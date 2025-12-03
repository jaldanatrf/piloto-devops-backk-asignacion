/**
 * @swagger
 * /api/roles/active/by-company-document/{documentType}/{documentNumber}:
 *   get:
 *     summary: Get active roles by company document type and number
 *     description: Returns all active roles for a company, searched by its document type and number.
 *     tags: [Roles, Companies]
 *     parameters:
 *       - in: path
 *         name: documentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [NIT, CC, CE, RUT]
 *         description: Document type of the company
 *       - in: path
 *         name: documentNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: Document number of the company
 *     responses:
 *       200:
 *         description: Active roles retrieved successfully
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
 *                   example: Active roles retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *                 count:
 *                   type: integer
 *                   example: 2
 */
/**
 * @swagger
 * /api/users/by-company-dud/{dud}:
 *   get:
 *     summary: Get users by company dud
 *     description: Returns all users associated with a company, searched by its dud (document type + document number).
 *     tags: [Users, Companies]
 *     parameters:
 *       - in: path
 *         name: dud
 *         required: true
 *         schema:
 *           type: string
 *         description: dud (document type + document number) of the company
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of users to return (pagination)
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of users to skip (pagination)
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
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - dud
 *         - companyId
 *       properties:
 *         id:
 *           type: integer
 *           description: User unique identifier
 *         name:
 *           type: string
 *           description: User's full name
 *           example: "Juan Pérez"
 *         dud:
 *           type: string
 *           description: dud (document type + document number)
 *           example: "CC12345678"
 *         companyId:
 *           type: integer
 *           description: ID of the company the user belongs to
 *           example: 1
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active
 *           example: true
 *         roles:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of role IDs assigned to the user
 *           example: [1, 2]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: User last update timestamp
 *     UserCreate:
 *       type: object
 *       required:
 *         - name
 *         - dud
 *         - companyId
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *           example: "Juan Pérez"
 *         DUD:
 *           type: string
 *           description: DUD (document type + document number)
 *           example: "CC12345678"
 *         companyId:
 *           type: integer
 *           description: ID of the company the user belongs to
 *           example: 1
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active (defaults to true)
 *           example: true
 *         roles:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of role IDs to assign to the user
 *           example: [1, 2]
 *     UserUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *           example: "Juan Pérez"
 *         dud:
 *           type: string
 *           description: DUD (document type + document number)
 *           example: "CC12345678"
 *         companyId:
 *           type: integer
 *           description: ID of the company the user belongs to
 *           example: 1
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active
 *           example: true
 *         roles:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of role IDs assigned to the user
 *           example: [1, 2]
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Operation success status
 *         message:
 *           type: string
 *           description: Response message
 *         data:
 *           description: Response data
 *         count:
 *           type: integer
 *           description: Number of items returned (for list operations)
 *   parameters:
 *     UserIdParam:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: integer
 *       description: User ID
 *     dudParam:
 *       in: path
 *       name: dud
 *       required: true
 *       schema:
 *         type: string
 *       description: dud (document type + document number)
 *     CompanyIdParam:
 *       in: path
 *       name: companyId
 *       required: true
 *       schema:
 *         type: integer
 *       description: Company ID
 *     RoleIdParam:
 *       in: path
 *       name: roleId
 *       required: true
 *       schema:
 *         type: integer
 *       description: Role ID
 */

