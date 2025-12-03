const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('../config');
const setupRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const jsonErrorHandler = require('./middleware/jsonValidator');
const { logger } = require('../../shared/logger');
const DatabaseFactory = require('../factories/DatabaseFactory');
const { swaggerSpec, swaggerUi } = require('../config/swagger');
const {
  CompanyController,
  RoleController,
  UserRoleController,
  RuleController,
  UserController,
  AssignmentController,
  ConfigurationController
} = require('./controllers');

// Importar servicios de seguridad
const JwtService = require('../../shared/security/JwtService');

// Importar casos de uso
const {
  CreateCompanyUseCase,
  GetCompanyByIdUseCase,
  GetCompanyByDocumentNumberUseCase,
  GetCompanyByDocumentTypeAndNumberUseCase,
  GetAllCompaniesUseCase,
  UpdateCompanyUseCase,
  UpdateCompanyByDocumentUseCase,
  DeleteCompanyUseCase
} = require('../../application/useCases/company/CompanyUseCases');
const {
  CreateRoleUseCase,
  GetRoleByIdUseCase,
  GetAllRolesUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase
} = require('../../application/useCases/roles/RoleUseCases');
const {
  CreateRuleUseCase,
  GetRuleByIdUseCase,
  GetRulesByCompanyUseCase,
  UpdateRuleUseCase,
  DeleteRuleUseCase,
  GetRulesByTypeUseCase,
  GetAvailableTypesUseCase,
  GetRuleStatsByTypeUseCase,
  GetRulesWithRolesUseCase,
  UpdateRuleWithRolesUseCase
} = require('../../application/useCases/rules/RuleUseCase');
const UserUseCases = require('../../application/useCases/users/UserUseCases');
const UserRoleUseCases = require('../../application/useCases/userRole/UserRoleUseCases');
const {
  CreateAssignmentUseCase,
  GetAssignmentUseCase,
  UpdateAssignmentUseCase,
  DeleteAssignmentUseCase,
  ListAssignmentsUseCase
} = require('../../application/useCases/assignment/AssignmentUseCases');


class Server {
  constructor() {
    this.app = express();
    this.port = config.port;
    this.databaseService = null;
    this.controllers = null;
    this.jwtService = null;

    this.setupMiddleware();
  }

  setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(morgan('combined'));
    
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Servir archivos estáticos
    this.app.use(express.static('public'));
  }

  setupRoutes() {
    // Ruta raíz - página de bienvenida
    this.app.get('/', (req, res) => {
      res.sendFile('index.html', { root: 'public' });
    });


      // Middleware de autenticación básica para Swagger interno
      const basicAuth = (req, res, next) => {
        const auth = req.headers['authorization'];
        if (!auth || !auth.startsWith('Basic ')) {
          res.setHeader('WWW-Authenticate', 'Basic realm="Internal API Docs"');
          return res.status(401).send('Authentication required.');
        }
        const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
        const [user, pass] = credentials;
        // Cambia estos valores por los que desees
        if (user === process.env.USER_SWAGGER && pass === process.env.PASSWORD_SWAGGER) {
          return next();
        }
        return res.status(403).send('Forbidden');
      };

       // Swagger interno protegido (usa SOLO swaggerSpec, importado una sola vez)
       const { swaggerSpec } = require('../config/swagger');
       this.app.use('/api-docs/internal', basicAuth, swaggerUi.serve, (req, res, next) => {
         swaggerUi.setup(swaggerSpec, {
           customCss: '.swagger-ui .topbar { display: none }',
           customSiteTitle: 'Back Asignaciones API Documentation (Internal)'
         })(req, res, next);
       });

       this.app.get('/api-docs/internal.json', basicAuth, (req, res) => {
         res.setHeader('Content-Type', 'application/json');
         res.send(swaggerSpec);
       });

      this.app.get('/api-docs/internal.json', basicAuth, (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
      });

      // Swagger externo (sin protección)
      const fs = require('fs');
      const yaml = require('js-yaml');
      const swaggerExternalPath = require('path').resolve(__dirname, '../../..', 'docs', 'swagger-external.yaml');
      let swaggerExternalSpec = {};
      try {
        swaggerExternalSpec = yaml.load(fs.readFileSync(swaggerExternalPath, 'utf8'));
      } catch (err) {
        console.error('No se pudo cargar swagger-external.yaml:', err);
      }
      this.app.use('/api-docs/external', swaggerUi.serve, swaggerUi.setup(swaggerExternalSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Back Asignaciones API Documentation (External)'
      }));

      this.app.get('/api-docs/external.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerExternalSpec);
      });

    // Configurar rutas con controladores inicializados
    const routes = setupRoutes(this.controllers, this.jwtService);
    this.app.use('/api', routes);

    // Health check with database status
    this.app.get('/health', async (req, res) => {
      try {
        let dbStatus = { status: 'not_initialized' };

        if (this.databaseService) {
          dbStatus = await this.databaseService.checkHealth();
        }

        res.json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          environment: config.nodeEnv,
          database: dbStatus
        });
      } catch (error) {
        res.status(500).json({
          status: 'ERROR',
          timestamp: new Date().toISOString(),
          environment: config.nodeEnv,
          database: { status: 'error', message: error.message }
        });
      }
    });
  }

  setupErrorHandling() {
    // Manejar errores JSON específicamente primero
    this.app.use(jsonErrorHandler);
    // Luego el error handler general
    this.app.use(errorHandler);
  }

  setupControllers(repositories) {
    // Inicializar el servicio JWT con el repositorio de usuarios
    this.jwtService = new JwtService(repositories.userRepository);
    // Crear casos de uso con repositorios
    const companyUseCases = {
      createCompany: new CreateCompanyUseCase(repositories.companyRepository),
      getCompanyById: new GetCompanyByIdUseCase(repositories.companyRepository),
      getCompanyByDocumentNumber: new GetCompanyByDocumentNumberUseCase(repositories.companyRepository),
      getCompanyByDocumentTypeAndNumber: new GetCompanyByDocumentTypeAndNumberUseCase(repositories.companyRepository),
      getAllCompanies: new GetAllCompaniesUseCase(repositories.companyRepository),
      updateCompany: new UpdateCompanyUseCase(repositories.companyRepository),
      updateCompanyByDocument: new UpdateCompanyByDocumentUseCase(repositories.companyRepository),

    };

    const roleUseCases = {
      createRole: new CreateRoleUseCase(repositories.roleRepository),
      getRoleById: new GetRoleByIdUseCase(repositories.roleRepository),
      getAllRoles: new GetAllRolesUseCase(repositories.roleRepository),
      updateRole: new UpdateRoleUseCase(repositories.roleRepository),
      deleteRole: new DeleteRoleUseCase(repositories.roleRepository),
      companyRepository: repositories.companyRepository,
      roleRepository: repositories.roleRepository
    };

    const ruleUseCases = {
      createRule: new CreateRuleUseCase(
        repositories.ruleRepository,
        repositories.companyRepository,
        repositories.ruleRoleRepository,
        repositories.roleRepository
      ),
      getRuleById: new GetRuleByIdUseCase(repositories.ruleRepository),
      getRulesByCompany: new GetRulesByCompanyUseCase(repositories.ruleRepository),
      updateRule: new UpdateRuleUseCase(repositories.ruleRepository),
      deleteRule: new DeleteRuleUseCase(repositories.ruleRepository),
      getRulesByType: new GetRulesByTypeUseCase(repositories.ruleRepository),
      getAvailableTypes: new GetAvailableTypesUseCase(repositories.ruleRepository),
      getRuleStatsByType: new GetRuleStatsByTypeUseCase(repositories.ruleRepository),
      GetRulesWithRolesUseCase: new GetRulesWithRolesUseCase(repositories.ruleRepository),
      UpdateRuleWithRolesUseCase: new UpdateRuleWithRolesUseCase(
        repositories.ruleRepository,
        repositories.ruleRoleRepository,
        repositories.roleRepository
      )
    };

    // Crear casos de uso de Assignment
    const assignmentUseCases = {
      createAssignment: new CreateAssignmentUseCase(
        repositories.assignmentRepository,
        repositories.userRepository,
        repositories.roleRepository,
        repositories.companyRepository
      ),
      getAssignment: new GetAssignmentUseCase(repositories.assignmentRepository),
      updateAssignment: new UpdateAssignmentUseCase(
        repositories.assignmentRepository,
        repositories.userRepository,
        repositories.roleRepository,
        repositories.companyRepository
      ),
      deleteAssignment: new DeleteAssignmentUseCase(repositories.assignmentRepository),
      listAssignments: new ListAssignmentsUseCase(repositories.assignmentRepository)
    };

    const userUseCases = new UserUseCases(
      repositories.userRepository,
      repositories.companyRepository,
      repositories.userRoleRepository,
      repositories.roleRepository
    );
    const userRoleUseCases = new UserRoleUseCases(repositories.userRepository, repositories.roleRepository, repositories.userRoleRepository);

    // Inicializar caso de uso para reglas empresariales
    const BusinessRuleProcessorUseCases = require('../../application/useCases/businessRules/BusinessRuleProcessorUseCases');
    const businessRuleProcessorUseCases = new BusinessRuleProcessorUseCases(
      repositories.companyRepository,
      repositories.ruleRepository,
      repositories.ruleRoleRepository,
      repositories.userRoleRepository,
      repositories.userRepository,
      repositories.roleRepository
    );

    // Inicializar controladores con casos de uso
    const BusinessRuleController = require('./controllers/BusinessRuleController');

    // Inicializar servicios de asignaciones automáticas
    const AssignmentQueueService = require('../../application/services/AssignmentQueueService');
    const AutoAssignmentUseCases = require('../../application/useCases/assignment/AutoAssignmentUseCases');
    const AutoAssignmentController = require('./controllers/AutoAssignmentController');

    const assignmentQueueService = new AssignmentQueueService(
      businessRuleProcessorUseCases,
      repositories.assignmentRepository,
      repositories.userRepository,
      repositories.configurationRepository
    );

    const autoAssignmentUseCases = new AutoAssignmentUseCases(
      assignmentQueueService,
      repositories.assignmentRepository,
      repositories.userRepository,
      businessRuleProcessorUseCases
    );

    // Inicializar casos de uso de Configuration
    const ConfigurationUseCases = require('../../application/useCases/configuration/ConfigurationUseCases');
    const configurationUseCases = new ConfigurationUseCases(
      repositories.configurationRepository,
      repositories.companyRepository
    );

    this.controllers = {
      companyController: new CompanyController(companyUseCases),
      roleController: new RoleController(roleUseCases, repositories.roleRepository),
      userRoleController: new UserRoleController(userRoleUseCases),
      ruleController: new RuleController(ruleUseCases, repositories.ruleRepository),
      userController: new UserController(userUseCases, userRoleUseCases),
      assignmentController: new AssignmentController(assignmentUseCases),
      businessRuleController: new BusinessRuleController(businessRuleProcessorUseCases),
      autoAssignmentController: new AutoAssignmentController(autoAssignmentUseCases),
      configurationController: new ConfigurationController(configurationUseCases)
    };
  }

  async initializeAutoAssignments() {
    try {
      const AutoAssignmentBootstrap = require('../bootstrap/AutoAssignmentBootstrap');
      this.autoAssignmentBootstrap = new AutoAssignmentBootstrap(
        this.controllers.autoAssignmentController.autoAssignmentUseCases
      );

      // Mostrar configuración
      this.autoAssignmentBootstrap.logConfigurationInfo();

      // Configurar cierre graceful
      this.autoAssignmentBootstrap.setupGracefulShutdown();

      // Inicializar servicio si está habilitado
      await this.autoAssignmentBootstrap.initialize();

    } catch (error) {
      logger.error('❌ Failed to initialize auto assignment service:', error);
      // No fallar el servidor completo por esto
    }
  }

  async start() {
    try {
      // Initialize database service using the factory
      this.databaseService = await DatabaseFactory.initializeDatabase();
      global.databaseService = this.databaseService;

      // Get repositories from database service
      const repositories = DatabaseFactory.getRepositories(this.databaseService);

      // Setup controllers with repositories
      this.setupControllers(repositories);

      // Exponer repositorios y casos de uso en app para uso en rutas
      this.app.set('companyRepository', repositories.companyRepository);
      this.app.set('userUseCases', this.controllers.userController.userUseCases);

      // Setup routes after controllers are ready
      this.setupRoutes();
      this.setupErrorHandling();

      // Initialize auto assignment bootstrap
      await this.initializeAutoAssignments();

      // Start server
      this.app.listen(this.port, () => {
        console.log(`🚀 Server running on port ${this.port}`);
        console.log(`📋 Internal Swagger: http://localhost:${this.port}/api-docs/internal`);
        console.log(`🌐 External Swagger: http://localhost:${this.port}/api-docs/external`);
      });
    } catch (error) {
      console.error('Error in start() method:', error);
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async shutdown() {
    try {
      if (this.databaseService) {
        await this.databaseService.shutdown();
      }
    } catch (error) {
      logger.error('Error during server shutdown:', error);
    }
  }
}

module.exports = Server;
