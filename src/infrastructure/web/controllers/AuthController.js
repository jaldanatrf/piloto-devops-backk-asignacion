const { ValidationError, UnauthorizedError } = require('../../../shared/errors');
const { logger } = require('../../../shared/logger');

class AuthController {
  constructor(jwtService) {
    this.jwtService = jwtService;
  }

  async login(req, res) {
    try {
      const { dud } = req.body;
      const apiKey = req.headers['x-api-key'] || req.headers['api-key'];

      if (!dud) {
        return res.status(400).json({
          success: false,
          error: 'DUD is required in request body',
          code: 'VALIDATION_ERROR'
        });
      }

      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'API key is required in headers (x-api-key)',
          code: 'VALIDATION_ERROR'
        });
      }

      const authResult = await this.jwtService.authenticateUser(apiKey, dud);

      logger.info('User login successful', {
        userId: authResult.user.id,
        DUD: authResult.user.DUD,
        companyId: authResult.user.companyId
      });

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        data: {
          token: authResult.token,
          refreshToken: authResult.refreshToken,
          expiresIn: authResult.expiresIn,
          user: {
            id: authResult.user.id,
            name: authResult.user.name,
            DUD: authResult.user.DUD,
            companyId: authResult.user.companyId,
            isActive: authResult.user.isActive,
            rolesCount: authResult.user.roles.length,
            type: 'USER'
          }
        }
      });

    } catch (error) {
      logger.error('Login failed', {
        error: error.message,
        dud: req.body.dud,
        hasApiKey: !!req.headers['x-api-key']
      });

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      if (error instanceof UnauthorizedError) {
        return res.status(401).json({
          success: false,
          error: error.message,
          code: 'UNAUTHORIZED'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error during authentication',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async appLogin(req, res) {
    try {
      const { companyId, description } = req.body;
      const apiKey = req.headers['x-api-key'] || req.headers['api-key'];

      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'Company ID is required in request body',
          code: 'VALIDATION_ERROR'
        });
      }

      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'API key is required in headers (x-api-key)',
          code: 'VALIDATION_ERROR'
        });
      }

      const parsedCompanyId = parseInt(companyId);
      if (isNaN(parsedCompanyId)) {
        return res.status(400).json({
          success: false,
          error: 'Company ID must be a valid number',
          code: 'VALIDATION_ERROR'
        });
      }

      const authResult = await this.jwtService.authenticateApplication(
        apiKey, 
        parsedCompanyId, 
        description || 'Application Integration'
      );

      logger.info('Application login successful', {
        companyId: parsedCompanyId,
        description: description || 'Application Integration',
        appId: authResult.user.id
      });

      res.status(200).json({
        success: true,
        message: 'Application authentication successful',
        data: {
          token: authResult.token,
          refreshToken: authResult.refreshToken,
          expiresIn: authResult.expiresIn,
          user: {
            id: authResult.user.id,
            name: authResult.user.name,
            DUD: authResult.user.DUD,
            companyId: authResult.user.companyId,
            type: authResult.user.type,
            description: authResult.user.description,
            isActive: authResult.user.isActive,
            rolesCount: authResult.user.rolesCount
          }
        }
      });

    } catch (error) {
      logger.error('Application login failed', {
        error: error.message,
        companyId: req.body.companyId,
        hasApiKey: !!req.headers['x-api-key']
      });

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      if (error instanceof UnauthorizedError) {
        return res.status(401).json({
          success: false,
          error: error.message,
          code: 'UNAUTHORIZED'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error during application authentication',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async integrationLogin(req, res) {
    try {
      const { username, password } = req.body;
      const apiKey = req.headers['x-api-key'] || req.headers['api-key'];

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required in request body',
          code: 'VALIDATION_ERROR'
        });
      }

      if (!apiKey) {
        return res.status(400).json({
          success: false,
          error: 'Integration API key is required in headers (x-api-key)',
          code: 'VALIDATION_ERROR'
        });
      }

      const authResult = await this.jwtService.authenticateIntegration(apiKey, username, password);

      logger.info('Integration login successful', {
        integrationId: authResult.user.id,
        username: username,
        permissions: authResult.user.permissions
      });

      res.status(200).json({
        success: true,
        message: 'Integration authentication successful',
        data: {
          token: authResult.token,
          refreshToken: authResult.refreshToken,
          expiresIn: authResult.expiresIn,
          user: {
            id: authResult.user.id,
            name: authResult.user.name,
            DUD: authResult.user.DUD,
            type: authResult.user.type,
            permissions: authResult.user.permissions,
            isActive: authResult.user.isActive,
            rolesCount: authResult.user.roles.length,
            canAccessAllCompanies: true
          }
        }
      });

    } catch (error) {
      logger.error('Integration login failed', {
        error: error.message,
        username: req.body.username,
        hasApiKey: !!req.headers['x-api-key']
      });

      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: 'VALIDATION_ERROR'
        });
      }

      if (error instanceof UnauthorizedError) {
        return res.status(401).json({
          success: false,
          error: error.message,
          code: 'UNAUTHORIZED'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error during integration authentication',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  async refreshToken(req, res) {
    res.json({ 
      success: true,
      message: 'Refresh token endpoint working',
      data: { endpoint: 'refresh' }
    });
  }

  async validateToken(req, res) {
    res.json({ 
      success: true,
      message: 'Validate token endpoint working',
      data: { endpoint: 'validate' }
    });
  }

  async getProfile(req, res) {
    res.json({ 
      success: true,
      message: 'Get profile endpoint working',
      data: { endpoint: 'profile' }
    });
  }
}

module.exports = AuthController;
