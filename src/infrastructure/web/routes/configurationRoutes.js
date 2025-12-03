const express = require('express');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Configurations
 *   description: Configuraciones de endpoints externos por empresa
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ConfigurationInput:
 *       type: object
 *       required:
 *         - companyId
 *         - tokenEndpoint
 *         - listQueryEndpoint
 *         - notificationEndpoint
 *         - authType
 *       properties:
 *         companyId:
 *           type: integer
 *           description: ID de la empresa
 *           example: 5
 *         tokenEndpoint:
 *           type: string
 *           description: Endpoint para generación de token
 *           example: "https://gestor.cuentamedica.com/api/Authentication/Authenticate"
 *         tokenMethod:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE, PATCH]
 *           default: POST
 *         listQueryEndpoint:
 *           type: string
 *           description: Endpoint para consulta de listas
 *           example: "https://gestor.cuentamedica.com/api/claims"
 *         listQueryMethod:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE, PATCH]
 *           default: GET
 *         notificationEndpoint:
 *           type: string
 *           description: Endpoint para notificación de asignaciones
 *           example: "https://gestor.cuentamedica.com/api/assignments/notify"
 *         notificationMethod:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE, PATCH]
 *           default: POST
 *         authType:
 *           type: string
 *           enum: [BASIC, BEARER, API_KEY, OAUTH2]
 *           description: Tipo de autenticación
 *           example: "BEARER"
 *         authUsername:
 *           type: string
 *           description: Usuario para autenticación
 *           example: "admin"
 *         authPassword:
 *           type: string
 *           description: |
 *             Contraseña para autenticación externa (se encripta con AES-256-GCM para seguridad en BD).
 *             Se desencripta automáticamente antes de enviarla al servicio externo.
 *             IMPORTANTE: Esta es una credencial de API, NO una contraseña de usuario.
 *           example: "admin"
 *         authApiKey:
 *           type: string
 *           description: API Key (requerido para authType=API_KEY)
 *         authAdditionalFields:
 *           type: object
 *           description: |
 *             Campos adicionales para autenticación. Para BEARER/OAUTH2, debe contener 'additionalClaims'.
 *             Soporta variables dinámicas usando sintaxis {variable} que se resuelven con bodyVariableMapping.
 *           example:
 *             additionalClaims:
 *               nit: "{companyNit}"
 *               user: "{userDud}"
 *               rol: "emiter"
 *         pathVariableMapping:
 *           type: object
 *           description: |
 *             Mapeo de variables para placeholders en URLs.
 *             Ejemplo: {"documentType": "assignment.documentType", "documentNumber": "assignment.documentNumber"}
 *           example:
 *             documentType: "assignment.documentType"
 *             documentNumber: "assignment.documentNumber"
 *         bodyVariableMapping:
 *           type: object
 *           description: |
 *             Mapeo de variables para placeholders en body y authAdditionalFields.
 *             Define qué ruta de datos usar para cada variable (assignment.*, user.*, company.*).
 *           example:
 *             companyNit: "company.documentNumber"
 *             userDud: "user.dud"
 *             assignedTo: "user.dud"
 *             claimId: "assignment.claimId"
 *         customHeaders:
 *           type: object
 *           description: Headers HTTP personalizados para las peticiones
 *           example:
 *             X-Client-ID: "asignaciones-backend"
 *             X-Source-System: "orchestrator"
 *         description:
 *           type: string
 *           description: Descripción de la configuración
 *           example: "Configuración para Gestor Cuenta Médica con additionalClaims"
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Estado de la configuración (activa/inactiva)
 */

