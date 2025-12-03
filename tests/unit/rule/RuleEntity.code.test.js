const Rule = require('../../../src/domain/entities/Rule');

describe('Rule Entity - CODE Types', () => {
  describe('Constructor and Basic Validation', () => {
    test('should create CODE rule with valid data', () => {
      const rule = new Rule(
        1,
        'Test CODE Rule',
        'Test description',
        1,
        'CODE',
        true,
        new Date(),
        null,
        null,
        null,
        'OBJ-001'
      );

      expect(rule.id).toBe(1);
      expect(rule.type).toBe('CODE');
      expect(rule.code).toBe('OBJ-001');
    });

    test('should create CODE-AMOUNT rule with valid data', () => {
      const rule = new Rule(
        1,
        'Test CODE-AMOUNT Rule',
        'Test description',
        1,
        'CODE-AMOUNT',
        true,
        new Date(),
        1000000,
        5000000,
        null,
        'OBJ-001'
      );

      expect(rule.type).toBe('CODE-AMOUNT');
      expect(rule.code).toBe('OBJ-001');
      expect(rule.minimumAmount).toBe(1000000);
      expect(rule.maximumAmount).toBe(5000000);
    });

    test('should create COMPANY-CODE rule with valid data', () => {
      const rule = new Rule(
        1,
        'Test COMPANY-CODE Rule',
        'Test description',
        1,
        'COMPANY-CODE',
        true,
        new Date(),
        null,
        null,
        '800000513-2',
        'OBJ-001'
      );

      expect(rule.type).toBe('COMPANY-CODE');
      expect(rule.code).toBe('OBJ-001');
      expect(rule.nitAssociatedCompany).toBe('800000513-2');
    });

    test('should create CODE-AMOUNT-COMPANY rule with valid data', () => {
      const rule = new Rule(
        1,
        'Test CODE-AMOUNT-COMPANY Rule',
        'Test description',
        1,
        'CODE-AMOUNT-COMPANY',
        true,
        new Date(),
        1000000,
        5000000,
        '800000513-2',
        'OBJ-001'
      );

      expect(rule.type).toBe('CODE-AMOUNT-COMPANY');
      expect(rule.code).toBe('OBJ-001');
      expect(rule.minimumAmount).toBe(1000000);
      expect(rule.maximumAmount).toBe(5000000);
      expect(rule.nitAssociatedCompany).toBe('800000513-2');
    });
  });

  describe('TYPE Validation', () => {
    test('should accept all 8 valid rule types', () => {
      const validTypesWithData = [
        { type: 'AMOUNT', minimumAmount: 1000, maximumAmount: 5000, nit: null, code: null },
        { type: 'COMPANY', minimumAmount: null, maximumAmount: null, nit: '800000513', code: null },
        { type: 'COMPANY-AMOUNT', minimumAmount: 1000, maximumAmount: 5000, nit: '800000513', code: null },
        { type: 'CODE', minimumAmount: null, maximumAmount: null, nit: null, code: 'OBJ-001' },
        { type: 'CODE-AMOUNT', minimumAmount: 1000, maximumAmount: 5000, nit: null, code: 'OBJ-001' },
        { type: 'COMPANY-CODE', minimumAmount: null, maximumAmount: null, nit: '800000513', code: 'OBJ-001' },
        { type: 'CODE-AMOUNT-COMPANY', minimumAmount: 1000, maximumAmount: 5000, nit: '800000513', code: 'OBJ-001' },
        { type: 'CUSTOM', minimumAmount: null, maximumAmount: null, nit: null, code: null }
      ];

      validTypesWithData.forEach(({ type, minimumAmount, maximumAmount, nit, code }) => {
        expect(() => {
          new Rule(null, 'Test', 'Description', 1, type, true, new Date(), minimumAmount, maximumAmount, nit, code);
        }).not.toThrow();
      });
    });

    test('should reject invalid rule type', () => {
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'INVALID_TYPE', true, new Date());
      }).toThrow(/Rule type must be one of/);
    });
  });

  describe('CODE Type Validation', () => {
    test('should require code field for CODE type', () => {
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE', true, new Date(), null, null, null, null);
      }).toThrow('Code is required for CODE type rules');
    });

    test('should require code field for CODE type (empty string)', () => {
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE', true, new Date(), null, null, null, '');
      }).toThrow('Code is required for CODE type rules');
    });

    test('should reject code longer than 100 characters for CODE type', () => {
      const longCode = 'A'.repeat(101);
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE', true, new Date(), null, null, null, longCode);
      }).toThrow('Code cannot exceed 100 characters');
    });

    test('should accept code exactly 100 characters for CODE type', () => {
      const maxCode = 'A'.repeat(100);
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE', true, new Date(), null, null, null, maxCode);
      }).not.toThrow();
    });
  });

  describe('CODE-AMOUNT Type Validation', () => {
    test('should require code field for CODE-AMOUNT type', () => {
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE-AMOUNT', true, new Date(), 1000, 5000, null, null);
      }).toThrow('Code is required for CODE-AMOUNT type rules');
    });

    test('should require minimumAmount for CODE-AMOUNT type', () => {
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE-AMOUNT', true, new Date(), null, 5000, null, 'OBJ-001');
      }).toThrow('Minimum amount is required for CODE-AMOUNT type rules');
    });

    test('should require maximumAmount for CODE-AMOUNT type', () => {
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE-AMOUNT', true, new Date(), 1000, null, null, 'OBJ-001');
      }).toThrow('Maximum amount is required for CODE-AMOUNT type rules');
    });

    test('should reject when minimumAmount > maximumAmount', () => {
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE-AMOUNT', true, new Date(), 5000, 1000, null, 'OBJ-001');
      }).toThrow('Minimum amount cannot be greater than maximum amount');
    });

    test('should accept when minimumAmount == maximumAmount', () => {
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE-AMOUNT', true, new Date(), 1000, 1000, null, 'OBJ-001');
      }).not.toThrow();
    });
  });

  describe('COMPANY-CODE Type Validation', () => {
    test('should require nitAssociatedCompany for COMPANY-CODE type', () => {
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'COMPANY-CODE', true, new Date(), null, null, null, 'OBJ-001');
      }).toThrow('NIT associated company is required for COMPANY-CODE type rules');
    });

    test('should require code field for COMPANY-CODE type', () => {
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'COMPANY-CODE', true, new Date(), null, null, '800000513', null);
      }).toThrow('Code is required for COMPANY-CODE type rules');
    });

    test('should validate NIT format for COMPANY-CODE type', () => {
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'COMPANY-CODE', true, new Date(), null, null, 'INVALID', 'OBJ-001');
      }).toThrow('NIT associated company must have a valid format');
    });

    test('should accept valid NIT formats for COMPANY-CODE type', () => {
      const validNITs = ['800000513', '8000005132', '800000513-2', '900123456K'];

      validNITs.forEach(nit => {
        expect(() => {
          new Rule(null, 'Test', 'Description', 1, 'COMPANY-CODE', true, new Date(), null, null, nit, 'OBJ-001');
        }).not.toThrow();
      });
    });
  });

  describe('CODE-AMOUNT-COMPANY Type Validation', () => {
    test('should require all three fields: code, amounts, and NIT', () => {
      // Missing code
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE-AMOUNT-COMPANY', true, new Date(), 1000, 5000, '800000513', null);
      }).toThrow('Code is required for CODE-AMOUNT-COMPANY type rules');

      // Missing minimumAmount
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE-AMOUNT-COMPANY', true, new Date(), null, 5000, '800000513', 'OBJ-001');
      }).toThrow('Minimum amount is required for CODE-AMOUNT-COMPANY type rules');

      // Missing maximumAmount
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE-AMOUNT-COMPANY', true, new Date(), 1000, null, '800000513', 'OBJ-001');
      }).toThrow('Maximum amount is required for CODE-AMOUNT-COMPANY type rules');

      // Missing NIT
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE-AMOUNT-COMPANY', true, new Date(), 1000, 5000, null, 'OBJ-001');
      }).toThrow('NIT associated company is required for CODE-AMOUNT-COMPANY type rules');
    });

    test('should validate NIT format for CODE-AMOUNT-COMPANY type', () => {
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE-AMOUNT-COMPANY', true, new Date(), 1000, 5000, 'INVALID', 'OBJ-001');
      }).toThrow('NIT associated company must have a valid format');
    });

    test('should create valid CODE-AMOUNT-COMPANY rule with all fields', () => {
      expect(() => {
        new Rule(null, 'Test', 'Description', 1, 'CODE-AMOUNT-COMPANY', true, new Date(), 1000000, 5000000, '800000513-2', 'OBJ-001');
      }).not.toThrow();
    });
  });

  describe('getBasicInfo() Method', () => {
    test('should include code field in basic info', () => {
      const rule = new Rule(
        1,
        'Test',
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

      const info = rule.getBasicInfo();

      expect(info.code).toBe('OBJ-001');
      expect(info.type).toBe('CODE');
    });

    test('should include null code for non-CODE rules', () => {
      const rule = new Rule(
        1,
        'Test',
        'Description',
        1,
        'AMOUNT',
        true,
        new Date(),
        1000,
        5000,
        null,
        null
      );

      const info = rule.getBasicInfo();

      expect(info.code).toBeNull();
    });
  });

  describe('clone() Method', () => {
    test('should clone CODE rule with code field', () => {
      const original = new Rule(
        1,
        'Original',
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

      const cloned = original.clone('Cloned', 2);

      expect(cloned.id).toBeNull();
      expect(cloned.name).toBe('Cloned');
      expect(cloned.companyId).toBe(2);
      expect(cloned.code).toBe('OBJ-001');
      expect(cloned.type).toBe('CODE');
    });

    test('should clone CODE-AMOUNT-COMPANY rule with all fields', () => {
      const original = new Rule(
        1,
        'Original',
        'Description',
        1,
        'CODE-AMOUNT-COMPANY',
        true,
        new Date(),
        1000000,
        5000000,
        '800000513',
        'OBJ-001'
      );

      const cloned = original.clone('Cloned');

      expect(cloned.code).toBe('OBJ-001');
      expect(cloned.minimumAmount).toBe(1000000);
      expect(cloned.maximumAmount).toBe(5000000);
      expect(cloned.nitAssociatedCompany).toBe('800000513');
    });
  });

  describe('Code Case-Sensitivity', () => {
    test('should preserve code case exactly as provided', () => {
      const codes = ['OBJ-001', 'obj-001', 'Obj-001', 'OBJ001', 'OBJECTION_CODE'];

      codes.forEach(code => {
        const rule = new Rule(null, 'Test', 'Description', 1, 'CODE', true, new Date(), null, null, null, code);
        expect(rule.code).toBe(code);
      });
    });

    test('should not normalize or transform code', () => {
      const rule = new Rule(null, 'Test', 'Description', 1, 'CODE', true, new Date(), null, null, null, ' OBJ-001 ');
      // Code should remain with spaces (no trimming in entity, validation handles it)
      expect(rule.code).toBe(' OBJ-001 ');
    });
  });
});
