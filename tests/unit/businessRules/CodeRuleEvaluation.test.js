const BusinessRuleProcessorUseCases = require('../../../src/application/useCases/businessRules/BusinessRuleProcessorUseCases');
const Claim = require('../../../src/domain/entities/Claim');
const Rule = require('../../../src/domain/entities/Rule');

describe('Business Rules - CODE Rule Evaluation', () => {
  let mockRuleRepository;
  let mockCompanyRepository;
  let mockRuleRoleRepository;
  let mockUserRepository;
  let mockUserRoleRepository;
  let mockRoleRepository;
  let processBusinessRulesUseCase;

  beforeEach(() => {
    // Mock repositories
    mockRuleRepository = {
      findByCompany: jest.fn()
    };

    mockCompanyRepository = {
      findById: jest.fn(),
      findByNit: jest.fn(),
      findByDocumentNumber: jest.fn()
    };

    mockRuleRoleRepository = {
      findByRuleId: jest.fn()
    };

    mockUserRepository = {
      findByRoleIds: jest.fn()
    };

    mockUserRoleRepository = {
      findByUserId: jest.fn(),
      getUsersByRole: jest.fn().mockImplementation((roleId) => {
        // Retornar usuarios basados en roleId para tests
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

    // Create use case with correct constructor signature
    processBusinessRulesUseCase = new BusinessRuleProcessorUseCases(
      mockCompanyRepository,
      mockRuleRepository,
      mockRuleRoleRepository,
      mockUserRoleRepository,
      mockUserRepository,
      mockRoleRepository
    );

    // Default company mock
    mockCompanyRepository.findByNit.mockResolvedValue({
      id: 1,
      name: 'Test Company',
      nit: '800000513',
      isActive: true
    });

    mockCompanyRepository.findByDocumentNumber.mockResolvedValue({
      id: 1,
      name: 'Test Company',
      nit: '800000513',
      documentNumber: '800000513',
      isActive: true
    });
  });

  describe('Claim.matchesObjectionCode() Method', () => {
    test('should match when objectionCode equals code exactly', () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      expect(claim.matchesObjectionCode('OBJ-001')).toBe(true);
    });

    test('should NOT match when codes differ in case', () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      expect(claim.matchesObjectionCode('obj-001')).toBe(false);
      expect(claim.matchesObjectionCode('OBJ-001')).toBe(true);
    });

    test('should return false when claim has no objectionCode', () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: null
      });

      expect(claim.matchesObjectionCode('OBJ-001')).toBe(false);
    });

    test('should return false when code parameter is null', () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      expect(claim.matchesObjectionCode(null)).toBe(false);
      expect(claim.matchesObjectionCode('')).toBe(false);
    });

    test('should be case-sensitive exact match', () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      expect(claim.matchesObjectionCode('OBJ-001')).toBe(true);
      expect(claim.matchesObjectionCode('obj-001')).toBe(false);
      expect(claim.matchesObjectionCode('Obj-001')).toBe(false);
      expect(claim.matchesObjectionCode('OBJ-002')).toBe(false);
      expect(claim.matchesObjectionCode(' OBJ-001 ')).toBe(false); // No trimming
    });
  });

  describe('CODE Rule Evaluation', () => {
    test('should match when objectionCode equals rule code', async () => {
      const rule = new Rule(
        1,
        'CODE Rule',
        'Description',
        1,
        'CODE',
        true,
        new Date(),
        null,
        null,
        null,
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'CODE Rule', ruleType: 'CODE' }
      ]);
      mockUserRepository.findByRoleIds.mockResolvedValue([
        { id: 1, name: 'User 1', email: 'user1@test.com', roleId: 10 }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].type).toBe('CODE');
      expect(result.appliedRules[0].code).toBe('OBJ-001');
      expect(result.appliedRules[0].applies).toBe(true);
      expect(result.appliedRules[0].reason).toContain("Código de objeción 'OBJ-001' coincide");
      expect(result.users).toHaveLength(1);
    });

    test('should NOT match when codes differ', async () => {
      const rule = new Rule(
        1,
        'CODE Rule',
        'Description',
        1,
        'CODE',
        true,
        new Date(),
        null,
        null,
        null,
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-002'
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'CODE Rule', ruleType: 'CODE' }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].applies).toBe(false);
      expect(result.appliedRules[0].reason).toContain("no coincide");
      expect(result.users).toHaveLength(0);
    });

    test('should be case-sensitive', async () => {
      const rule = new Rule(
        1,
        'CODE Rule',
        'Description',
        1,
        'CODE',
        true,
        new Date(),
        null,
        null,
        null,
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'obj-001' // Different case
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'CODE Rule', ruleType: 'CODE' }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].applies).toBe(false);
      expect(result.users).toHaveLength(0);
    });

    test('should NOT match when claim has no objectionCode', async () => {
      const rule = new Rule(
        1,
        'CODE Rule',
        'Description',
        1,
        'CODE',
        true,
        new Date(),
        null,
        null,
        null,
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: null
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'CODE Rule', ruleType: 'CODE' }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].applies).toBe(false);
      expect(result.users).toHaveLength(0);
    });
  });

  describe('CODE-AMOUNT Rule Evaluation', () => {
    test('should match when BOTH code AND amount match', async () => {
      const rule = new Rule(
        1,
        'CODE-AMOUNT Rule',
        'Description',
        1,
        'CODE-AMOUNT',
        true,
        new Date(),
        1000000,
        5000000,
        null,
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000, // In range
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001' // Matches
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'CODE-AMOUNT Rule', ruleType: 'CODE-AMOUNT' }
      ]);
      mockUserRepository.findByRoleIds.mockResolvedValue([
        { id: 1, name: 'User 1', email: 'user1@test.com', roleId: 10 }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].applies).toBe(true);
      expect(result.appliedRules[0].reason).toContain("coincide");
      expect(result.appliedRules[0].reason).toContain("en rango");
      expect(result.users).toHaveLength(1);
    });

    test('should NOT match when code matches but amount does NOT', async () => {
      const rule = new Rule(
        1,
        'CODE-AMOUNT Rule',
        'Description',
        1,
        'CODE-AMOUNT',
        true,
        new Date(),
        1000000,
        5000000,
        null,
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 8000000, // Out of range
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001' // Matches
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'CODE-AMOUNT Rule', ruleType: 'CODE-AMOUNT' }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].applies).toBe(false);
      expect(result.appliedRules[0].reason).toContain("fuera del rango");
      expect(result.users).toHaveLength(0);
    });

    test('should NOT match when amount matches but code does NOT', async () => {
      const rule = new Rule(
        1,
        'CODE-AMOUNT Rule',
        'Description',
        1,
        'CODE-AMOUNT',
        true,
        new Date(),
        1000000,
        5000000,
        null,
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000, // In range
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-002' // Does NOT match
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'CODE-AMOUNT Rule', ruleType: 'CODE-AMOUNT' }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].applies).toBe(false);
      expect(result.appliedRules[0].reason).toContain("código de objeción");
      expect(result.appliedRules[0].reason).toContain("no coincide");
      expect(result.users).toHaveLength(0);
    });

    test('should match at range boundaries (inclusive)', async () => {
      const rule = new Rule(
        1,
        'CODE-AMOUNT Rule',
        'Description',
        1,
        'CODE-AMOUNT',
        true,
        new Date(),
        1000000,
        5000000,
        null,
        'OBJ-001'
      );

      // Test minimum boundary
      const claimMin = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 1000000, // Exactly minimum
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'CODE-AMOUNT Rule', ruleType: 'CODE-AMOUNT' }
      ]);
      mockUserRepository.findByRoleIds.mockResolvedValue([
        { id: 1, name: 'User 1', email: 'user1@test.com', roleId: 10 }
      ]);

      const resultMin = await processBusinessRulesUseCase.processClaim(claimMin);
      expect(resultMin.appliedRules[0].applies).toBe(true);

      // Test maximum boundary
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
    });
  });

  describe('COMPANY-CODE Rule Evaluation', () => {
    test('should match when BOTH NIT AND code match', async () => {
      const rule = new Rule(
        1,
        'COMPANY-CODE Rule',
        'Description',
        1,
        'COMPANY-CODE',
        true,
        new Date(),
        null,
        null,
        '900000514',
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514', // Matches NIT
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001' // Matches code
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'COMPANY-CODE Rule', ruleType: 'COMPANY-CODE' }
      ]);
      mockUserRepository.findByRoleIds.mockResolvedValue([
        { id: 1, name: 'User 1', email: 'user1@test.com', roleId: 10 }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].applies).toBe(true);
      expect(result.appliedRules[0].reason).toContain("coincide");
      expect(result.appliedRules[0].reason).toContain("900000514");
      expect(result.appliedRules[0].reason).toContain("OBJ-001");
      expect(result.users).toHaveLength(1);
    });

    test('should NOT match when code matches but NIT does NOT', async () => {
      const rule = new Rule(
        1,
        'COMPANY-CODE Rule',
        'Description',
        1,
        'COMPANY-CODE',
        true,
        new Date(),
        null,
        null,
        '900000514',
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '800000999', // Different NIT
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001' // Matches code
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'COMPANY-CODE Rule', ruleType: 'COMPANY-CODE' }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].applies).toBe(false);
      expect(result.appliedRules[0].reason).toContain("no coincide");
      expect(result.users).toHaveLength(0);
    });

    test('should NOT match when NIT matches but code does NOT', async () => {
      const rule = new Rule(
        1,
        'COMPANY-CODE Rule',
        'Description',
        1,
        'COMPANY-CODE',
        true,
        new Date(),
        null,
        null,
        '900000514',
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514', // Matches NIT
        InvoiceAmount: 1000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-002' // Different code
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'COMPANY-CODE Rule', ruleType: 'COMPANY-CODE' }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].applies).toBe(false);
      expect(result.appliedRules[0].reason).toContain("no coincide");
      expect(result.users).toHaveLength(0);
    });

    test('should normalize NIT for comparison', async () => {
      const rule = new Rule(
        1,
        'COMPANY-CODE Rule',
        'Description',
        1,
        'COMPANY-CODE',
        true,
        new Date(),
        null,
        null,
        '900000514-5', // With dash
        'OBJ-001'
      );

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
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'COMPANY-CODE Rule', ruleType: 'COMPANY-CODE' }
      ]);
      mockUserRepository.findByRoleIds.mockResolvedValue([
        { id: 1, name: 'User 1', email: 'user1@test.com', roleId: 10 }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].applies).toBe(true);
      expect(result.users).toHaveLength(1);
    });
  });

  describe('CODE-AMOUNT-COMPANY Rule Evaluation', () => {
    test('should match when ALL THREE criteria match (code + amount + NIT)', async () => {
      const rule = new Rule(
        1,
        'CODE-AMOUNT-COMPANY Rule',
        'Description',
        1,
        'CODE-AMOUNT-COMPANY',
        true,
        new Date(),
        1000000,
        5000000,
        '900000514',
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514', // Matches NIT
        InvoiceAmount: 3000000, // In range
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001' // Matches code
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'CODE-AMOUNT-COMPANY Rule', ruleType: 'CODE-AMOUNT-COMPANY' }
      ]);
      mockUserRepository.findByRoleIds.mockResolvedValue([
        { id: 1, name: 'User 1', email: 'user1@test.com', roleId: 10 }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules).toHaveLength(1);
      expect(result.appliedRules[0].applies).toBe(true);
      expect(result.appliedRules[0].reason).toContain("coincide");
      expect(result.appliedRules[0].reason).toContain("OBJ-001");
      expect(result.appliedRules[0].reason).toContain("en rango");
      expect(result.appliedRules[0].reason).toContain("900000514");
      expect(result.users).toHaveLength(1);
    });

    test('should NOT match when code and NIT match but amount does NOT', async () => {
      const rule = new Rule(
        1,
        'CODE-AMOUNT-COMPANY Rule',
        'Description',
        1,
        'CODE-AMOUNT-COMPANY',
        true,
        new Date(),
        1000000,
        5000000,
        '900000514',
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514', // Matches
        InvoiceAmount: 8000000, // Out of range
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001' // Matches
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'CODE-AMOUNT-COMPANY Rule', ruleType: 'CODE-AMOUNT-COMPANY' }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].applies).toBe(false);
      expect(result.appliedRules[0].reason).toContain("fuera de rango");
      expect(result.users).toHaveLength(0);
    });

    test('should NOT match when code and amount match but NIT does NOT', async () => {
      const rule = new Rule(
        1,
        'CODE-AMOUNT-COMPANY Rule',
        'Description',
        1,
        'CODE-AMOUNT-COMPANY',
        true,
        new Date(),
        1000000,
        5000000,
        '900000514',
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '800000999', // Different NIT
        InvoiceAmount: 3000000, // In range
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001' // Matches
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'CODE-AMOUNT-COMPANY Rule', ruleType: 'CODE-AMOUNT-COMPANY' }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].applies).toBe(false);
      expect(result.appliedRules[0].reason).toContain("no coincide");
      expect(result.users).toHaveLength(0);
    });

    test('should NOT match when NIT and amount match but code does NOT', async () => {
      const rule = new Rule(
        1,
        'CODE-AMOUNT-COMPANY Rule',
        'Description',
        1,
        'CODE-AMOUNT-COMPANY',
        true,
        new Date(),
        1000000,
        5000000,
        '900000514',
        'OBJ-001'
      );

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514', // Matches
        InvoiceAmount: 3000000, // In range
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-002' // Different code
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'CODE-AMOUNT-COMPANY Rule', ruleType: 'CODE-AMOUNT-COMPANY' }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].applies).toBe(false);
      expect(result.appliedRules[0].reason).toContain("código de objeción");
      expect(result.users).toHaveLength(0);
    });

    test('should require ALL criteria to match simultaneously', async () => {
      const rule = new Rule(
        1,
        'CODE-AMOUNT-COMPANY Rule',
        'Description',
        1,
        'CODE-AMOUNT-COMPANY',
        true,
        new Date(),
        1000000,
        5000000,
        '900000514',
        'OBJ-001'
      );

      // Wrong code, wrong NIT, wrong amount - nothing matches
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '800000999', // Wrong
        InvoiceAmount: 8000000, // Wrong
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-002' // Wrong
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([
        { roleId: 10, ruleName: 'CODE-AMOUNT-COMPANY Rule', ruleType: 'CODE-AMOUNT-COMPANY' }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].applies).toBe(false);
      expect(result.users).toHaveLength(0);
    });
  });

  describe('Reason Messages', () => {
    test('should include descriptive reason for CODE match', async () => {
      const rule = new Rule(1, 'Test', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-001');
      const claim = new Claim({
        ProcessId: 1, Target: '800000513', Source: '900000514',
        InvoiceAmount: 1000000, ClaimId: 'C001', Value: 100000, ObjectionCode: 'OBJ-001'
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([{ roleId: 10 }]);
      mockUserRepository.findByRoleIds.mockResolvedValue([{ id: 1, roleId: 10 }]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].reason).toMatch(/Código de objeción 'OBJ-001' coincide/);
    });

    test('should include descriptive reason for CODE mismatch', async () => {
      const rule = new Rule(1, 'Test', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-001');
      const claim = new Claim({
        ProcessId: 1, Target: '800000513', Source: '900000514',
        InvoiceAmount: 1000000, ClaimId: 'C001', Value: 100000, ObjectionCode: 'OBJ-002'
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([{ roleId: 10 }]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].reason).toMatch(/no coincide con código configurado/);
    });

    test('should include all criteria in CODE-AMOUNT-COMPANY reason', async () => {
      const rule = new Rule(
        1, 'Test', 'Desc', 1, 'CODE-AMOUNT-COMPANY', true, new Date(),
        1000000, 5000000, '900000514', 'OBJ-001'
      );
      const claim = new Claim({
        ProcessId: 1, Target: '800000513', Source: '900000514',
        InvoiceAmount: 3000000, ClaimId: 'C001', Value: 100000, ObjectionCode: 'OBJ-001'
      });

      mockRuleRepository.findByCompany.mockResolvedValue([rule]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([{ roleId: 10 }]);
      mockUserRepository.findByRoleIds.mockResolvedValue([{ id: 1, roleId: 10 }]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.appliedRules[0].reason).toContain('OBJ-001');
      expect(result.appliedRules[0].reason).toContain('rango');
      expect(result.appliedRules[0].reason).toContain('900000514');
    });
  });
});