// Función para crear las rutas de usuarios
function createUserRoutes(userController) {
  /**
   * Endpoint: Get active roles by company document type and number
   */
  router.get('/roles/active/by-company-document/:documentType/:documentNumber', async (req, res, next) => {
    try {
      const { documentType, documentNumber } = req.params;
      if (!documentType || !documentNumber) {
        return res.status(400).json({ success: false, message: 'Company document type and number are required', data: null });
      }
      // Buscar la compañía por tipo y número de documento
      const company = await userController.userUseCases.companyRepository.findByDocumentTypeAndNumber(documentType, documentNumber);
      if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found', data: null });
      }
      // Buscar roles activos por companyId
      const roles = await userController.userUseCases.roleRepository.findActive(company.id);
      return res.status(200).json({
        success: true,
        message: 'Active roles retrieved successfully',
        data: roles,
        count: roles.length
      });
    } catch (error) {
      next(error);
    }
  });
  /**
   * Endpoint: Get users by company document number (NIT)
   */
  router.get('/by-company-dud/:dud', (req, res, next) => userController.getUsersByCompanyDud(req, res, next));
  /**
   * @swagger
   * /api/users:
   *   post:
   *     summary: Create a new user
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserCreate'
   *     responses:
   *       201:
   *         description: User created successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid request data
   *       409:
   *         description: User with document/email already exists
   *       500:
   *         description: Internal server error
   */
    /**
     * @swagger
     * /api/users/by-company-document/{documentNumber}:
     *   get:
     *     summary: Get users by company document number with advanced filtering
     *     description: Returns all users associated with a company with support for search, filtering, sorting and pagination.
     *     tags: [Users, Companies]
     *     parameters:
     *       - in: path
     *         name: documentNumber
     *         required: true
     *         schema:
     *           type: string
     *         description: Document number (NIT) of the company
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *           minimum: 1
     *           maximum: 100
     *         description: Maximum number of users to return per page
     *       - in: query
     *         name: offset
     *         schema:
     *           type: integer
     *           default: 0
     *           minimum: 0
     *         description: Number of users to skip (pagination)
     *       - in: query
     *         name: dud
     *         schema:
     *           type: string
     *         description: Filtro específico en DUD del usuario
     *         example: "DUD123456"
     *       - in: query
     *         name: name
     *         schema:
     *           type: string
     *         description: Filtro específico en nombre del usuario
     *         example: "juan"
     *       - in: query
     *         name: documentType
     *         schema:
     *           type: string
     *           enum: [CC, CE, PP, TI, RC]
     *         description: Filter by document type
     *         example: "CC"
     *       - in: query
     *         name: isActive
     *         schema:
     *           type: boolean
     *         description: Filter by active status
     *         example: true
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [firstName, createdAt, documentNumber, isActive]
     *           default: firstName
     *         description: Field to sort by
     *         example: "firstName"
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *           default: asc
     *         description: Sort order
     *         example: "asc"
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
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/User'
     *                 total:
     *                   type: integer
     *                   description: Total users without filters
     *                   example: 25
     *                 totalFiltered:
     *                   type: integer
     *                   description: Total users with filters applied
     *                   example: 8
     *                 currentPage:
     *                   type: integer
     *                   description: Current page number
     *                   example: 1
     *                 totalPages:
     *                   type: integer
     *                   description: Total pages
     *                   example: 2
     *                 hasNextPage:
     *                   type: boolean
     *                   description: Whether there is a next page
     *                   example: true
     *                 hasPreviousPage:
     *                   type: boolean
     *                   description: Whether there is a previous page
     *                   example: false
     *       400:
     *         description: Validation error - invalid parameters
     *       404:
     *         description: Company not found
     *       500:
     *         description: Internal server error
     */
    router.get('/by-company-document/:documentNumber', (req, res, next) => userController.getUsersByCompanyDocumentNumber(req, res, next));
  router.post('/', (req, res, next) => userController.createUser(req, res, next));

  /**
   * @swagger
   * /api/users:
   *   get:
   *     summary: Get all users with optional filters
   *     tags: [Users]
   *     parameters:
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Filter by active status
   *       - in: query
   *         name: firstName
   *         schema:
   *           type: string
   *         description: Filter by first name (partial match)
   *       - in: query
   *         name: lastName
   *         schema:
   *           type: string
   *         description: Filter by last name (partial match)
   *       - in: query
   *         name: email
   *         schema:
   *           type: string
   *         description: Filter by email (partial match)
   *       - in: query
   *         name: documentType
   *         schema:
   *           type: string
   *           enum: [CC, CE, TI, PP, RC]
   *         description: Filter by document type
   *       - in: query
   *         name: documentNumber
   *         schema:
   *           type: string
   *         description: Filter by document number (partial match)
   *       - in: query
   *         name: companyId
   *         schema:
   *           type: integer
   *         description: Filter by company ID
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/User'
   *                     count:
   *                       type: integer
   *       500:
   *         description: Internal server error
   */
  router.get('/', (req, res, next) => userController.getAllUsers(req, res, next));

  /**
   * @swagger
   * /api/users/search/name:
   *   get:
   *     summary: Search users by name
   *     tags: [Users]
   *     parameters:
   *       - in: query
   *         name: name
   *         required: true
   *         schema:
   *           type: string
   *         description: Name to search for (searches in firstName and lastName)
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Maximum number of results to return
   *     responses:
   *       200:
   *         description: Search completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/User'
   *                     count:
   *                       type: integer
   *       400:
   *         description: Name parameter is required
   *       500:
   *         description: Internal server error
   */
  router.get('/search/name', (req, res, next) => userController.searchUsersByName(req, res, next));

  /**
   * @swagger
   * /api/users/search/document:
   *   get:
   *     summary: Search users by document
   *     tags: [Users]
   *     parameters:
   *       - in: query
   *         name: documentType
   *         schema:
   *           type: string
   *           enum: [CC, CE, TI, PP, RC]
   *         description: Document type to search for
   *       - in: query
   *         name: documentNumber
   *         schema:
   *           type: string
   *         description: Document number to search for
   *     responses:
   *       200:
   *         description: Search completed successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/User'
   *                     count:
   *                       type: integer
   *       400:
   *         description: At least document type or number is required
   *       500:
   *         description: Internal server error
   */
  router.get('/search/dud', (req, res, next) => userController.searchUsersByDud(req, res, next));

  /**
   * @swagger
   * /api/users/active:
   *   get:
   *     summary: Get all active users
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: Active users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/User'
   *                     count:
   *                       type: integer
   *       500:
   *         description: Internal server error
   */
  router.get('/active', (req, res, next) => userController.getActiveUsers(req, res, next));

  /**
   * @swagger
   * /api/users/company/{companyId}:
   *   get:
   *     summary: Get users by company
   *     tags: [Users]
   *     parameters:
   *       - $ref: '#/components/parameters/CompanyIdParam'
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/User'
   *                     count:
   *                       type: integer
   *       400:
   *         description: Invalid company ID
   *       404:
   *         description: Company not found
   *       500:
   *         description: Internal server error
   */
  router.get('/company/:companyId', (req, res, next) => userController.getUsersByCompany(req, res, next));

  /**
   * @swagger
   * /api/users/role/{roleId}:
   *   get:
   *     summary: Get users by role
   *     tags: [Users]
   *     parameters:
   *       - $ref: '#/components/parameters/RoleIdParam'
   *     responses:
   *       200:
   *         description: Users retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/User'
   *                     count:
   *                       type: integer
   *       400:
   *         description: Invalid role ID
   *       500:
   *         description: Internal server error
   */
  router.get('/role/:roleId', (req, res, next) => userController.getUsersByRole(req, res, next));

  /**
   * @swagger
   * /api/users/document/{documentType}/{documentNumber}:
   *   get:
   *     summary: Get user by document type and number
   *     tags: [Users]
   *     parameters:
   *       - $ref: '#/components/parameters/DocumentTypeParam'
   *       - $ref: '#/components/parameters/DocumentNumberParam'
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid document parameters
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  router.get('/dud/:dud', (req, res, next) => userController.getUserByDud(req, res, next));

  /**
   * @swagger
   * /api/users/company/{companyId}/document/{documentType}/{documentNumber}:
   *   get:
   *     summary: Get user by company ID, document type and number
   *     tags: [Users]
   *     parameters:
   *       - in: path
   *         name: companyId
   *         required: true
   *         schema:
   *           type: integer
   *         description: Company ID
   *         example: 1
   *       - $ref: '#/components/parameters/DocumentTypeParam'
   *       - $ref: '#/components/parameters/DocumentNumberParam'
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid parameters
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  router.get('/company/:companyId/dud/:dud', (req, res, next) => userController.getUserByCompanyAndDud(req, res, next));

  /**
   * @swagger
   * /api/users/email/{email}:
   *   get:
   *     summary: Get user by email
   *     tags: [Users]
   *     parameters:
   *       - $ref: '#/components/parameters/EmailParam'
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid email
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  router.get('/email/:email', (req, res, next) => userController.getUserByEmail(req, res, next));

  /**
   * @swagger
   * /api/users/{id}:
   *   get:
   *     summary: Get user by ID
   *     tags: [Users]
   *     parameters:
   *       - $ref: '#/components/parameters/UserIdParam'
   *     responses:
   *       200:
   *         description: User retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid user ID
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  router.get('/:id', (req, res, next) => userController.getUserById(req, res, next));

  /**
   * @swagger
   * /api/users/{id}:
   *   put:
   *     summary: Update user
   *     tags: [Users]
   *     parameters:
   *       - $ref: '#/components/parameters/UserIdParam'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UserUpdate'
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid request data
   *       404:
   *         description: User not found
   *       409:
   *         description: Document/email already exists for another user
   *       500:
   *         description: Internal server error
   */
  router.put('/:id', (req, res, next) => userController.updateUser(req, res, next));

  /**
   * @swagger
   * /api/users/{id}/document:
   *   patch:
   *     summary: Update user document
   *     tags: [Users]
   *     parameters:
   *       - $ref: '#/components/parameters/UserIdParam'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - documentType
   *               - documentNumber
   *             properties:
   *               documentType:
   *                 type: string
   *                 enum: [CC, CE, TI, PP, RC]
   *                 example: "CC"
   *               documentNumber:
   *                 type: string
   *                 example: "12345678"
   *     responses:
   *       200:
   *         description: User document updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid request data
   *       404:
   *         description: User not found
   *       409:
   *         description: Document already exists for another user
   *       500:
   *         description: Internal server error
   */
  router.patch('/:id/dud', (req, res, next) => userController.updateUserDud(req, res, next));

  /**
   * @swagger
   * /api/users/{id}/email:
   *   patch:
   *     summary: Update user email
   *     tags: [Users]
   *     parameters:
   *       - $ref: '#/components/parameters/UserIdParam'
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "juan.perez@email.com"
   *     responses:
   *       200:
   *         description: User email updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid email
   *       404:
   *         description: User not found
   *       409:
   *         description: Email already exists for another user
   *       500:
   *         description: Internal server error
   */
  // Email update endpoint removed

  /**
   * @swagger
   * /api/users/{id}/toggle-status:
   *   patch:
   *     summary: Toggle user active status
   *     tags: [Users]
   *     parameters:
   *       - $ref: '#/components/parameters/UserIdParam'
   *     responses:
   *       200:
   *         description: User status updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               allOf:
   *                 - $ref: '#/components/schemas/ApiResponse'
   *                 - type: object
   *                   properties:
   *                     data:
   *                       $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid user ID
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  router.patch('/:id/toggle-status', (req, res, next) => userController.toggleUserStatus(req, res, next));

  /**
   * @swagger
   * /api/users/{id}:
   *   delete:
   *     summary: Delete user
   *     tags: [Users]
   *     parameters:
   *       - $ref: '#/components/parameters/UserIdParam'
   *     responses:
   *       200:
   *         description: User deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ApiResponse'
   *       400:
   *         description: Invalid user ID or user has active assignments
   *       404:
   *         description: User not found
   *       500:
   *         description: Internal server error
   */
  router.delete('/:id', (req, res, next) => userController.deleteUser(req, res, next));

  return router;
}

module.exports = createUserRoutes;
