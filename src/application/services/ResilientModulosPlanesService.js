const { ResilientClientFactory } = require('../../shared/resilience');
const { logger } = require('../../shared/logger');

const API_MODULOS_PLANES = process.env.API_MODULOS_PLANES;

class ResilientModulesPlansService {
  constructor() {
    // Crear cliente HTTP resiliente específico para autenticación
    this.authClient = ResilientClientFactory.createAuthClient({
      axios: {
        baseURL: API_MODULOS_PLANES,
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    // Crear cliente HTTP resiliente para consultas de datos
    this.queryClient = ResilientClientFactory.createQueryClient({
      axios: {
        baseURL: API_MODULOS_PLANES,
        timeout: 20000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    logger.info('ResilientModulesPlansService initialized', {
      baseURL: API_MODULOS_PLANES
    });
  }

  /**
   * Obtiene token usando concatenación de docType y doc con resilencia
   * @param {string} docType - Tipo de documento
   * @param {string} doc - Número de documento
   * @returns {Promise<string>} Token JWT
   */
  async getToken(docType, doc) {
    const username = `${docType}${doc}`;
    const operationName = `ModulosPlanesService.getToken(${docType}${doc})`;
    
    logger.info(`[ModulosPlanesService] Getting token for user: ${username}`);

    try {
      const response = await this.authClient.post(
        '/JWT/registro',
        { username },
        {
          resilience: {
            // Configuración específica para obtener tokens
            maxRetries: 3,
            baseDelay: 1000,
            backoffStrategy: 'exponential'
          }
        },
        operationName
      );

      if (response.data && response.data.esExitoso && response.data.token) {
        logger.info(`[ModulosPlanesService] Token obtained successfully for user: ${username}`);
        return response.data.token;
      }

      const errorMessage = response.data?.msg || 'Could not obtain token - invalid response format';
      logger.error(`[ModulosPlanesService] Token request failed for user: ${username}`, {
        response: response.data,
        error: errorMessage
      });

      throw new Error(errorMessage);
    } catch (error) {
      logger.error(`[ModulosPlanesService] Error obtaining token for user: ${username}`, {
        error: error.message,
        status: error.status,
        code: error.code
      });

      // Re-lanzar con contexto adicional
      const contextualError = new Error(`Error obtaining token for ${username}: ${error.message}`);
      contextualError.originalError = error;
      contextualError.username = username;
      contextualError.operation = 'getToken';
      
      throw contextualError;
    }
  }

  /**
   * Consulta empresa por NIT usando el token obtenido con resilencia
   * @param {string} nit - NIT de la empresa
   * @param {string} token - Token JWT para autenticación
   * @returns {Promise<Array>} Lista de empresas
   */
  async getCompanyByNit(nit, token) {
    const operationName = `ModulosPlanesService.getCompanyByNit(${nit})`;
    
    logger.info(`[ModulosPlanesService] Querying company by NIT: ${nit}`);

    try {
      const response = await this.queryClient.get(
        `/empresas?nit=${encodeURIComponent(nit)}`,
        {
          headers: {
            Authorization: token
          },
          resilience: {
            // Configuración específica para consultas de empresa
            maxRetries: 2,
            baseDelay: 1500,
            backoffStrategy: 'linear',
            // Incluir 401 y 403 en retries por si el token expira
            retryOn: [401, 403, 408, 429, 500, 502, 503, 504]
          }
        },
        operationName
      );

      logger.info(`[ModulosPlanesService] Company query successful for NIT: ${nit}`, {
        resultCount: Array.isArray(response.data) ? response.data.length : 'unknown'
      });

      return response.data;
    } catch (error) {
      logger.error(`[ModulosPlanesService] Error querying company by NIT: ${nit}`, {
        error: error.message,
        status: error.status,
        code: error.code,
        token: token ? 'present' : 'missing'
      });

      // Manejo especial para errores de autenticación
      if (error.status === 401 || error.status === 403) {
        const authError = new Error(`Authentication failed when querying company ${nit}. Token may be invalid or expired.`);
        authError.originalError = error;
        authError.nit = nit;
        authError.operation = 'getCompanyByNit';
        authError.authenticationFailure = true;
        throw authError;
      }

      // Re-lanzar con contexto adicional
      const contextualError = new Error(`Error querying company ${nit}: ${error.message}`);
      contextualError.originalError = error;
      contextualError.nit = nit;
      contextualError.operation = 'getCompanyByNit';
      
      throw contextualError;
    }
  }

  /**
   * Método combinado para obtener token y consultar empresa en una operación
   * con manejo de errores de autenticación automático
   * @param {string} docType - Tipo de documento
   * @param {string} doc - Número de documento  
   * @param {string} nit - NIT de la empresa
   * @returns {Promise<Array>} Lista de empresas
   */
  async getCompanyWithAuth(docType, doc, nit) {
    const operationName = `ModulosPlanesService.getCompanyWithAuth(${docType}${doc}, ${nit})`;
    
    logger.info(`[ModulosPlanesService] Getting company with automatic authentication`, {
      docType,
      doc,
      nit
    });

    try {
      // Obtener token
      const token = await this.getToken(docType, doc);
      
      // Consultar empresa
      const companies = await this.getCompanyByNit(nit, token);
      
      logger.info(`[ModulosPlanesService] Company retrieved successfully with auth`, {
        nit,
        resultCount: Array.isArray(companies) ? companies.length : 'unknown'
      });

      return companies;
    } catch (error) {
      logger.error(`[ModulosPlanesService] Error in getCompanyWithAuth`, {
        docType,
        doc,
        nit,
        error: error.message,
        operation: error.operation || 'unknown'
      });

      throw error;
    }
  }

  /**
   * Obtiene métricas de rendimiento de las operaciones
   * @returns {Object} Métricas de las operaciones HTTP
   */
  getMetrics() {
    return {
      auth: this.authClient.getMetrics(),
      query: this.queryClient.getMetrics()
    };
  }

  /**
   * Obtiene métricas de una operación específica
   * @param {string} operationName - Nombre de la operación
   * @returns {Object} Métricas de la operación
   */
  getOperationMetrics(operationName) {
    // Intentar obtener métricas de ambos clientes
    const authMetrics = this.authClient.getOperationMetrics(operationName);
    const queryMetrics = this.queryClient.getOperationMetrics(operationName);
    
    // Retornar las métricas que contengan datos
    if (authMetrics.successes > 0 || authMetrics.failures > 0) {
      return authMetrics;
    }
    
    return queryMetrics;
  }
}

module.exports = new ResilientModulesPlansService();
