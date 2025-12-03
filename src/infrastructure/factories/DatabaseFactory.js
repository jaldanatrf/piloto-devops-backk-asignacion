
const SequelizeAdapter = require('../database/SequelizeAdapter');
const DatabaseService = require('../../application/services/DatabaseService');
const { defineModels } = require('../database/models');
const {
  SequelizeCompanyRepository,
  SequelizeRoleRepository,
  SequelizeRuleRepository,
  SequelizeUserRepository,
  SequelizeUserRoleRepository,
  SequelizeAssignmentRepository,
  SequelizeRuleRoleRepository,
  SequelizeConfigurationRepository
} = require('../database/repositories');
const DatabaseInitService = require('../database/services/DatabaseInitService');

// Factory para configurar e inyectar dependencias de base de datos
class DatabaseFactory {
  static createDatabaseService() {
    const databaseAdapter = new SequelizeAdapter();
    return new DatabaseService(databaseAdapter);
  }

  static async initializeDatabase() {
    try {
      const databaseService = this.createDatabaseService();
      await databaseService.initialize();

      // Obtener la instancia de Sequelize
      const sequelize = databaseService.databaseAdapter.getSequelizeInstance();

      // Definir todos los modelos
      const models = defineModels(sequelize);

      // Ejecutar migraciones y validación de esquema
      const dbInitService = new DatabaseInitService(sequelize, models);
      const verbose = process.env.DB_INIT_VERBOSE === 'true';
      const initReport = await dbInitService.initialize(verbose);

      // Si hay errores críticos en migraciones, lanzar error
      if (initReport.hasErrors && initReport.migrations?.failed > 0) {
        throw new Error('Database migrations failed. Check logs for details.');
      }

      // Crear repositorios con el adapter
      const repositories = {
        companyRepository: new SequelizeCompanyRepository(models),
        roleRepository: new SequelizeRoleRepository(models),
        ruleRepository: new SequelizeRuleRepository(models),
        userRepository: new SequelizeUserRepository(models),
        userRoleRepository: new SequelizeUserRoleRepository(sequelize, models),
        assignmentRepository: new SequelizeAssignmentRepository(models),
        ruleRoleRepository: new SequelizeRuleRoleRepository(models),
        configurationRepository: new SequelizeConfigurationRepository(models)
      };

      // Agregar repositorios al servicio
      databaseService.repositories = repositories;
      databaseService.models = models;
      databaseService.dbInitService = dbInitService;

      console.log('Database initialized successfully with all repositories');
      return databaseService;
    } catch (error) {
      console.error('Failed to initialize database:', error.message);
      throw error;
    }
  }

  // Método para obtener repositorios específicos
  static getRepositories(databaseService) {
    if (!databaseService.repositories) {
      throw new Error('Database service not properly initialized. Repositories not available.');
    }
    return databaseService.repositories;
  }

  // Método para obtener modelos específicos
  static getModels(databaseService) {
    if (!databaseService.models) {
      throw new Error('Database service not properly initialized. Models not available.');
    }
    return databaseService.models;
  }
}

module.exports = DatabaseFactory;
