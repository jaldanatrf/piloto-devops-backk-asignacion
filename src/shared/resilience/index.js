const ResilienceService = require('./ResilienceService');
const ResilientHttpClient = require('./ResilientHttpClient');

/**
 * Configuraciones predefinidas para diferentes tipos de integraciones
 */
const INTEGRATION_CONFIGS = {
  // Para APIs críticas que requieren alta disponibilidad
  CRITICAL: {
    resilience: {
      maxRetries: 5,
      backoffStrategy: 'exponential',
      baseDelay: 1000,
      maxDelay: 60000,
      jitter: true,
      retryOn: [408, 429, 500, 502, 503, 504],
      timeout: 30000,
      circuitBreakerConfig: {
        enabled: true,
        failureThreshold: 3,
        resetTimeout: 30000,
        monitoringPeriod: 10000
      }
    }
  },

  // Para APIs de autenticación
  AUTHENTICATION: {
    resilience: {
      maxRetries: 3,
      backoffStrategy: 'exponential',
      baseDelay: 500,
      maxDelay: 10000,
      jitter: true,
      retryOn: [408, 429, 500, 502, 503, 504],
      timeout: 15000,
      circuitBreakerConfig: {
        enabled: true,
        failureThreshold: 5,
        resetTimeout: 60000,
        monitoringPeriod: 10000
      }
    }
  },

  // Para consultas de datos no críticas
  QUERY: {
    resilience: {
      maxRetries: 2,
      backoffStrategy: 'linear',
      baseDelay: 1000,
      maxDelay: 5000,
      jitter: false,
      retryOn: [408, 429, 500, 502, 503, 504],
      timeout: 20000,
      circuitBreakerConfig: {
        enabled: false
      }
    }
  },

  // Para notificaciones y webhooks
  NOTIFICATION: {
    resilience: {
      maxRetries: 4,
      backoffStrategy: 'exponential',
      baseDelay: 2000,
      maxDelay: 30000,
      jitter: true,
      retryOn: [408, 429, 500, 502, 503, 504],
      timeout: 25000,
      circuitBreakerConfig: {
        enabled: true,
        failureThreshold: 10,
        resetTimeout: 120000,
        monitoringPeriod: 30000
      }
    }
  }
};

/**
 * Factory para crear clientes HTTP resilientes con configuraciones predefinidas
 */
class ResilientClientFactory {
  /**
   * Crea un cliente HTTP resiliente para APIs críticas
   */
  static createCriticalClient(additionalConfig = {}) {
    return new ResilientHttpClient({
      ...INTEGRATION_CONFIGS.CRITICAL,
      ...additionalConfig
    });
  }

  /**
   * Crea un cliente HTTP resiliente para autenticación
   */
  static createAuthClient(additionalConfig = {}) {
    return new ResilientHttpClient({
      ...INTEGRATION_CONFIGS.AUTHENTICATION,
      ...additionalConfig
    });
  }

  /**
   * Crea un cliente HTTP resiliente para consultas
   */
  static createQueryClient(additionalConfig = {}) {
    return new ResilientHttpClient({
      ...INTEGRATION_CONFIGS.QUERY,
      ...additionalConfig
    });
  }

  /**
   * Crea un cliente HTTP resiliente para notificaciones
   */
  static createNotificationClient(additionalConfig = {}) {
    return new ResilientHttpClient({
      ...INTEGRATION_CONFIGS.NOTIFICATION,
      ...additionalConfig
    });
  }

  /**
   * Crea un cliente HTTP resiliente con configuración personalizada
   */
  static createCustomClient(config = {}) {
    return new ResilientHttpClient(config);
  }
}

module.exports = {
  ResilienceService,
  ResilientHttpClient,
  ResilientClientFactory,
  INTEGRATION_CONFIGS
};
