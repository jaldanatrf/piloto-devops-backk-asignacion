class ConfigurationController {
  constructor(configurationUseCases) {
    this.configurationUseCases = configurationUseCases;
  }

  /**
   * POST /api/configurations
   * Crea una nueva configuración
   */
  async create(req, res, next) {
    try {
      const configuration = await this.configurationUseCases.createConfiguration(req.body);

      res.status(201).json({
        success: true,
        data: configuration.getFullInfo(),
        message: 'Configuration created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/configurations/:id
   * Obtiene una configuración por ID
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;

      const configuration = await this.configurationUseCases.getConfigurationById(parseInt(id));

      res.json({
        success: true,
        data: configuration.getFullInfo()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/configurations/company/:companyId
   * Obtiene la configuración de una empresa
   */
  async getByCompanyId(req, res, next) {
    try {
      const { companyId } = req.params;

      const configuration = await this.configurationUseCases.getConfigurationByCompanyId(parseInt(companyId));

      res.json({
        success: true,
        data: configuration.getFullInfo()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/configurations
   * Obtiene todas las configuraciones con filtros opcionales
   */
  async getAll(req, res, next) {
    try {
      const filters = {
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        companyId: req.query.companyId ? parseInt(req.query.companyId) : undefined,
        authType: req.query.authType
      };

      const configurations = await this.configurationUseCases.getAllConfigurations(filters);

      res.json({
        success: true,
        data: configurations.map(config => config.getBasicInfo()),
        count: configurations.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/configurations/:id
   * Actualiza una configuración
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;

      const configuration = await this.configurationUseCases.updateConfiguration(parseInt(id), req.body);

      res.json({
        success: true,
        data: configuration.getFullInfo(),
        message: 'Configuration updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/configurations/:id
   * Elimina una configuración
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      await this.configurationUseCases.deleteConfiguration(parseInt(id));

      res.json({
        success: true,
        message: 'Configuration deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/configurations/:id/activate
   * Activa una configuración
   */
  async activate(req, res, next) {
    try {
      const { id } = req.params;

      const configuration = await this.configurationUseCases.activateConfiguration(parseInt(id));

      res.json({
        success: true,
        data: configuration.getBasicInfo(),
        message: 'Configuration activated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/configurations/:id/deactivate
   * Desactiva una configuración
   */
  async deactivate(req, res, next) {
    try {
      const { id } = req.params;

      const configuration = await this.configurationUseCases.deactivateConfiguration(parseInt(id));

      res.json({
        success: true,
        data: configuration.getBasicInfo(),
        message: 'Configuration deactivated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/configurations/variables/available
   * Obtiene la documentación de variables disponibles
   */
  async getAvailableVariables(req, res, next) {
    try {
      const documentation = this.configurationUseCases.getAvailableVariablesDocumentation();

      res.json({
        success: true,
        data: documentation,
        message: 'Available variables documentation retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/configurations/active
   * Obtiene solo las configuraciones activas
   */
  async getActive(req, res, next) {
    try {
      const configurations = await this.configurationUseCases.getAllConfigurations({ isActive: true });

      res.json({
        success: true,
        data: configurations.map(config => config.getBasicInfo()),
        count: configurations.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/configurations/companies-with-configs
   * Obtiene todas las empresas con sus configuraciones con paginación
   */
  async getCompaniesWithConfigurations(req, res, next) {
    try {
      const page = req.query.page ? parseInt(req.query.page) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;

      const result = await this.configurationUseCases.getCompaniesWithConfigurations({
        page,
        limit
      });

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ConfigurationController;
