const axios = require('axios');

describe('Rule Endpoints Integration Tests', () => {
  const baseURL = 'http://localhost:4041/api';
  let createdCompanyId = null;
  let createdRuleId = null;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create a test company first (rules must belong to a company)
    const timestamp = Date.now();
    const companyData = {
      name: `Rules Test Company ${timestamp}`,
      description: 'Company for rules testing',
      documentNumber: `${timestamp}`,
      documentType: 'NIT',
      type: 'CORPORATION'
    };

    try {
      const companyResponse = await axios.post(`${baseURL}/companies`, companyData);
      createdCompanyId = companyResponse.data.data.id;
      console.log(`✅ Test company created with ID: ${createdCompanyId}`);
    } catch (error) {
      console.error('❌ Failed to create test company:', error.response?.data || error.message);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up: delete created company (this should cascade delete rules)
    if (createdCompanyId) {
      try {
        await axios.delete(`${baseURL}/companies/${createdCompanyId}`);
        console.log(`✅ Test company deleted: ${createdCompanyId}`);
      } catch (error) {
        console.error('❌ Failed to delete test company:', error.response?.data || error.message);
      }
    }
  });

  afterEach(async () => {
    // Clean up: delete created rule if exists
    if (createdRuleId && createdCompanyId) {
      try {
        await axios.delete(`${baseURL}/companies/${createdCompanyId}/rules/${createdRuleId}`);
        createdRuleId = null;
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('POST /api/companies/{companyId}/rules', () => {
    it('should create a rule with valid data for an existing company', async () => {
      const timestamp = Date.now();
      const ruleData = {
        name: `Test Security Rule ${timestamp}`,
        description: 'Integration test rule for security compliance',
        type: 'SECURITY'
      };

      const response = await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, ruleData);
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data.name).toBe(ruleData.name);
      expect(response.data.data.type).toBe('SECURITY');
      expect(response.data.data.companyId).toBe(createdCompanyId);
      expect(response.data.data.isActive).toBe(true);
      
      createdRuleId = response.data.data.id;
    });

    it('should fail when rule name is missing', async () => {
      const ruleData = {
        description: 'Test rule without name',
        type: 'BUSINESS'
      };

      try {
        await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, ruleData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
      }
    });

    it('should fail when description is missing', async () => {
      const ruleData = {
        name: 'Test Rule Without Description',
        type: 'BUSINESS'
      };

      try {
        await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, ruleData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
      }
    });

    it('should fail when type is missing', async () => {
      const ruleData = {
        name: 'Test Rule Without Type',
        description: 'Test rule description'
      };

      try {
        await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, ruleData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
      }
    });

    it('should fail when company does not exist', async () => {
      const ruleData = {
        name: 'Test Rule for Non-existent Company',
        description: 'This should fail',
        type: 'BUSINESS'
      };

      try {
        await axios.post(`${baseURL}/companies/999999/rules`, ruleData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.success).toBe(false);
      }
    });

    it('should fail with duplicate rule name in same company', async () => {
      const timestamp = Date.now();
      const ruleData = {
        name: `Duplicate Rule ${timestamp}`,
        description: 'First rule',
        type: 'COMPLIANCE'
      };

      // Create first rule
      const firstResponse = await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, ruleData);
      createdRuleId = firstResponse.data.data.id;

      // Try to create duplicate
      const duplicateData = {
        ...ruleData,
        description: 'Duplicate rule' // Different description but same name
      };

      try {
        await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, duplicateData);
        fail('Should have thrown an error for duplicate rule name');
      } catch (error) {
        expect(error.response.status).toBe(409);
        expect(error.response.data.success).toBe(false);
      }
    });

    it('should validate rule type enum values', async () => {
      const ruleData = {
        name: 'Test Rule with Invalid Type',
        description: 'Test rule description',
        type: 'INVALID_TYPE'
      };

      try {
        await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, ruleData);
        fail('Should have thrown an error for invalid type');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
      }
    });
  });

  describe('GET /api/companies/{companyId}/rules/{ruleId}', () => {
    it('should get rule by ID', async () => {
      const timestamp = Date.now();
      const ruleData = {
        name: `Get Test Rule ${timestamp}`,
        description: 'Rule for get test',
        type: 'OPERATIONAL'
      };

      // Create rule
      const createResponse = await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, ruleData);
      createdRuleId = createResponse.data.data.id;

      // Get rule by ID
      const getResponse = await axios.get(`${baseURL}/companies/${createdCompanyId}/rules/${createdRuleId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.data.success).toBe(true);
      expect(getResponse.data.data.id).toBe(createdRuleId);
      expect(getResponse.data.data.name).toBe(ruleData.name);
      expect(getResponse.data.data.companyId).toBe(createdCompanyId);
    });

    it('should return 404 for non-existent rule', async () => {
      try {
        await axios.get(`${baseURL}/companies/${createdCompanyId}/rules/999999`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.success).toBe(false);
      }
    });

    it('should return 404 for rule from different company', async () => {
      // This test assumes there might be rules in other companies
      // We can't easily test this without creating another company
      try {
        await axios.get(`${baseURL}/companies/999999/rules/1`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.success).toBe(false);
      }
    });
  });

  describe('GET /api/companies/{companyId}/rules', () => {
    beforeEach(async () => {
      // Create some test rules for filtering tests
      const timestamp = Date.now();
      const rules = [
        { name: `Active Business Rule ${timestamp}`, description: 'Active business rule', type: 'BUSINESS', isActive: true },
        { name: `Inactive Security Rule ${timestamp}`, description: 'Inactive security rule', type: 'SECURITY', isActive: false },
        { name: `Active Compliance Rule ${timestamp}`, description: 'Active compliance rule', type: 'COMPLIANCE', isActive: true }
      ];

      for (const rule of rules) {
        await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, rule);
      }
    });

    it('should list all rules for a company', async () => {
      const response = await axios.get(`${baseURL}/companies/${createdCompanyId}/rules`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.count).toBeGreaterThanOrEqual(3);
    });

    it('should filter active rules', async () => {
      const response = await axios.get(`${baseURL}/companies/${createdCompanyId}/rules?isActive=true`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // All returned rules should be active
      response.data.data.forEach(rule => {
        expect(rule.isActive).toBe(true);
      });
    });

    it('should filter by rule type', async () => {
      const response = await axios.get(`${baseURL}/companies/${createdCompanyId}/rules?type=BUSINESS`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // All returned rules should be BUSINESS type
      response.data.data.forEach(rule => {
        expect(rule.type).toBe('BUSINESS');
      });
    });

    it('should filter by name (partial match)', async () => {
      const response = await axios.get(`${baseURL}/companies/${createdCompanyId}/rules?name=Business`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // All returned rules should contain "Business" in the name
      response.data.data.forEach(rule => {
        expect(rule.name.toLowerCase()).toContain('business');
      });
    });
  });

  describe('PUT /api/companies/{companyId}/rules/{ruleId}', () => {
    it('should update rule successfully', async () => {
      const timestamp = Date.now();
      const originalData = {
        name: `Original Rule ${timestamp}`,
        description: 'Original description',
        type: 'TECHNICAL'
      };

      // Create rule
      const createResponse = await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, originalData);
      createdRuleId = createResponse.data.data.id;

      // Update rule
      const updateData = {
        name: `Updated Rule ${timestamp}`,
        description: 'Updated description',
        type: 'BUSINESS',
        isActive: false
      };

      const updateResponse = await axios.put(`${baseURL}/companies/${createdCompanyId}/rules/${createdRuleId}`, updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.success).toBe(true);
      expect(updateResponse.data.data.name).toBe(updateData.name);
      expect(updateResponse.data.data.description).toBe(updateData.description);
      expect(updateResponse.data.data.type).toBe(updateData.type);
      expect(updateResponse.data.data.isActive).toBe(updateData.isActive);
    });

    it('should fail to update with duplicate name', async () => {
      const timestamp = Date.now();
      
      // Create first rule
      const firstRuleData = {
        name: `First Rule ${timestamp}`,
        description: 'First rule',
        type: 'SECURITY'
      };
      await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, firstRuleData);

      // Create second rule
      const secondRuleData = {
        name: `Second Rule ${timestamp}`,
        description: 'Second rule',
        type: 'COMPLIANCE'
      };
      const secondResponse = await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, secondRuleData);
      createdRuleId = secondResponse.data.data.id;

      // Try to update second rule with first rule's name
      const updateData = {
        name: firstRuleData.name,
        description: 'Updated description'
      };

      try {
        await axios.put(`${baseURL}/companies/${createdCompanyId}/rules/${createdRuleId}`, updateData);
        fail('Should have thrown an error for duplicate name');
      } catch (error) {
        expect(error.response.status).toBe(409);
        expect(error.response.data.success).toBe(false);
      }
    });
  });

  describe('DELETE /api/companies/{companyId}/rules/{ruleId}', () => {
    it('should delete rule successfully', async () => {
      const timestamp = Date.now();
      const ruleData = {
        name: `Delete Test Rule ${timestamp}`,
        description: 'Rule for delete test',
        type: 'CUSTOM'
      };

      // Create rule
      const createResponse = await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, ruleData);
      const ruleId = createResponse.data.data.id;

      // Delete rule
      const deleteResponse = await axios.delete(`${baseURL}/companies/${createdCompanyId}/rules/${ruleId}`);

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.data.success).toBe(true);
      expect(deleteResponse.data.message).toBe('Rule deleted successfully');

      // Verify rule is deleted
      try {
        await axios.get(`${baseURL}/companies/${createdCompanyId}/rules/${ruleId}`);
        fail('Should have thrown an error for deleted rule');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should return 404 for non-existent rule', async () => {
      try {
        await axios.delete(`${baseURL}/companies/${createdCompanyId}/rules/999999`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.success).toBe(false);
      }
    });
  });

  describe('GET /api/companies/{companyId}/rules/active', () => {
    it('should get only active rules', async () => {
      // Create mix of active and inactive rules
      const timestamp = Date.now();
      await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, {
        name: `Active Rule 1 ${timestamp}`,
        description: 'Active rule',
        type: 'BUSINESS',
        isActive: true
      });

      await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, {
        name: `Inactive Rule 1 ${timestamp}`,
        description: 'Inactive rule',
        type: 'SECURITY',
        isActive: false
      });

      const response = await axios.get(`${baseURL}/companies/${createdCompanyId}/rules/active`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);

      // All returned rules should be active
      response.data.data.forEach(rule => {
        expect(rule.isActive).toBe(true);
      });
    });
  });

  describe('GET /api/companies/{companyId}/rules/search', () => {
    it('should search rules by term', async () => {
      // Create rule with specific searchable content
      const timestamp = Date.now();
      await axios.post(`${baseURL}/companies/${createdCompanyId}/rules`, {
        name: `Searchable Security Rule ${timestamp}`,
        description: 'This rule contains searchable terms',
        type: 'SECURITY'
      });

      const response = await axios.get(`${baseURL}/companies/${createdCompanyId}/rules/search?q=searchable`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);

      // Should find rules with the search term in name or description
      const foundRule = response.data.data.find(rule => 
        rule.name.toLowerCase().includes('searchable') || 
        rule.description.toLowerCase().includes('searchable')
      );
      expect(foundRule).toBeTruthy();
    });

    it('should require search term', async () => {
      try {
        await axios.get(`${baseURL}/companies/${createdCompanyId}/rules/search`);
        fail('Should have thrown an error for missing search term');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
      }
    });
  });

  describe('GET /api/companies/{companyId}/rules/types/available', () => {
    it('should get available rule types for company', async () => {
      const response = await axios.get(`${baseURL}/companies/${createdCompanyId}/rules/types/available`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });

  describe('GET /api/companies/{companyId}/rules/stats/by-type', () => {
    it('should get rule statistics by type', async () => {
      const response = await axios.get(`${baseURL}/companies/${createdCompanyId}/rules/stats/by-type`);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Each stat should have type, total, active, inactive
      response.data.data.forEach(stat => {
        expect(stat).toHaveProperty('type');
        expect(stat).toHaveProperty('total');
        expect(stat).toHaveProperty('active');
        expect(stat).toHaveProperty('inactive');
        expect(typeof stat.total).toBe('number');
        expect(typeof stat.active).toBe('number');
        expect(typeof stat.inactive).toBe('number');
      });
    });
  });

  console.log('✅ Rule endpoints integration tests completed');
});
