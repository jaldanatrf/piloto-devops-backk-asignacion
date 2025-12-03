const Company = require('../src/domain/entities/company');

describe('Company Entity', () => {
  test('should create a valid company', () => {
    const company = new Company(
      1,
      'Tech Solutions Ltd',
      'A technology solutions company',
      '12345-ABC',
      true
    );

    expect(company.id).toBe(1);
    expect(company.name).toBe('Tech Solutions Ltd');
    expect(company.description).toBe('A technology solutions company');
    expect(company.documentNumber).toBe('12345-ABC');
    expect(company.isActive).toBe(true);
    expect(company.rules).toEqual([]);
  });

  test('should throw error for empty name', () => {
    expect(() => {
      new Company(1, '', 'Description', '12345-ABC');
    }).toThrow('Company name is required');
  });

  test('should throw error for empty document number', () => {
    expect(() => {
      new Company(1, 'Test Company', 'Description', '');
    }).toThrow('Company document number is required');
  });

  test('should throw error for short document number', () => {
    expect(() => {
      new Company(1, 'Test Company', 'Description', '123');
    }).toThrow('Company document number must be at least 5 characters long');
  });

  test('should throw error for invalid document number format', () => {
    expect(() => {
      new Company(1, 'Test Company', 'Description', '12345@ABC');
    }).toThrow('Company document number can only contain letters, numbers and hyphens');
  });

  test('should activate and deactivate company', () => {
    const company = new Company(1, 'Test Company', 'Description', '12345-ABC');
    
    company.deactivate();
    expect(company.isActive).toBe(false);
    
    company.activate();
    expect(company.isActive).toBe(true);
  });

  test('should update document number', () => {
    const company = new Company(1, 'Test Company', 'Description', '12345-ABC');
    
    company.updateDocumentNumber('67890-XYZ');
    expect(company.documentNumber).toBe('67890-XYZ');
  });

  test('should throw error when updating with invalid document number', () => {
    const company = new Company(1, 'Test Company', 'Description', '12345-ABC');
    
    expect(() => {
      company.updateDocumentNumber('123');
    }).toThrow('Company document number must be between 5 and 20 characters');
  });

  test('should manage rules correctly', () => {
    const company = new Company(1, 'Test Company', 'Description', '12345-ABC');
    
    const mockRule = { id: 1, name: 'Test Rule', isActive: true };
    
    company.addRule(mockRule);
    expect(company.getRulesCount()).toBe(1);
    expect(company.hasRule(1)).toBe(true);
    
    company.removeRule(1);
    expect(company.getRulesCount()).toBe(0);
    expect(company.hasRule(1)).toBe(false);
  });

  test('should get basic info correctly', () => {
    const company = new Company(1, 'Test Company', 'Description', '12345-ABC');
    const basicInfo = company.getBasicInfo();
    
    expect(basicInfo).toEqual({
      id: 1,
      name: 'Test Company',
      description: 'Description',
      documentNumber: '12345-ABC',
      isActive: true,
      createdAt: expect.any(Date),
      rulesCount: 0
    });
  });

  test('should get stats correctly', () => {
    const company = new Company(1, 'Test Company', 'Description', '12345-ABC');
    const stats = company.getStats();
    
    expect(stats).toEqual({
      rulesCount: 0,
      activeRulesCount: 0,
      isActive: true,
      createdAt: expect.any(Date),
      documentNumber: '12345-ABC'
    });
  });
});

module.exports = Company;
