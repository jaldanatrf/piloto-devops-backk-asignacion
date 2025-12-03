const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ClaimData:
 *       type: object
 *       required:
 *         - ProcessId
 *         - Target
 *         - Source
 *         - InvoiceAmount
 *         - ClaimId
 *         - Value
 *       properties:
 *         ProcessId:
 *           type: integer
 *           description: ID del proceso
 *           example: 1234
 *         Target:
 *           type: string
 *           description: NIT de la empresa objetivo
 *           example: "9000054312"
 *         Source:
 *           type: string
 *           description: NIT de la empresa fuente
 *           example: "800000513"
 *         DocumentNumber:
 *           type: string
 *           description: Número del documento
 *           example: "FC98654"
 *         InvoiceAmount:
 *           type: number
 *           description: Valor de la factura
 *           example: 200000
 *         ExternalReference:
 *           type: string
 *           description: Referencia externa
 *           example: "100048"
 *         ClaimId:
 *           type: string
 *           description: ID de la reclamación
 *           example: "1111154"
 *         ConceptApplicationCode:
 *           type: string
 *           description: Código de aplicación del concepto
 *           example: "GLO"
 *         ObjectionCode:
 *           type: string
 *           description: Código de objeción
 *           example: "FF4412"
 *         Value:
 *           type: number
 *           description: Valor de la reclamación
 *           example: 200000
 * 
 *     NotificationUser:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID del usuario
 *         firstName:
 *           type: string
 *           description: Nombre del usuario
 *         lastName:
 *           type: string
 *           description: Apellido del usuario
 *         email:
 *           type: string
 *           description: Email del usuario
 *         documentType:
 *           type: string
 *           description: Tipo de documento
 *         documentNumber:
 *           type: string
 *           description: Número de documento
 *         role:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             name:
 *               type: string
 *             description:
 *               type: string
 *         appliedRules:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 * 
 *     BusinessRuleResult:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indica si el procesamiento fue exitoso
 *         message:
 *           type: string
 *           description: Mensaje descriptivo del resultado
 *         data:
 *           type: object
 *           properties:
 *             claim:
 *               type: object
 *               description: Información básica de la reclamación
 *             company:
 *               type: object
 *               description: Información de la empresa objetivo
 *             users:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/NotificationUser'
 *               description: Lista de usuarios a notificar
 *             appliedRules:
 *               type: array
 *               items:
 *                 type: object
 *               description: Reglas que aplicaron
 *             summary:
 *               type: object
 *               properties:
 *                 totalUsersToNotify:
 *                   type: integer
 *                 totalRulesEvaluated:
 *                   type: integer
 *                 totalRulesApplied:
 *                   type: integer
 */

