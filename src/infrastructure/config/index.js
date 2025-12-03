const path = require('path');

// Determinar el archivo .env según el entorno
const getEnvFile = () => {
  // Si DOTENV_CONFIG_PATH está definido en ecosystem.config.js, usarlo
  if (process.env.DOTENV_CONFIG_PATH) {
    return process.env.DOTENV_CONFIG_PATH;
  }

  // Mapeo de NODE_ENV a archivos .env
  const envMap = {
    'dev': '.env.dev',
    'development': '.env.dev',
    'preproduction': '.env.pre',
    'pre': '.env.pre',
    'production': '.env.prod',
    'prod': '.env.prod',
    'staging': '.env.staging'
  };

  const nodeEnv = process.env.NODE_ENV || 'development';
  return envMap[nodeEnv] || '.env.local';
};

const envFile = getEnvFile();
const envPath = path.join(__dirname, '../../..', envFile);

require('dotenv').config({ path: envPath });

// Solo log en desarrollo si es necesario
// console.log(`[Config] Loading environment from: ${envFile} (NODE_ENV: ${process.env.NODE_ENV || 'not set'})`);

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    host: process.env.DB_HOST || 'ip sin configurar',
    port: process.env.DB_PORT || '1433',
    name: process.env.DB_NAME || 'base de datos sin configurar',
    user: process.env.DB_USER || 'usuario sin configurar',
    password: process.env.DB_PASSWORD || ''
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  api: {
    key: process.env.API_KEY || 'your-api-key',
    integraciones: {
      key: process.env.API_KEY_INTEGRACIONES || 'integration-api-key',
      user: process.env.INTEGRATION_USER || 'integration_system',
      password: process.env.INTEGRATION_PASSWORD || 'default_password'
    }
  }
};
