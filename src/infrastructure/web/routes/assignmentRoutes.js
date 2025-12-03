const express = require('express');
const router = express.Router();
const assignmentProcessController = require('../controllers/assignmentProcessController');

/**
 * @swagger
 * /api/assignments/complete:
 *   post:
 *     summary: Completa una asignación usando ClaimId y DocumentNumber
 *     description: Marca como completada la asignación que corresponde al ClaimId y DocumentNumber indicados.
 *     tags: [Assignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - claimId
 *               - documentNumber
 *             properties:
 *               claimId:
 *                 type: string
 *                 description: ID del claim/glosa
 *                 example: "CLM123456"
 *               documentNumber:
 *                 type: string
 *                 description: Número de documento
 *                 example: "DOC789012"
 *     responses:
 *       200:
 *         description: Asignación completada exitosamente
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
 *                   example: "Assignment completed successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       400:
 *         description: ClaimId o DocumentNumber faltante o inválido
 *       404:
 *         description: Asignación no encontrada para los parámetros dados
 *       500:
 *         description: Error interno del servidor
 */
// Ruta /complete movida a index.js para evitar autenticación
// router.post('/complete', assignmentProcessController.completeByClaimAndDocument.bind(assignmentProcessController));
/**
/**
 * @swagger
 * /api/assignments/company/{companyId}/reassignment:
 *   post:
 *     summary: Reasignar usuarios a asignaciones por ID
 *     description: Reasigna asignaciones usando el id de la tabla assignment y deja trazabilidad del usuario TCP que realiza la acción.
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la compañía
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userTCP:
 *                 type: string
 *                 description: Usuario TCP que realiza la acción
 *                 example: "CC10021234"
 *               userId:
 *                 type: integer
 *                 description: ID del usuario a asignar
 *                 example: 1
 *               assignments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     assigmentId:
 *                       type: integer
 *                       description: ID de la asignación a reasignar
 *                       example: 2569898
 *     responses:
 *       200:
 *         description: Resultado de la reasignación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 updated:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       assignmentId:
 *                         type: integer
 *                       userId:
 *                         type: integer
 *       400:
 *         description: Body inválido
 *       500:
 *         description: Error interno del servidor
 */
/**
 * @swagger
 * /api/assignments/company/{documentNumber}:
 *   get:
 *     summary: Consulta asignaciones por número de documento con filtros avanzados
 *     description: Devuelve las asignaciones de la compañía con soporte para búsqueda, filtros, ordenamiento y paginación completa.
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: documentNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Número de documento de la compañía
 *         example: "900123456"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Cantidad de elementos por página
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Número de elementos a saltar (paginación)
 *       - in: query
 *         name: userInfo.dud
 *         schema:
 *           type: string
 *         description: Filtro específico en DUD del usuario asignado
 *         example: "DUD123456"
 *       - in: query
 *         name: userInfo.name
 *         schema:
 *           type: string
 *         description: Filtro específico en nombre del usuario asignado
 *         example: "juan"
 *       - in: query
 *         name: ClaimId
 *         schema:
 *           type: string
 *         description: Filtro específico por ID del reclamo
 *         example: "CLM123"
 *       - in: query
 *         name: ObjectionCode
 *         schema:
 *           type: string
 *         description: Filtro específico por código de objeción
 *         example: "OBJ456"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Asignado, Pendiente, Completado, Cancelado]
 *         description: Filtro por estado de asignación
 *         example: "Asignado"
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha desde (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha hasta (YYYY-MM-DD)
 *         example: "2024-12-31"
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filtro por usuario asignado
 *         example: 123
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [fechaAsignacionGlosa, dud, status, createdAt]
 *           default: fechaAsignacionGlosa
 *         description: Campo de ordenamiento
 *         example: "fechaAsignacionGlosa"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden de clasificación
 *         example: "asc"
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir detalles adicionales
 *     responses:
 *       200:
 *         description: Lista de asignaciones obtenida exitosamente
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
 *                       dud:
 *                         type: string
 *                         example: "DUD123456"
 *                       userName:
 *                         type: string
 *                         example: "Juan Pérez"
 *                       status:
 *                         type: string
 *                         example: "Asignado"
 *                       fechaAsignacionGlosa:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                       userId:
 *                         type: integer
 *                         example: 123
 *                       companyId:
 *                         type: integer
 *                         example: 1
 *                       ClaimId:
 *                         type: string
 *                         example: "CLM123"
 *                       DocumentNumber:
 *                         type: string
 *                         example: "DOC456"
 *                 total:
 *                   type: integer
 *                   description: Total de asignaciones sin filtros
 *                   example: 500
 *                 totalFiltered:
 *                   type: integer
 *                   description: Total de asignaciones con filtros aplicados
 *                   example: 25
 *                 currentPage:
 *                   type: integer
 *                   description: Página actual
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   description: Total de páginas
 *                   example: 5
 *                 hasNextPage:
 *                   type: boolean
 *                   description: Indica si hay página siguiente
 *                   example: true
 *                 hasPreviousPage:
 *                   type: boolean
 *                   description: Indica si hay página anterior
 *                   example: false
 *       400:
 *         description: Error de validación - parámetros inválidos
 *       404:
 *         description: Compañía no encontrada
 *       500:
 *         description: Error interno del servidor
 */


