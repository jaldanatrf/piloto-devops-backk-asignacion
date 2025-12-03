const Configuration = require('../../../domain/entities/Configuration');
const { ValidationError, NotFoundError } = require('../../../shared/errors');
const encryptionService = require('../../../shared/utils/EncryptionService');

class ConfigurationUseCases {
  constructor(configurationRepository, companyRepository) {
    this.configurationRepository = configurationRepository;
    this.companyRepository = companyRepository;
  }

  /**
   * Crea una nueva configuración para una empresa
   * @param {Object} configurationData - Datos de la configuración
   * @returns {Promise<Configuration>}
   */
  async createConfiguration(configurationData) {
    // Validar que la empresa existe
    const company = await this.companyRepository.findById(configurationData.companyId);
    if (!company) {
      throw new NotFoundError(`Company with ID ${configurationData.companyId} not found`);
    }

    // Verificar que no exista ya una configuración para esta empresa
    const existingConfig = await this.configurationRepository.findByCompanyId(configurationData.companyId);
    if (existingConfig) {
      throw new ValidationError(`Configuration for company ID ${configurationData.companyId} already exists`);
    }

    // Encriptar authPassword si existe (encriptación REVERSIBLE con AES-256-GCM)
    // Se encripta para seguridad en BD, pero se desencripta antes de enviar al servicio externo
    if (configurationData.authPassword) {
      configurationData.authPassword = encryptionService.encrypt(configurationData.authPassword);
    }

    // Crear entidad de configuración
    const configuration = new Configuration(configurationData);

    // Guardar en el repositorio
    return await this.configurationRepository.save(configuration);
  }

  /**
   * Obtiene una configuración por ID
   * @param {number} id
   * @returns {Promise<Configuration>}
   */
  async getConfigurationById(id) {
    const configuration = await this.configurationRepository.findById(id);

    if (!configuration) {
      throw new NotFoundError(`Configuration with ID ${id} not found`);
    }

    return configuration;
  }

  /**
   * Obtiene una configuración por company ID
   * @param {number} companyId
   * @returns {Promise<Configuration>}
   */
  async getConfigurationByCompanyId(companyId) {
    // Validar que la empresa existe
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new NotFoundError(`Company with ID ${companyId} not found`);
    }

    const configuration = await this.configurationRepository.findByCompanyId(companyId);

    if (!configuration) {
      throw new NotFoundError(`Configuration for company ID ${companyId} not found`);
    }

    return configuration;
  }

  /**
   * Obtiene todas las configuraciones con filtros opcionales
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Configuration[]>}
   */
  async getAllConfigurations(filters = {}) {
    return await this.configurationRepository.findAll(filters);
  }

  /**
   * Actualiza una configuración
   * @param {number} id
   * @param {Object} updateData
   * @returns {Promise<Configuration>}
   */
  async updateConfiguration(id, updateData) {
    // Verificar que la configuración existe
    const existingConfiguration = await this.configurationRepository.findById(id);
    if (!existingConfiguration) {
      throw new NotFoundError(`Configuration with ID ${id} not found`);
    }

    // Si se está cambiando el companyId, validar que la nueva empresa existe
    if (updateData.companyId && updateData.companyId !== existingConfiguration.companyId) {
      const company = await this.companyRepository.findById(updateData.companyId);
      if (!company) {
        throw new NotFoundError(`Company with ID ${updateData.companyId} not found`);
      }

      // Verificar que no exista ya una configuración para la nueva empresa
      const existingConfig = await this.configurationRepository.findByCompanyId(updateData.companyId);
      if (existingConfig) {
        throw new ValidationError(`Configuration for company ID ${updateData.companyId} already exists`);
      }
    }

    // Encriptar authPassword si se está actualizando (encriptación REVERSIBLE con AES-256-GCM)
    // Solo encriptar si viene un nuevo password y no está ya encriptado
    if (updateData.authPassword && !encryptionService.isEncrypted(updateData.authPassword)) {
      updateData.authPassword = encryptionService.encrypt(updateData.authPassword);
    }

    // Actualizar en el repositorio
    return await this.configurationRepository.update(id, updateData);
  }

  /**
   * Elimina una configuración
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  async deleteConfiguration(id) {
    // Verificar que la configuración existe
    const existingConfiguration = await this.configurationRepository.findById(id);
    if (!existingConfiguration) {
      throw new NotFoundError(`Configuration with ID ${id} not found`);
    }

    return await this.configurationRepository.delete(id);
  }

  /**
   * Activa una configuración
   * @param {number} id
   * @returns {Promise<Configuration>}
   */
  async activateConfiguration(id) {
    const configuration = await this.getConfigurationById(id);
    configuration.activate();

    return await this.configurationRepository.update(id, { isActive: true });
  }

  /**
   * Desactiva una configuración
   * @param {number} id
   * @returns {Promise<Configuration>}
   */
  async deactivateConfiguration(id) {
    const configuration = await this.getConfigurationById(id);
    configuration.deactivate();

    return await this.configurationRepository.update(id, { isActive: false });
  }

  /**
   * Obtiene todas las empresas con sus configuraciones con paginación
   * @param {Object} options - Opciones de paginación
   * @param {number} options.page - Número de página (default: 1)
   * @param {number} options.limit - Elementos por página (default: 10)
   * @returns {Promise<Object>} - Objeto con datos paginados y metadata
   */
  async getCompaniesWithConfigurations(options = {}) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    // Obtener todas las empresas
    const allCompanies = await this.companyRepository.findAll();
    const total = allCompanies.length;

    // Aplicar paginación
    const paginatedCompanies = allCompanies.slice(offset, offset + limit);

    // Para cada empresa paginada, obtener su configuración si existe
    const companiesWithConfigs = await Promise.all(
      paginatedCompanies.map(async (company) => {
        const configuration = await this.configurationRepository.findByCompanyId(company.id);

        return {
          company: {
            id: company.id,
            name: company.name,
            description: company.description,
            documentNumber: company.documentNumber,
            documentType: company.documentType,
            type: company.type,
          },
          configuration: configuration ? {
            id: configuration.id,
            tokenEndpoint: configuration.tokenEndpoint,
            listQueryEndpoint: configuration.listQueryEndpoint,
            notificationEndpoint: configuration.notificationEndpoint,
            authType: configuration.authType,
            authUsername: configuration.authUsername,
            isActive: configuration.isActive,
            description: configuration.description,
            createdAt: configuration.createdAt,
            updatedAt: configuration.updatedAt,
          } : null
        };
      })
    );

    return {
      data: companiesWithConfigs,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit
      }
    };
  }

  /**
   * Obtiene la documentación de variables disponibles
   * @returns {Object} - Documentación de variables disponibles
   */
  getAvailableVariablesDocumentation() {
    const EndpointResolver = require('../../services/EndpointResolver');
    return EndpointResolver.getAvailableDataFieldsDocumentation();
  }
}

module.exports = ConfigurationUseCases;
