/**
 * @swagger
 * /api/users/by-company-document/{documentNumber}:
 *   get:
 *     summary: Get users by company document number
 *     description: Returns all users associated with a company, searched by its document number (NIT).
 *     tags: [Users, Companies]
 *     parameters:
 *       - in: path
 *         name: documentNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Document number (NIT) of the company
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 count:
 *                   type: integer
 *                   example: 2
*/
const express = require('express');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RuleInput:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - type
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the rule
 *           minLength: 2
 *           maxLength: 100
 *         description:
 *           type: string
 *           description: Detailed description of the rule
 *           maxLength: 500
 *         type:
 *           type: string
 *           enum: [AMOUNT, COMPANY, COMPANY-AMOUNT, BUSINESS, SECURITY, COMPLIANCE, OPERATIONAL, TECHNICAL, CUSTOM]
 *           description: |
 *             Category of the rule. Available types:
 *             - AMOUNT: Requires minimumAmount and maximumAmount
 *             - COMPANY: Requires nitAssociatedCompany
 *             - COMPANY-AMOUNT: Requires minimumAmount, maximumAmount and nitAssociatedCompany
 *             - BUSINESS, SECURITY, COMPLIANCE, OPERATIONAL, TECHNICAL, CUSTOM: Legacy types (no additional fields required)
 *         minimumAmount:
 *           type: number
 *           format: decimal
 *           description: |
 *             Minimum amount for the rule (required for AMOUNT and COMPANY-AMOUNT types)
 *           minimum: 0
 *         maximumAmount:
 *           format: decimal
 *           description: |
 *             Maximum amount for the rule (required for AMOUNT and COMPANY-AMOUNT types)
 *           minimum: 0
 *         nitAssociatedCompany:
 *           type: string
 *           description: |
 *             NIT of the associated company (required for COMPANY and COMPANY-AMOUNT types)
 *           maxLength: 20
 *         roleIds:
 *           type: array
 *           items:
 *             type: integer
 *           description: |
 *             Array of role IDs that will be associated with this rule.
 *             All roles must belong to the same company as the rule.
 *           example: [1, 2, 3]
 *         isActive:
 *           type: boolean
 *           description: Whether the rule is active
 *           default: true
 *     Rule:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the rule
 *         name:
 *           type: string
 *           description: Name of the rule
 *           minLength: 2
 *           maxLength: 100
 *         description:
 *           type: string
 *           description: Detailed description of the rule
 *           maxLength: 500
 *         type:
 *           type: string
 *         companyName:
 *           type: string
 *           description: Name of the company (included in some responses)
 *       required:
 *         - name
 *         - description
 *         - type
 *         - companyId
 *       example:
 *         id: 1
 *         name: "Payment Amount Rule"
 *         description: "Validation rule for payment amounts between specific limits"
 *         type: "AMOUNT"
 *         companyId: 1
 *         minimumAmount: 1000.00
 *         maximumAmount: 50000.00
 *         nitAssociatedCompany: null
 *         isActive: true
 *         createdAt: "2024-01-15T10:30:00Z"
 *         updatedAt: "2024-01-15T10:30:00Z"
 * 
 *     RuleStats:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           description: Rule type
 *         total:
 *           type: integer
 *           description: Total number of rules of this type
 *         active:
 *           type: integer
 *           description: Number of active rules of this type
 *         inactive:
 *           type: integer
 *           description: Number of inactive rules of this type
 *       example:
 *         type: "SECURITY"
 *         total: 10
 *         active: 8
 *         inactive: 2
 */

