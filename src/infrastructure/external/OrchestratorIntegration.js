const httpClient = require('../../shared/resilience/httpClient');
const https = require('https');
const EndpointResolver = require('../../application/services/EndpointResolver');
const encryptionService = require('../../shared/utils/EncryptionService');

// Cache para almacenar tokens por NIT
const tokenCache = new Map();
const TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutos en milliseconds

/**
 * Configuración para peticiones HTTPS en desarrollo (certificados autofirmados)
 */
const getHttpsAgent = () => {
  if (process.env.NODE_ENV !== 'production') {
    return new https.Agent({ rejectUnauthorized: false });
  }
  return undefined;
};

/**
 * Obtener token de autenticación usando configuración dinámica
 * @param {Object} configuration - Configuración de la empresa (entidad Configuration)
 * @param {Object} data - Datos para resolver variables (assignment, user, company)
 * @returns {Promise<string>} - Token de acceso
 */
async function getAuthToken(configuration, data) {
  // Verificar si ya tenemos un token válido en cache
  const cacheKey = configuration.companyId;
  const cachedToken = tokenCache.get(cacheKey);

  if (cachedToken && Date.now() < cachedToken.expiry) {
    return cachedToken.token;
  }

  try {
    // Construir URL del endpoint de token
    const endpointResolver = new EndpointResolver();
    const authUrl = configuration.pathVariableMapping
      ? endpointResolver.resolveUrl(configuration.tokenEndpoint, configuration.pathVariableMapping, data)
      : configuration.tokenEndpoint;

    // Construir body para autenticación con estructura fija
    let authBody = {};

    if (configuration.authType === 'BEARER' || configuration.authType === 'OAUTH2') {
      // Desencriptar password antes de enviar (se almacena encriptado en BD)
      let decryptedPassword = configuration.authPassword;

      // Verificar si está encriptado (soporta AES-256-GCM y CryptoJS)
      if (encryptionService.isEncrypted(configuration.authPassword)) {
        try {
          // Usar decryptAuto para detectar automáticamente el formato
          decryptedPassword = encryptionService.decryptAuto(configuration.authPassword);
        } catch (error) {
          // Si falla la desencriptación, usar el password tal cual
        }
      } else if (configuration.authPassword && configuration.authPassword.startsWith('$2a$')) {
        // Detectar bcrypt (formato: $2a$rounds$salt+hash)
        throw new Error('Password is encrypted with bcrypt (irreversible). Please update configuration with plain-text password.');
      }

      // Estructura FIJA del body de autenticación
      authBody = {
        grant_type: "password",
        username: configuration.authUsername,
        password: decryptedPassword
      };

      // Agregar additionalClaims si están configurados (resolviendo variables)
      if (configuration.authAdditionalFields && configuration.authAdditionalFields.additionalClaims) {
        // Clonar additionalClaims para no modificar el original
        const additionalClaimsTemplate = JSON.parse(JSON.stringify(configuration.authAdditionalFields.additionalClaims));

        // Resolver variables en additionalClaims
        const resolvedAdditionalClaims = configuration.bodyVariableMapping
          ? endpointResolver.resolveBody(additionalClaimsTemplate, configuration.bodyVariableMapping, data)
          : additionalClaimsTemplate;

        // Agregar additionalClaims al body (estructura fija)
        authBody.additionalClaims = resolvedAdditionalClaims;
      }
    } else if (configuration.authType === 'BASIC') {
      // BASIC auth no necesita body, se envía en headers
      authBody = {};
    } else if (configuration.authType === 'API_KEY') {
      // API_KEY puede necesitar body personalizado
      if (configuration.authAdditionalFields) {
        const additionalFieldsTemplate = JSON.parse(JSON.stringify(configuration.authAdditionalFields));
        authBody = configuration.bodyVariableMapping
          ? endpointResolver.resolveBody(additionalFieldsTemplate, configuration.bodyVariableMapping, data)
          : additionalFieldsTemplate;
      }
    }

    // Configurar headers
    const headers = configuration.customHeaders || {};

    const response = await httpClient[configuration.tokenMethod.toLowerCase()](authUrl, authBody, {
      headers,
      httpsAgent: getHttpsAgent()
    });

    if (response.data && response.data.access_token) {
      // Guardar token en cache
      tokenCache.set(cacheKey, {
        token: response.data.access_token,
        expiry: Date.now() + TOKEN_EXPIRY
      });

      return response.data.access_token;
    } else {
      throw new Error('Invalid token response: ' + JSON.stringify(response.data));
    }
  } catch (error) {
    throw new Error(`Error obtaining token: ${error.message}`);
  }
}

