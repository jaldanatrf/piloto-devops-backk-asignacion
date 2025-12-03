// Servicio de base de datos que respeta la arquitectura hexagonal
class DatabaseService {
  constructor(databaseAdapter) {
    this.databaseAdapter = databaseAdapter;
  }

  async initialize() {
    try {
      await this.databaseAdapter.connect();
      return true;
    } catch (error) {
      throw new Error(`Failed to initialize database service: ${error.message}`);
    }
  }

  async shutdown() {
    try {
      await this.databaseAdapter.disconnect();
      return true;
    } catch (error) {
      throw new Error(`Failed to shutdown database service: ${error.message}`);
    }
  }

  async checkHealth() {
    return await this.databaseAdapter.healthCheck();
  }

  async isConnected() {
    return await this.databaseAdapter.isConnected();
  }

  getConnection() {
    // Soporte para Sequelize
    if (this.databaseAdapter.getSequelizeInstance) {
      return this.databaseAdapter.getSequelizeInstance();
    }
    throw new Error('Database adapter does not support direct connection access');
  }

  // Método específico para Sequelize
  async syncModels(options = {}) {
    if (this.databaseAdapter.sync) {
      return await this.databaseAdapter.sync(options);
    }
    throw new Error('Database adapter does not support model synchronization');
  }

  // Método para transacciones
  async transaction(callback) {
    if (this.databaseAdapter.transaction) {
      return await this.databaseAdapter.transaction(callback);
    }
    throw new Error('Database adapter does not support transactions');
  }
}

module.exports = DatabaseService;
