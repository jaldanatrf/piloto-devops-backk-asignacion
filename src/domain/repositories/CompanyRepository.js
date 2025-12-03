// Puerto/Interfaz para el repositorio de Company (Dominio)
class CompanyRepository {
  constructor() {
    if (this.constructor === CompanyRepository) {
      throw new Error('CompanyRepository is an abstract class and cannot be instantiated directly');
    }
  }

  // Métodos que deben ser implementados por los adaptadores
  async save(company) {
    throw new Error('save method must be implemented');
  }

  async findById(id) {
    throw new Error('findById method must be implemented');
  }

  async findByName(name) {
    throw new Error('findByName method must be implemented');
  }

  async findByDocumentNumber(documentNumber) {
    throw new Error('findByDocumentNumber method must be implemented');
  }

  async findByDocumentTypeAndNumber(documentType, documentNumber) {
    throw new Error('findByDocumentTypeAndNumber method must be implemented');
  }

  async findAll(filters = {}) {
    throw new Error('findAll method must be implemented');
  }

  async findActive() {
    throw new Error('findActive method must be implemented');
  }

  async update(id, companyData) {
    throw new Error('update method must be implemented');
  }

  async delete(id) {
    throw new Error('delete method must be implemented');
  }

  async exists(name) {
    throw new Error('exists method must be implemented');
  }

  async existsByDocumentNumber(documentNumber) {
    throw new Error('existsByDocumentNumber method must be implemented');
  }

  async bulkCreate(companies) {
    throw new Error('bulkCreate method must be implemented');
  }

  // Método específico para obtener estadísticas de la compañía
  async getStats(id) {
    throw new Error('getStats method must be implemented');
  }

  // Método para obtener compañía con sus reglas
  async findByIdWithRules(id) {
    throw new Error('findByIdWithRules method must be implemented');
  }
}

module.exports = CompanyRepository;