function createConfigurationRoutes(configurationController) {
  /**
   * @swagger
   * /api/configurations/variables/available:
   *   get:
   *     summary: Obtener documentación de variables disponibles
   *     tags: [Configurations]
   *     responses:
   *       200:
   *         description: Documentación de variables obtenida exitosamente
   */
  router.get('/variables/available', (req, res, next) =>
    configurationController.getAvailableVariables(req, res, next)
  );

  /**
   * @swagger
   * /api/configurations/active:
   *   get:
   *     summary: Obtener solo configuraciones activas
   *     tags: [Configurations]
   *     responses:
   *       200:
   *         description: Configuraciones activas obtenidas exitosamente
   */
  router.get('/active', (req, res, next) =>
    configurationController.getActive(req, res, next)
  );

  /**
   * @swagger
   * /api/configurations/companies-with-configs:
   *   get:
   *     summary: Obtener todas las empresas con sus configuraciones (paginado)
   *     tags: [Configurations]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *         description: Número de página
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Elementos por página
   *     responses:
   *       200:
   *         description: Empresas con configuraciones obtenidas exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       company:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: integer
   *                           name:
   *                             type: string
   *                           description:
   *                             type: string
   *                           documentNumber:
   *                             type: string
   *                           documentType:
   *                             type: string
   *                           type:
   *                             type: string
   *                       configuration:
   *                         type: object
   *                         nullable: true
   *                         properties:
   *                           id:
   *                             type: integer
   *                           tokenEndpoint:
   *                             type: string
   *                           listQueryEndpoint:
   *                             type: string
   *                           notificationEndpoint:
   *                             type: string
   *                           authType:
   *                             type: string
   *                           authUsername:
   *                             type: string
   *                           isActive:
   *                             type: boolean
   *                           description:
   *                             type: string
   *                           createdAt:
   *                             type: string
   *                             format: date-time
   *                           updatedAt:
   *                             type: string
   *                             format: date-time
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                       description: Total de empresas
   *                     page:
   *                       type: integer
   *                       description: Página actual
   *                     totalPages:
   *                       type: integer
   *                       description: Total de páginas
   *                     limit:
   *                       type: integer
   *                       description: Elementos por página
   */
  router.get('/companies-with-configs', (req, res, next) =>
    configurationController.getCompaniesWithConfigurations(req, res, next)
  );

  /**
   * @swagger
   * /api/configurations:
   *   post:
   *     summary: Crear una nueva configuración
   *     tags: [Configurations]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ConfigurationInput'
   *     responses:
   *       201:
   *         description: Configuración creada exitosamente
   *       400:
   *         description: Error de validación
   *       409:
   *         description: La configuración ya existe para esta empresa
   */
  router.post('/', (req, res, next) =>
    configurationController.create(req, res, next)
  );

  /**
   * @swagger
   * /api/configurations:
   *   get:
   *     summary: Obtener todas las configuraciones
   *     tags: [Configurations]
   *     parameters:
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filtrar por estado activo
   *       - in: query
   *         name: companyId
   *         schema:
   *           type: integer
   *         description: Filtrar por ID de empresa
   *       - in: query
   *         name: authType
   *         schema:
   *           type: string
   *         description: Filtrar por tipo de autenticación
   *     responses:
   *       200:
   *         description: Configuraciones obtenidas exitosamente
   */
  router.get('/', (req, res, next) =>
    configurationController.getAll(req, res, next)
  );

  /**
   * @swagger
   * /api/configurations/{id}:
   *   get:
   *     summary: Obtener configuración por ID
   *     tags: [Configurations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la configuración
   *     responses:
   *       200:
   *         description: Configuración obtenida exitosamente
   *       404:
   *         description: Configuración no encontrada
   */
  router.get('/:id', (req, res, next) =>
    configurationController.getById(req, res, next)
  );

  /**
   * @swagger
   * /api/configurations/{id}:
   *   put:
   *     summary: Actualizar una configuración
   *     tags: [Configurations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la configuración
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ConfigurationInput'
   *     responses:
   *       200:
   *         description: Configuración actualizada exitosamente
   *       404:
   *         description: Configuración no encontrada
   *       400:
   *         description: Error de validación
   */
  router.put('/:id', (req, res, next) =>
    configurationController.update(req, res, next)
  );

  /**
   * @swagger
   * /api/configurations/{id}:
   *   delete:
   *     summary: Eliminar una configuración
   *     tags: [Configurations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la configuración
   *     responses:
   *       200:
   *         description: Configuración eliminada exitosamente
   *       404:
   *         description: Configuración no encontrada
   */
  router.delete('/:id', (req, res, next) =>
    configurationController.delete(req, res, next)
  );

  /**
   * @swagger
   * /api/configurations/{id}/activate:
   *   patch:
   *     summary: Activar una configuración
   *     tags: [Configurations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la configuración
   *     responses:
   *       200:
   *         description: Configuración activada exitosamente
   *       404:
   *         description: Configuración no encontrada
   */
  router.patch('/:id/activate', (req, res, next) =>
    configurationController.activate(req, res, next)
  );

  /**
   * @swagger
   * /api/configurations/{id}/deactivate:
   *   patch:
   *     summary: Desactivar una configuración
   *     tags: [Configurations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la configuración
   *     responses:
   *       200:
   *         description: Configuración desactivada exitosamente
   *       404:
   *         description: Configuración no encontrada
   */
  router.patch('/:id/deactivate', (req, res, next) =>
    configurationController.deactivate(req, res, next)
  );

  /**
   * @swagger
   * /api/configurations/company/{companyId}:
   *   get:
   *     summary: Obtener configuración por ID de empresa
   *     tags: [Configurations]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la empresa
   *     responses:
   *       200:
   *         description: Configuración obtenida exitosamente
   *       404:
   *         description: Configuración no encontrada para esta empresa
   */
  router.get('/company/:companyId', (req, res, next) =>
    configurationController.getByCompanyId(req, res, next)
  );

  return router;
}

module.exports = createConfigurationRoutes;
