const axios = require('axios');
const { default: axiosRetry } = require('axios-retry');


// Cargar configuraciones globales desde el archivo .env
env = process.env;
const retryCount = parseInt(env.GLOBAL_API_RETRY_COUNT, 10) || 3;
const timeout = parseInt(env.GLOBAL_API_TIMEOUT, 10) || 5000;

// Crear una instancia de Axios con configuraciones globales
const httpClient = axios.create({
  timeout,
});

// Configurar reintentos automáticos
axiosRetry(httpClient, {
  retries: retryCount,
  retryCondition: (error) => {
    // Reintentar solo en errores de red o respuestas con códigos de estado >= 500
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status >= 500;
  },
});

module.exports = httpClient;
