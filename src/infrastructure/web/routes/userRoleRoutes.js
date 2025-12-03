const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/users/{userId}/roles:
 *   get:
 *     summary: Obtener todos los roles de un usuario
 *     tags: [User Roles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de roles del usuario obtenida exitosamente
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
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 *   post:
 *     summary: Asignar un rol a un usuario
 *     tags: [User Roles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: integer
 *                 description: ID del rol a asignar
 *                 example: 1
 *     responses:
 *       201:
 *         description: Rol asignado exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: El usuario ya tiene este rol asignado
 * 
 *   put:
 *     summary: Reemplazar todos los roles de un usuario
 *     tags: [User Roles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleIds
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs de roles
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Roles del usuario actualizados exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /api/users/{userId}/roles/multiple:
 *   post:
 *     summary: Asignar múltiples roles a un usuario
 *     tags: [User Roles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleIds
 *             properties:
 *               roleIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Array de IDs de roles a asignar
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: Roles asignados exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /api/users/{userId}/available-roles:
 *   get:
 *     summary: Obtener roles disponibles para asignar a un usuario
 *     tags: [User Roles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Lista de roles disponibles obtenida exitosamente
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

/**
 * @swagger
 * /api/users/{userId}/roles/{roleId}:
 *   delete:
 *     summary: Quitar un rol específico de un usuario
 *     tags: [User Roles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Rol removido exitosamente
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * 
 *   get:
 *     summary: Verificar si un usuario tiene un rol específico
 *     tags: [User Roles]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *     responses:
 *       200:
 *         description: Verificación completada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         hasRole:
 *                           type: boolean
 *                           description: Indica si el usuario tiene el rol
 */

/**
 * @swagger
 * /api/roles/{roleId}/users:
 *   get:
 *     summary: Obtener usuarios que tienen un rol específico
 *     tags: [User Roles]
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del rol
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Filtrar por empresa (opcional)
 *     responses:
 *       200:
 *         description: Lista de usuarios con el rol obtenida exitosamente
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
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           companyId:
 *                             type: integer
 *                     count:
 *                       type: integer
 */

// Función para crear las rutas de asignación de roles a usuarios
function createUserRoleRoutes(userRoleController) {
  // Rutas para gestión de roles de usuarios
  router.get('/users/:userId/roles', (req, res, next) => userRoleController.getUserRoles(req, res, next));
  router.post('/users/:userId/roles', (req, res, next) => userRoleController.assignRole(req, res, next));
  router.put('/users/:userId/roles', (req, res, next) => userRoleController.replaceUserRoles(req, res, next));
  router.delete('/users/:userId/roles/:roleId', (req, res, next) => userRoleController.removeRole(req, res, next));
  
  // Rutas adicionales
  router.get('/users/:userId/available-roles', (req, res, next) => userRoleController.getAvailableRoles(req, res, next));
  router.post('/users/:userId/roles/multiple', (req, res, next) => userRoleController.assignMultipleRoles(req, res, next));
  router.get('/users/:userId/roles/:roleId', (req, res, next) => userRoleController.hasRole(req, res, next));
  
  // Rutas para obtener usuarios por rol
  router.get('/roles/:roleId/users', (req, res, next) => userRoleController.getUsersByRole(req, res, next));
  
  return router;
}

module.exports = createUserRoleRoutes;
