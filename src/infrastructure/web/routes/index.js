const express = require('express');
const router = express.Router();

// Importar las funciones de creación de rutas
const createCompanyRoutes = require('./companyRoutes');
const createRoleRoutes = require('./roleRoutes');
const createUserRoleRoutes = require('./userRoleRoutes');
const createRuleRoutes = require('./ruleRoutes');
const createUserRoutes = require('./userRoutes');
const createAsignacionRoutes = require('./assignmentRoutes');
const createBusinessRuleRoutes = require('./businessRuleRoutes');
const createAutoAssignmentRoutes = require('./autoAssignmentRoutes');
const createConfigurationRoutes = require('./configurationRoutes');
const createAuthRoutes = require('./auth');
const debugRoutes = require('./debugRoutes');
const { createFullAuthMiddleware } = require('../middleware/auth');

// Función para configurar todas las rutas con los controladores
function setupRoutes(controllers, jwtService = null) {
  // Configurar rutas principales
  router.get('/', (req, res) => {
    res.json({
      message: 'API Backend Asignaciones',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        companies: '/api/companies',
        companyRoles: '/api/companies/:companyId/roles',
        userRoles: '/api/users/:userId/roles',
        rules: '/api/companies/:companyId/rules',
        users: '/api/users',
        assignments: '/api/asignaciones',
        businessRules: '/api/business-rules',
        autoAssignments: '/api/auto-assignments',
        configurations: '/api/configurations'
      },
      design: {
        note: 'Los roles son específicos de cada compañía y pueden ser asignados a usuarios de esa empresa',
        relationships: [
          'User ↔ Company: Un usuario pertenece a UNA empresa',
          'Role ↔ Company: Un rol pertenece a UNA empresa',
          'User ↔ Roles: Un usuario puede tener MUCHOS roles de su empresa (N:M)'
        ]
      }
    });
  });

  // Configurar rutas específicas con controladores
  
  // Rutas de autenticación (no requieren autenticación previa)
  if (jwtService) {
    router.use('/auth', createAuthRoutes(jwtService));
  }
  
  // Ruta específica sin autenticación SOLO para /complete
  router.post('/assignments/complete', require('../controllers/assignmentProcessController').completeByClaimAndDocument.bind(require('../controllers/assignmentProcessController')));
  
  /**
   * @swagger
   * /api/companies/import-users/{documentType}/{documentNumber}:
   *   post:
   *     summary: Importar usuarios desde API externa (SIN AUTENTICACIÓN)
   *     description: |
   *       Importa usuarios desde el API externa de módulos y planes. 
   *       **ESTE ENDPOINT NO REQUIERE AUTENTICACIÓN JWT** - Es público para integraciones externas.
   *       
   *       Proceso:
   *       1. Obtiene token del API externa usando documentType + documentNumber
   *       2. Consulta empresa en API externa por NIT
   *       3. Busca empresa local por documentNumber
   *       4. Importa usuarios asociados (crea nuevos, identifica existentes)
   *     tags: [Companies]
   *     security: []  # No authentication required
   *     parameters:
   *       - name: documentType
   *         in: path
   *         required: true
   *         description: Tipo de documento de la empresa
   *         schema:
   *           type: string
   *           enum: [NIT, CC, CE]
   *         example: NIT
   *       - name: documentNumber
   *         in: path
   *         required: true
   *         description: Número de documento de la empresa
   *         schema:
   *           type: string
   *         example: "900123456"
   *     responses:
   *       200:
   *         description: Usuarios importados exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: "Importación completada: 5 usuarios creados, 2 ya existían"
   *                 data:
   *                   type: object
   *                   properties:
   *                     created:
   *                       type: integer
   *                       description: Número de usuarios nuevos creados
   *                       example: 5
   *                     existing:
   *                       type: integer
   *                       description: Número de usuarios que ya existían
   *                       example: 2
   *                     company:
   *                       type: string
   *                       description: Nombre de la empresa
   *                       example: "Innovación Digital S.A.S."
   *                     totalProcessed:
   *                       type: integer
   *                       description: Total de usuarios procesados
   *                       example: 7
   *       404:
   *         description: Empresa no encontrada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Empresa no encontrada en el API externo"
   *                 data:
   *                   type: null
   *                   example: null
   *       500:
   *         description: Error interno del servidor
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Error interno del servidor durante la importación"
   *                 data:
   *                   type: null
   *                   example: null
   */
  // Ruta específica sin autenticación para importación de usuarios
  router.post('/companies/import-users/:documentType/:documentNumber', async (req, res, next) => {
    try {
      const { documentType, documentNumber } = req.params;
      const modulesPlansService = require('../../../application/services/ModulosPlanesService');
      const token = await modulesPlansService.getToken(documentType, documentNumber);
      const companies = await modulesPlansService.getCompanyByNit(documentNumber, token);
      if (!Array.isArray(companies) || companies.length === 0) {
        return res.status(404).json({ success: false, message: 'Empresa no encontrada en el API externo', data: null });
      }
      const companyExt = companies[0];
      const companyRepository = req.app.get('companyRepository');
      const companyLocal = await companyRepository.findByDocumentNumber(documentNumber);
      if (!companyLocal) {
        return res.status(404).json({ success: false, message: 'Empresa no encontrada en el sistema local', data: null });
      }
      const userUseCases = req.app.get('userUseCases');
      const created = [];
      const existing = [];
      const errors = [];

      // Helper para limpiar tildes y caracteres especiales
      const cleanName = (str) => {
        if (!str) return '';
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
          .replace(/[^a-zA-Z .-]/g, ' ') // Solo letras, espacio, punto, guion
          .replace(/\s+/g, ' ') // Unifica espacios
          .trim();
      };

      for (const userExt of companyExt.usersAssociated || []) {
        try {
          const dud = userExt.userName;

          // Usar findByDUD primero para evitar intentar crear duplicados
          let user = await userUseCases.userRepository.findByDUD(dud);

          if (user) {
            existing.push(user);
          } else {
            // Intentar crear usuario
            const userData = {
              name: cleanName(userExt.Nombres),
              dud: userExt.userName,
              companyId: companyLocal.id,
              isActive: true,
              roles: []
            };

            try {
              const newUser = await userUseCases.createUser(userData);
              created.push(newUser);
            } catch (createError) {
              // Si falla por duplicado, verificar si fue creado por otro proceso concurrente
              if (createError.message && createError.message.includes('DUD already exists')) {
                const retryUser = await userUseCases.userRepository.findByDUD(dud);
                if (retryUser) {
                  existing.push(retryUser);
                } else {
                  throw createError;
                }
              } else {
                throw createError;
              }
            }
          }
        } catch (userError) {
          errors.push({
            dud: userExt.userName,
            name: userExt.Nombres,
            error: userError.message
          });
        }
      }

      return res.status(200).json({
        success: errors.length === 0,
        message: `Importación completada: ${created.length} usuarios creados, ${existing.length} ya existían${errors.length > 0 ? `, ${errors.length} errores` : ''}`,
        data: {
          created: created.length,
          existing: existing.length,
          errors: errors.length,
          errorDetails: errors.length > 0 ? errors : undefined,
          company: companyLocal.name,
          totalProcessed: created.length + existing.length
        }
      });
    } catch (error) {
      console.error('Error en importación de usuarios:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor durante la importación',
        data: null
      });
    }
  });
  
  // Aplicar middleware de autenticación a todas las rutas siguientes
  if (jwtService) {
    const fullAuthMiddleware = createFullAuthMiddleware(jwtService);
    router.use(fullAuthMiddleware);
  }
  
  router.use('/companies', createCompanyRoutes(controllers.companyController));
  router.use('/', createRoleRoutes(controllers.roleController));
  router.use('/', createUserRoleRoutes(controllers.userRoleController));
  router.use('/', createRuleRoutes(controllers.ruleController));
  router.use('/users', createUserRoutes(controllers.userController));
  router.use('/assignments', createAsignacionRoutes(controllers.assignmentController));
  router.use('/business-rules', createBusinessRuleRoutes(controllers.businessRuleController));
  router.use('/auto-assignments', createAutoAssignmentRoutes(controllers.autoAssignmentController));
  router.use('/configurations', createConfigurationRoutes(controllers.configurationController));

  // Ruta global para reglas con roles con filtros avanzados
  /**
   * @swagger
   * /api/rules/with-roles:
   *   get:
   *     summary: Obtener reglas con sus roles asociados (paginado y filtrado)
   *     description: Obtiene todas las reglas de una compañía específica junto con sus roles asociados, con soporte para paginación, búsqueda, filtros y ordenamiento
   *     tags:
   *       - Rules
   *     parameters:
   *       - in: query
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la compañía
   *         example: 4
   *       - in: query
   *         name: limit
   *         required: false
   *         schema:
   *           type: integer
   *           default: 10
   *           minimum: 1
   *           maximum: 100
   *         description: Número máximo de reglas a retornar por página
   *         example: 5
   *       - in: query
   *         name: offset
   *         required: false
   *         schema:
   *           type: integer
   *           default: 0
   *           minimum: 0
   *         description: Número de reglas a saltar (para paginación)
   *         example: 5
   *       - in: query
   *         name: name
   *         required: false
   *         schema:
   *           type: string
   *         description: Filtro específico en nombre de regla
   *         example: "contrato"
   *       - in: query
   *         name: description
   *         required: false
   *         schema:
   *           type: string
   *         description: Filtro específico en descripción de regla
   *         example: "monto"
   *       - in: query
   *         name: type
   *         required: false
   *         schema:
   *           type: string
   *           enum: [COMPANY, AMOUNT, COMPANY-AMOUNT, BUSINESS, SECURITY, COMPLIANCE, OPERATIONAL, TECHNICAL, CUSTOM]
   *         description: Filtro por tipo de regla
   *         example: "AMOUNT"
   *       - in: query
   *         name: sortBy
   *         required: false
   *         schema:
   *           type: string
   *           enum: [name, createdAt, type, isActive]
   *           default: createdAt
   *         description: Campo por el cual ordenar
   *         example: "name"
   *       - in: query
   *         name: sortOrder
   *         required: false
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *           default: desc
   *         description: Orden de clasificación
   *         example: "asc"
   *     responses:
   *       200:
   *         description: Reglas obtenidas exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       id:
   *                         type: integer
   *                         example: 1
   *                       name:
   *                         type: string
   *                         example: "Regla de validación"
   *                       description:
   *                         type: string
   *                         example: "Descripción de la regla"
   *                       type:
   *                         type: string
   *                         example: "AMOUNT"
   *                       isActive:
   *                         type: boolean
   *                         example: true
   *                       minimumAmount:
   *                         type: number
   *                         example: 1000
   *                       maximumAmount:
   *                         type: number
   *                         example: 50000
   *                       nitAssociatedCompany:
   *                         type: string
   *                         example: "123456789"
   *                       createdAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2024-01-15T10:30:00Z"
   *                       updatedAt:
   *                         type: string
   *                         format: date-time
   *                         example: "2024-01-15T10:30:00Z"
   *                       roles:
   *                         type: array
   *                         items:
   *                           type: object
   *                           properties:
   *                             id:
   *                               type: integer
   *                               example: 1
   *                             name:
   *                               type: string
   *                               example: "admin"
   *                 total:
   *                   type: integer
   *                   description: Total de reglas sin filtros
   *                   example: 150
   *                 totalFiltered:
   *                   type: integer
   *                   description: Total de reglas con filtros aplicados
   *                   example: 12
   *                 currentPage:
   *                   type: integer
   *                   description: Página actual
   *                   example: 2
   *                 totalPages:
   *                   type: integer
   *                   description: Total de páginas
   *                   example: 3
   *                 hasNextPage:
   *                   type: boolean
   *                   description: Indica si hay página siguiente
   *                   example: true
   *                 hasPreviousPage:
   *                   type: boolean
   *                   description: Indica si hay página anterior
   *                   example: true
   *       400:
   *         description: Error de validación - parámetros inválidos
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "companyId es requerido"
   *                 data:
   *                   type: null
   *                   example: null
   *       500:
   *         description: Error interno del servidor
   */
  router.get('/rules/with-roles', (req, res, next) => {
    controllers.ruleController.getRulesWithRoles(req, res, next);
  });

  // Rutas de debug (solo en desarrollo)
  if (process.env.NODE_ENV !== 'production') {
    router.use('/debug', debugRoutes);
  }

  return router;
}

module.exports = setupRoutes;
