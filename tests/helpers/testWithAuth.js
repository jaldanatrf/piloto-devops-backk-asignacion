const authHelper = require('./authHelper');

/**
 * Wrapper para request con autenticación automática
 * Simplifica agregar headers de auth a todos los requests
 */
class AuthenticatedRequest {
  constructor(request, app, token = null) {
    this.request = request;
    this.app = app;
    this.token = token || authHelper.generateAdminToken();
  }

  /**
   * GET request con autenticación
   */
  get(url) {
    return this.request(this.app)
      .get(url)
      .set('Authorization', `Bearer ${this.token}`);
  }

  /**
   * POST request con autenticación
   */
  post(url) {
    return this.request(this.app)
      .post(url)
      .set('Authorization', `Bearer ${this.token}`);
  }

  /**
   * PUT request con autenticación
   */
  put(url) {
    return this.request(this.app)
      .put(url)
      .set('Authorization', `Bearer ${this.token}`);
  }

  /**
   * DELETE request con autenticación
   */
  delete(url) {
    return this.request(this.app)
      .delete(url)
      .set('Authorization', `Bearer ${this.token}`);
  }

  /**
   * PATCH request con autenticación
   */
  patch(url) {
    return this.request(this.app)
      .patch(url)
      .set('Authorization', `Bearer ${this.token}`);
  }

  /**
   * Request sin autenticación (para tests de error)
   */
  noAuth() {
    return {
      get: (url) => this.request(this.app).get(url),
      post: (url) => this.request(this.app).post(url),
      put: (url) => this.request(this.app).put(url),
      delete: (url) => this.request(this.app).delete(url),
      patch: (url) => this.request(this.app).patch(url)
    };
  }
}

/**
 * Factory para crear authenticated request
 */
function createAuthRequest(request, app, token = null) {
  return new AuthenticatedRequest(request, app, token);
}

module.exports = {
  AuthenticatedRequest,
  createAuthRequest
};