// Función para crear las rutas de reglas (siempre bajo una compañía)
function createRuleRoutes(ruleController) {
  
  /**
   * @swagger
   * /api/companies/{companyId}/rules:
   *   post:
   *     summary: Create a new rule for a company
   *     description: |
   *       Creates a new business rule that must be associated with a company.
   *       Optionally, you can specify roleIds to automatically associate the rule with specific roles.
   *       All specified roles must belong to the same company as the rule.
   *     tags: [Rules]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the company to create the rule for
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RuleInput'
   *           examples:
   *             simple_rule:
   *               summary: Simple rule without role associations
   *               value:
   *                 name: "Basic Security Rule"
   *                 description: "Basic security validation rule"
   *                 type: "SECURITY"
   *                 isActive: true
   *             rule_with_roles:
   *               summary: Rule with role associations
   *               value:
   *                 name: "Payment Amount Rule"
   *                 description: "Validation rule for payment amounts between specific limits"
   *                 type: "AMOUNT"
   *                 minimumAmount: 1000.00
   *                 maximumAmount: 50000.00
   *                 roleIds: [1, 2, 3]
   *                 isActive: true
   *             company_rule:
   *               summary: Company-specific rule
   *               value:
   *                 name: "Partner Company Rule"
   *                 description: "Rule specific to partner company transactions"
   *                 type: "COMPANY"
   *                 nitAssociatedCompany: "900123456-7"
   *                 roleIds: [4, 5]
   *                 isActive: true
   *     responses:
   *       201:
   *         description: Rule created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Rule'
   *                 message:
   *                   type: string
   *                   example: "Rule created successfully"
   *       400:
   *         description: Invalid input data
   *       404:
   *         description: Company not found
   *       409:
   *         description: Rule name already exists in this company
   */
  router.post('/companies/:companyId/rules', (req, res, next) => ruleController.create(req, res, next));

  /**
   * @swagger
   * /api/companies/{companyId}/rules:
   *   get:
   *     summary: Get all rules for a company
   *     description: Retrieves all rules belonging to a specific company with optional filtering
   *     tags: [Rules]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the company
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [AMOUNT, COMPANY, COMPANY-AMOUNT, BUSINESS, SECURITY, COMPLIANCE, OPERATIONAL, TECHNICAL, CUSTOM]
   *         description: Filter by rule type
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *         description: Filter by rule name (partial match)
   *     responses:
   *       200:
   *         description: List of rules retrieved successfully
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
   *                     $ref: '#/components/schemas/Rule'
   *                 count:
   *                   type: integer
   *                   description: Number of rules returned
   *       404:
   *         description: Company not found
   */
  router.get('/companies/:companyId/rules', (req, res, next) => ruleController.getAll(req, res, next));

  /**
   * @swagger
   * /api/companies/{companyId}/rules/active:
   *   get:
   *     summary: Get active rules for a company
   *     description: Retrieves only the active rules for a specific company
   *     tags: [Rules]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the company
   *     responses:
   *       200:
   *         description: Active rules retrieved successfully
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
   *                     $ref: '#/components/schemas/Rule'
   *                 count:
   *                   type: integer
   */
  router.get('/companies/:companyId/rules/active', (req, res, next) => ruleController.getActive(req, res, next));

  /**
   * @swagger
   * /api/companies/{companyId}/rules/search:
   *   get:
   *     summary: Search rules by text
   *     description: Search for rules within a company by name or description
   *     tags: [Rules]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the company
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Search term to look for in rule names and descriptions
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Maximum number of results to return
   *     responses:
   *       200:
   *         description: Search results retrieved successfully
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
   *                     $ref: '#/components/schemas/Rule'
   *                 count:
   *                   type: integer
   *       400:
   *         description: Search term is required
   */
  router.get('/companies/:companyId/rules/search', (req, res, next) => ruleController.search(req, res, next));

  /**
   * @swagger
   * /api/companies/{companyId}/rules/{ruleId}:
   *   get:
   *     summary: Get a specific rule by ID
   *     description: Retrieves a single rule by its ID within a company
   *     tags: [Rules]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the company
   *       - in: path
   *         name: ruleId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the rule
   *     responses:
   *       200:
   *         description: Rule retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Rule'
   *       404:
   *         description: Rule not found in this company
   */
  router.get('/companies/:companyId/rules/:ruleId', (req, res, next) => ruleController.getById(req, res, next));

  /**
   * @swagger
   * /api/companies/{companyId}/rules/{ruleId}:
   *   put:
   *     summary: Update a rule
   *     description: Updates an existing rule within a company
   *     tags: [Rules]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the company
   *       - in: path
   *         name: ruleId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the rule to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/RuleInput'
   *     responses:
   *       200:
   *         description: Rule updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Rule'
   *                 message:
   *                   type: string
   *                   example: "Rule updated successfully"
   *       400:
   *         description: Invalid input data
   *       404:
   *         description: Rule not found in this company
   *       409:
   *         description: Rule name already exists in this company
   */
  router.put('/companies/:companyId/rules/:ruleId', (req, res, next) => ruleController.update(req, res, next));

  /**
   * @swagger
   * /api/companies/{companyId}/rules/{ruleId}/roles:
   *   put:
   *     summary: Update a rule and its role associations
   *     description: Updates an existing rule within a company including its role associations
   *     tags: [Rules]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the company
   *       - in: path
   *         name: ruleId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the rule to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Name of the rule
   *                 example: "prueba jaldana"
   *               description:
   *                 type: string
   *                 description: Description of the rule
   *                 example: "prueba"
   *               type:
   *                 type: string
   *                 enum: [AMOUNT, SECURITY, COMPANY, TIME, APPROVAL]
   *                 description: Type of the rule
   *                 example: "AMOUNT"
   *               minimumAmount:
   *                 type: number
   *                 description: Minimum amount for AMOUNT type rules
   *                 example: 850000
   *               maximumAmount:
   *                 type: number
   *                 description: Maximum amount for AMOUNT type rules
   *                 example: 3000000
   *               roleIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: Array of role IDs to associate with this rule
   *                 example: [1, 2, 7]
   *               isActive:
   *                 type: boolean
   *                 description: Whether the rule is active
   *                 example: true
   *               nitAssociatedCompany:
   *                 type: string
   *                 description: NIT of associated company for COMPANY type rules
   *     responses:
   *       200:
   *         description: Rule and roles updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Rule'
   *                 message:
   *                   type: string
   *                   example: "Rule and roles updated successfully"
   *       400:
   *         description: Invalid input data
   *       404:
   *         description: Rule not found in this company
   *       409:
   *         description: Rule name already exists in this company
   */
  router.put('/companies/:companyId/rules/:ruleId/roles', (req, res, next) => ruleController.updateWithRoles(req, res, next));

  /**
   * @swagger
   * /api/companies/{companyId}/rules/{ruleId}:
   *   delete:
   *     summary: Delete a rule
   *     description: Deletes a rule from a company
   *     tags: [Rules]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the company
   *       - in: path
   *         name: ruleId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the rule to delete
   *     responses:
   *       200:
   *         description: Rule deleted successfully
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
   *                   example: "Rule deleted successfully"
   *       404:
   *         description: Rule not found in this company
   */
  router.delete('/companies/:companyId/rules/:ruleId', (req, res, next) => ruleController.delete(req, res, next));
  
  /**
   * @swagger
   * /api/companies/{companyId}/rules/type/{type}:
   *   get:
   *     summary: Get rules by type
   *     description: Retrieves all rules of a specific type for a company
   *     tags: [Rules]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the company
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [AMOUNT, COMPANY, COMPANY-AMOUNT, BUSINESS, SECURITY, COMPLIANCE, OPERATIONAL, TECHNICAL, CUSTOM]
   *         description: Type of rules to retrieve
   *     responses:
   *       200:
   *         description: Rules retrieved successfully
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
   *                     $ref: '#/components/schemas/Rule'
   *                 count:
   *                   type: integer
   */
  router.get('/companies/:companyId/rules/type/:type', (req, res, next) => ruleController.getByType(req, res, next));

  /**
   * @swagger
   * /api/companies/{companyId}/rules/types/available:
   *   get:
   *     summary: Get available rule types for a company
   *     description: Retrieves all rule types that are currently used by the company
   *     tags: [Rules]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the company
   *     responses:
   *       200:
   *         description: Available types retrieved successfully
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
   *                     type: string
   *                   example: ["BUSINESS", "SECURITY", "COMPLIANCE"]
   */
  router.get('/companies/:companyId/rules/types/available', (req, res, next) => ruleController.getAvailableTypes(req, res, next));

  /**
   * @swagger
   * /api/companies/{companyId}/rules/stats/by-type:
   *   get:
   *     summary: Get rule statistics by type
   *     description: Retrieves statistics showing the count of rules by type for a company
   *     tags: [Rules]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the company
   *     responses:
   *       200:
   *         description: Statistics retrieved successfully
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
   *                     $ref: '#/components/schemas/RuleStats'
   */
  router.get('/companies/:companyId/rules/stats/by-type', (req, res, next) => ruleController.getStatsByType(req, res, next));
  
  /**
   * @swagger
   * /api/rules:
   *   get:
   *     summary: Get all rules (administrative)
   *     description: Retrieves all rules across all companies (for administrative purposes)
   *     tags: [Rules, Administration]
   *     parameters:
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *       - in: query
   *         name: companyId
   *         schema:
   *           type: integer
   *         description: Filter by specific company
   *       - in: query
   *         name: type
   *         schema:
   *           type: string
   *           enum: [AMOUNT, COMPANY, COMPANY-AMOUNT, BUSINESS, SECURITY, COMPLIANCE, OPERATIONAL, TECHNICAL, CUSTOM]
   *         description: Filter by rule type
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *         description: Filter by rule name (partial match)
   *     responses:
   *       200:
   *         description: All rules retrieved successfully
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
   *                     allOf:
   *                       - $ref: '#/components/schemas/Rule'
   *                       - type: object
   *                         properties:
   *                           companyName:
   *                             type: string
   *                             description: Name of the company this rule belongs to
   *                 count:
   *                   type: integer
   */
  router.get('/rules', (req, res, next) => ruleController.getAllRules(req, res, next));
  
  /**
   * @swagger
   * /api/rules/{ruleId}/roles:
   *   put:
   *     summary: Update a rule and its role associations (global endpoint)
   *     description: |
   *       Updates an existing rule including its role associations.
   *       This is a more RESTful endpoint that focuses on the rule entity.
   *       The companyId is validated internally to ensure the rule belongs to the correct company.
   *     tags: [Rules]
   *     parameters:
   *       - in: path
   *         name: ruleId
   *         required: true
   *         schema:
   *           type: integer
   *         description: ID of the rule to update
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               companyId:
   *                 type: integer
   *                 description: ID of the company (for validation)
   *                 example: 4
   *               name:
   *                 type: string
   *                 description: Name of the rule
   *                 example: "prueba jaldana"
   *               description:
   *                 type: string
   *                 description: Description of the rule
   *                 example: "prueba"
   *               type:
   *                 type: string
   *                 enum: [AMOUNT, COMPANY, COMPANY-AMOUNT, BUSINESS, SECURITY, COMPLIANCE, OPERATIONAL, TECHNICAL, CUSTOM]
   *                 description: Type of the rule
   *                 example: "AMOUNT"
   *               minimumAmount:
   *                 type: number
   *                 description: Minimum amount for AMOUNT type rules
   *                 example: 850000
   *               maximumAmount:
   *                 type: number
   *                 description: Maximum amount for AMOUNT type rules
   *                 example: 3000000
   *               roleIds:
   *                 type: array
   *                 items:
   *                   type: integer
   *                 description: Array of role IDs to associate with this rule
   *                 example: [1, 2, 7]
   *               isActive:
   *                 type: boolean
   *                 description: Whether the rule is active
   *                 example: true
   *               nitAssociatedCompany:
   *                 type: string
   *                 description: NIT of associated company for COMPANY type rules
   *             required:
   *               - companyId
   *     responses:
   *       200:
   *         description: Rule and roles updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Rule'
   *                 message:
   *                   type: string
   *                   example: "Rule and roles updated successfully"
   *       400:
   *         description: Invalid input data or company validation failed
   *       404:
   *         description: Rule not found
   *       409:
   *         description: Rule name already exists in this company
   */
  router.put('/rules/:ruleId/roles', (req, res, next) => ruleController.updateWithRolesGlobal(req, res, next));
  
  return router;
}

module.exports = createRuleRoutes;
