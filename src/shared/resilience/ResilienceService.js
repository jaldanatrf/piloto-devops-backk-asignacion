const { logger } = require('../logger');

/**
 * Configuración por defecto para resilencia
 */
const DEFAULT_CONFIG = {
  maxRetries: 3,
  backoffStrategy: 'exponential', // 'exponential' | 'linear' | 'fixed'
  baseDelay: 1000, // 1 segundo
  maxDelay: 30000, 
  jitter: true, 
  retryOn: [408, 429, 500, 502, 503, 504], // Códigos de estado HTTP que activan retry
  circuitBreakerConfig: {
    enabled: false,
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minuto
    monitoringPeriod: 10000 // 10 segundos
  },
  timeout: 30000 // 30 segundos
};

/**
 * Servicio de resilencia para peticiones HTTP
 */
class ResilienceService {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.circuitBreakers = new Map();
    this.requestMetrics = new Map();
  }

  /**
   * Ejecuta una función con resilencia
   * @param {Function} fn - Función a ejecutar
   * @param {Object} options - Opciones específicas para esta ejecución
   * @param {string} operationName - Nombre de la operación para logs
   * @returns {Promise<any>} - Resultado de la función
   */
  async executeWithResilience(fn, options = {}, operationName = 'unknown') {
    const config = { ...this.config, ...options };
    const startTime = Date.now();
    
    logger.info(`[Resilience] Starting operation: ${operationName}`, {
      maxRetries: config.maxRetries,
      timeout: config.timeout
    });

    // Circuit Breaker check
    if (config.circuitBreakerConfig.enabled) {
      const circuitState = this.getCircuitState(operationName);
      if (circuitState === 'OPEN') {
        const error = new Error(`Circuit breaker is OPEN for operation: ${operationName}`);
        error.code = 'CIRCUIT_BREAKER_OPEN';
        throw error;
      }
    }

    let lastError;
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        // Añadir timeout a la función
        const result = await this.withTimeout(fn(), config.timeout);
        
        // Registrar éxito
        this.recordSuccess(operationName);
        
        const duration = Date.now() - startTime;
        logger.info(`[Resilience] Operation successful: ${operationName}`, {
          attempt: attempt + 1,
          duration
        });
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Registrar fallo
        this.recordFailure(operationName, error);
        
        // Verificar si debemos hacer retry
        if (!this.shouldRetry(error, attempt, config)) {
          break;
        }
        
        // Calcular delay para el próximo intento
        const delay = this.calculateDelay(attempt, config);
        
        logger.warn(`[Resilience] Operation failed, retrying in ${delay}ms: ${operationName}`, {
          attempt: attempt + 1,
          maxRetries: config.maxRetries,
          error: error.message,
          delay
        });
        
        await this.sleep(delay);
      }
    }

    const duration = Date.now() - startTime;
    logger.error(`[Resilience] Operation failed after all retries: ${operationName}`, {
      totalAttempts: config.maxRetries + 1,
      duration,
      finalError: lastError.message
    });

    throw lastError;
  }

  /**
   * Determina si se debe reintentar la operación
   */
  shouldRetry(error, attempt, config) {
    if (attempt >= config.maxRetries) {
      return false;
    }

    // Verificar códigos de estado HTTP
    if (error.response && error.response.status) {
      return config.retryOn.includes(error.response.status);
    }

    // Verificar errores de red
    if (error.code === 'ECONNRESET' || 
        error.code === 'ENOTFOUND' || 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT') {
      return true;
    }

    // No reintentar por defecto
    return false;
  }

  /**
   * Calcula el delay para el próximo intento
   */
  calculateDelay(attempt, config) {
    let delay;
    
    switch (config.backoffStrategy) {
      case 'exponential':
        delay = config.baseDelay * Math.pow(2, attempt);
        break;
      case 'linear':
        delay = config.baseDelay * (attempt + 1);
        break;
      case 'fixed':
      default:
        delay = config.baseDelay;
        break;
    }

    // Aplicar límite máximo
    delay = Math.min(delay, config.maxDelay);

    // Aplicar jitter si está habilitado
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  /**
   * Añade timeout a una promesa
   */
  withTimeout(promise, timeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeout}ms`));
        }, timeout);
      })
    ]);
  }

  /**
   * Registra un éxito en las métricas
   */
  recordSuccess(operationName) {
    if (!this.requestMetrics.has(operationName)) {
      this.requestMetrics.set(operationName, {
        successes: 0,
        failures: 0,
        lastSuccess: null,
        lastFailure: null
      });
    }
    
    const metrics = this.requestMetrics.get(operationName);
    metrics.successes++;
    metrics.lastSuccess = Date.now();

    // Actualizar circuit breaker
    if (this.config.circuitBreakerConfig.enabled) {
      this.updateCircuitBreaker(operationName, true);
    }
  }

  /**
   * Registra un fallo en las métricas
   */
  recordFailure(operationName, error) {
    if (!this.requestMetrics.has(operationName)) {
      this.requestMetrics.set(operationName, {
        successes: 0,
        failures: 0,
        lastSuccess: null,
        lastFailure: null
      });
    }
    
    const metrics = this.requestMetrics.get(operationName);
    metrics.failures++;
    metrics.lastFailure = Date.now();
    metrics.lastError = error.message;

    // Actualizar circuit breaker
    if (this.config.circuitBreakerConfig.enabled) {
      this.updateCircuitBreaker(operationName, false);
    }
  }

  /**
   * Obtiene el estado del circuit breaker
   */
  getCircuitState(operationName) {
    if (!this.circuitBreakers.has(operationName)) {
      this.circuitBreakers.set(operationName, {
        state: 'CLOSED',
        failures: 0,
        lastFailureTime: null,
        nextAttemptTime: null
      });
    }
    
    const breaker = this.circuitBreakers.get(operationName);
    const now = Date.now();
    
    // Si está abierto, verificar si es hora de intentar de nuevo
    if (breaker.state === 'OPEN' && now >= breaker.nextAttemptTime) {
      breaker.state = 'HALF_OPEN';
    }
    
    return breaker.state;
  }

  /**
   * Actualiza el estado del circuit breaker
   */
  updateCircuitBreaker(operationName, success) {
    const breaker = this.circuitBreakers.get(operationName);
    const config = this.config.circuitBreakerConfig;
    
    if (success) {
      if (breaker.state === 'HALF_OPEN') {
        breaker.state = 'CLOSED';
        breaker.failures = 0;
      }
    } else {
      breaker.failures++;
      breaker.lastFailureTime = Date.now();
      
      if (breaker.failures >= config.failureThreshold) {
        breaker.state = 'OPEN';
        breaker.nextAttemptTime = Date.now() + config.resetTimeout;
        
        logger.warn(`[Circuit Breaker] OPENED for operation: ${operationName}`, {
          failures: breaker.failures,
          resetTime: new Date(breaker.nextAttemptTime).toISOString()
        });
      }
    }
  }

  /**
   * Obtiene métricas de una operación
   */
  getMetrics(operationName) {
    return this.requestMetrics.get(operationName) || {
      successes: 0,
      failures: 0,
      lastSuccess: null,
      lastFailure: null
    };
  }

  /**
   * Obtiene todas las métricas
   */
  getAllMetrics() {
    const metrics = {};
    for (const [name, data] of this.requestMetrics.entries()) {
      metrics[name] = { ...data };
    }
    return metrics;
  }

  /**
   * Función helper para dormir
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ResilienceService;
