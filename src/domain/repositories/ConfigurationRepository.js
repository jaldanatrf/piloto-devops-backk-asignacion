/**
 * Interface del repositorio de Configuration
 * Define los contratos que debe cumplir cualquier implementación
 */
class ConfigurationRepository {
  /**
   * Guarda una nueva configuración
   * @param {Configuration} configuration
   * @returns {Promise<Configuration>}
   */
  async save(configuration) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca una configuración por ID
   * @param {number} id
   * @returns {Promise<Configuration|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca una configuración por company ID
   * @param {number} companyId
   * @returns {Promise<Configuration|null>}
   */
  async findByCompanyId(companyId) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca todas las configuraciones
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Configuration[]>}
   */
  async findAll(filters) {
    throw new Error('Method not implemented');
  }

  /**
   * Actualiza una configuración
   * @param {number} id
   * @param {Object} updateData
   * @returns {Promise<Configuration>}
   */
  async update(id, updateData) {
    throw new Error('Method not implemented');
  }

  /**
   * Elimina una configuración
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }
}

module.exports = ConfigurationRepository;
