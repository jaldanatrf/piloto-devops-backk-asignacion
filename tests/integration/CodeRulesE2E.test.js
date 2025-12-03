const BusinessRuleProcessorUseCases = require('../../src/application/useCases/businessRules/BusinessRuleProcessorUseCases');
const { CreateRuleUseCase, UpdateRuleUseCase } = require('../../src/application/useCases/rules/RuleUseCase');
const Claim = require('../../src/domain/entities/Claim');
const Rule = require('../../src/domain/entities/Rule');
const { ConflictError, NotFoundError } = require('../../src/shared/errors');

describe('CODE Rules - E2E Integration Tests', () => {
  let mockRuleRepository;
  let mockCompanyRepository;
  let mockRuleRoleRepository;
  let mockUserRepository;
  let mockUserRoleRepository;
  let mockRoleRepository;
  let processBusinessRulesUseCase;
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
      findById: jest.fn(),
      findByNit: jest.fn(),
      findByDocumentNumber: jest.fn()
    };

    mockRuleRoleRepository = {
      bulkCreate: jest.fn(),
      findByRuleId: jest.fn(),
      deleteByRuleId: jest.fn()
    };

    mockUserRepository = {
      findByRoleIds: jest.fn()
    };

    mockUserRoleRepository = {
      findByUserId: jest.fn(),
      getUsersByRole: jest.fn().mockImplementation((roleId) => {
        return Promise.resolve([
          { id: roleId, name: `User ${roleId}`, dud: `DUD${roleId}`, isActive: true }
        ]);
      })
    };

    mockRoleRepository = {
      findById: jest.fn().mockImplementation((roleId) => {
        return Promise.resolve({
          id: roleId,
          name: `Role ${roleId}`,
          description: `Description for role ${roleId}`
        });
      })
    };

    // Create use cases
    processBusinessRulesUseCase = new BusinessRuleProcessorUseCases(
      mockCompanyRepository,
      mockRuleRepository,
      mockRuleRoleRepository,
      mockUserRoleRepository,
      mockUserRepository,
      mockRoleRepository
    );

    createRuleUseCase = new CreateRuleUseCase(
      mockRuleRepository,
      mockCompanyRepository,
      mockRuleRoleRepository,
      mockRoleRepository
    );

    updateRuleUseCase = new UpdateRuleUseCase(mockRuleRepository);

    // Default company mocks
    mockCompanyRepository.findById.mockResolvedValue({
      id: 1,
      name: 'Test Company',
      nit: '800000513',
      documentNumber: '800000513',
      isActive: true
    });

    mockCompanyRepository.findByNit.mockResolvedValue({
      id: 1,
      name: 'Test Company',
      nit: '800000513',
      documentNumber: '800000513',
      isActive: true
    });

    mockCompanyRepository.findByDocumentNumber.mockResolvedValue({
      id: 1,
      name: 'Test Company',
      nit: '800000513',
      documentNumber: '800000513',
      isActive: true
    });

    mockRuleRepository.findByName.mockResolvedValue(null);
  });

  describe('Complete Flow: Create Rule → Process Claim → Assign Users', () => {
    test('should create CODE rule, process matching claim, and assign users', async () => {
      // Step 1: Create CODE rule
      const ruleData = {
        name: 'Objecion OBJ-001',
        description: 'Regla para código OBJ-001',
        type: 'CODE',
        code: 'OBJ-001'
      };

      const savedRule = new Rule(1, ruleData.name, ruleData.description, 1, ruleData.type, true, new Date(), null, null, null, ruleData.code);
      mockRuleRepository.save.mockResolvedValue(savedRule);
      mockRoleRepository.findById.mockResolvedValue({ id: 10, name: 'Analista' });
      mockRuleRepository.findByCompany.mockResolvedValue([]);

      const createdRule = await createRuleUseCase.execute(ruleData, 1, [10]);

      expect(createdRule.type).toBe('CODE');
      expect(createdRule.code).toBe('OBJ-001');

      // Step 2: Process claim with matching code
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      mockRuleRepository.findByCompany.mockResolvedValue([savedRule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'Objecion OBJ-001', ruleType: 'CODE' }
      ]);
      mockUserRoleRepository.getUsersByRole.mockResolvedValue([
        { id: 1, name: 'Juan Perez', dud: 'DUD001', isActive: true }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      // Step 3: Verify assignment
      expect(result.users).toHaveLength(1);
      expect(result.users[0].name).toBe('Juan Perez');
      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].applies).toBe(true);
      expect(result.appliedRules[0].code).toBe('OBJ-001');
    });

    test('should create CODE-AMOUNT rule, validate overlap, and process claim', async () => {
      // Step 1: Create first CODE-AMOUNT rule
      const rule1Data = {
        name: 'OBJ-001 Rango 1M-5M',
        description: 'Primer rango',
        type: 'CODE-AMOUNT',
        code: 'OBJ-001',
        minimumAmount: 1000000,
        maximumAmount: 5000000
      };

      const savedRule1 = new Rule(1, rule1Data.name, rule1Data.description, 1, rule1Data.type, true, new Date(), 1000000, 5000000, null, 'OBJ-001');
      mockRuleRepository.save.mockResolvedValue(savedRule1);
      mockRoleRepository.findById.mockResolvedValue({ id: 10, name: 'Analista Jr' });
      mockRuleRepository.findByCompany.mockResolvedValue([]);

      const createdRule1 = await createRuleUseCase.execute(rule1Data, 1, [10]);
      expect(createdRule1).toBeDefined();

      // Step 2: Try to create overlapping rule (should fail)
      const rule2Data = {
        name: 'OBJ-001 Rango Solapado',
        description: 'Intentar solapamiento',
        type: 'CODE-AMOUNT',
        code: 'OBJ-001',
        minimumAmount: 3000000, // Overlaps with first rule
        maximumAmount: 8000000
      };

      mockRuleRepository.findByCompany.mockResolvedValue([savedRule1]);

      await expect(
        createRuleUseCase.execute(rule2Data, 1, [20])
      ).rejects.toThrow(ConflictError);

      // Step 3: Create adjacent rule (should succeed)
      const rule3Data = {
        name: 'OBJ-001 Rango 5M-10M',
        description: 'Rango adyacente',
        type: 'CODE-AMOUNT',
        code: 'OBJ-001',
        minimumAmount: 5000000, // Adjacent, not overlapping
        maximumAmount: 10000000
      };

      const savedRule3 = new Rule(2, rule3Data.name, rule3Data.description, 1, rule3Data.type, true, new Date(), 5000000, 10000000, null, 'OBJ-001');
      mockRuleRepository.save.mockResolvedValue(savedRule3);
      mockRoleRepository.findById.mockResolvedValue({ id: 20, name: 'Analista Sr' });

      const createdRule3 = await createRuleUseCase.execute(rule3Data, 1, [20]);
      expect(createdRule3).toBeDefined();

      // Step 4: Process claim in first range
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000, // In first range
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      mockRuleRepository.findByCompany.mockResolvedValue([savedRule1, savedRule3]);
      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        if (ruleId === 1) return Promise.resolve([{ roleId: 10 }]);
        if (ruleId === 2) return Promise.resolve([{ roleId: 20 }]);
      });
      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        if (roleIds.includes(10)) return Promise.resolve([{ id: 1, name: 'Junior Analyst', roleId: 10 }]);
        if (roleIds.includes(20)) return Promise.resolve([{ id: 2, name: 'Senior Analyst', roleId: 20 }]);
        return Promise.resolve([]);
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      // Only first rule should apply
      expect(result.users).toHaveLength(1);
      expect(result.users[0].name).toBe('Junior Analyst');
    });

    test('should create COMPANY-CODE rule and prioritize over COMPANY rule', async () => {
      // Step 1: Create COMPANY rule (Level 5)
      const companyRule = new Rule(1, 'All from Company', 'Desc', 1, 'COMPANY', true, new Date(), null, null, '900000514', null);

      // Step 2: Create COMPANY-CODE rule (Level 2 - more specific)
      const companyCodeRule = new Rule(2, 'Company + Code', 'Desc', 1, 'COMPANY-CODE', true, new Date(), null, null, '900000514', 'OBJ-001');

      // Step 3: Process claim
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      mockRuleRepository.findByCompany.mockResolvedValue([companyRule, companyCodeRule]);
      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        if (ruleId === 1) return Promise.resolve([{ roleId: 10 }]);
        if (ruleId === 2) return Promise.resolve([{ roleId: 20 }]);
      });
      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        if (roleIds.includes(10)) return Promise.resolve([{ id: 1, name: 'General User', roleId: 10 }]);
        if (roleIds.includes(20)) return Promise.resolve([{ id: 2, name: 'Specific User', roleId: 20 }]);
        return Promise.resolve([]);
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      // Should prioritize Level 2 (COMPANY-CODE) over Level 5 (COMPANY)
      expect(result.users).toHaveLength(1);
      expect(result.users[0].name).toBe('Specific User');
      expect(result.appliedRules.filter(r => r.applies)).toHaveLength(2);
    });

    test('should create CODE-AMOUNT-COMPANY rule as highest priority', async () => {
      // Create all possible matching rules
      const rules = [
        new Rule(1, 'Most Specific', 'L1', 1, 'CODE-AMOUNT-COMPANY', true, new Date(), 1000000, 5000000, '900000514', 'OBJ-001'),
        new Rule(2, 'COMPANY-CODE', 'L2', 1, 'COMPANY-CODE', true, new Date(), null, null, '900000514', 'OBJ-001'),
        new Rule(3, 'CODE-AMOUNT', 'L3', 1, 'CODE-AMOUNT', true, new Date(), 1000000, 5000000, null, 'OBJ-001'),
        new Rule(4, 'COMPANY-AMOUNT', 'L4', 1, 'COMPANY-AMOUNT', true, new Date(), 1000000, 5000000, '900000514', null),
        new Rule(5, 'COMPANY', 'L5', 1, 'COMPANY', true, new Date(), null, null, '900000514', null),
        new Rule(6, 'CODE', 'L6', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-001'),
        new Rule(7, 'AMOUNT', 'L7', 1, 'AMOUNT', true, new Date(), 2000000, 8000000, null, null)
      ];

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      mockRuleRepository.findByCompany.mockResolvedValue(rules);
      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        return Promise.resolve([{ roleId: ruleId * 10 }]);
      });
      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        return Promise.resolve(roleIds.map(roleId => ({
          id: roleId / 10,
          name: `User Level ${roleId / 10}`,
          roleId
        })));
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      // Should only return users from most specific rule (CODE-AMOUNT-COMPANY)
      expect(result.users).toHaveLength(1);
      expect(result.users[0].name).toBe('User Level 1');

      // All rules should be evaluated
      expect(result.appliedRules).toHaveLength(7);

      // All should apply
      expect(result.appliedRules.filter(r => r.applies)).toHaveLength(7);
    });
  });

  describe('Update Rule Flow', () => {
    test('should update CODE rule without validation error on same rule', async () => {
      const existingRule = new Rule(1, 'Original', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-001');

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
      const updated = await updateRuleUseCase.execute(1, 1, updateData);

      expect(updated.description).toBe('Updated description');
    });

    test('should prevent updating to duplicate CODE', async () => {
      const rule1 = new Rule(1, 'Rule 1', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-001');
      const rule2 = new Rule(2, 'Rule 2', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-002');

      mockRuleRepository.findById.mockResolvedValue(rule2);
      mockRuleRepository.findByCompany.mockResolvedValue([rule1, rule2]);

      const updateData = {
        code: 'OBJ-001' // Try to change to existing code
      };

      await expect(
        updateRuleUseCase.execute(2, 1, updateData)
      ).rejects.toThrow(ConflictError);
    });

    test('should allow updating CODE-AMOUNT range when not overlapping', async () => {
      const rule1 = new Rule(1, 'Rule 1', 'Desc', 1, 'CODE-AMOUNT', true, new Date(), 1000000, 5000000, null, 'OBJ-001');
      const rule2 = new Rule(2, 'Rule 2', 'Desc', 1, 'CODE-AMOUNT', true, new Date(), 6000000, 10000000, null, 'OBJ-001');

      mockRuleRepository.findById.mockResolvedValue(rule2);
      mockRuleRepository.findByCompany.mockResolvedValue([rule1, rule2]);
      mockRuleRepository.update.mockResolvedValue({
        ...rule2,
        maximumAmount: 12000000
      });

      const updateData = {
        maximumAmount: 12000000 // Extend upper limit (no overlap with rule1)
      };

      const updated = await updateRuleUseCase.execute(2, 1, updateData);

      expect(updated.maximumAmount).toBe(12000000);
    });
  });

  describe('Complex Scenarios', () => {
    test('should handle case-sensitive code matching', async () => {
      const ruleUpperCase = new Rule(1, 'Upper', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-001');
      const ruleLowerCase = new Rule(2, 'Lower', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'obj-001');

      // Both rules should be allowed (case-sensitive)
      mockRuleRepository.findByCompany.mockResolvedValue([ruleUpperCase]);
      mockRuleRepository.save.mockResolvedValue(ruleLowerCase);
      mockRoleRepository.findById.mockResolvedValue({ id: 10 });

      const rule2Data = {
        name: 'Lower',
        description: 'Desc',
        type: 'CODE',
        code: 'obj-001' // Different case
      };

      // Should NOT throw error
      await expect(
        createRuleUseCase.execute(rule2Data, 1, [10])
      ).resolves.toBeDefined();

      // Process claims with different cases
      const claimUpper = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      const claimLower = new Claim({
        ProcessId: 2,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C002',
        Value: 100000,
        ObjectionCode: 'obj-001'
      });

      mockRuleRepository.findByCompany.mockResolvedValue([ruleUpperCase, ruleLowerCase]);
      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        return Promise.resolve([{ roleId: ruleId * 10 }]);
      });
      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        return Promise.resolve(roleIds.map(roleId => ({
          id: roleId / 10,
          name: `User ${roleId / 10}`,
          roleId
        })));
      });

      // Upper case claim should match only upper case rule
      const resultUpper = await processBusinessRulesUseCase.processClaim(claimUpper);
      expect(resultUpper.appliedRules.filter(r => r.applies)).toHaveLength(1);
      expect(resultUpper.appliedRules[0].code).toBe('OBJ-001');

      // Lower case claim should match only lower case rule
      const resultLower = await processBusinessRulesUseCase.processClaim(claimLower);
      expect(resultLower.appliedRules.filter(r => r.applies)).toHaveLength(1);
      expect(resultLower.appliedRules[0].code).toBe('obj-001');
    });

    test('should handle null objectionCode in claim', async () => {
      const rule = new Rule(1, 'CODE Rule', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-001');

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: null // No objection code
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([{ roleId: 10 }]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      // Rule should not apply
      expect(result.appliedRules[0].applies).toBe(false);
      expect(result.users).toHaveLength(0);
    });

    test('should combine users from multiple rules at same specificity level', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      // Three CODE rules (same level) with different users
      const rule1 = new Rule(1, 'CODE 1', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-001');
      const rule2 = new Rule(2, 'CODE 2', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-001');
      const rule3 = new Rule(3, 'CODE 3', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-001');

      mockRuleRepository.findByCompany.mockResolvedValue([rule1, rule2, rule3]);
      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        return Promise.resolve([{ roleId: ruleId * 10 }]);
      });
      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        return Promise.resolve(roleIds.map(roleId => ({
          id: roleId / 10,
          name: `User ${roleId / 10}`,
          email: `user${roleId / 10}@test.com`,
          roleId
        })));
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      // Should return all 3 users (same specificity level)
      expect(result.users).toHaveLength(3);
      expect(result.users.map(u => u.id)).toContain(1);
      expect(result.users.map(u => u.id)).toContain(2);
      expect(result.users.map(u => u.id)).toContain(3);
    });

    test('should handle NIT normalization in COMPANY-CODE rules', async () => {
      const rule = new Rule(1, 'COMPANY-CODE', 'Desc', 1, 'COMPANY-CODE', true, new Date(), null, null, '900000514-5', 'OBJ-001');

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '9000005145', // Same NIT without dash
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([{ roleId: 10 }]);
      mockUserRepository.findByRoleIds.mockResolvedValue([
        { id: 1, name: 'User 1', roleId: 10 }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      // Should match despite different NIT format
      expect(result.appliedRules[0].applies).toBe(true);
      expect(result.users).toHaveLength(1);
    });

    test('should handle boundary amounts in CODE-AMOUNT rules', async () => {
      const rule = new Rule(1, 'CODE-AMOUNT', 'Desc', 1, 'CODE-AMOUNT', true, new Date(), 1000000, 5000000, null, 'OBJ-001');

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([{ roleId: 10 }]);
      mockUserRepository.findByRoleIds.mockResolvedValue([
        { id: 1, name: 'User 1', roleId: 10 }
      ]);

      // Test minimum boundary (inclusive)
      const claimMin = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000, // Exactly minimum
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      const resultMin = await processBusinessRulesUseCase.processClaim(claimMin);
      expect(resultMin.appliedRules[0].applies).toBe(true);

      // Test maximum boundary (inclusive)
      const claimMax = new Claim({
        ProcessId: 2,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 5000000, // Exactly maximum
        ClaimId: 'C002',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      const resultMax = await processBusinessRulesUseCase.processClaim(claimMax);
      expect(resultMax.appliedRules[0].applies).toBe(true);

      // Test below minimum
      const claimBelow = new Claim({
        ProcessId: 3,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 999999, // Below minimum
        ClaimId: 'C003',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      const resultBelow = await processBusinessRulesUseCase.processClaim(claimBelow);
      expect(resultBelow.appliedRules[0].applies).toBe(false);

      // Test above maximum
      const claimAbove = new Claim({
        ProcessId: 4,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 5000001, // Above maximum
        ClaimId: 'C004',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      const resultAbove = await processBusinessRulesUseCase.processClaim(claimAbove);
      expect(resultAbove.appliedRules[0].applies).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing company gracefully', async () => {
      mockCompanyRepository.findByNit.mockResolvedValue(null);

      const claim = new Claim({
        ProcessId: 1,
        Target: '999999999', // Non-existent company
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      await expect(
        processBusinessRulesUseCase.processClaim(claim)
      ).rejects.toThrow(NotFoundError);
    });

    test('should handle no matching rules', async () => {
      mockRuleRepository.findByCompany.mockResolvedValue([]);

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules).toHaveLength(0);
      expect(result.users).toHaveLength(0);
    });
  });
});
