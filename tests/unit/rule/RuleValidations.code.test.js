const { CreateRuleUseCase, UpdateRuleUseCase } = require('../../../src/application/useCases/rules/RuleUseCase');
const { ConflictError } = require('../../../src/shared/errors');

describe('Rule Validations - CODE Types', () => {
  let mockRuleRepository;
  let mockCompanyRepository;
  let mockRoleRepository;
  let mockRuleRoleRepository;
  let createRuleUseCase;
  let updateRuleUseCase;

  beforeEach(() => {
    // Mock repositories
    mockRuleRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findByCompany: jest.fn(),
      update: jest.fn()
    };

    mockCompanyRepository = {
      findById: jest.fn()
    };

    mockRoleRepository = {
      findById: jest.fn()
    };

    mockRuleRoleRepository = {
      bulkCreate: jest.fn()
    };

    // Create use cases
    createRuleUseCase = new CreateRuleUseCase(
      mockRuleRepository,
      mockCompanyRepository,
      mockRuleRoleRepository,
      mockRoleRepository
    );

    updateRuleUseCase = new UpdateRuleUseCase(mockRuleRepository);

    // Default mocks
    mockCompanyRepository.findById.mockResolvedValue({
      id: 1,
      name: 'Test Company',
      isActive: true
    });

    mockRuleRepository.findByName.mockResolvedValue(null);
  });

  describe('CODE Rule Validation', () => {
    test('should prevent duplicate CODE rules with same code', async () => {
      const existingRule = {
        id: 1,
        type: 'CODE',
        code: 'OBJ-001',
        companyId: 1
      };

      mockRuleRepository.findByCompany.mockResolvedValue([existingRule]);

      const newRuleData = {
        name: 'New CODE Rule',
        description: 'Description',
        type: 'CODE',
        code: 'OBJ-001'
      };

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).rejects.toThrow(ConflictError);

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).rejects.toThrow("A CODE rule with code 'OBJ-001' already exists for this company");
    });

    test('should allow CODE rules with different codes', async () => {
      const existingRule = {
        id: 1,
        type: 'CODE',
        code: 'OBJ-001',
        companyId: 1
      };

      mockRuleRepository.findByCompany.mockResolvedValue([existingRule]);
      mockRuleRepository.save.mockResolvedValue({
        id: 2,
        name: 'New CODE Rule',
        type: 'CODE',
        code: 'OBJ-002',
        companyId: 1
      });

      const newRuleData = {
        name: 'New CODE Rule',
        description: 'Description',
        type: 'CODE',
        code: 'OBJ-002'
      };

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).resolves.toBeDefined();
    });

    test('should be case-sensitive for CODE comparison', async () => {
      const existingRule = {
        id: 1,
        type: 'CODE',
        code: 'OBJ-001',
        companyId: 1
      };

      mockRuleRepository.findByCompany.mockResolvedValue([existingRule]);
      mockRuleRepository.save.mockResolvedValue({
        id: 2,
        name: 'New CODE Rule',
        type: 'CODE',
        code: 'obj-001',
        companyId: 1
      });

      const newRuleData = {
        name: 'New CODE Rule',
        description: 'Description',
        type: 'CODE',
        code: 'obj-001' // Different case
      };

      // Should allow because case-sensitive
      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).resolves.toBeDefined();
    });
  });

  describe('CODE-AMOUNT Rule Validation', () => {
    test('should prevent overlapping CODE-AMOUNT rules with same code', async () => {
      const existingRule = {
        id: 1,
        type: 'CODE-AMOUNT',
        code: 'OBJ-001',
        minimumAmount: 1000000,
        maximumAmount: 5000000,
        companyId: 1
      };

      mockRuleRepository.findByCompany.mockResolvedValue([existingRule]);

      const newRuleData = {
        name: 'Overlapping Rule',
        description: 'Description',
        type: 'CODE-AMOUNT',
        code: 'OBJ-001',
        minimumAmount: 3000000, // Overlaps with [1M-5M]
        maximumAmount: 8000000
      };

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).rejects.toThrow(ConflictError);

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).rejects.toThrow(/CODE-AMOUNT rule overlaps/);
    });

    test('should allow adjacent CODE-AMOUNT ranges with same code', async () => {
      const existingRule = {
        id: 1,
        type: 'CODE-AMOUNT',
        code: 'OBJ-001',
        minimumAmount: 1000000,
        maximumAmount: 5000000,
        companyId: 1
      };

      mockRuleRepository.findByCompany.mockResolvedValue([existingRule]);
      mockRuleRepository.save.mockResolvedValue({
        id: 2,
        name: 'Adjacent Rule',
        type: 'CODE-AMOUNT',
        code: 'OBJ-001',
        minimumAmount: 5000000,
        maximumAmount: 10000000,
        companyId: 1
      });

      const newRuleData = {
        name: 'Adjacent Rule',
        description: 'Description',
        type: 'CODE-AMOUNT',
        code: 'OBJ-001',
        minimumAmount: 5000000, // Adjacent, not overlapping
        maximumAmount: 10000000
      };

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).resolves.toBeDefined();
    });

    test('should allow CODE-AMOUNT rules with same range but different code', async () => {
      const existingRule = {
        id: 1,
        type: 'CODE-AMOUNT',
        code: 'OBJ-001',
        minimumAmount: 1000000,
        maximumAmount: 5000000,
        companyId: 1
      };

      mockRuleRepository.findByCompany.mockResolvedValue([existingRule]);
      mockRuleRepository.save.mockResolvedValue({
        id: 2,
        name: 'Different Code Rule',
        type: 'CODE-AMOUNT',
        code: 'OBJ-002',
        minimumAmount: 1000000,
        maximumAmount: 5000000,
        companyId: 1
      });

      const newRuleData = {
        name: 'Different Code Rule',
        description: 'Description',
        type: 'CODE-AMOUNT',
        code: 'OBJ-002', // Different code
        minimumAmount: 1000000,
        maximumAmount: 5000000
      };

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).resolves.toBeDefined();
    });
  });

  describe('COMPANY-CODE Rule Validation', () => {
    test('should prevent duplicate COMPANY-CODE rules with same NIT and code', async () => {
      const existingRule = {
        id: 1,
        type: 'COMPANY-CODE',
        code: 'OBJ-001',
        nitAssociatedCompany: '800000513',
        companyId: 1
      };

      mockRuleRepository.findByCompany.mockResolvedValue([existingRule]);

      const newRuleData = {
        name: 'Duplicate Rule',
        description: 'Description',
        type: 'COMPANY-CODE',
        code: 'OBJ-001',
        nitAssociatedCompany: '800000513'
      };

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).rejects.toThrow(ConflictError);

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).rejects.toThrow("A COMPANY-CODE rule with NIT '800000513' and code 'OBJ-001' already exists");
    });

    test('should allow COMPANY-CODE with same code but different NIT', async () => {
      const existingRule = {
        id: 1,
        type: 'COMPANY-CODE',
        code: 'OBJ-001',
        nitAssociatedCompany: '800000513',
        companyId: 1
      };

      mockRuleRepository.findByCompany.mockResolvedValue([existingRule]);
      mockRuleRepository.save.mockResolvedValue({
        id: 2,
        name: 'Different NIT Rule',
        type: 'COMPANY-CODE',
        code: 'OBJ-001',
        nitAssociatedCompany: '900000514',
        companyId: 1
      });

      const newRuleData = {
        name: 'Different NIT Rule',
        description: 'Description',
        type: 'COMPANY-CODE',
        code: 'OBJ-001',
        nitAssociatedCompany: '900000514' // Different NIT
      };

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).resolves.toBeDefined();
    });

    test('should allow COMPANY-CODE with same NIT but different code', async () => {
      const existingRule = {
        id: 1,
        type: 'COMPANY-CODE',
        code: 'OBJ-001',
        nitAssociatedCompany: '800000513',
        companyId: 1
      };

      mockRuleRepository.findByCompany.mockResolvedValue([existingRule]);
      mockRuleRepository.save.mockResolvedValue({
        id: 2,
        name: 'Different Code Rule',
        type: 'COMPANY-CODE',
        code: 'OBJ-002',
        nitAssociatedCompany: '800000513',
        companyId: 1
      });

      const newRuleData = {
        name: 'Different Code Rule',
        description: 'Description',
        type: 'COMPANY-CODE',
        code: 'OBJ-002', // Different code
        nitAssociatedCompany: '800000513'
      };

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).resolves.toBeDefined();
    });
  });

  describe('CODE-AMOUNT-COMPANY Rule Validation', () => {
    test('should prevent overlapping CODE-AMOUNT-COMPANY with same code and NIT', async () => {
      const existingRule = {
        id: 1,
        type: 'CODE-AMOUNT-COMPANY',
        code: 'OBJ-001',
        minimumAmount: 1000000,
        maximumAmount: 5000000,
        nitAssociatedCompany: '800000513',
        companyId: 1
      };

      mockRuleRepository.findByCompany.mockResolvedValue([existingRule]);

      const newRuleData = {
        name: 'Overlapping Rule',
        description: 'Description',
        type: 'CODE-AMOUNT-COMPANY',
        code: 'OBJ-001',
        minimumAmount: 3000000, // Overlaps
        maximumAmount: 8000000,
        nitAssociatedCompany: '800000513'
      };

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).rejects.toThrow(ConflictError);

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).rejects.toThrow(/CODE-AMOUNT-COMPANY rule overlaps/);
    });

    test('should allow overlapping ranges with different code', async () => {
      const existingRule = {
        id: 1,
        type: 'CODE-AMOUNT-COMPANY',
        code: 'OBJ-001',
        minimumAmount: 1000000,
        maximumAmount: 5000000,
        nitAssociatedCompany: '800000513',
        companyId: 1
      };

      mockRuleRepository.findByCompany.mockResolvedValue([existingRule]);
      mockRuleRepository.save.mockResolvedValue({
        id: 2,
        name: 'Different Code Rule',
        type: 'CODE-AMOUNT-COMPANY',
        code: 'OBJ-002',
        minimumAmount: 3000000,
        maximumAmount: 8000000,
        nitAssociatedCompany: '800000513',
        companyId: 1
      });

      const newRuleData = {
        name: 'Different Code Rule',
        description: 'Description',
        type: 'CODE-AMOUNT-COMPANY',
        code: 'OBJ-002', // Different code
        minimumAmount: 3000000,
        maximumAmount: 8000000,
        nitAssociatedCompany: '800000513'
      };

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).resolves.toBeDefined();
    });

    test('should allow overlapping ranges with different NIT', async () => {
      const existingRule = {
        id: 1,
        type: 'CODE-AMOUNT-COMPANY',
        code: 'OBJ-001',
        minimumAmount: 1000000,
        maximumAmount: 5000000,
        nitAssociatedCompany: '800000513',
        companyId: 1
      };

      mockRuleRepository.findByCompany.mockResolvedValue([existingRule]);
      mockRuleRepository.save.mockResolvedValue({
        id: 2,
        name: 'Different NIT Rule',
        type: 'CODE-AMOUNT-COMPANY',
        code: 'OBJ-001',
        minimumAmount: 3000000,
        maximumAmount: 8000000,
        nitAssociatedCompany: '900000514',
        companyId: 1
      });

      const newRuleData = {
        name: 'Different NIT Rule',
        description: 'Description',
        type: 'CODE-AMOUNT-COMPANY',
        code: 'OBJ-001',
        minimumAmount: 3000000,
        maximumAmount: 8000000,
        nitAssociatedCompany: '900000514' // Different NIT
      };

      await expect(
        createRuleUseCase.execute(newRuleData, 1)
      ).resolves.toBeDefined();
    });
  });

  describe('Update Rule Validations', () => {
    test('should exclude current rule when validating CODE duplicates', async () => {
      const existingRule = {
        id: 1,
        name: 'Existing Rule',
        type: 'CODE',
        code: 'OBJ-001',
        companyId: 1
      };

      mockRuleRepository.findById.mockResolvedValue(existingRule);
      mockRuleRepository.findByCompany.mockResolvedValue([existingRule]);
      mockRuleRepository.update.mockResolvedValue({
        ...existingRule,
        description: 'Updated description'
      });

      const updateData = {
        description: 'Updated description'
      };

      // Should NOT throw error because we're updating the same rule
      await expect(
        updateRuleUseCase.execute(1, 1, updateData)
      ).resolves.toBeDefined();
    });

    test('should validate overlapping when updating CODE-AMOUNT rule', async () => {
      const existingRule1 = {
        id: 1,
        name: 'Rule 1',
        type: 'CODE-AMOUNT',
        code: 'OBJ-001',
        minimumAmount: 1000000,
        maximumAmount: 5000000,
        companyId: 1
      };

      const existingRule2 = {
        id: 2,
        name: 'Rule 2',
        type: 'CODE-AMOUNT',
        code: 'OBJ-001',
        minimumAmount: 6000000,
        maximumAmount: 10000000,
        companyId: 1
      };

      mockRuleRepository.findById.mockResolvedValue(existingRule2);
      mockRuleRepository.findByCompany.mockResolvedValue([existingRule1, existingRule2]);

      const updateData = {
        maximumAmount: 12000000 // Still doesn't overlap with rule 1
      };

      mockRuleRepository.update.mockResolvedValue({
        ...existingRule2,
        ...updateData
      });

      await expect(
        updateRuleUseCase.execute(2, 1, updateData)
      ).resolves.toBeDefined();
    });
  });
});