// Función para crear las rutas de procesamiento de reglas empresariales
function createBusinessRuleRoutes(businessRuleController) {

  /**
   * @swagger
   * /api/business-rules/process-claim:
   *   post:
   *     summary: Procesar reclamación y determinar usuarios a notificar
   *     description: |
   *       Analiza una reclamación contra las reglas empresariales definidas
   *       para determinar qué usuarios deben ser notificados según el tipo de regla que aplique.
   *       
   *       **Tipos de reglas soportados:**
   *       - **COMPANY**: Valida si la empresa fuente coincide con el NIT asociado
   *       - **AMOUNT**: Verifica si el monto está dentro del rango definido
   *       - **COMPANY-AMOUNT**: Valida tanto empresa como monto
   *       - **Otros tipos**: Se aplican de forma general
   *     tags: [Business Rules]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ClaimData'
   *           examples:
   *             standard_claim:
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
   *             high_amount_claim:
   *               summary: Reclamación de monto alto
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
   *         description: Procesamiento exitoso con usuarios encontrados
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BusinessRuleResult'
   *       204:
   *         description: Procesamiento exitoso pero sin usuarios a notificar
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BusinessRuleResult'
   *       400:
   *         description: Datos de reclamación inválidos
   *       404:
   *         description: Empresa objetivo no encontrada
   *       500:
   *         description: Error interno del servidor
   */
  router.post('/process-claim', (req, res, next) => businessRuleController.processClaim(req, res, next));

  /**
   * @swagger
   * /api/business-rules/test-rule/{ruleId}:
   *   post:
   *     summary: Probar una regla específica contra una reclamación
   *     description: |
   *       Permite probar cómo una regla específica evalúa una reclamación determinada
   *       sin ejecutar acciones reales. Útil para debugging y validación.
   *     tags: [Business Rules]
   *     parameters:
   *       - in: path
   *         name: ruleId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la regla a probar
   *         example: 1
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ClaimData'
   *     responses:
   *       200:
   *         description: Prueba completada exitosamente
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
   *                     rule:
   *                       type: object
   *                       description: Información de la regla probada
   *                     claim:
   *                       type: object
   *                       description: Información de la reclamación
   *                     applies:
   *                       type: boolean
   *                       description: Si la regla aplica o no
   *                     reason:
   *                       type: string
   *                       description: Razón de por qué aplica o no
   *                     affectedUsers:
   *                       type: integer
   *                       description: Número de usuarios afectados
   *                     users:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/NotificationUser'
   *       400:
   *         description: Datos inválidos
   *       404:
   *         description: Regla no encontrada
   *       500:
   *         description: Error interno del servidor
   */
  router.post('/test-rule/:ruleId', (req, res, next) => businessRuleController.testRule(req, res, next));

  /**
   * @swagger
   * /api/business-rules/companies/{companyId}/stats:
   *   get:
   *     summary: Obtener estadísticas de reglas por empresa
   *     description: |
   *       Retorna estadísticas detalladas sobre las reglas configuradas
   *       para una empresa específica, incluyendo totales por tipo y estado.
   *     tags: [Business Rules]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID de la empresa
   *         example: 1
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
   *                 message:
   *                   type: string
   *                 data:
   *                   type: object
   *                   properties:
   *                     companyId:
   *                       type: integer
   *                     statistics:
   *                       type: object
   *                       properties:
   *                         total:
   *                           type: integer
   *                         active:
   *                           type: integer
   *                         inactive:
   *                           type: integer
   *                         byType:
   *                           type: object
   *                           additionalProperties:
   *                             type: object
   *                             properties:
   *                               total:
   *                                 type: integer
   *                               active:
   *                                 type: integer
   *                               inactive:
   *                                 type: integer
   *       400:
   *         description: ID de empresa inválido
   *       500:
   *         description: Error interno del servidor
   */
  router.get('/companies/:companyId/stats', (req, res, next) => businessRuleController.getCompanyRuleStats(req, res, next));

  /**
   * @swagger
   * /api/business-rules/companies/find/{documentNumber}:
   *   get:
   *     summary: Buscar empresa por número de documento
   *     description: |
   *       Busca una empresa utilizando su número de documento.
   *       Útil para validar si una empresa existe antes de procesar reclamaciones.
   *     tags: [Business Rules]
   *     parameters:
   *       - in: path
   *         name: documentNumber
   *         required: true
   *         schema:
   *           type: string
   *         description: Número de documento de la empresa
   *         example: "9000054312"
   *     responses:
   *       200:
   *         description: Empresa encontrada
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
   *                   description: Información de la empresa encontrada
   *       404:
   *         description: Empresa no encontrada
   *       400:
   *         description: Número de documento inválido
   *       500:
   *         description: Error interno del servidor
   */
  router.get('/companies/find/:documentNumber', (req, res, next) => businessRuleController.findCompanyByDocument(req, res, next));

  /**
   * @swagger
   * /api/business-rules/test-sample:
   *   post:
   *     summary: Probar el servicio con datos de ejemplo
   *     description: |
   *       Endpoint de prueba que utiliza datos de muestra predefinidos
   *       para validar el funcionamiento del servicio de reglas empresariales.
   *       No requiere parámetros de entrada.
   *     tags: [Business Rules]
   *     responses:
   *       200:
   *         description: Prueba completada exitosamente
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
   *                     sampleData:
   *                       $ref: '#/components/schemas/ClaimData'
   *                     result:
   *                       $ref: '#/components/schemas/BusinessRuleResult'
   *       500:
   *         description: Error interno del servidor
   */
  router.post('/test-sample', (req, res, next) => businessRuleController.testWithSampleData(req, res, next));

  return router;
}

module.exports = createBusinessRuleRoutes;
