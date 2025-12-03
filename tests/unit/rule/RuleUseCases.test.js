const {
  CreateRuleUseCase,
  GetRuleByIdUseCase,
  GetRulesByCompanyUseCase,
  UpdateRuleUseCase,
  DeleteRuleUseCase,
  GetRulesByTypeUseCase,
  GetAvailableTypesUseCase,
  GetRuleStatsByTypeUseCase
} = require('../../../src/application/useCases/CreateRuleUseCase');

const { ValidationError, NotFoundError, ConflictError } = require('../../../src/shared/errors');

// Mock repositories
const mockRuleRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  findByCompany: jest.fn(),
  findByType: jest.fn(),
  getAvailableTypes: jest.fn(),
  getStatsByType: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

const mockCompanyRepository = {
  findById: jest.fn()
};

describe('Rule Use Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateRuleUseCase', () => {
    let createRuleUseCase;

    beforeEach(() => {
      createRuleUseCase = new CreateRuleUseCase(mockRuleRepository, mockCompanyRepository);
    });

    test('should create rule successfully', async () => {
      const ruleData = {
        name: 'Access Control',
        description: 'Controls user access to resources',
        type: 'SECURITY',
        isActive: true
      };
      const companyId = 'company-123';
      const company = { id: companyId, name: 'Test Company', isActive: true };
      const savedRule = { id: 1, ...ruleData, companyId };

      mockCompanyRepository.findById.mockResolvedValue(company);
      mockRuleRepository.findByName.mockResolvedValue(null);
      mockRuleRepository.save.mockResolvedValue(savedRule);

      const result = await createRuleUseCase.execute(ruleData, companyId);

      expect(mockCompanyRepository.findById).toHaveBeenCalledWith(companyId);
      expect(mockRuleRepository.findByName).toHaveBeenCalledWith('Access Control', companyId);
      expect(mockRuleRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedRule);
    });

    test('should throw ValidationError for missing rule name', async () => {
      const ruleData = { description: 'Test description', type: 'SECURITY' };
      const companyId = 'company-123';

      await expect(createRuleUseCase.execute(ruleData, companyId))
        .rejects.toThrow(ValidationError);
      await expect(createRuleUseCase.execute(ruleData, companyId))
        .rejects.toThrow('Rule name is required');
    });

    test('should throw ValidationError for missing rule description', async () => {
      const ruleData = { name: 'Access Control', type: 'SECURITY' };
      const companyId = 'company-123';

      await expect(createRuleUseCase.execute(ruleData, companyId))
        .rejects.toThrow(ValidationError);
      await expect(createRuleUseCase.execute(ruleData, companyId))
        .rejects.toThrow('Rule description is required');
    });

    test('should throw ValidationError for missing rule type', async () => {
      const ruleData = { name: 'Access Control', description: 'Test description' };
      const companyId = 'company-123';

      await expect(createRuleUseCase.execute(ruleData, companyId))
        .rejects.toThrow(ValidationError);
      await expect(createRuleUseCase.execute(ruleData, companyId))
        .rejects.toThrow('Rule type is required');
    });

    test('should throw ValidationError for missing company ID', async () => {
      const ruleData = { name: 'Access Control', description: 'Test description', type: 'SECURITY' };

      await expect(createRuleUseCase.execute(ruleData, null))
        .rejects.toThrow(ValidationError);
      await expect(createRuleUseCase.execute(ruleData, null))
        .rejects.toThrow('Company ID is required');
    });

    test('should throw NotFoundError when company not found', async () => {
      const ruleData = { name: 'Access Control', description: 'Test description', type: 'SECURITY' };
      const companyId = 'company-123';

      mockCompanyRepository.findById.mockResolvedValue(null);

      await expect(createRuleUseCase.execute(ruleData, companyId))
        .rejects.toThrow(NotFoundError);
      await expect(createRuleUseCase.execute(ruleData, companyId))
        .rejects.toThrow(`Company with ID ${companyId} not found`);
    });

    test('should throw ValidationError for inactive company', async () => {
      const ruleData = { name: 'Access Control', description: 'Test description', type: 'SECURITY' };
      const companyId = 'company-123';
      const inactiveCompany = { id: companyId, name: 'Test Company', isActive: false };

      mockCompanyRepository.findById.mockResolvedValue(inactiveCompany);

      await expect(createRuleUseCase.execute(ruleData, companyId))
        .rejects.toThrow(ValidationError);
      await expect(createRuleUseCase.execute(ruleData, companyId))
        .rejects.toThrow('Cannot create rules for inactive company');
    });

    test('should throw ConflictError for duplicate rule name', async () => {
      const ruleData = { name: 'Access Control', description: 'Test description', type: 'SECURITY' };
      const companyId = 'company-123';
      const company = { id: companyId, name: 'Test Company', isActive: true };
      const existingRule = { id: 1, name: 'Access Control', companyId };

      mockCompanyRepository.findById.mockResolvedValue(company);
      mockRuleRepository.findByName.mockResolvedValue(existingRule);

      await expect(createRuleUseCase.execute(ruleData, companyId))
        .rejects.toThrow(ConflictError);
      await expect(createRuleUseCase.execute(ruleData, companyId))
        .rejects.toThrow("Rule with name 'Access Control' already exists in this company");
    });
  });

  describe('GetRuleByIdUseCase', () => {
    let getRuleByIdUseCase;

    beforeEach(() => {
      getRuleByIdUseCase = new GetRuleByIdUseCase(mockRuleRepository);
    });

    test('should get rule by ID successfully', async () => {
      const ruleId = 1;
      const companyId = 'company-123';
      const rule = { id: ruleId, name: 'Access Control', companyId };

      mockRuleRepository.findById.mockResolvedValue(rule);

      const result = await getRuleByIdUseCase.execute(ruleId, companyId);

      expect(mockRuleRepository.findById).toHaveBeenCalledWith(ruleId, companyId);
      expect(result).toEqual(rule);
    });

    test('should throw ValidationError for missing rule ID', async () => {
      const companyId = 'company-123';

      await expect(getRuleByIdUseCase.execute(null, companyId))
        .rejects.toThrow(ValidationError);
      await expect(getRuleByIdUseCase.execute(null, companyId))
        .rejects.toThrow('Rule ID is required');
    });

    test('should throw ValidationError for missing company ID', async () => {
      const ruleId = 1;

      await expect(getRuleByIdUseCase.execute(ruleId, null))
        .rejects.toThrow(ValidationError);
      await expect(getRuleByIdUseCase.execute(ruleId, null))
        .rejects.toThrow('Company ID is required');
    });

    test('should throw NotFoundError when rule not found', async () => {
      const ruleId = 999;
      const companyId = 'company-123';

      mockRuleRepository.findById.mockResolvedValue(null);

      await expect(getRuleByIdUseCase.execute(ruleId, companyId))
        .rejects.toThrow(NotFoundError);
      await expect(getRuleByIdUseCase.execute(ruleId, companyId))
        .rejects.toThrow(`Rule with ID ${ruleId} not found in this company`);
    });
  });

  describe('GetRulesByCompanyUseCase', () => {
    let getRulesByCompanyUseCase;

    beforeEach(() => {
      getRulesByCompanyUseCase = new GetRulesByCompanyUseCase(mockRuleRepository);
    });

    test('should get rules by company successfully', async () => {
      const companyId = 'company-123';
      const rules = [
        { id: 1, name: 'Access Control', companyId },
        { id: 2, name: 'Data Validation', companyId }
      ];

      mockRuleRepository.findByCompany.mockResolvedValue(rules);

      const result = await getRulesByCompanyUseCase.execute(companyId);

      expect(mockRuleRepository.findByCompany).toHaveBeenCalledWith(companyId, {});
      expect(result).toEqual(rules);
    });

    test('should get rules with filters', async () => {
      const companyId = 'company-123';
      const filters = { isActive: true, type: 'security' };
      const rules = [{ id: 1, name: 'Access Control', companyId, isActive: true, type: 'security' }];

      mockRuleRepository.findByCompany.mockResolvedValue(rules);

      const result = await getRulesByCompanyUseCase.execute(companyId, filters);

      expect(mockRuleRepository.findByCompany).toHaveBeenCalledWith(companyId, filters);
      expect(result).toEqual(rules);
    });

    test('should throw ValidationError for missing company ID', async () => {
      await expect(getRulesByCompanyUseCase.execute(null))
        .rejects.toThrow(ValidationError);
      await expect(getRulesByCompanyUseCase.execute(null))
        .rejects.toThrow('Company ID is required');
    });
  });

  describe('UpdateRuleUseCase', () => {
    let updateRuleUseCase;

    beforeEach(() => {
      updateRuleUseCase = new UpdateRuleUseCase(mockRuleRepository);
    });

    test('should update rule successfully', async () => {
      const ruleId = 1;
      const companyId = 'company-123';
      const updateData = { description: 'Updated description' };
      const existingRule = { id: ruleId, name: 'Access Control', companyId };
      const updatedRule = { ...existingRule, ...updateData };

      mockRuleRepository.findById.mockResolvedValue(existingRule);
      mockRuleRepository.update.mockResolvedValue(updatedRule);

      const result = await updateRuleUseCase.execute(ruleId, companyId, updateData);

      expect(mockRuleRepository.findById).toHaveBeenCalledWith(ruleId, companyId);
      expect(mockRuleRepository.update).toHaveBeenCalledWith(ruleId, companyId, updateData);
      expect(result).toEqual(updatedRule);
    });

    test('should update rule name without conflict', async () => {
      const ruleId = 1;
      const companyId = 'company-123';
      const updateData = { name: 'Updated Access Control' };
      const existingRule = { id: ruleId, name: 'Access Control', companyId };
      const updatedRule = { ...existingRule, ...updateData };

      mockRuleRepository.findById.mockResolvedValue(existingRule);
      mockRuleRepository.findByName.mockResolvedValue(null);
      mockRuleRepository.update.mockResolvedValue(updatedRule);

      const result = await updateRuleUseCase.execute(ruleId, companyId, updateData);

      expect(mockRuleRepository.findByName).toHaveBeenCalledWith('Updated Access Control', companyId);
      expect(result).toEqual(updatedRule);
    });

    test('should throw ValidationError for missing rule ID', async () => {
      const companyId = 'company-123';
      const updateData = { description: 'Updated' };

      await expect(updateRuleUseCase.execute(null, companyId, updateData))
        .rejects.toThrow(ValidationError);
      await expect(updateRuleUseCase.execute(null, companyId, updateData))
        .rejects.toThrow('Rule ID is required');
    });

    test('should throw NotFoundError when rule not found', async () => {
      const ruleId = 999;
      const companyId = 'company-123';
      const updateData = { description: 'Updated' };

      mockRuleRepository.findById.mockResolvedValue(null);

      await expect(updateRuleUseCase.execute(ruleId, companyId, updateData))
        .rejects.toThrow(NotFoundError);
      await expect(updateRuleUseCase.execute(ruleId, companyId, updateData))
        .rejects.toThrow(`Rule with ID ${ruleId} not found in this company`);
    });

    test('should throw ConflictError for duplicate rule name', async () => {
      const ruleId = 1;
      const companyId = 'company-123';
      const updateData = { name: 'Data Validation' };
      const existingRule = { id: ruleId, name: 'Access Control', companyId };
      const conflictingRule = { id: 2, name: 'Data Validation', companyId };

      mockRuleRepository.findById.mockResolvedValue(existingRule);
      mockRuleRepository.findByName.mockResolvedValue(conflictingRule);

      await expect(updateRuleUseCase.execute(ruleId, companyId, updateData))
        .rejects.toThrow(ConflictError);
      await expect(updateRuleUseCase.execute(ruleId, companyId, updateData))
        .rejects.toThrow("Rule with name 'Data Validation' already exists in this company");
    });
  });

  describe('DeleteRuleUseCase', () => {
    let deleteRuleUseCase;

    beforeEach(() => {
      deleteRuleUseCase = new DeleteRuleUseCase(mockRuleRepository);
    });

    test('should delete rule successfully', async () => {
      const ruleId = 1;
      const companyId = 'company-123';
      const existingRule = { id: ruleId, name: 'Access Control', companyId };

      mockRuleRepository.findById.mockResolvedValue(existingRule);
      mockRuleRepository.delete.mockResolvedValue(true);

      const result = await deleteRuleUseCase.execute(ruleId, companyId);

      expect(mockRuleRepository.findById).toHaveBeenCalledWith(ruleId, companyId);
      expect(mockRuleRepository.delete).toHaveBeenCalledWith(ruleId, companyId);
      expect(result).toBe(true);
    });

    test('should throw ValidationError for missing rule ID', async () => {
      const companyId = 'company-123';

      await expect(deleteRuleUseCase.execute(null, companyId))
        .rejects.toThrow(ValidationError);
      await expect(deleteRuleUseCase.execute(null, companyId))
        .rejects.toThrow('Rule ID is required');
    });

    test('should throw ValidationError for missing company ID', async () => {
      const ruleId = 1;

      await expect(deleteRuleUseCase.execute(ruleId, null))
        .rejects.toThrow(ValidationError);
      await expect(deleteRuleUseCase.execute(ruleId, null))
        .rejects.toThrow('Company ID is required');
    });

    test('should throw NotFoundError when rule not found', async () => {
      const ruleId = 999;
      const companyId = 'company-123';

      mockRuleRepository.findById.mockResolvedValue(null);

      await expect(deleteRuleUseCase.execute(ruleId, companyId))
        .rejects.toThrow(NotFoundError);
      await expect(deleteRuleUseCase.execute(ruleId, companyId))
        .rejects.toThrow(`Rule with ID ${ruleId} not found in this company`);
    });
  });

  describe('GetRulesByTypeUseCase', () => {
    let getRulesByTypeUseCase;

    beforeEach(() => {
      getRulesByTypeUseCase = new GetRulesByTypeUseCase(mockRuleRepository);
    });

    test('should get rules by type successfully', async () => {
      const type = 'SECURITY';
      const companyId = 'company-123';
      const rules = [
        { id: 1, name: 'Access Control', type: 'SECURITY', companyId },
        { id: 2, name: 'Data Encryption', type: 'SECURITY', companyId }
      ];

      mockRuleRepository.findByType.mockResolvedValue(rules);

      const result = await getRulesByTypeUseCase.execute(type, companyId);

      expect(mockRuleRepository.findByType).toHaveBeenCalledWith(type, companyId);
      expect(result).toEqual(rules);
    });

    test('should throw ValidationError for missing type', async () => {
      const companyId = 'company-123';

      await expect(getRulesByTypeUseCase.execute(null, companyId))
        .rejects.toThrow(ValidationError);
      await expect(getRulesByTypeUseCase.execute(null, companyId))
        .rejects.toThrow('Rule type is required');
    });
  });

  describe('GetAvailableTypesUseCase', () => {
    let getAvailableTypesUseCase;

    beforeEach(() => {
      getAvailableTypesUseCase = new GetAvailableTypesUseCase(mockRuleRepository);
    });

    test('should get available types successfully', async () => {
      const companyId = 'company-123';
      const types = ['BUSINESS', 'SECURITY', 'COMPLIANCE'];

      mockRuleRepository.getAvailableTypes.mockResolvedValue(types);

      const result = await getAvailableTypesUseCase.execute(companyId);

      expect(mockRuleRepository.getAvailableTypes).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(types);
    });

    test('should get available types without company filter', async () => {
      const types = ['BUSINESS', 'SECURITY', 'COMPLIANCE', 'OPERATIONAL'];

      mockRuleRepository.getAvailableTypes.mockResolvedValue(types);

      const result = await getAvailableTypesUseCase.execute();

      expect(mockRuleRepository.getAvailableTypes).toHaveBeenCalledWith(null);
      expect(result).toEqual(types);
    });
  });

  describe('GetRuleStatsByTypeUseCase', () => {
    let getRuleStatsByTypeUseCase;

    beforeEach(() => {
      getRuleStatsByTypeUseCase = new GetRuleStatsByTypeUseCase(mockRuleRepository);
    });

    test('should get stats by type successfully', async () => {
      const companyId = 'company-123';
      const stats = [
        { type: 'SECURITY', total: 5, active: 4, inactive: 1 },
        { type: 'BUSINESS', total: 3, active: 3, inactive: 0 }
      ];

      mockRuleRepository.getStatsByType.mockResolvedValue(stats);

      const result = await getRuleStatsByTypeUseCase.execute(companyId);

      expect(mockRuleRepository.getStatsByType).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(stats);
    });

    test('should get stats by type without company filter', async () => {
      const stats = [
        { type: 'SECURITY', total: 10, active: 8, inactive: 2 },
        { type: 'BUSINESS', total: 6, active: 5, inactive: 1 },
        { type: 'COMPLIANCE', total: 4, active: 4, inactive: 0 }
      ];

      mockRuleRepository.getStatsByType.mockResolvedValue(stats);

      const result = await getRuleStatsByTypeUseCase.execute();

      expect(mockRuleRepository.getStatsByType).toHaveBeenCalledWith(null);
      expect(result).toEqual(stats);
    });
  });
});
