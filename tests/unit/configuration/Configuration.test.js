const Configuration = require('../../../src/domain/entities/Configuration');

describe('Configuration Entity', () => {
  const validConfigData = {
    id: 1,
    companyId: 1,
    tokenEndpoint: 'https://api.example.com/token',
    tokenMethod: 'POST',
    listQueryEndpoint: 'https://api.example.com/lists',
    listQueryMethod: 'GET',
    notificationEndpoint: 'https://api.example.com/notifications',
    notificationMethod: 'POST',
    authType: 'BEARER',
    authUsername: 'admin',
    authPassword: 'password123',
    isActive: true
  };

  describe('Constructor and Validation', () => {
    test('should create a valid configuration', () => {
      const config = new Configuration(validConfigData);

      expect(config.id).toBe(1);
      expect(config.companyId).toBe(1);
      expect(config.tokenEndpoint).toBe('https://api.example.com/token');
      expect(config.authType).toBe('BEARER');
      expect(config.isActive).toBe(true);
    });

    test('should throw error for missing companyId', () => {
      const invalidData = { ...validConfigData };
      delete invalidData.companyId;

      expect(() => {
        new Configuration(invalidData);
      }).toThrow('Company ID is required');
    });

    test('should throw error for missing tokenEndpoint', () => {
      const invalidData = { ...validConfigData };
      delete invalidData.tokenEndpoint;

      expect(() => {
        new Configuration(invalidData);
      }).toThrow('Token endpoint is required');
    });

    test('should throw error for invalid URL in tokenEndpoint', () => {
      const invalidData = { ...validConfigData, tokenEndpoint: 'not-a-url' };

      expect(() => {
        new Configuration(invalidData);
      }).toThrow('tokenEndpoint must be a valid URL');
    });

    test('should throw error for invalid HTTP method', () => {
      const invalidData = { ...validConfigData, tokenMethod: 'INVALID' };

      expect(() => {
        new Configuration(invalidData);
      }).toThrow('tokenMethod must be a valid HTTP method');
    });

    test('should throw error for invalid auth type', () => {
      const invalidData = { ...validConfigData, authType: 'INVALID' };

      expect(() => {
        new Configuration(invalidData);
      }).toThrow('authType must be one of: BASIC, BEARER, API_KEY, OAUTH2');
    });

    test('should throw error for BEARER auth without username', () => {
      const invalidData = { ...validConfigData };
      delete invalidData.authUsername;

      expect(() => {
        new Configuration(invalidData);
      }).toThrow('Username and password are required for BEARER authentication');
    });

    test('should throw error for API_KEY auth without apiKey', () => {
      const invalidData = { ...validConfigData, authType: 'API_KEY' };
      delete invalidData.authUsername;
      delete invalidData.authPassword;

      expect(() => {
        new Configuration(invalidData);
      }).toThrow('API Key is required for API_KEY authentication');
    });

    test('should accept valid JSON mappings', () => {
      const configData = {
        ...validConfigData,
        pathVariableMapping: { documentType: 'assignment.documentType' },
        bodyVariableMapping: { userDud: 'user.dud' }
      };

      const config = new Configuration(configData);
      expect(config.pathVariableMapping).toEqual({ documentType: 'assignment.documentType' });
      expect(config.bodyVariableMapping).toEqual({ userDud: 'user.dud' });
    });

    test('should throw error for invalid pathVariableMapping', () => {
      const invalidData = {
        ...validConfigData,
        pathVariableMapping: 'not-an-object'
      };

      expect(() => {
        new Configuration(invalidData);
      }).toThrow('pathVariableMapping must be an object');
    });
  });

  describe('Endpoint Management', () => {
    test('should update token endpoint', () => {
      const config = new Configuration(validConfigData);
      const newEndpoint = 'https://api.newserver.com/auth';

      config.updateEndpoint('tokenEndpoint', newEndpoint);
      expect(config.tokenEndpoint).toBe(newEndpoint);
    });

    test('should throw error when updating with invalid URL', () => {
      const config = new Configuration(validConfigData);

      expect(() => {
        config.updateEndpoint('tokenEndpoint', 'invalid-url');
      }).toThrow('tokenEndpoint must be a valid URL');
    });

    test('should update notification endpoint', () => {
      const config = new Configuration(validConfigData);
      const newEndpoint = 'https://api.newserver.com/notify';

      config.updateEndpoint('notificationEndpoint', newEndpoint);
      expect(config.notificationEndpoint).toBe(newEndpoint);
    });
  });

  describe('Authentication Management', () => {
    test('should update auth credentials', () => {
      const config = new Configuration(validConfigData);

      config.updateAuth({
        authUsername: 'newuser',
        authPassword: 'newpassword'
      });

      expect(config.authUsername).toBe('newuser');
      expect(config.authPassword).toBe('newpassword');
    });

    test('should update auth type', () => {
      const config = new Configuration({
        ...validConfigData,
        authType: 'API_KEY',
        authApiKey: 'test-api-key-123'
      });

      expect(config.authType).toBe('API_KEY');
      expect(config.authApiKey).toBe('test-api-key-123');
    });

    test('should handle additional auth fields', () => {
      const config = new Configuration({
        ...validConfigData,
        authAdditionalFields: {
          grant_type: 'password',
          scope: 'read write'
        }
      });

      expect(config.authAdditionalFields).toEqual({
        grant_type: 'password',
        scope: 'read write'
      });
    });
  });

  describe('Activation Management', () => {
    test('should activate configuration', () => {
      const config = new Configuration({ ...validConfigData, isActive: false });

      config.activate();
      expect(config.isActive).toBe(true);
    });

    test('should deactivate configuration', () => {
      const config = new Configuration(validConfigData);

      config.deactivate();
      expect(config.isActive).toBe(false);
    });
  });

  describe('Variable Management', () => {
    test('should get available variables from mappings', () => {
      const config = new Configuration({
        ...validConfigData,
        pathVariableMapping: {
          documentType: 'assignment.documentType',
          documentNumber: 'assignment.documentNumber'
        },
        bodyVariableMapping: {
          userDud: 'user.dud',
          claimId: 'assignment.claimId'
        }
      });

      const variables = config.getAvailableVariables();
      expect(variables).toContain('documentType');
      expect(variables).toContain('documentNumber');
      expect(variables).toContain('userDud');
      expect(variables).toContain('claimId');
    });

    test('should return empty array when no mappings', () => {
      const config = new Configuration(validConfigData);
      const variables = config.getAvailableVariables();

      expect(variables).toEqual([]);
    });
  });

  describe('Info Methods', () => {
    test('should return basic info', () => {
      const config = new Configuration(validConfigData);
      const basicInfo = config.getBasicInfo();

      expect(basicInfo).toMatchObject({
        id: 1,
        companyId: 1,
        authType: 'BEARER',
        isActive: true
      });
      expect(basicInfo.authPassword).toBeUndefined();
      expect(basicInfo.authApiKey).toBeUndefined();
    });

    test('should return full info', () => {
      const config = new Configuration(validConfigData);
      const fullInfo = config.getFullInfo();

      expect(fullInfo).toMatchObject({
        id: 1,
        companyId: 1,
        tokenEndpoint: 'https://api.example.com/token',
        authType: 'BEARER',
        authUsername: 'admin',
        isActive: true
      });
      expect(fullInfo.authPassword).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle configuration with all optional fields', () => {
      const minimalConfig = {
        companyId: 1,
        tokenEndpoint: 'https://api.example.com/token',
        listQueryEndpoint: 'https://api.example.com/lists',
        notificationEndpoint: 'https://api.example.com/notifications',
        authType: 'API_KEY',
        authApiKey: 'test-key-123'
      };

      const config = new Configuration(minimalConfig);
      expect(config.companyId).toBe(1);
      expect(config.isActive).toBe(true); // default
    });

    test('should handle custom headers', () => {
      const config = new Configuration({
        ...validConfigData,
        customHeaders: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'value'
        }
      });

      expect(config.customHeaders).toEqual({
        'Content-Type': 'application/json',
        'X-Custom-Header': 'value'
      });
    });

    test('should handle complex nested body variable mappings', () => {
      const config = new Configuration({
        ...validConfigData,
        bodyVariableMapping: {
          'nested.field.path': 'assignment.data.value',
          'another.field': 'user.profile.name'
        }
      });

      expect(config.bodyVariableMapping['nested.field.path']).toBe('assignment.data.value');
    });
  });
});
