const express = require('express');
const AuthController = require('../controllers/AuthController');
const { createApiKeyMiddleware, createFullAuthMiddleware } = require('../middleware/auth');

function createAuthRoutes(jwtService) {
  const router = express.Router();
  const authController = new AuthController(jwtService);
  const apiKeyMiddleware = createApiKeyMiddleware(jwtService);
  const fullAuthMiddleware = createFullAuthMiddleware(jwtService);

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Authenticate user with DUD and API key
   *     description: Validates API key and user DUD, returns JWT token if successful
   *     parameters:
   *       - in: header
   *         name: x-api-key
   *         required: true
   *         schema:
   *           type: string
   *         description: API key for authentication
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - dud
   *             properties:
   *               dud:
   *                 type: string
   *                 description: User DUD (Document Unique ID)
   *                 example: "12345678-9"
   *     responses:
   *       200:
   *         description: Authentication successful
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
   *                   example: "Authentication successful"
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                       description: JWT access token
   *                     refreshToken:
   *                       type: string
   *                       description: JWT refresh token
   *                     expiresIn:
   *                       type: string
   *                       example: "24h"
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: integer
   *                         name:
   *                           type: string
   *                         DUD:
   *                           type: string
   *                         companyId:
   *                           type: integer
   *                         isActive:
   *                           type: boolean
   *                         rolesCount:
   *                           type: integer
   *       400:
   *         description: Validation error
   *       401:
   *         description: Authentication failed
   *       500:
   *         description: Internal server error
   */
  router.post('/login', authController.login.bind(authController));

  /**
   * @swagger
   * /api/auth/app-login:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Authenticate application with Company ID and API key
   *     description: Validates API key and company ID, returns JWT token for application use
   *     parameters:
   *       - in: header
   *         name: x-api-key
   *         required: true
   *         schema:
   *           type: string
   *         description: API key for authentication
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - companyId
   *             properties:
   *               companyId:
   *                 type: integer
   *                 description: Company ID for application authentication
   *                 example: 4
   *               description:
   *                 type: string
   *                 description: Optional description for the application
   *                 example: "External system integration"
   *     responses:
   *       200:
   *         description: Application authentication successful
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
   *                   example: "Application authentication successful"
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                       description: JWT access token
   *                     refreshToken:
   *                       type: string
   *                       description: JWT refresh token
   *                     expiresIn:
   *                       type: string
   *                       example: "24h"
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: integer
   *                         name:
   *                           type: string
   *                         DUD:
   *                           type: string
   *                         companyId:
   *                           type: integer
   *                         type:
   *                           type: string
   *                           example: "APPLICATION"
   *                         isActive:
   *                           type: boolean
   *                         rolesCount:
   *                           type: integer
   *       400:
   *         description: Validation error
   *       401:
   *         description: Authentication failed
   *       500:
   *         description: Internal server error
   */
  router.post('/app-login', authController.appLogin.bind(authController));

  /**
   * @swagger
   * /api/auth/integration-login:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Authenticate integration system with API key and credentials
   *     description: Validates integration API key and system credentials, returns JWT token with full system access
   *     parameters:
   *       - in: header
   *         name: x-api-key
   *         required: true
   *         schema:
   *           type: string
   *         description: Integration API key for system authentication
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: Integration system username
   *                 example: "integration_system"
   *               password:
   *                 type: string
   *                 description: Integration system password
   *                 example: "Int3gr4t10n@2024#Secure"
   *     responses:
   *       200:
   *         description: Integration authentication successful
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
   *                   example: "Integration authentication successful"
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                       description: JWT access token with system permissions
   *                     refreshToken:
   *                       type: string
   *                       description: JWT refresh token
   *                     expiresIn:
   *                       type: string
   *                       example: "24h"
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                           example: "integration_system_001"
   *                         name:
   *                           type: string
   *                           example: "Integration System User"
   *                         type:
   *                           type: string
   *                           example: "INTEGRATION"
   *                         permissions:
   *                           type: array
   *                           items:
   *                             type: string
   *                           example: ["INTEGRATION_ACCESS", "READ_ALL_COMPANIES", "WRITE_ALL_COMPANIES"]
   *                         canAccessAllCompanies:
   *                           type: boolean
   *                           example: true
   *       400:
   *         description: Validation error
   *       401:
   *         description: Authentication failed
   *       500:
   *         description: Internal server error
   */
  router.post('/integration-login', authController.integrationLogin.bind(authController));

  /**
   * @swagger
   * /api/auth/refresh:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Refresh JWT token
   *     description: Generates new access and refresh tokens using a valid refresh token
   *     parameters:
   *       - in: header
   *         name: x-api-key
   *         required: true
   *         schema:
   *           type: string
   *         description: API key for authentication
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refreshToken
   *             properties:
   *               refreshToken:
   *                 type: string
   *                 description: Valid refresh token
   *     responses:
   *       200:
   *         description: Token refreshed successfully
   *       400:
   *         description: Validation error
   *       401:
   *         description: Invalid refresh token
   *       500:
   *         description: Internal server error
   */
  router.post('/refresh', authController.refreshToken.bind(authController));

  /**
   * @swagger
   * /api/auth/validate:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Validate current JWT token
   *     description: Validates the current JWT token and returns user information
   *     parameters:
   *       - in: header
   *         name: x-api-key
   *         required: true
   *         schema:
   *           type: string
   *         description: API key for authentication
   *       - in: header
   *         name: Authorization
   *         required: true
   *         schema:
   *           type: string
   *         description: Bearer JWT token
   *         example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *     responses:
   *       200:
   *         description: Token is valid
   *       401:
   *         description: Invalid or expired token
   *       500:
   *         description: Internal server error
   */
  router.get('/validate', fullAuthMiddleware, authController.validateToken.bind(authController));

  /**
   * @swagger
   * /api/auth/profile:
   *   get:
   *     tags:
   *       - Authentication
   *     summary: Get user profile
   *     description: Retrieves complete user profile information including roles and permissions
   *     parameters:
   *       - in: header
   *         name: x-api-key
   *         required: true
   *         schema:
   *           type: string
   *         description: API key for authentication
   *       - in: header
   *         name: Authorization
   *         required: true
   *         schema:
   *           type: string
   *         description: Bearer JWT token
   *         example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *     responses:
   *       200:
   *         description: Profile retrieved successfully
   *       401:
   *         description: Authentication required
   *       500:
   *         description: Internal server error
   */
  router.get('/profile', fullAuthMiddleware, authController.getProfile.bind(authController));

  return router;
}

module.exports = createAuthRoutes;
