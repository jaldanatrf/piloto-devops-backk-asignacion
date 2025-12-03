const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../infrastructure/config');
const { UnauthorizedError, ValidationError } = require('../errors');

class JwtService {
  constructor(userRepository) {
    this.userRepository = userRepository;
    this.secret = config.jwt.secret;
    this.expiresIn = config.jwt.expiresIn;
  }

  /**
   * Generate a JWT token for a user
   * @param {Object} payload - User data to include in token
   * @returns {string} JWT token
   */
  generateToken(payload) {
    try {
      const tokenPayload = {
        id: payload.id,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        roles: payload.roles,
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(tokenPayload, this.secret, {
        expiresIn: this.expiresIn,
        issuer: 'back-asignaciones',
        audience: 'back-asignaciones-client'
      });
    } catch (error) {
      throw new Error('Error generating token: ' + error.message);
    }
  }

  /**
   * Verify and decode a JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret, {
        issuer: 'back-asignaciones',
        audience: 'back-asignaciones-client'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      }
      if (error.name === 'NotBeforeError') {
        throw new UnauthorizedError('Token not active');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  }

  /**
   * Extract JWT token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} Token or null if not found
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }

    // Limpiar cualquier contenido extra y espacios
    const cleanHeader = authHeader.trim();
    
    // Verificar que empiece con "Bearer "
    if (!cleanHeader.startsWith('Bearer ')) {
      return null;
    }

    // Extraer la parte después de "Bearer "
    const tokenPart = cleanHeader.substring(7); // "Bearer ".length = 7
    
    // Si hay contenido adicional después del token (como ", "refreshToken": ..."), limpiarlo
    const tokenMatch = tokenPart.match(/^([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)/);
    
    if (tokenMatch) {
      return tokenMatch[1]; // Devolver solo el token JWT limpio
    }

    // Fallback: intentar extraer el token de la manera tradicional
    const parts = cleanHeader.split(' ');
    if (parts.length >= 2 && parts[0] === 'Bearer') {
      // Extraer solo la parte que parece un JWT (formato: xxx.yyy.zzz)
      const jwtPattern = /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/;
      const match = parts[1].match(jwtPattern);
      return match ? match[0] : null;
    }

    return null;
  }

  /**
   * Hash a password
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare a password with its hash
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password
   * @returns {Promise<boolean>} True if passwords match
   */
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate a refresh token
   * @param {Object} payload - User data to include in token
   * @returns {string} Refresh token
   */
  generateRefreshToken(payload) {
    try {
      const tokenPayload = {
        id: payload.id,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000)
      };

      return jwt.sign(tokenPayload, this.secret, {
        expiresIn: '7d', // Refresh tokens last longer
        issuer: 'back-asignaciones',
        audience: 'back-asignaciones-client'
      });
    } catch (error) {
      throw new Error('Error generating refresh token: ' + error.message);
    }
  }

  /**
   * Verify a refresh token
   * @param {string} token - Refresh token to verify
   * @returns {Object} Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'back-asignaciones',
        audience: 'back-asignaciones-client'
      });

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token');
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token has expired');
      }
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  /**
   * Validate API key
   * @param {string} apiKey - The API key to validate
   * @throws {UnauthorizedError} If API key is invalid or missing
   */
  validateApiKey(apiKey) {
    const validApiKey = config.apiKey || process.env.API_KEY;
    
    if (!apiKey) {
      throw new UnauthorizedError('API key is required');
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedError('Invalid API key');
    }
  }

  /**
   * Validate user by DUD and check if active
   * @param {string} dud - User's DUD to validate
   * @returns {Promise<Object>} User object if valid and active
   * @throws {ValidationError} If DUD is missing
   * @throws {UnauthorizedError} If user not found or inactive
   */
  async validateUserByDUD(dud) {
    if (!dud) {
      throw new ValidationError('DUD is required');
    }

    const user = await this.userRepository.findByDUD(dud);
    
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User is inactive');
    }

    return user;
  }

  /**
   * Authenticate user with API key and DUD
   * @param {string} apiKey - API key for authentication
   * @param {string} dud - User's DUD
   * @returns {Promise<Object>} Authentication result with tokens and user info
   * @throws {UnauthorizedError} If authentication fails
   * @throws {ValidationError} If parameters are invalid
   */
  async authenticateUser(apiKey, dud) {
    // Validate API key first
    this.validateApiKey(apiKey);

    // Validate and get user
    const user = await this.validateUserByDUD(dud);

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      name: user.name,
      DUD: user.DUD,
      companyId: user.companyId,
      roles: user.roles || []
    };

    const token = this.generateToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    return {
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        DUD: user.DUD,
        companyId: user.companyId,
        isActive: user.isActive,
        roles: user.roles || []
      },
      expiresIn: this.expiresIn
    };
  }

  /**
   * Authenticate integration system with API key and credentials
   * @param {string} apiKey - Integration API key for authentication
   * @param {string} username - Integration system username
   * @param {string} password - Integration system password
   * @returns {Promise<Object>} Authentication result with tokens and integration user info
   * @throws {UnauthorizedError} If authentication fails
   * @throws {ValidationError} If parameters are invalid
   */
  async authenticateIntegration(apiKey, username, password) {
    const integrationConfig = config.api?.integraciones;
    
    if (!integrationConfig) {
      throw new UnauthorizedError('Integration configuration not found');
    }

    // Validate integration API key
    if (!apiKey) {
      throw new ValidationError('Integration API key is required');
    }

    if (apiKey !== integrationConfig.key) {
      throw new UnauthorizedError('Invalid integration API key');
    }

    // Validate integration credentials
    if (!username || !password) {
      throw new ValidationError('Username and password are required');
    }

    if (username !== integrationConfig.user || password !== integrationConfig.password) {
      throw new UnauthorizedError('Invalid integration credentials');
    }

    // Create integration user payload with system permissions
    const integrationUser = {
      id: 'integration_system',
      name: 'Integration System',
      DUD: 'INTEGRATION',
      type: 'integration',
      companyId: null,
      isActive: true,
      roles: ['system_admin'],
      permissions: ['*'], // Full system access
      canAccessAllCompanies: true
    };

    // Generate tokens
    const tokenPayload = {
      id: integrationUser.id,
      name: integrationUser.name,
      DUD: integrationUser.DUD,
      type: integrationUser.type,
      companyId: integrationUser.companyId,
      roles: integrationUser.roles,
      permissions: integrationUser.permissions,
      canAccessAllCompanies: integrationUser.canAccessAllCompanies
    };

    const token = this.generateToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    return {
      success: true,
      token,
      refreshToken,
      user: integrationUser,
      expiresIn: this.expiresIn
    };
  }
}

module.exports = JwtService;