/**
 * @swagger
 * components:
 *   schemas:
 *     Assignment:
 *       type: object
 *       required:
 *         - userId
 *         - roleId
 *         - companyId
 *         - startDate
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único de la asignación
 *         userId:
 *           type: integer
 *           description: ID del usuario asignado
 *         roleId:
 *           type: integer
 *           description: ID del rol asignado
 *         companyId:
 *           type: integer
 *           description: ID de la compañía
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de inicio de la asignación
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de fin de la asignación (opcional)
 *         status:
 *           type: string
 *           enum: [pending, active, completed, cancelled, unassigned]
 *           description: Estado de la asignación
 *         isActive:
 *           type: boolean
 *           description: Indica si la asignación está activa
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *       example:
 *         id: 1
 *         userId: 1
 *         roleId: 2
 *         companyId: 1
 *         startDate: "2024-01-01T00:00:00.000Z"
 *         endDate: "2024-12-31T23:59:59.000Z"
 *         status: "active"
 *         isActive: true
 *         createdAt: "2024-01-01T10:00:00.000Z"
 *         updatedAt: "2024-01-01T10:00:00.000Z"
 *     
 *     CreateAssignmentRequest:
 *       type: object
 *       required:
 *         - userId
 *         - roleId
 *         - companyId
 *         - startDate
 *       properties:
 *         userId:
 *           type: integer
 *           description: ID del usuario a asignar
 *         roleId:
 *           type: integer
 *           description: ID del rol a asignar
 *         companyId:
 *           type: integer
 *           description: ID de la compañía
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de inicio de la asignación
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Fecha de fin de la asignación (opcional)
 *         status:
 *           type: string
 *           enum: [pending, active, completed, cancelled, unassigned]
 *           default: pending
 *           description: Estado inicial de la asignación
 *       example:
 *         userId: 1
 *         roleId: 2
 *         companyId: 1
 *         startDate: "2024-01-01T00:00:00.000Z"
 *         endDate: "2024-12-31T23:59:59.000Z"
 *         status: "pending"
 *     
 *     UpdateAssignmentRequest:
 *       type: object
 *       properties:
 *         roleId:
 *           type: integer
 *           description: ID del nuevo rol
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Nueva fecha de inicio
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Nueva fecha de fin
 *         status:
 *           type: string
 *           enum: [pending, active, completed, cancelled, unassigned]
 *           description: Nuevo estado
 *       example:
 *         roleId: 3
 *         status: "active"
 *         endDate: "2024-06-30T23:59:59.000Z"
 *     
 *     AssignmentsList:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Assignment'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             limit:
 *               type: integer
 *             total:
 *               type: integer
 *             totalPages:
 *               type: integer
 */

