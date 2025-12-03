const express = require('express');
const router = express.Router();

/**
 * Rutas para el servicio de asignaciones automáticas
 * Maneja la cola RabbitMQ y procesamiento automático de asignaciones
 */
function createAutoAssignmentRoutes(autoAssignmentController) {
  
  /**
   * @swagger
   * components:
   *   schemas:
   *     ClaimMessage:
   *       type: object
   *       required:
   *         - ProcessId
   *         - Target
   *         - Source
   *         - DocumentNumber
   *         - InvoiceAmount
   *         - ExternalReference
   *         - ClaimId
   *         - ConceptApplicationCode
   *         - ObjectionCode
   *         - Value
   *       properties:
   *         ProcessId:
   *           type: integer
   *           description: Identificador único del proceso
   *           example: 1234
   *         Target:
   *           type: string
   *           description: NIT o documento de la empresa objetivo
   *           example: "9000054312"
   *         Source:
   *           type: string
   *           description: NIT o documento de la empresa fuente
   *           example: "800000513"
   *         DocumentNumber:
   *           type: string
   *           description: Número del documento asociado
   *           example: "FC98654"
   *         InvoiceAmount:
   *           type: number
   *           format: float
   *           description: Monto de la factura
   *           example: 200000
   *         ExternalReference:
   *           type: string
   *           description: Referencia externa del proceso
   *           example: "100048"
   *         ClaimId:
   *           type: string
   *           description: Identificador único de la reclamación
   *           example: "1111154"
   *         ConceptApplicationCode:
   *           type: string
   *           description: Código de concepto de aplicación
   *           example: "GLO"
   *         ObjectionCode:
   *           type: string
   *           description: Código de objeción
   *           example: "FF4412"
   *         Value:
   *           type: number
   *           format: float
   *           description: Valor de la reclamación
   *           example: 200000
   *     
   *     QueueServiceStatus:
   *       type: object
   *       properties:
   *         isConnected:
   *           type: boolean
   *           description: Estado de conexión a RabbitMQ
   *         queueName:
   *           type: string
   *           description: Nombre de la cola
   *         reconnectAttempts:
   *           type: integer
   *           description: Intentos de reconexión
   *         connectionStatus:
   *           type: string
   *           enum: [active, inactive]
   *         channelStatus:
   *           type: string
   *           enum: [active, inactive]
   *     
   *     AutoAssignmentStats:
   *       type: object
   *       properties:
   *         summary:
   *           type: object
   *           properties:
   *             total:
   *               type: integer
   *               description: Total de asignaciones automáticas
   *             pending:
   *               type: integer
   *               description: Asignaciones pendientes
   *             completed:
   *               type: integer
   *               description: Asignaciones completadas
   *             completionRate:
   *               type: string
   *               description: Tasa de finalización en porcentaje
   *         distribution:
   *           type: object
   *           properties:
   *             byUser:
   *               type: object
   *               description: Distribución por usuario
   *             byType:
   *               type: object
   *               description: Distribución por tipo
   *         queueStatus:
   *           $ref: '#/components/schemas/QueueServiceStatus'
   */

  /**
   * @swagger
   * /api/auto-assignments/service/start:
   *   post:
   *     summary: Inicializar el servicio de asignaciones automáticas
   *     description: Conecta a RabbitMQ e inicia el consumo de mensajes
   *     tags: [Auto Assignments]
   *     responses:
   *       200:
   *         description: Servicio iniciado exitosamente
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
   *                   example: "Assignment queue service is running"
   *                 data:
   *                   $ref: '#/components/schemas/QueueServiceStatus'
   *       500:
   *         description: Error al inicializar el servicio
   */
  router.post('/service/start', async (req, res) => {
    await autoAssignmentController.initializeService(req, res);
  });

  /**
   * @swagger
   * /api/auto-assignments/service/stop:
   *   post:
   *     summary: Detener el servicio de asignaciones automáticas
   *     description: Detiene el consumo de mensajes y cierra conexión a RabbitMQ
   *     tags: [Auto Assignments]
   *     responses:
   *       200:
   *         description: Servicio detenido exitosamente
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
   *                   example: "Assignment queue service stopped"
   *       500:
   *         description: Error al detener el servicio
   */
  router.post('/service/stop', async (req, res) => {
    await autoAssignmentController.stopService(req, res);
  });

  /**
   * @swagger
   * /api/auto-assignments/service/status:
   *   get:
   *     summary: Obtener el estado del servicio de asignaciones automáticas
   *     description: Devuelve información detallada sobre el estado de la conexión y cola
   *     tags: [Auto Assignments]
   *     responses:
   *       200:
   *         description: Estado del servicio obtenido exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/QueueServiceStatus'
   *       500:
   *         description: Error al obtener el estado
   */
  router.get('/service/status', async (req, res) => {
    await autoAssignmentController.getServiceStatus(req, res);
  });

  /**
   * @swagger
   * /api/auto-assignments/process-manually:
   *   post:
   *     summary: Procesar una reclamación manualmente
   *     description: Procesa una reclamación sin usar la cola, útil para testing
   *     tags: [Auto Assignments]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ClaimMessage'
   *           examples:
   *             standard:
   *               summary: Reclamación estándar
   *               value:
   *                 ProcessId: 1234
   *                 Target: "9000054312"
   *                 Source: "800000513"
   *                 DocumentNumber: "FC98654"
   *                 InvoiceAmount: 200000
   *                 ExternalReference: "100048"
   *                 ClaimId: "1111154"
   *                 ConceptApplicationCode: "GLO"
   *                 ObjectionCode: "FF4412"
   *                 Value: 200000
   *             highAmount:
   *               summary: Monto alto
   *               value:
   *                 ProcessId: 5678
   *                 Target: "9000054312"
   *                 Source: "900123456-7"
   *                 DocumentNumber: "FC99999"
   *                 InvoiceAmount: 1500000
   *                 ExternalReference: "200050"
   *                 ClaimId: "2222555"
   *                 ConceptApplicationCode: "ADM"
   *                 ObjectionCode: "AA1100"
   *                 Value: 1500000
   *     responses:
   *       200:
   *         description: Reclamación procesada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     assignment:
   *                       type: object
   *                       description: Información de la asignación creada
   *                     selectedUser:
   *                       type: object
   *                       description: Usuario seleccionado para la asignación
   *                     processResult:
   *                       type: object
   *                       description: Resultado del procesamiento de reglas
   *       400:
   *         description: Datos de reclamación inválidos
   *       404:
   *         description: Recursos no encontrados
   *       500:
   *         description: Error interno del servidor
   */
  router.post('/process-manually', async (req, res) => {
    await autoAssignmentController.processClaimManually(req, res);
  });

  /**
   * @swagger
   * /api/auto-assignments/stats:
   *   get:
   *     summary: Obtener estadísticas de asignaciones automáticas
   *     description: Devuelve estadísticas detalladas sobre las asignaciones automáticas
   *     tags: [Auto Assignments]
   *     parameters:
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Fecha de inicio para filtrar (ISO 8601)
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *         description: Fecha de fin para filtrar (ISO 8601)
   *       - in: query
   *         name: userId
   *         schema:
   *           type: integer
   *         description: ID del usuario para filtrar
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, active, completed, cancelled]
   *         description: Estado de la asignación para filtrar
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *         description: Tipo de asignación para filtrar
   *     responses:
   *       200:
   *         description: Estadísticas obtenidas exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/AutoAssignmentStats'
   *       500:
   *         description: Error al obtener estadísticas
   */
  router.get('/stats', async (req, res) => {
    await autoAssignmentController.getAssignmentStats(req, res);
  });

  /**
   * @swagger
   * /api/auto-assignments/test-message:
   *   post:
   *     summary: Enviar mensaje de prueba a la cola
   *     description: Envía un mensaje de prueba a la cola RabbitMQ para verificar funcionamiento
   *     tags: [Auto Assignments]
   *     requestBody:
   *       required: false
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ClaimMessage'
   *           examples:
   *             test:
   *               summary: Mensaje de prueba
   *               value:
   *                 ProcessId: 9999
   *                 Target: "9000054312"
   *                 Source: "800000999"
   *                 DocumentNumber: "TEST001"
   *                 InvoiceAmount: 150000
   *                 ExternalReference: "TEST001"
   *                 ClaimId: "TEST001"
   *                 ConceptApplicationCode: "TEST"
   *                 ObjectionCode: "T001"
   *                 Value: 150000
   *     responses:
   *       200:
   *         description: Mensaje de prueba enviado exitosamente
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
   *                   example: "Test message sent to queue"
   *                 data:
   *                   type: object
   *                   properties:
   *                     claimId:
   *                       type: string
   *                     queueStatus:
   *                       $ref: '#/components/schemas/QueueServiceStatus'
   *       500:
   *         description: Error al enviar mensaje de prueba
   */
  router.post('/test-message', async (req, res) => {
    await autoAssignmentController.sendTestMessage(req, res);
  });

  /**
   * @swagger
   * /api/auto-assignments/message-example:
   *   get:
   *     summary: Obtener ejemplo de estructura de mensaje
   *     description: Devuelve un ejemplo de la estructura requerida para los mensajes de la cola
   *     tags: [Auto Assignments]
   *     responses:
   *       200:
   *         description: Ejemplo obtenido exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     example:
   *                       $ref: '#/components/schemas/ClaimMessage'
   *                     documentation:
   *                       type: object
   *                       properties:
   *                         requiredFields:
   *                           type: array
   *                           items:
   *                             type: object
   *                             properties:
   *                               field:
   *                                 type: string
   *                               type:
   *                                 type: string
   *                               description:
   *                                 type: string
   *                         optionalFields:
   *                           type: array
   *                           items:
   *                             type: object
   *                     queueName:
   *                       type: string
   *                     usage:
   *                       type: object
   *       500:
   *         description: Error al obtener ejemplo
   */
  router.get('/message-example', async (req, res) => {
    await autoAssignmentController.getMessageExample(req, res);
  });

  return router;
}

module.exports = createAutoAssignmentRoutes;
