const JwtService = require('../../../shared/security/JwtService');
const { UnauthorizedError } = require('../../../shared/errors');
const { logger } = require('../../../shared/logger');

/**
 * Middleware para validar JWT tokens
 * @param {JwtService} jwtService - Instancia del servicio JWT
 * @returns {Function} Middleware function
 */
function createAuthMiddleware(jwtService) {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        throw new UnauthorizedError('Authorization header is required');
      }

      const token = jwtService.extractTokenFromHeader(authHeader);
      
      if (!token) {
        throw new UnauthorizedError('Invalid authorization header format');
      }

      const decoded = jwtService.verifyToken(token);
      
      // Agregar información del usuario al objeto request
      req.user = {
        id: decoded.id,
        name: decoded.name,
        DUD: decoded.DUD,
        companyId: decoded.companyId,
        type: decoded.type || 'USER',
        roles: decoded.roles || [],
        permissions: decoded.permissions || []
      };

      logger.info('User authenticated successfully', {
        userId: req.user.id,
        DUD: req.user.DUD,
        companyId: req.user.companyId
      });

      next();
    } catch (error) {
      logger.error('Authentication failed', {
        error: error.message,
        headers: req.headers
      });

      if (error instanceof UnauthorizedError) {
        return res.status(401).json({
          success: false,
          error: error.message,
          code: 'UNAUTHORIZED'
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        code: 'UNAUTHORIZED'
      });
    }
  };
}

/**
 * Middleware para validar API Key (regular o integración)
 * @param {JwtService} jwtService - Instancia del servicio JWT
 * @returns {Function} Middleware function
 */
function createApiKeyMiddleware(jwtService) {
  return (req, res, next) => {
    try {
      const apiKey = req.headers['x-api-key'] || req.headers['api-key'];
      
      if (!apiKey) {
        throw new UnauthorizedError('API key is required');
      }

      // Intentar validar como API key regular primero
      try {
        jwtService.validateApiKey(apiKey);
        logger.info('Regular API key validated successfully');
        return next();
      } catch (regularApiKeyError) {
        // Si falla, intentar como API key de integración
        try {
          jwtService.validateIntegrationApiKey(apiKey);
          logger.info('Integration API key validated successfully');
          return next();
        } catch (integrationApiKeyError) {
          throw new UnauthorizedError('Invalid API key');
        }
      }
    } catch (error) {
      logger.error('API key validation failed', {
        error: error.message
      });

      return res.status(401).json({
        success: false,
        error: error.message,
        code: 'INVALID_API_KEY'
      });
    }
  };
}

/**
 * Middleware combinado que valida solo JWT Token (sin API key)
 * @param {JwtService} jwtService - Instancia del servicio JWT
 * @returns {Function} Middleware function
 */
function createFullAuthMiddleware(jwtService) {
  return (req, res, next) => {
    try {
      // Verificar JWT Token únicamente
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          error: 'Authorization header with JWT token is required',
          code: 'MISSING_JWT_TOKEN'
        });
      }

      const token = jwtService.extractTokenFromHeader(authHeader);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Invalid authorization header format. Use: Bearer <token>',
          code: 'INVALID_AUTH_HEADER'
        });
      }

      // Verificar y decodificar el token
      const decoded = jwtService.verifyToken(token);
      
      // Agregar información del usuario al objeto request
      req.user = {
        id: decoded.id,
        name: decoded.name,
        DUD: decoded.DUD,
        companyId: decoded.companyId,
        type: decoded.type || 'USER',
        roles: decoded.roles || [],
        permissions: decoded.permissions || []
      };

      logger.info('JWT authentication successful', {
        userId: req.user.id,
        DUD: req.user.DUD,
        companyId: req.user.companyId,
        userType: req.user.type
      });

      next();

    } catch (error) {
      logger.error('JWT authentication failed', {
        error: error.message,
        hasAuthHeader: !!req.headers.authorization
      });

      if (error instanceof UnauthorizedError) {
        return res.status(401).json({
          success: false,
          error: error.message,
          code: 'JWT_TOKEN_ERROR'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'JWT token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid JWT token',
          code: 'INVALID_TOKEN'
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal authentication error',
        code: 'AUTHENTICATION_ERROR'
      });
    }
  };
}

/**
 * Middleware para verificar que el usuario pertenece a una compañía específica
 * @param {number} requiredCompanyId - ID de la compañía requerida
 * @returns {Function} Middleware function
 */
function requireCompany(requiredCompanyId) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'UNAUTHORIZED'
      });
    }

    if (req.user.companyId !== requiredCompanyId) {
      logger.warn('User tried to access resource from different company', {
        userId: req.user.id,
        userCompanyId: req.user.companyId,
        requiredCompanyId
      });

      return res.status(403).json({
        success: false,
        error: 'Access denied: insufficient permissions',
        code: 'FORBIDDEN'
      });
    }

    next();
  };
}

/**
 * Middleware para verificar que el usuario tiene uno de los roles especificados
 * @param {Array<string|number>} requiredRoles - Array de roles requeridos
 * @returns {Function} Middleware function
 */
function requireRoles(requiredRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
        code: 'UNAUTHORIZED'
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => 
      userRoles.includes(role)
    );

    if (!hasRequiredRole) {
      logger.warn('User tried to access resource without required roles', {
        userId: req.user.id,
        userRoles,
        requiredRoles
      });

      return res.status(403).json({
        success: false,
        error: 'Access denied: insufficient roles',
        code: 'INSUFFICIENT_ROLES'
      });
    }

    next();
  };
}

module.exports = {
  createAuthMiddleware,
  createApiKeyMiddleware,
  createFullAuthMiddleware,
  requireCompany,
  requireRoles
};
