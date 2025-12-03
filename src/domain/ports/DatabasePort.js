// Puerto (Interface) para la conexión de base de datos - Capa de Dominio
// Define el contrato que debe cumplir cualquier adaptador de base de datos

class DatabasePort {
  async connect() {
    throw new Error('connect method must be implemented');
  }

  async disconnect() {
    throw new Error('disconnect method must be implemented');
  }

  async isConnected() {
    throw new Error('isConnected method must be implemented');
  }

  async healthCheck() {
    throw new Error('healthCheck method must be implemented');
  }
}

module.exports = DatabasePort;
