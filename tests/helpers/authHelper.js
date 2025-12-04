const jwt = require('jsonwebtoken');
const config = require('../../src/infrastructure/config');

/**
 * Helper para generar tokens JWT para tests de integración
 */
class AuthTestHelper {
  constructor() {
    this.secret = config.jwt.secret;
    this.expiresIn = config.jwt.expiresIn;
  }

  /**
   * Genera un token JWT para un usuario de prueba
   * @param {Object} payload - Datos del usuario (id, name, DUD, companyId, roles)
   * @returns {string} Token JWT
   */
  generateTestToken(payload = {}) {
    const defaultPayload = {
      id: payload.id || 999,
      name: payload.name || 'Test User',
      DUD: payload.DUD || 'TEST123',
      companyId: payload.companyId || 1,
      type: payload.type || 'USER',
      roles: payload.roles || ['admin'],
      permissions: payload.permissions || [],
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(defaultPayload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: 'back-asignaciones',
      audience: 'back-asignaciones-client'
    });
  }

  /**
   * Genera un token para un usuario con permisos de administrador
   * @param {number} companyId - ID de la compañía
   * @returns {string} Token JWT
   */
  generateAdminToken(companyId = 1) {
    return this.generateTestToken({
      id: 999,
      name: 'Admin User',
      DUD: 'ADMIN999',
      companyId,
      type: 'USER',
      roles: ['admin', 'super_admin'],
      permissions: ['*']
    });
  }

  /**
   * Genera un token para un usuario normal
   * @param {number} companyId - ID de la compañía
   * @returns {string} Token JWT
   */
  generateUserToken(companyId = 1) {
    return this.generateTestToken({
      id: 1000,
      name: 'Regular User',
      DUD: 'USER1000',
      companyId,
      type: 'USER',
      roles: ['user'],
      permissions: []
    });
  }

  /**
   * Genera un token para un sistema de integración con permisos completos
   * @returns {string} Token JWT
   */
  generateIntegrationToken() {
    return this.generateTestToken({
      id: 'integration_system',
      name: 'Integration System',
      DUD: 'INTEGRATION',
      type: 'integration',
      companyId: null,
      roles: ['system_admin'],
      permissions: ['*'],
      canAccessAllCompanies: true
    });
  }

  /**
   * Genera el header de autorización completo
   * @param {string} token - Token JWT (si no se provee, genera uno nuevo)
   * @returns {Object} Headers de autorización
   */
  getAuthHeaders(token = null) {
    const authToken = token || this.generateAdminToken();
    return {
      'Authorization': `Bearer ${authToken}`
    };
  }

  /**
   * Genera un token expirado para probar manejo de errores
   * @returns {string} Token JWT expirado
   */
  generateExpiredToken() {
    const payload = {
      id: 999,
      name: 'Test User',
      DUD: 'TEST123',
      companyId: 1,
      roles: ['admin'],
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: '-1h', // Token expirado hace 1 hora
      issuer: 'back-asignaciones',
      audience: 'back-asignaciones-client'
    });
  }

  /**
   * Genera un token inválido para probar manejo de errores
   * @returns {string} Token inválido
   */
  generateInvalidToken() {
    return 'invalid.token.here';
  }

  /**
   * Decodifica un token sin validarlo (útil para debugging)
   * @param {string} token - Token JWT
   * @returns {Object} Payload decodificado
   */
  decodeToken(token) {
    return jwt.decode(token);
  }
}

// Exportar instancia singleton para uso en tests
module.exports = new AuthTestHelper();
