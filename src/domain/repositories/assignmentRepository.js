// Interface del repositorio (Puerto)
class AssignmentRepository {
  async findById(id) {
    throw new Error('Método findById debe ser implementado');
  }
  
  async findAll(filters = {}, pagination = {}) {
    throw new Error('Método findAll debe ser implementado');
  }
  
  async count(filters = {}) {
    throw new Error('Método count debe ser implementado');
  }
  
  async create(assignment) {
    throw new Error('Método create debe ser implementado');
  }
  
  async save(assignment) {
    throw new Error('Método save debe ser implementado');
  }
  
  async update(id, updateData) {
    throw new Error('Método update debe ser implementado');
  }
  
  async delete(id) {
    throw new Error('Método delete debe ser implementado');
  }
  
  async findByUser(userId, filters = {}) {
    throw new Error('Método findByUser debe ser implementado');
  }

  async findByRole(roleId, filters = {}) {
    throw new Error('Método findByRole debe ser implementado');
  }

  async findByCompany(companyId, filters = {}) {
    throw new Error('Método findByCompany debe ser implementado');
  }


  async findOverlappingAssignments(userId, startDate, endDate) {
    throw new Error('Método findOverlappingAssignments debe ser implementado');
  }

  async getStats(filters = {}) {
    throw new Error('Método getStats debe ser implementado');
  }

  async search(searchTerm, limit = 10) {
    throw new Error('Método search debe ser implementado');
  }

  async exists(id) {
    throw new Error('Método exists debe ser implementado');
  }
}

module.exports = AssignmentRepository;