/**
 * @swagger
 * /api/assignments:
 *   post:
 *     summary: Crear nueva asignación
 *     description: Crea una nueva asignación de usuario a rol en una compañía
 *     tags: [Assignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAssignmentRequest'
 *     responses:
 *       201:
 *         description: Asignación creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *                 message:
 *                   type: string
 *                   example: "Assignment created successfully"
 *       400:
 *         description: Datos de entrada inválidos
 *       409:
 *         description: Conflicto - ya existe una asignación similar
 *       500:
 *         description: Error interno del servidor
 *   
 *   get:
 *     summary: Listar asignaciones
 *     description: Obtiene una lista paginada de asignaciones con filtros opcionales
 *     tags: [Assignments]
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
 *           maximum: 100
 *         description: Cantidad de elementos por página
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de usuario
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de rol
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de compañía
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, cancelled, unassigned]
 *         description: Filtrar por estado
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por asignaciones activas
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha de inicio desde
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filtrar por fecha de inicio hasta
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir detalles de usuario, rol y compañía
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Campo por el cual ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Lista de asignaciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentsList'
 *       400:
 *         description: Parámetros de consulta inválidos
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/assignments/{id}:
 *   get:
 *     summary: Obtener asignación por ID
 *     description: Obtiene los detalles de una asignación específica
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la asignación
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir detalles de usuario, rol y compañía
 *     responses:
 *       200:
 *         description: Asignación encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *       404:
 *         description: Asignación no encontrada
 *       500:
 *         description: Error interno del servidor
 *   
 *   put:
 *     summary: Actualizar asignación
 *     description: Actualiza los datos de una asignación existente
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la asignación a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAssignmentRequest'
 *     responses:
 *       200:
 *         description: Asignación actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *                 message:
 *                   type: string
 *                   example: "Assignment updated successfully"
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Asignación no encontrada
 *       409:
 *         description: Conflicto al actualizar
 *       500:
 *         description: Error interno del servidor
 *   
 *   delete:
 *     summary: Eliminar asignación
 *     description: Elimina una asignación (soft delete por defecto)
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la asignación a eliminar
 *       - in: query
 *         name: force
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Realizar eliminación permanente
 *     responses:
 *       200:
 *         description: Asignación eliminada exitosamente
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
 *                   example: "Assignment deleted successfully"
 *       404:
 *         description: Asignación no encontrada
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/assignments/{id}/activate:
 *   post:
 *     summary: Activar asignación
 *     description: Cambia el estado de una asignación a "active"
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la asignación a activar
 *     responses:
 *       200:
 *         description: Asignación activada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *                 message:
 *                   type: string
 *                   example: "Assignment activated successfully"
 *       404:
 *         description: Asignación no encontrada
 *       400:
 *         description: No se puede activar la asignación en su estado actual
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/assignments/{id}/complete:
 *   post:
 *     summary: Completar asignación
 *     description: Marca una asignación como completada y establece la fecha de fin
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la asignación a completar
 *     responses:
 *       200:
 *         description: Asignación completada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *                 message:
 *                   type: string
 *                   example: "Assignment completed successfully"
 *       404:
 *         description: Asignación no encontrada
 *       400:
 *         description: No se puede completar la asignación en su estado actual
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/assignments/{id}/cancel:
 *   post:
 *     summary: Cancelar asignación
 *     description: Cancela una asignación cambiando su estado a "cancelled"
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la asignación a cancelar
 *     responses:
 *       200:
 *         description: Asignación cancelada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Assignment'
 *                 message:
 *                   type: string
 *                   example: "Assignment cancelled successfully"
 *       404:
 *         description: Asignación no encontrada
 *       400:
 *         description: No se puede cancelar la asignación en su estado actual
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/assignments/user/{userId}:
 *   get:
 *     summary: Obtener asignaciones de un usuario
 *     description: Obtiene todas las asignaciones de un usuario específico
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, cancelled, unassigned]
 *         description: Filtrar por estado específico
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir detalles de rol y compañía
 *     responses:
 *       200:
 *         description: Asignaciones del usuario obtenidas exitosamente
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
 *                     $ref: '#/components/schemas/Assignment'
 *                 count:
 *                   type: integer
 *                   description: Total de asignaciones encontradas
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/assignments/company/{companyId}:
 *   get:
 *     summary: Obtener asignaciones de una compañía
 *     description: Obtiene todas las asignaciones de una compañía específica
 *     tags: [Assignments]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la compañía
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
 *           default: 20
 *         description: Elementos por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, cancelled, unassigned]
 *         description: Filtrar por estado
 *       - in: query
 *         name: roleId
 *         schema:
 *           type: integer
 *         description: Filtrar por rol específico
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir detalles de usuario y rol
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: startDate
 *         description: Campo de ordenamiento
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden de clasificación
 *     responses:
 *       200:
 *         description: Asignaciones de la compañía obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssignmentsList'
 *       404:
 *         description: Compañía no encontrada
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/assignments/search:
 *   get:
 *     summary: Buscar asignaciones
 *     description: Busca asignaciones por nombre de usuario, rol o compañía
 *     tags: [Assignments]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Término de búsqueda (mínimo 2 caracteres)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, cancelled, unassigned]
 *         description: Filtrar por estado
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Filtrar por compañía específica
 *     responses:
 *       200:
 *         description: Resultados de búsqueda obtenidos exitosamente
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
 *                     $ref: '#/components/schemas/Assignment'
 *                 count:
 *                   type: integer
 *                   description: Total de resultados encontrados
 *                 query:
 *                   type: string
 *                   description: Término de búsqueda utilizado
 *       400:
 *         description: Término de búsqueda inválido
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/assignments/active:
 *   get:
 *     summary: Obtener asignaciones activas
 *     description: Obtiene todas las asignaciones con estado "active"
 *     tags: [Assignments]
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         description: Filtrar por compañía específica
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filtrar por usuario específico
 *       - in: query
 *         name: includeDetails
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir detalles de usuario, rol y compañía
 *     responses:
 *       200:
 *         description: Asignaciones activas obtenidas exitosamente
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
 *                     $ref: '#/components/schemas/Assignment'
 *                 count:
 *                   type: integer
 *                   description: Total de asignaciones activas
 *       500:
 *         description: Error interno del servidor
 */

// Configurar rutas
module.exports = (assignmentController) => {
  // Reasignación masiva de asignaciones por processId
  router.post('/company/:companyId/reassignment', assignmentController.bulkReassign.bind(assignmentController));

  // CRUD básico
  router.post('/', assignmentController.create.bind(assignmentController));
  router.get('/', assignmentController.getAll.bind(assignmentController));
  router.get('/search', assignmentController.search.bind(assignmentController));
  router.get('/active', assignmentController.getActive.bind(assignmentController));
  router.get('/user/:userId', assignmentController.getByUser.bind(assignmentController));
  router.get('/company/:documentNumber', assignmentController.getByCompany.bind(assignmentController));
  router.get('/:id', assignmentController.getById.bind(assignmentController));
  router.put('/:id', assignmentController.update.bind(assignmentController));
  router.delete('/:id', assignmentController.delete.bind(assignmentController));

  // Operaciones de estado
  router.post('/:id/activate', assignmentController.activate.bind(assignmentController));
  router.post('/:id/complete', assignmentController.complete.bind(assignmentController));
  router.post('/:id/cancel', assignmentController.cancel.bind(assignmentController));

  // Eliminado: ruta duplicada para consulta por documento de compañía
  return router;
};