/**
 * Asigna un usuario a un claim en el orquestador
 * @param {string} processId - ID del proceso
 * @param {string} assignedUser - DUD del usuario asignado
 * @param {string} claimId - ID del claim
 * @returns {Promise<Object>} - Respuesta del orquestador
 */
async function assignDisputeFiling(processId, assignedUser, claimId) {
  const baseUrl = process.env.ORCHESTRATOR_API;
  const url = `${baseUrl}/api/admonCtas/dispute-filings/${processId}/assignments`;
  const body = {
    assignedUser,
    claimId
  };

  try {
    const response = await httpClient.post(url, body, {
      httpsAgent: getHttpsAgent()
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error assigning dispute filing: ${error.message}`);
  }
}

/**
 * Asigna múltiples usuarios a disputas usando configuración dinámica
 * @param {Object} configuration - Configuración de la empresa (entidad Configuration)
 * @param {Array<Object>} assignments - Array de asignaciones
 * @param {Object} data - Datos para resolver variables (assignment, user, company)
 * @returns {Promise<Object>} - Respuesta del orquestador
 */
async function assignMultipleDisputes(configuration, assignments, data) {
  try {
    const endpointResolver = new EndpointResolver();

    // Obtener token de autenticación si es necesario
    let token = null;
    if (configuration.authType === 'BEARER' || configuration.authType === 'OAUTH2') {
      token = await getAuthToken(configuration, data);
    }

    // Resolver URL del endpoint de notificación con variables
    const url = configuration.pathVariableMapping
      ? endpointResolver.resolveUrl(configuration.notificationEndpoint, configuration.pathVariableMapping, data)
      : configuration.notificationEndpoint;

    // Construir body de notificación
    // Si bodyVariableMapping tiene claves (además de assignments), resolver variables adicionales
    let body = { assignments };

    if (configuration.bodyVariableMapping && Object.keys(configuration.bodyVariableMapping).length > 0) {
      // Hay variables adicionales para resolver en el body
      const additionalFields = Object.keys(configuration.bodyVariableMapping)
        .filter(key => key !== 'assignments')
        .reduce((acc, key) => {
          acc[key] = `{${key}}`;
          return acc;
        }, {});

      if (Object.keys(additionalFields).length > 0) {
        // Resolver solo las variables adicionales
        const resolvedAdditionalFields = endpointResolver.resolveBody(
          additionalFields,
          configuration.bodyVariableMapping,
          data
        );

        // Combinar assignments con campos adicionales resueltos
        body = {
          assignments,
          ...resolvedAdditionalFields
        };
      }
    }

    // Configurar headers
    const headers = { ...configuration.customHeaders };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else if (configuration.authType === 'API_KEY') {
      headers['X-API-Key'] = configuration.authApiKey;
    }

    // Hacer petición con configuración dinámica
    const response = await httpClient[configuration.notificationMethod.toLowerCase()](url, body, {
      headers,
      httpsAgent: getHttpsAgent()
    });

    return response.data;
  } catch (error) {
    throw new Error(`Error assigning multiple disputes: ${error.message}`);
  }
}

module.exports = {
  assignDisputeFiling,
  assignMultipleDisputes
};
