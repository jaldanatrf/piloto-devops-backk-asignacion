class Configuration {
  constructor({
    id,
    companyId,
    tokenEndpoint,
    tokenMethod = 'POST',
    listQueryEndpoint,
    listQueryMethod = 'GET',
    notificationEndpoint,
    notificationMethod = 'POST',
    authType,
    authUsername,
    authPassword,
    authApiKey,
    authAdditionalFields,
    pathVariableMapping,
    bodyVariableMapping,
    customHeaders,
    isActive = true,
    description,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.companyId = companyId;

    // Endpoints
    this.tokenEndpoint = tokenEndpoint;
    this.tokenMethod = tokenMethod;
    this.listQueryEndpoint = listQueryEndpoint;
    this.listQueryMethod = listQueryMethod;
    this.notificationEndpoint = notificationEndpoint;
    this.notificationMethod = notificationMethod;

    // Autenticación
    this.authType = authType;
    this.authUsername = authUsername;
    this.authPassword = authPassword;
    this.authApiKey = authApiKey;
    this.authAdditionalFields = authAdditionalFields;

    // Mapeo de variables
    this.pathVariableMapping = pathVariableMapping;
    this.bodyVariableMapping = bodyVariableMapping;
    this.customHeaders = customHeaders;

    // Metadatos
    this.isActive = isActive;
    this.description = description;
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt;

    this.validate();
  }

  validate() {
    // Validar companyId
    if (!this.companyId) {
      throw new Error('Configuration must be associated with a company');
    }

    // Validar endpoints
    if (!this.tokenEndpoint || this.tokenEndpoint.trim().length === 0) {
      throw new Error('Token endpoint is required');
    }

    if (!this.listQueryEndpoint || this.listQueryEndpoint.trim().length === 0) {
      throw new Error('List query endpoint is required');
    }

    if (!this.notificationEndpoint || this.notificationEndpoint.trim().length === 0) {
      throw new Error('Notification endpoint is required');
    }

    // Validar que sean URLs válidas
    this.validateUrl(this.tokenEndpoint, 'Token endpoint');
    this.validateUrl(this.listQueryEndpoint, 'List query endpoint');
    this.validateUrl(this.notificationEndpoint, 'Notification endpoint');

    // Validar métodos HTTP
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

    if (!validMethods.includes(this.tokenMethod.toUpperCase())) {
      throw new Error(`Invalid token method: ${this.tokenMethod}. Must be one of: ${validMethods.join(', ')}`);
    }

    if (!validMethods.includes(this.listQueryMethod.toUpperCase())) {
      throw new Error(`Invalid list query method: ${this.listQueryMethod}. Must be one of: ${validMethods.join(', ')}`);
    }

    if (!validMethods.includes(this.notificationMethod.toUpperCase())) {
      throw new Error(`Invalid notification method: ${this.notificationMethod}. Must be one of: ${validMethods.join(', ')}`);
    }

    // Normalizar métodos a mayúsculas
    this.tokenMethod = this.tokenMethod.toUpperCase();
    this.listQueryMethod = this.listQueryMethod.toUpperCase();
    this.notificationMethod = this.notificationMethod.toUpperCase();

    // Validar tipo de autenticación
    if (!this.authType || this.authType.trim().length === 0) {
      throw new Error('Authentication type is required');
    }

    const validAuthTypes = ['BASIC', 'BEARER', 'API_KEY', 'OAUTH2'];
    if (!validAuthTypes.includes(this.authType.toUpperCase())) {
      throw new Error(`Invalid authentication type: ${this.authType}. Must be one of: ${validAuthTypes.join(', ')}`);
    }

    this.authType = this.authType.toUpperCase();

    // Validar credenciales según el tipo de autenticación
    if (this.authType === 'BASIC' || this.authType === 'BEARER' || this.authType === 'OAUTH2') {
      if (!this.authUsername || this.authUsername.trim().length === 0) {
        throw new Error(`Username is required for ${this.authType} authentication`);
      }
      if (!this.authPassword || this.authPassword.trim().length === 0) {
        throw new Error(`Password is required for ${this.authType} authentication`);
      }
    }

    if (this.authType === 'API_KEY') {
      if (!this.authApiKey || this.authApiKey.trim().length === 0) {
        throw new Error('API key is required for API_KEY authentication');
      }
    }

    // Validar mapeos JSON si existen
    if (this.pathVariableMapping && typeof this.pathVariableMapping !== 'object') {
      throw new Error('Path variable mapping must be a valid JSON object');
    }

    if (this.bodyVariableMapping && typeof this.bodyVariableMapping !== 'object') {
      throw new Error('Body variable mapping must be a valid JSON object');
    }

    if (this.customHeaders && typeof this.customHeaders !== 'object') {
      throw new Error('Custom headers must be a valid JSON object');
    }

    if (this.authAdditionalFields && typeof this.authAdditionalFields !== 'object') {
      throw new Error('Auth additional fields must be a valid JSON object');
    }
  }

  validateUrl(url, fieldName) {
    try {
      new URL(url);
    } catch (error) {
      throw new Error(`${fieldName} must be a valid URL: ${url}`);
    }
  }

  // Domain methods
  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  updateDescription(newDescription) {
    if (newDescription && newDescription.length > 500) {
      throw new Error('Configuration description cannot exceed 500 characters');
    }
    this.description = newDescription;
  }

  updateEndpoint(endpointType, newUrl, newMethod) {
    this.validateUrl(newUrl, `${endpointType} endpoint`);

    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (newMethod && !validMethods.includes(newMethod.toUpperCase())) {
      throw new Error(`Invalid HTTP method: ${newMethod}`);
    }

    switch (endpointType) {
      case 'token':
        this.tokenEndpoint = newUrl;
        if (newMethod) this.tokenMethod = newMethod.toUpperCase();
        break;
      case 'listQuery':
        this.listQueryEndpoint = newUrl;
        if (newMethod) this.listQueryMethod = newMethod.toUpperCase();
        break;
      case 'notification':
        this.notificationEndpoint = newUrl;
        if (newMethod) this.notificationMethod = newMethod.toUpperCase();
        break;
      default:
        throw new Error(`Invalid endpoint type: ${endpointType}`);
    }
  }

  updateAuth(authData) {
    if (authData.authType) {
      const validAuthTypes = ['BASIC', 'BEARER', 'API_KEY', 'OAUTH2'];
      if (!validAuthTypes.includes(authData.authType.toUpperCase())) {
        throw new Error(`Invalid authentication type: ${authData.authType}`);
      }
      this.authType = authData.authType.toUpperCase();
    }

    if (authData.authUsername !== undefined) this.authUsername = authData.authUsername;
    if (authData.authPassword !== undefined) this.authPassword = authData.authPassword;
    if (authData.authApiKey !== undefined) this.authApiKey = authData.authApiKey;
    if (authData.authAdditionalFields !== undefined) {
      if (typeof authData.authAdditionalFields !== 'object') {
        throw new Error('Auth additional fields must be a valid JSON object');
      }
      this.authAdditionalFields = authData.authAdditionalFields;
    }

    // Re-validar credenciales
    this.validate();
  }

  updateVariableMapping(mappingType, newMapping) {
    if (typeof newMapping !== 'object') {
      throw new Error(`${mappingType} mapping must be a valid JSON object`);
    }

    switch (mappingType) {
      case 'path':
        this.pathVariableMapping = newMapping;
        break;
      case 'body':
        this.bodyVariableMapping = newMapping;
        break;
      case 'headers':
        this.customHeaders = newMapping;
        break;
      default:
        throw new Error(`Invalid mapping type: ${mappingType}`);
    }
  }

  // Método para obtener información básica
  getBasicInfo() {
    return {
      id: this.id,
      companyId: this.companyId,
      tokenEndpoint: this.tokenEndpoint,
      tokenMethod: this.tokenMethod,
      listQueryEndpoint: this.listQueryEndpoint,
      listQueryMethod: this.listQueryMethod,
      notificationEndpoint: this.notificationEndpoint,
      notificationMethod: this.notificationMethod,
      authType: this.authType,
      isActive: this.isActive,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Método para obtener configuración completa (sin exponer contraseñas)
  getFullInfo() {
    return {
      ...this.getBasicInfo(),
      authUsername: this.authUsername,
      authAdditionalFields: this.authAdditionalFields,
      pathVariableMapping: this.pathVariableMapping,
      bodyVariableMapping: this.bodyVariableMapping,
      customHeaders: this.customHeaders
    };
  }

  // Método para validar si la configuración puede usarse
  canBeUsed() {
    return this.isActive;
  }

  // Método para obtener las variables disponibles en los mapeos
  getAvailableVariables() {
    const variables = new Set();

    if (this.pathVariableMapping) {
      Object.keys(this.pathVariableMapping).forEach(key => variables.add(key));
    }

    if (this.bodyVariableMapping) {
      Object.keys(this.bodyVariableMapping).forEach(key => variables.add(key));
    }

    return Array.from(variables);
  }
}

module.exports = Configuration;
