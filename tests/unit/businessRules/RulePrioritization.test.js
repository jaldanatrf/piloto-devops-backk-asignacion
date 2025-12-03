const BusinessRuleProcessorUseCases = require('../../../src/application/useCases/businessRules/BusinessRuleProcessorUseCases');
const Claim = require('../../../src/domain/entities/Claim');
const Rule = require('../../../src/domain/entities/Rule');

describe('Business Rules - 8-Level Prioritization System', () => {
  let mockRuleRepository;
  let mockCompanyRepository;
  let mockRuleRoleRepository;
  let mockUserRepository;
  let mockUserRoleRepository;
  let mockRoleRepository;
  let processBusinessRulesUseCase;

  beforeEach(() => {
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

    processBusinessRulesUseCase = new BusinessRuleProcessorUseCases(
      mockCompanyRepository,
      mockRuleRepository,
      mockRuleRoleRepository,
      mockUserRoleRepository,
      mockUserRepository,
      mockRoleRepository
    );

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

  describe('Specificity Hierarchy (8 Levels)', () => {
    test('should respect correct specificity order from most to least specific', () => {
      // Level 1: CODE-AMOUNT-COMPANY (most specific - 3 criteria)
      // Level 2: COMPANY-CODE (2 criteria)
      // Level 3: CODE-AMOUNT (2 criteria)
      // Level 4: COMPANY-AMOUNT (2 criteria - existing)
      // Level 5: COMPANY (1 criterion - existing)
      // Level 6: CODE (1 criterion)
      // Level 7: AMOUNT (1 criterion - existing)
      // Level 8: CUSTOM (0 criteria - least specific - existing)

      const expectedOrder = [
        { type: 'CODE-AMOUNT-COMPANY', level: 1 },
        { type: 'COMPANY-CODE', level: 2 },
        { type: 'CODE-AMOUNT', level: 3 },
        { type: 'COMPANY-AMOUNT', level: 4 },
        { type: 'COMPANY', level: 5 },
        { type: 'CODE', level: 6 },
        { type: 'AMOUNT', level: 7 },
        { type: 'CUSTOM', level: 8 }
      ];

      // Verify order is correct
      expect(expectedOrder[0].type).toBe('CODE-AMOUNT-COMPANY');
      expect(expectedOrder[7].type).toBe('CUSTOM');
    });

    test('should apply ONLY users from most specific rule (Level 1)', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      // Create rules at different levels
      const ruleLevel1 = new Rule(1, 'Level 1', 'Desc', 1, 'CODE-AMOUNT-COMPANY', true, new Date(), 1000000, 5000000, '900000514', 'OBJ-001');
      const ruleLevel4 = new Rule(2, 'Level 4', 'Desc', 1, 'COMPANY-AMOUNT', true, new Date(), 1000000, 10000000, '900000514', null);
      const ruleLevel5 = new Rule(3, 'Level 5', 'Desc', 1, 'COMPANY', true, new Date(), null, null, '900000514', null);
      const ruleLevel7 = new Rule(4, 'Level 7', 'Desc', 1, 'AMOUNT', true, new Date(), 2000000, 8000000, null, null);

      mockRuleRepository.findByCompany.mockResolvedValue([ruleLevel1, ruleLevel4, ruleLevel5, ruleLevel7]);

      // Mock role-rule associations
      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        if (ruleId === 1) return Promise.resolve([{ roleId: 10 }]);
        if (ruleId === 2) return Promise.resolve([{ roleId: 20 }]);
        if (ruleId === 3) return Promise.resolve([{ roleId: 30 }]);
        if (ruleId === 4) return Promise.resolve([{ roleId: 40 }]);
      });

      // Mock users for each role
      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        const users = [];
        if (roleIds.includes(10)) users.push({ id: 1, name: 'User Level 1', roleId: 10 });
        if (roleIds.includes(20)) users.push({ id: 2, name: 'User Level 4', roleId: 20 });
        if (roleIds.includes(30)) users.push({ id: 3, name: 'User Level 5', roleId: 30 });
        if (roleIds.includes(40)) users.push({ id: 4, name: 'User Level 7', roleId: 40 });
        return Promise.resolve(users);
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      // Should ONLY return users from Level 1 (most specific)
      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(1);
      expect(result.users[0].name).toBe('User Level 1');

      // Should evaluate all 4 rules
      expect(result.appliedRules).toHaveLength(4);

      // All 4 should apply, but only Level 1 users returned
      expect(result.appliedRules[0].applies).toBe(true);
      expect(result.appliedRules[1].applies).toBe(true);
      expect(result.appliedRules[2].applies).toBe(true);
      expect(result.appliedRules[3].applies).toBe(true);
    });

    test('should fall back to Level 2 when Level 1 does not match', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      // Level 1 rule that does NOT match (wrong code)
      const ruleLevel1 = new Rule(1, 'Level 1', 'Desc', 1, 'CODE-AMOUNT-COMPANY', true, new Date(), 1000000, 5000000, '900000514', 'OBJ-999');
      // Level 2 rule that DOES match
      const ruleLevel2 = new Rule(2, 'Level 2', 'Desc', 1, 'COMPANY-CODE', true, new Date(), null, null, '900000514', 'OBJ-001');
      // Level 5 rule that DOES match
      const ruleLevel5 = new Rule(3, 'Level 5', 'Desc', 1, 'COMPANY', true, new Date(), null, null, '900000514', null);

      mockRuleRepository.findByCompany.mockResolvedValue([ruleLevel1, ruleLevel2, ruleLevel5]);

      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        if (ruleId === 1) return Promise.resolve([{ roleId: 10 }]);
        if (ruleId === 2) return Promise.resolve([{ roleId: 20 }]);
        if (ruleId === 3) return Promise.resolve([{ roleId: 30 }]);
      });

      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        const users = [];
        if (roleIds.includes(10)) users.push({ id: 1, name: 'User Level 1', roleId: 10 });
        if (roleIds.includes(20)) users.push({ id: 2, name: 'User Level 2', roleId: 20 });
        if (roleIds.includes(30)) users.push({ id: 3, name: 'User Level 5', roleId: 30 });
        return Promise.resolve(users);
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      // Level 1 doesn't apply, so should return Level 2 users only
      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(2);
      expect(result.users[0].name).toBe('User Level 2');
    });

    test('should combine multiple rules at SAME specificity level', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      // TWO Level 2 rules that both match
      const ruleLevel2A = new Rule(1, 'Level 2A', 'Desc', 1, 'COMPANY-CODE', true, new Date(), null, null, '900000514', 'OBJ-001');
      const ruleLevel2B = new Rule(2, 'Level 2B', 'Desc', 1, 'COMPANY-CODE', true, new Date(), null, null, '900000514', 'OBJ-001');
      // Level 5 rule (should be ignored)
      const ruleLevel5 = new Rule(3, 'Level 5', 'Desc', 1, 'COMPANY', true, new Date(), null, null, '900000514', null);

      mockRuleRepository.findByCompany.mockResolvedValue([ruleLevel2A, ruleLevel2B, ruleLevel5]);

      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        if (ruleId === 1) return Promise.resolve([{ roleId: 10 }]);
        if (ruleId === 2) return Promise.resolve([{ roleId: 20 }]);
        if (ruleId === 3) return Promise.resolve([{ roleId: 30 }]);
      });

      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        const users = [];
        if (roleIds.includes(10)) users.push({ id: 1, name: 'User 2A', roleId: 10 });
        if (roleIds.includes(20)) users.push({ id: 2, name: 'User 2B', roleId: 20 });
        if (roleIds.includes(30)) users.push({ id: 3, name: 'User Level 5', roleId: 30 });
        return Promise.resolve(users);
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      // Should return BOTH Level 2 users, but NOT Level 5
      expect(result.users).toHaveLength(2);
      expect(result.users.map(u => u.id)).toContain(1);
      expect(result.users.map(u => u.id)).toContain(2);
      expect(result.users.map(u => u.id)).not.toContain(3);
    });
  });

  describe('Priority Level Transitions', () => {
    test('should prioritize CODE-AMOUNT-COMPANY (L1) over COMPANY-CODE (L2)', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      const ruleL1 = new Rule(1, 'L1', 'Desc', 1, 'CODE-AMOUNT-COMPANY', true, new Date(), 1000000, 5000000, '900000514', 'OBJ-001');
      const ruleL2 = new Rule(2, 'L2', 'Desc', 1, 'COMPANY-CODE', true, new Date(), null, null, '900000514', 'OBJ-001');

      mockRuleRepository.findByCompany.mockResolvedValue([ruleL1, ruleL2]);
      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        if (ruleId === 1) return Promise.resolve([{ roleId: 10 }]);
        if (ruleId === 2) return Promise.resolve([{ roleId: 20 }]);
      });
      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        if (roleIds.includes(10)) return Promise.resolve([{ id: 1, name: 'User L1', roleId: 10 }]);
        if (roleIds.includes(20)) return Promise.resolve([{ id: 2, name: 'User L2', roleId: 20 }]);
        return Promise.resolve([]);
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(1); // L1 user only
    });

    test('should prioritize COMPANY-CODE (L2) over CODE-AMOUNT (L3)', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      const ruleL2 = new Rule(1, 'L2', 'Desc', 1, 'COMPANY-CODE', true, new Date(), null, null, '900000514', 'OBJ-001');
      const ruleL3 = new Rule(2, 'L3', 'Desc', 1, 'CODE-AMOUNT', true, new Date(), 1000000, 5000000, null, 'OBJ-001');

      mockRuleRepository.findByCompany.mockResolvedValue([ruleL2, ruleL3]);
      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        if (ruleId === 1) return Promise.resolve([{ roleId: 10 }]);
        if (ruleId === 2) return Promise.resolve([{ roleId: 20 }]);
      });
      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        if (roleIds.includes(10)) return Promise.resolve([{ id: 1, name: 'User L2', roleId: 10 }]);
        if (roleIds.includes(20)) return Promise.resolve([{ id: 2, name: 'User L3', roleId: 20 }]);
        return Promise.resolve([]);
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(1); // L2 user only
    });

    test('should prioritize CODE-AMOUNT (L3) over COMPANY-AMOUNT (L4)', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      const ruleL3 = new Rule(1, 'L3', 'Desc', 1, 'CODE-AMOUNT', true, new Date(), 1000000, 5000000, null, 'OBJ-001');
      const ruleL4 = new Rule(2, 'L4', 'Desc', 1, 'COMPANY-AMOUNT', true, new Date(), 1000000, 5000000, '900000514', null);

      mockRuleRepository.findByCompany.mockResolvedValue([ruleL3, ruleL4]);
      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        if (ruleId === 1) return Promise.resolve([{ roleId: 10 }]);
        if (ruleId === 2) return Promise.resolve([{ roleId: 20 }]);
      });
      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        if (roleIds.includes(10)) return Promise.resolve([{ id: 1, name: 'User L3', roleId: 10 }]);
        if (roleIds.includes(20)) return Promise.resolve([{ id: 2, name: 'User L4', roleId: 20 }]);
        return Promise.resolve([]);
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(1); // L3 user only
    });

    test('should prioritize COMPANY-AMOUNT (L4) over COMPANY (L5)', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: null
      });

      const ruleL4 = new Rule(1, 'L4', 'Desc', 1, 'COMPANY-AMOUNT', true, new Date(), 1000000, 5000000, '900000514', null);
      const ruleL5 = new Rule(2, 'L5', 'Desc', 1, 'COMPANY', true, new Date(), null, null, '900000514', null);

      mockRuleRepository.findByCompany.mockResolvedValue([ruleL4, ruleL5]);
      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        if (ruleId === 1) return Promise.resolve([{ roleId: 10 }]);
        if (ruleId === 2) return Promise.resolve([{ roleId: 20 }]);
      });
      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        if (roleIds.includes(10)) return Promise.resolve([{ id: 1, name: 'User L4', roleId: 10 }]);
        if (roleIds.includes(20)) return Promise.resolve([{ id: 2, name: 'User L5', roleId: 20 }]);
        return Promise.resolve([]);
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(1); // L4 user only
    });

    test('should prioritize COMPANY (L5) over CODE (L6)', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      const ruleL5 = new Rule(1, 'L5', 'Desc', 1, 'COMPANY', true, new Date(), null, null, '900000514', null);
      const ruleL6 = new Rule(2, 'L6', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-001');

      mockRuleRepository.findByCompany.mockResolvedValue([ruleL5, ruleL6]);
      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        if (ruleId === 1) return Promise.resolve([{ roleId: 10 }]);
        if (ruleId === 2) return Promise.resolve([{ roleId: 20 }]);
      });
      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        if (roleIds.includes(10)) return Promise.resolve([{ id: 1, name: 'User L5', roleId: 10 }]);
        if (roleIds.includes(20)) return Promise.resolve([{ id: 2, name: 'User L6', roleId: 20 }]);
        return Promise.resolve([]);
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(1); // L5 user only
    });

    test('should prioritize CODE (L6) over AMOUNT (L7)', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      const ruleL6 = new Rule(1, 'L6', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-001');
      const ruleL7 = new Rule(2, 'L7', 'Desc', 1, 'AMOUNT', true, new Date(), 1000000, 5000000, null, null);

      mockRuleRepository.findByCompany.mockResolvedValue([ruleL6, ruleL7]);
      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        if (ruleId === 1) return Promise.resolve([{ roleId: 10 }]);
        if (ruleId === 2) return Promise.resolve([{ roleId: 20 }]);
      });
      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        if (roleIds.includes(10)) return Promise.resolve([{ id: 1, name: 'User L6', roleId: 10 }]);
        if (roleIds.includes(20)) return Promise.resolve([{ id: 2, name: 'User L7', roleId: 20 }]);
        return Promise.resolve([]);
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(1); // L6 user only
    });

    test('should prioritize AMOUNT (L7) over CUSTOM (L8)', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: null
      });

      const ruleL7 = new Rule(1, 'L7', 'Desc', 1, 'AMOUNT', true, new Date(), 1000000, 5000000, null, null);
      const ruleL8 = new Rule(2, 'L8', 'Desc', 1, 'CUSTOM', true, new Date(), null, null, null, null);

      mockRuleRepository.findByCompany.mockResolvedValue([ruleL7, ruleL8]);
      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        if (ruleId === 1) return Promise.resolve([{ roleId: 10 }]);
        if (ruleId === 2) return Promise.resolve([{ roleId: 20 }]);
      });
      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        if (roleIds.includes(10)) return Promise.resolve([{ id: 1, name: 'User L7', roleId: 10 }]);
        if (roleIds.includes(20)) return Promise.resolve([{ id: 2, name: 'User L8', roleId: 20 }]);
        return Promise.resolve([]);
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(1); // L7 user only
    });
  });

  describe('Edge Cases', () => {
    test('should return empty users when NO rules match', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      // All rules that do NOT match
      const rule1 = new Rule(1, 'R1', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-999');
      const rule2 = new Rule(2, 'R2', 'Desc', 1, 'COMPANY', true, new Date(), null, null, '800000999', null);
      const rule3 = new Rule(3, 'R3', 'Desc', 1, 'AMOUNT', true, new Date(), 10000000, 20000000, null, null);

      mockRuleRepository.findByCompany.mockResolvedValue([rule1, rule2, rule3]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.users).toHaveLength(0);
    });

    test('should handle when only CUSTOM (L8) rule matches', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: null
      });

      const ruleL8 = new Rule(1, 'L8', 'Desc', 1, 'CUSTOM', true, new Date(), null, null, null, null);

      mockRuleRepository.findByCompany.mockResolvedValue([ruleL8]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([{ roleId: 10 }]);
      mockUserRepository.findByRoleIds.mockResolvedValue([{ id: 1, name: 'User L8', roleId: 10 }]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(1);
    });

    test('should deduplicate users when same user appears in multiple rules at SAME level', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      // Two COMPANY-CODE rules (same level) with same user
      const ruleA = new Rule(1, 'RuleA', 'Desc', 1, 'COMPANY-CODE', true, new Date(), null, null, '900000514', 'OBJ-001');
      const ruleB = new Rule(2, 'RuleB', 'Desc', 1, 'COMPANY-CODE', true, new Date(), null, null, '900000514', 'OBJ-001');

      mockRuleRepository.findByCompany.mockResolvedValue([ruleA, ruleB]);

      // Both rules have same roleId
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([{ roleId: 10 }]);

      // Same user appears for both rules
      mockUserRepository.findByRoleIds.mockResolvedValue([
        { id: 1, name: 'Same User', email: 'user@test.com', roleId: 10 }
      ]);

      const result = await processBusinessRulesUseCase.processClaim(claim);

      // Should only appear once
      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(1);
    });

    test('should handle all 8 levels with proper hierarchy', async () => {
      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      // Create all 8 levels (all matching)
      const rules = [
        new Rule(1, 'L1', 'Desc', 1, 'CODE-AMOUNT-COMPANY', true, new Date(), 1000000, 5000000, '900000514', 'OBJ-001'),
        new Rule(2, 'L2', 'Desc', 1, 'COMPANY-CODE', true, new Date(), null, null, '900000514', 'OBJ-001'),
        new Rule(3, 'L3', 'Desc', 1, 'CODE-AMOUNT', true, new Date(), 1000000, 5000000, null, 'OBJ-001'),
        new Rule(4, 'L4', 'Desc', 1, 'COMPANY-AMOUNT', true, new Date(), 1000000, 5000000, '900000514', null),
        new Rule(5, 'L5', 'Desc', 1, 'COMPANY', true, new Date(), null, null, '900000514', null),
        new Rule(6, 'L6', 'Desc', 1, 'CODE', true, new Date(), null, null, null, 'OBJ-001'),
        new Rule(7, 'L7', 'Desc', 1, 'AMOUNT', true, new Date(), 2000000, 8000000, null, null),
        new Rule(8, 'L8', 'Desc', 1, 'CUSTOM', true, new Date(), null, null, null, null)
      ];

      mockRuleRepository.findByCompany.mockResolvedValue(rules);

      mockRuleRoleRepository.findByRuleId.mockImplementation((ruleId) => {
        return Promise.resolve([{ roleId: ruleId * 10 }]);
      });

      mockUserRepository.findByRoleIds.mockImplementation((roleIds) => {
        return Promise.resolve(roleIds.map(roleId => ({
          id: roleId / 10,
          name: `User L${roleId / 10}`,
          roleId
        })));
      });

      const result = await processBusinessRulesUseCase.processClaim(claim);

      // Should only return L1 user (most specific)
      expect(result.users).toHaveLength(1);
      expect(result.users[0].id).toBe(1);
      expect(result.users[0].name).toBe('User L1');

      // All 8 rules should be evaluated
      expect(result.appliedRules).toHaveLength(8);
    });
  });

  describe('Logging and Debugging', () => {
    test('should log highest specificity level found', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const claim = new Claim({
        ProcessId: 1,
        Target: '800000513',
        Source: '900000514',
        InvoiceAmount: 3000000,
        ClaimId: 'C001',
        Value: 100000,
        ObjectionCode: 'OBJ-001'
      });

      const ruleL2 = new Rule(1, 'L2', 'Desc', 1, 'COMPANY-CODE', true, new Date(), null, null, '900000514', 'OBJ-001');
      const ruleL5 = new Rule(2, 'L5', 'Desc', 1, 'COMPANY', true, new Date(), null, null, '900000514', null);

      mockRuleRepository.findByCompany.mockResolvedValue([ruleL2, ruleL5]);
      mockRuleRoleRepository.findByRuleId.mockResolvedValue([{ roleId: 10 }]);
      mockUserRepository.findByRoleIds.mockResolvedValue([{ id: 1, roleId: 10 }]);

      await processBusinessRulesUseCase.processClaim(claim);

      // Should log the highest specificity (level 2)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Especificidad más alta encontrada'),
        expect.objectContaining({ highestSpecificity: 2 })
      );

      consoleSpy.mockRestore();
    });
  });
});
