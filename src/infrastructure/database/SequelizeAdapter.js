const { Sequelize } = require('sequelize');
const config = require('../config');
const { logger } = require('../../shared/logger');
const DatabasePort = require('../../domain/ports/DatabasePort');

// Adaptador de Sequelize que implementa el puerto DatabasePort
class SequelizeAdapter extends DatabasePort {
  constructor() {
    super();
    this.sequelize = null;
    this.connected = false;
  }

  async connect() {
    try {
      if (!this.sequelize) {
        logger.debug('Initializing Sequelize connection to SQL Server...');
        logger.debug(`Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
        
        this.sequelize = new Sequelize(
          config.database.name,
          config.database.user,
          config.database.password,
          {
            host: config.database.host,
            port: parseInt(config.database.port),
            dialect: 'mssql',
            dialectOptions: {
              options: {
                encrypt: false, // Set to true if using Azure
                enableArithAbort: true,
                trustServerCertificate: true
              }
            },
            pool: {
              max: 10,
              min: 0,
              acquire: 60000,
              idle: 30000
            },
            logging: (msg) => logger.debug(`Sequelize: ${msg}`),
            timezone: '-05:00', // Colombia timezone (UTC-5)
            define: {
              timestamps: true,
              underscored: true,
              freezeTableName: true
            }
          }
        );

        // Test the connection
        await this.testConnection();
        this.connected = true;
        logger.debug('Successfully connected to SQL Server database using Sequelize');
      }
      
      return this.sequelize;
    } catch (error) {
      logger.error('Error connecting to database:', error);
      this.connected = false;
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async disconnect() {
    try {
      if (this.sequelize) {
        await this.sequelize.close();
        this.sequelize = null;
        this.connected = false;
        logger.info('Database connection closed');
      }
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  async isConnected() {
    return this.connected && this.sequelize !== null;
  }

  async healthCheck() {
    try {
      if (!this.sequelize || !this.connected) {
        return { 
          status: 'disconnected', 
          message: 'No database connection',
          timestamp: new Date().toISOString()
        };
      }

      await this.testConnection();
      return { 
        status: 'connected', 
        message: 'Database connection is healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.connected = false;
      return { 
        status: 'error', 
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Método específico del adaptador (no del puerto)
  getSequelizeInstance() {
    if (!this.sequelize) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.sequelize;
  }

  async testConnection() {
    try {
      await this.sequelize.authenticate();
      logger.debug('Database connection test successful');
    } catch (error) {
      logger.error('Database connection test failed:', error);
      throw error;
    }
  }

  // Método para sincronizar modelos (útil para desarrollo)
  async sync(options = {}) {
    try {
      if (!this.sequelize) {
        throw new Error('Database not connected. Call connect() first.');
      }
      
      await this.sequelize.sync(options);
      logger.info('Database models synchronized');
    } catch (error) {
      logger.error('Error synchronizing database models:', error);
      throw error;
    }
  }

  // Método para ejecutar transacciones
  async transaction(callback) {
    if (!this.sequelize) {
      throw new Error('Database not connected. Call connect() first.');
    }
    
    return await this.sequelize.transaction(callback);
  }
}

module.exports = SequelizeAdapter;
