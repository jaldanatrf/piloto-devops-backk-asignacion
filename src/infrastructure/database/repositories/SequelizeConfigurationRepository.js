const ConfigurationRepository = require('../../../domain/repositories/ConfigurationRepository');
const Configuration = require('../../../domain/entities/Configuration');
const { ValidationError, NotFoundError } = require('../../../shared/errors');

class SequelizeConfigurationRepository extends ConfigurationRepository {
  constructor(sequelizeModels) {
    super();
    this.ConfigurationModel = sequelizeModels.Configuration;
    this.CompanyModel = sequelizeModels.Company;
  }

  async save(configuration) {
    try {
      const configurationData = {
        companyId: configuration.companyId,
        tokenEndpoint: configuration.tokenEndpoint,
        tokenMethod: configuration.tokenMethod,
        listQueryEndpoint: configuration.listQueryEndpoint,
        listQueryMethod: configuration.listQueryMethod,
        notificationEndpoint: configuration.notificationEndpoint,
        notificationMethod: configuration.notificationMethod,
        authType: configuration.authType,
        authUsername: configuration.authUsername,
        authPassword: configuration.authPassword,
        authApiKey: configuration.authApiKey,
        authAdditionalFields: configuration.authAdditionalFields,
        pathVariableMapping: configuration.pathVariableMapping,
        bodyVariableMapping: configuration.bodyVariableMapping,
        customHeaders: configuration.customHeaders,
        isActive: configuration.isActive,
        description: configuration.description
      };

      const savedConfiguration = await this.ConfigurationModel.create(configurationData);

      return this.toEntity(savedConfiguration);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ValidationError(`Configuration for company ID ${configuration.companyId} already exists`);
      }
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new ValidationError(`Company with ID ${configuration.companyId} does not exist`);
      }
      throw error;
    }
  }

  async findById(id) {
    try {
      const configurationData = await this.ConfigurationModel.findByPk(id);

      if (!configurationData) {
        return null;
      }

      return this.toEntity(configurationData);
    } catch (error) {
      throw error;
    }
  }

  async findByCompanyId(companyId) {
    try {
      const configurationData = await this.ConfigurationModel.findOne({
        where: { companyId: companyId }
      });

      if (!configurationData) {
        return null;
      }

      return this.toEntity(configurationData);
    } catch (error) {
      throw error;
    }
  }

  async findAll(filters = {}) {
    try {
      const whereClause = {};

      // Aplicar filtros
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }

      if (filters.companyId !== undefined) {
        whereClause.companyId = filters.companyId;
      }

      if (filters.authType) {
        whereClause.authType = filters.authType;
      }

      const configurationsData = await this.ConfigurationModel.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      });

      return configurationsData.map(config => this.toEntity(config));
    } catch (error) {
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      const [updatedRowsCount] = await this.ConfigurationModel.update(updateData, {
        where: { id: id }
      });

      if (updatedRowsCount === 0) {
        throw new NotFoundError(`Configuration with ID ${id} not found`);
      }

      // Obtener la configuración actualizada
      return await this.findById(id);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ValidationError(`Configuration for company already exists`);
      }
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new ValidationError(`Company with ID ${updateData.companyId} does not exist`);
      }
      throw error;
    }
  }

  async delete(id) {
    try {
      const deletedRowsCount = await this.ConfigurationModel.destroy({
        where: { id: id }
      });

      if (deletedRowsCount === 0) {
        throw new NotFoundError(`Configuration with ID ${id} not found`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Convierte un modelo Sequelize a entidad de dominio
   * @param {Object} configData - Datos del modelo Sequelize
   * @returns {Configuration} - Entidad de dominio
   */
  toEntity(configData) {
    return new Configuration({
      id: configData.id,
      companyId: configData.companyId,
      tokenEndpoint: configData.tokenEndpoint,
      tokenMethod: configData.tokenMethod,
      listQueryEndpoint: configData.listQueryEndpoint,
      listQueryMethod: configData.listQueryMethod,
      notificationEndpoint: configData.notificationEndpoint,
      notificationMethod: configData.notificationMethod,
      authType: configData.authType,
      authUsername: configData.authUsername,
      authPassword: configData.authPassword,
      authApiKey: configData.authApiKey,
      authAdditionalFields: configData.authAdditionalFields,
      pathVariableMapping: configData.pathVariableMapping,
      bodyVariableMapping: configData.bodyVariableMapping,
      customHeaders: configData.customHeaders,
      isActive: configData.isActive,
      description: configData.description,
      createdAt: configData.createdAt,
      updatedAt: configData.updatedAt
    });
  }
}

module.exports = SequelizeConfigurationRepository;
