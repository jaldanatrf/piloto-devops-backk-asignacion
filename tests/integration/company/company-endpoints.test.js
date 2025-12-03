const axios = require('axios');

describe('Company Endpoints Integration Tests', () => {
  const baseURL = 'http://localhost:4041/api';
  let createdCompanyId = null;

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterEach(async () => {
    // Clean up: delete created company if exists
    if (createdCompanyId) {
      try {
        await axios.delete(`${baseURL}/companies/${createdCompanyId}`);
        createdCompanyId = null;
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe('POST /api/companies', () => {
    it('should create a company with valid data', async () => {
      const timestamp = Date.now();
      const companyData = {
        name: `Test Company ${timestamp}`,
        description: 'Integration test company',
        documentNumber: `${timestamp}`,
        documentType: 'NIT'
      };

      const response = await axios.post(`${baseURL}/companies`, companyData);
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data.name).toBe(companyData.name);
      expect(response.data.data.documentType).toBe('NIT');
      
      createdCompanyId = response.data.data.id;
    });

    it('should fail when documentType is missing', async () => {
      const companyData = {
        name: 'Test Company Without DocType',
        description: 'Test company',
        documentNumber: '123456789'
        // documentType is missing
      };

      try {
        await axios.post(`${baseURL}/companies`, companyData);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.success).toBe(false);
      }
    });

    it('should fail with duplicate name', async () => {
      const timestamp = Date.now();
      const companyData = {
        name: `Duplicate Company ${timestamp}`,
        description: 'First company',
        documentNumber: `${timestamp}`,
        documentType: 'NIT'
      };

      // Create first company
      const firstResponse = await axios.post(`${baseURL}/companies`, companyData);
      createdCompanyId = firstResponse.data.data.id;

      // Try to create duplicate
      const duplicateData = {
        ...companyData,
        documentNumber: `${timestamp + 1}` // Different document number
      };

      try {
        await axios.post(`${baseURL}/companies`, duplicateData);
        fail('Should have thrown an error for duplicate name');
      } catch (error) {
        expect(error.response.status).toBe(409);
        expect(error.response.data.success).toBe(false);
      }
    });
  });

  describe('GET /api/companies/document/{documentType}/{documentNumber}', () => {
    it('should find company by document type and number', async () => {
      const timestamp = Date.now();
      const companyData = {
        name: `Search Test Company ${timestamp}`,
        description: 'Company for search test',
        documentNumber: `${timestamp}`,
        documentType: 'NIT'
      };

      // Create company
      const createResponse = await axios.post(`${baseURL}/companies`, companyData);
      createdCompanyId = createResponse.data.data.id;

      // Search by document type and number
      const searchResponse = await axios.get(
        `${baseURL}/companies/document/${companyData.documentType}/${companyData.documentNumber}`
      );

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.data.success).toBe(true);
      expect(searchResponse.data.data.id).toBe(createdCompanyId);
      expect(searchResponse.data.data.documentType).toBe('NIT');
      expect(searchResponse.data.data.documentNumber).toBe(companyData.documentNumber);
    });

    it('should return 404 for non-existent document', async () => {
      try {
        await axios.get(`${baseURL}/companies/document/NIT/999999999`);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.success).toBe(false);
      }
    });
  });

  describe('GET /api/companies', () => {
    it('should list all companies', async () => {
      const response = await axios.get(`${baseURL}/companies`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should filter active companies', async () => {
      const response = await axios.get(`${baseURL}/companies/active`);
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
  });
});
