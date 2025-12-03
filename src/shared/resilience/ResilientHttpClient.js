const axios = require('axios');
const ResilienceService = require('./ResilienceService');
const { logger } = require('../logger');

/**
 * Wrapper resiliente para Axios
 */
class ResilientHttpClient {
  constructor(config = {}) {
    this.resilienceService = new ResilienceService(config.resilience);
    this.axiosConfig = config.axios || {};
    
    // Crear instancia de axios con configuración base
    this.axiosInstance = axios.create(this.axiosConfig);
    
    // Configurar interceptors si se proporcionan
    if (config.interceptors) {
      this.setupInterceptors(config.interceptors);
    }
  }

  /**
   * Configura interceptors de axios
   */
  setupInterceptors(interceptors) {
    if (interceptors.request) {
      this.axiosInstance.interceptors.request.use(
        interceptors.request.onFulfilled,
        interceptors.request.onRejected
      );
    }

    if (interceptors.response) {
      this.axiosInstance.interceptors.response.use(
        interceptors.response.onFulfilled,
        interceptors.response.onRejected
      );
    }
  }

  /**
   * Realiza una petición GET con resilencia
   */
  async get(url, config = {}, operationName = `GET ${url}`) {
    return this.request('get', url, null, config, operationName);
  }

  /**
   * Realiza una petición POST con resilencia
   */
  async post(url, data = null, config = {}, operationName = `POST ${url}`) {
    return this.request('post', url, data, config, operationName);
  }

  /**
   * Realiza una petición PUT con resilencia
   */
  async put(url, data = null, config = {}, operationName = `PUT ${url}`) {
    return this.request('put', url, data, config, operationName);
  }

  /**
   * Realiza una petición DELETE con resilencia
   */
  async delete(url, config = {}, operationName = `DELETE ${url}`) {
    return this.request('delete', url, null, config, operationName);
  }

  /**
   * Método genérico para realizar peticiones HTTP con resilencia
   */
  async request(method, url, data = null, config = {}, operationName = `${method.toUpperCase()} ${url}`) {
    const requestFn = () => {
      const requestConfig = {
        method,
        url,
        ...config
      };

      if (data) {
        requestConfig.data = data;
      }

      logger.debug(`[HTTP] Making request: ${operationName}`, {
        method,
        url,
        headers: requestConfig.headers,
        timeout: requestConfig.timeout
      });

      return this.axiosInstance(requestConfig);
    };

    try {
      const response = await this.resilienceService.executeWithResilience(
        requestFn,
        config.resilience,
        operationName
      );

      logger.debug(`[HTTP] Request successful: ${operationName}`, {
        status: response.status,
        statusText: response.statusText
      });

      return response;
    } catch (error) {
      // Enriquecer el error con información adicional
      const enrichedError = this.enrichError(error, method, url);
      
      logger.error(`[HTTP] Request failed: ${operationName}`, {
        error: enrichedError.message,
        status: enrichedError.status,
        code: enrichedError.code
      });

      throw enrichedError;
    }
  }

  /**
   * Enriquece los errores con información adicional
   */
  enrichError(error, method, url) {
    const enrichedError = new Error(error.message);
    enrichedError.originalError = error;
    enrichedError.method = method;
    enrichedError.url = url;
    enrichedError.timestamp = new Date().toISOString();

    // Información de respuesta HTTP si está disponible
    if (error.response) {
      enrichedError.status = error.response.status;
      enrichedError.statusText = error.response.statusText;
      enrichedError.headers = error.response.headers;
      enrichedError.data = error.response.data;
    }

    // Información de la petición si está disponible
    if (error.request) {
      enrichedError.request = {
        method: error.request.method,
        url: error.request.url,
        headers: error.request.headers
      };
    }

    // Código de error de red
    if (error.code) {
      enrichedError.code = error.code;
    }

    return enrichedError;
  }

  /**
   * Obtiene métricas de las peticiones
   */
  getMetrics() {
    return this.resilienceService.getAllMetrics();
  }

  /**
   * Obtiene métricas de una operación específica
   */
  getOperationMetrics(operationName) {
    return this.resilienceService.getMetrics(operationName);
  }

  /**
   * Crea una nueva instancia con configuración específica
   */
  static create(config = {}) {
    return new ResilientHttpClient(config);
  }
}

module.exports = ResilientHttpClient;
