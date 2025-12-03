// Repository interface (Port) for Rule entity
class RuleRepository {
  constructor() {
    if (this.constructor === RuleRepository) {
      throw new Error('RuleRepository is an abstract class and cannot be instantiated directly');
    }
  }

  // Métodos que deben ser implementados por los adaptadores
  async save(rule) {
    throw new Error('save method must be implemented');
  }

  async findById(id, companyId) {
    throw new Error('findById method must be implemented');
  }

  async findByName(name, companyId) {
    throw new Error('findByName method must be implemented');
  }

  async findByCompany(companyId, filters = {}) {
    throw new Error('findByCompany method must be implemented');
  }

  async findByType(type, companyId) {
    throw new Error('findByType method must be implemented');
  }
  
  async findActive(companyId) {
    throw new Error('findActive method must be implemented');
  }

  async update(id, companyId, ruleData) {
    throw new Error('update method must be implemented');
  }

  async delete(id, companyId) {
    throw new Error('delete method must be implemented');
  }

  async exists(name, companyId) {
    throw new Error('exists method must be implemented');
  }

  async findByPermission(permission, companyId) {
    throw new Error('findByPermission method must be implemented');
  }

  async bulkCreate(rules) {
    throw new Error('bulkCreate method must be implemented');
  }

  // Método específico para obtener estadísticas de reglas por compañía
  async getStatsByCompany(companyId) {
    throw new Error('getStatsByCompany method must be implemented');
  }
}

module.exports = RuleRepository;
