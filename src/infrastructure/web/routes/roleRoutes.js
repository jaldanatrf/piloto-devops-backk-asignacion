/**
 * @swagger
 * /api/companies/by-document/{documentNumber}/roles/active:
 *   get:
 *     summary: Obtener roles activos de una empresa por número de documento
 *     description: Devuelve todos los roles activos de una empresa, buscada solo por número de documento.
 *     tags: [Roles, Companies]
 *     parameters:
 *       - in: path
 *         name: documentNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de documento de la empresa
 *     responses:
 *       200:
 *         description: Roles activos recuperados exitosamente
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
 *                   example: Roles activos recuperados exitosamente
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *                 count:
 *                   type: integer
 *                   example: 2
 */
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/companies/{companyId}/roles:
 *   post:
 *     summary: Crear un nuevo rol para una empresa
 *     description: Los roles pertenecen a una empresa específica y solo pueden ser asignados a usuarios de esa empresa
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa propietaria del rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nombre del rol (único dentro de la empresa)
 *                 example: "Administrador de Sistema"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Descripción del rol
 *                 example: "Rol con permisos administrativos completos para esta empresa"
 *               isActive:
 *                 type: boolean
 *                 default: true
 *                 description: Estado activo del rol
 *                 example: true
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Role'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Conflicto - Rol ya existe en esta empresa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   get:
 *     summary: Obtener todos los roles de una empresa
 *     description: Lista todos los roles que pertenecen a una empresa específica
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa propietaria de los roles
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtrar por nombre (búsqueda parcial)
 *     responses:
 *       200:
 *         description: Lista de roles obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Role'
 *                     count:
 *                       type: integer
 *                       description: Número total de roles
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/companies/{companyId}/roles/active:
 *   get:
 *     summary: Obtener roles activos con filtros avanzados
 *     description: Obtiene roles de una empresa con soporte para búsqueda, filtros de estado, ordenamiento y paginación
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Número máximo de elementos a retornar por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Número de elementos a omitir desde el inicio
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filtro específico en nombre de rol
 *         example: "admin"
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtro específico por estado del rol
 *         example: true
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, isActive]
 *           default: name
 *         description: Campo por el cual ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Lista de roles obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Role'
 *                 total:
 *                   type: integer
 *                   description: Total de roles sin filtros
 *                   example: 50
 *                 totalFiltered:
 *                   type: integer
 *                   description: Total de roles con filtros aplicados
 *                   example: 8
 *                 currentPage:
 *                   type: integer
 *                   description: Página actual
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   description: Total de páginas
 *                   example: 2
 *                 hasNextPage:
 *                   type: boolean
 *                   description: Indica si hay página siguiente
 *                   example: true
 *                 hasPreviousPage:
 *                   type: boolean
 *                   description: Indica si hay página anterior
 *                   example: false
 *       400:
 *         description: Error de validación en parámetros
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/companies/{companyId}/roles/search:
 *   get:
 *     summary: Buscar roles por nombre en una empresa
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Límite de resultados
 *     responses:
 *       200:
 *         description: Resultados de búsqueda obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Role'
 *                     count:
 *                       type: integer
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */

/**
 * @swagger
 * /api/companies/{companyId}/roles/{roleId}:
 *   get:
 *     summary: Obtener un rol específico por ID
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Role'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   put:
 *     summary: Actualizar un rol específico
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Nuevo nombre del rol
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Nueva descripción del rol
 *               isActive:
 *                 type: boolean
 *                 description: Nuevo estado activo del rol
 *     responses:
 *       200:
 *         description: Rol actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Role'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 * 
 *   delete:
 *     summary: Eliminar un rol específico
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Role deleted successfully"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/companies/{companyId}/roles/available:
 *   get:
 *     summary: Obtener roles disponibles para asignar en una empresa
 *     description: Lista roles activos de una empresa que pueden ser asignados a usuarios
 *     tags: [Roles]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la empresa
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: ID del usuario (para filtrar roles ya asignados - en desarrollo)
 *     responses:
 *       200:
 *         description: Lista de roles disponibles para asignación
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Role'
 *                     count:
 *                       type: integer
 */

// Función para crear las rutas de roles (siempre bajo una compañía)
function createRoleRoutes(roleController) {
  // Endpoint: Obtener roles activos por número de documento de la empresa
  router.get('/companies/by-document/:documentNumber/roles/active', async (req, res, next) => {
    try {
      const { documentNumber } = req.params;
      if (!documentNumber) {
        return res.status(400).json({ success: false, message: 'Número de documento requerido', data: null });
      }
      // Buscar la compañía por número de documento
      const company = await roleController.roleUseCases.companyRepository.findByDocumentNumber(documentNumber);
      if (!company) {
        return res.status(404).json({ success: false, message: 'Empresa no encontrada', data: null });
      }
      // Buscar roles activos por companyId
      const roles = await roleController.roleUseCases.roleRepository.findActive(company.id);
      return res.status(200).json({
        success: true,
        message: 'Roles activos recuperados exitosamente',
        data: roles,
        count: roles.length
      });
    } catch (error) {
      next(error);
    }
  });
  // Rutas básicas CRUD (todas requieren companyId)
  router.post('/companies/:companyId/roles', (req, res, next) => roleController.create(req, res, next));
  router.get('/companies/:companyId/roles', (req, res, next) => roleController.getAll(req, res, next));
  router.get('/companies/:companyId/roles/filtered', (req, res, next) => roleController.getAllFiltered(req, res, next));
  router.get('/companies/:companyId/roles/active', (req, res, next) => roleController.getActive(req, res, next));
  router.get('/companies/:companyId/roles/available', (req, res, next) => roleController.getAvailableForUser(req, res, next));
  router.get('/companies/:companyId/roles/search', (req, res, next) => roleController.search(req, res, next));
  router.get('/companies/:companyId/roles/:roleId', (req, res, next) => roleController.getById(req, res, next));
  router.put('/companies/:companyId/roles/:roleId', (req, res, next) => roleController.update(req, res, next));
  router.delete('/companies/:companyId/roles/:roleId', (req, res, next) => roleController.delete(req, res, next));
  
  // Rutas especiales (temporalmente deshabilitadas)
  // router.get('/companies/:companyId/roles/:roleId/stats', (req, res, next) => roleController.getUsageStats(req, res, next));
  // router.get('/companies/:companyId/roles/:roleId/can-delete', (req, res, next) => roleController.canBeDeleted(req, res, next));
  
  // Ruta administrativa (todos los roles) - temporalmente deshabilitada
  // router.get('/roles', (req, res, next) => roleController.getAllRoles(req, res, next));
  
  return router;
}

module.exports = createRoleRoutes;
