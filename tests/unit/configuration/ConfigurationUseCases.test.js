const ConfigurationUseCases = require('../../../src/application/useCases/configuration/ConfigurationUseCases');
const Configuration = require('../../../src/domain/entities/Configuration');
const { NotFoundError, ValidationError } = require('../../../src/shared/errors');

describe('ConfigurationUseCases', () => {
  let configurationUseCases;
  let mockConfigurationRepository;
  let mockCompanyRepository;

  const validConfigData = {
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

  const mockCompany = {
    id: 1,
    name: 'Test Company',
    documentNumber: '123456789'
  };

  beforeEach(() => {
    mockConfigurationRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCompanyId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };

    mockCompanyRepository = {
      findById: jest.fn()
    };

    configurationUseCases = new ConfigurationUseCases(
      mockConfigurationRepository,
      mockCompanyRepository
    );
  });

  describe('createConfiguration', () => {
    test('should create configuration successfully', async () => {
      mockCompanyRepository.findById.mockResolvedValue(mockCompany);
      mockConfigurationRepository.findByCompanyId.mockResolvedValue(null);
      mockConfigurationRepository.save.mockResolvedValue(
        new Configuration({ ...validConfigData, id: 1 })
      );

      const result = await configurationUseCases.createConfiguration(validConfigData);

      expect(mockCompanyRepository.findById).toHaveBeenCalledWith(1);
      expect(mockConfigurationRepository.findByCompanyId).toHaveBeenCalledWith(1);
      expect(mockConfigurationRepository.save).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Configuration);
    });

    test('should throw error if company does not exist', async () => {
      mockCompanyRepository.findById.mockResolvedValue(null);

      await expect(
        configurationUseCases.createConfiguration(validConfigData)
      ).rejects.toThrow(NotFoundError);
      await expect(
        configurationUseCases.createConfiguration(validConfigData)
      ).rejects.toThrow('Company with ID 1 not found');
    });

    test('should throw error if configuration already exists for company', async () => {
      mockCompanyRepository.findById.mockResolvedValue(mockCompany);
      mockConfigurationRepository.findByCompanyId.mockResolvedValue(
        new Configuration({ ...validConfigData, id: 1 })
      );

      await expect(
        configurationUseCases.createConfiguration(validConfigData)
      ).rejects.toThrow(ValidationError);
      await expect(
        configurationUseCases.createConfiguration(validConfigData)
      ).rejects.toThrow('Configuration for company ID 1 already exists');
    });

    test('should encrypt password before saving', async () => {
      mockCompanyRepository.findById.mockResolvedValue(mockCompany);
      mockConfigurationRepository.findByCompanyId.mockResolvedValue(null);
      mockConfigurationRepository.save.mockImplementation((config) => {
        return Promise.resolve(config);
      });

      await configurationUseCases.createConfiguration(validConfigData);

      const savedConfig = mockConfigurationRepository.save.mock.calls[0][0];
      expect(savedConfig.authPassword).not.toBe('password123');
      expect(savedConfig.authPassword.length).toBeGreaterThan(20); // bcrypt hash
    });
  });

  describe('getConfigurationById', () => {
    test('should get configuration by id successfully', async () => {
      const mockConfig = new Configuration({ ...validConfigData, id: 1 });
      mockConfigurationRepository.findById.mockResolvedValue(mockConfig);

      const result = await configurationUseCases.getConfigurationById(1);

      expect(mockConfigurationRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toBeInstanceOf(Configuration);
      expect(result.id).toBe(1);
    });

    test('should throw error if configuration not found', async () => {
      mockConfigurationRepository.findById.mockResolvedValue(null);

      await expect(
        configurationUseCases.getConfigurationById(999)
      ).rejects.toThrow(NotFoundError);
      await expect(
        configurationUseCases.getConfigurationById(999)
      ).rejects.toThrow('Configuration with ID 999 not found');
    });
  });

  describe('getConfigurationByCompanyId', () => {
    test('should get configuration by company id successfully', async () => {
      const mockConfig = new Configuration({ ...validConfigData, id: 1 });
      mockConfigurationRepository.findByCompanyId.mockResolvedValue(mockConfig);

      const result = await configurationUseCases.getConfigurationByCompanyId(1);

      expect(mockConfigurationRepository.findByCompanyId).toHaveBeenCalledWith(1);
      expect(result).toBeInstanceOf(Configuration);
      expect(result.companyId).toBe(1);
    });

    test('should throw error if configuration not found for company', async () => {
      mockConfigurationRepository.findByCompanyId.mockResolvedValue(null);

      await expect(
        configurationUseCases.getConfigurationByCompanyId(999)
      ).rejects.toThrow(NotFoundError);
      await expect(
        configurationUseCases.getConfigurationByCompanyId(999)
      ).rejects.toThrow('Configuration for company ID 999 not found');
    });
  });

  describe('getAllConfigurations', () => {
    test('should get all configurations without filters', async () => {
      const mockConfigs = [
        new Configuration({ ...validConfigData, id: 1 }),
        new Configuration({ ...validConfigData, id: 2, companyId: 2 })
      ];
      mockConfigurationRepository.findAll.mockResolvedValue(mockConfigs);

      const result = await configurationUseCases.getAllConfigurations({});

      expect(mockConfigurationRepository.findAll).toHaveBeenCalledWith({});
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Configuration);
    });

    test('should get configurations with filters', async () => {
      const filters = { isActive: true, companyId: 1 };
      const mockConfigs = [
        new Configuration({ ...validConfigData, id: 1 })
      ];
      mockConfigurationRepository.findAll.mockResolvedValue(mockConfigs);

      const result = await configurationUseCases.getAllConfigurations(filters);

      expect(mockConfigurationRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result).toHaveLength(1);
    });
  });

  describe('updateConfiguration', () => {
    test('should update configuration successfully', async () => {
      const existingConfig = new Configuration({ ...validConfigData, id: 1 });
      const updateData = { description: 'Updated description' };

      mockConfigurationRepository.findById.mockResolvedValue(existingConfig);
      mockConfigurationRepository.update.mockResolvedValue(
        new Configuration({ ...validConfigData, ...updateData, id: 1 })
      );

      const result = await configurationUseCases.updateConfiguration(1, updateData);

      expect(mockConfigurationRepository.findById).toHaveBeenCalledWith(1);
      expect(mockConfigurationRepository.update).toHaveBeenCalled();
      expect(result.description).toBe('Updated description');
    });

    test('should throw error if configuration not found', async () => {
      mockConfigurationRepository.findById.mockResolvedValue(null);

      await expect(
        configurationUseCases.updateConfiguration(999, {})
      ).rejects.toThrow(NotFoundError);
    });

    test('should encrypt password when updating', async () => {
      const existingConfig = new Configuration({ ...validConfigData, id: 1 });
      const updateData = { authPassword: 'newpassword' };

      mockConfigurationRepository.findById.mockResolvedValue(existingConfig);
      mockConfigurationRepository.update.mockImplementation((id, config) => {
        return Promise.resolve(new Configuration({ ...validConfigData, ...config, id }));
      });

      await configurationUseCases.updateConfiguration(1, updateData);

      const updateCall = mockConfigurationRepository.update.mock.calls[0][1];
      expect(updateCall.authPassword).not.toBe('newpassword');
      expect(updateCall.authPassword.length).toBeGreaterThan(20);
    });
  });

  describe('deleteConfiguration', () => {
    test('should delete configuration successfully', async () => {
      const mockConfig = new Configuration({ ...validConfigData, id: 1 });
      mockConfigurationRepository.findById.mockResolvedValue(mockConfig);
      mockConfigurationRepository.delete.mockResolvedValue(true);

      await configurationUseCases.deleteConfiguration(1);

      expect(mockConfigurationRepository.findById).toHaveBeenCalledWith(1);
      expect(mockConfigurationRepository.delete).toHaveBeenCalledWith(1);
    });

    test('should throw error if configuration not found', async () => {
      mockConfigurationRepository.findById.mockResolvedValue(null);

      await expect(
        configurationUseCases.deleteConfiguration(999)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('activateConfiguration', () => {
    test('should activate configuration successfully', async () => {
      const mockConfig = new Configuration({ ...validConfigData, id: 1, isActive: false });
      mockConfigurationRepository.findById.mockResolvedValue(mockConfig);
      mockConfigurationRepository.update.mockResolvedValue(
        new Configuration({ ...validConfigData, id: 1, isActive: true })
      );

      const result = await configurationUseCases.activateConfiguration(1);

      expect(result.isActive).toBe(true);
      expect(mockConfigurationRepository.update).toHaveBeenCalled();
    });

    test('should throw error if configuration not found', async () => {
      mockConfigurationRepository.findById.mockResolvedValue(null);

      await expect(
        configurationUseCases.activateConfiguration(999)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('deactivateConfiguration', () => {
    test('should deactivate configuration successfully', async () => {
      const mockConfig = new Configuration({ ...validConfigData, id: 1, isActive: true });
      mockConfigurationRepository.findById.mockResolvedValue(mockConfig);
      mockConfigurationRepository.update.mockResolvedValue(
        new Configuration({ ...validConfigData, id: 1, isActive: false })
      );

      const result = await configurationUseCases.deactivateConfiguration(1);

      expect(result.isActive).toBe(false);
      expect(mockConfigurationRepository.update).toHaveBeenCalled();
    });
  });

  describe('getAvailableVariablesDocumentation', () => {
    test('should return available variables documentation', () => {
      const documentation = configurationUseCases.getAvailableVariablesDocumentation();

      expect(documentation).toHaveProperty('from_assignment');
      expect(documentation).toHaveProperty('from_user');
      expect(documentation).toHaveProperty('from_company');
      expect(documentation).toHaveProperty('examples');
      expect(documentation.from_assignment).toHaveProperty('assignment.id');
      expect(documentation.from_user).toHaveProperty('user.dud');
    });
  });
});
