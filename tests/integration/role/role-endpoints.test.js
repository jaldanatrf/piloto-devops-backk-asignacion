const request = require('supertest');
const Server = require('../../../src/infrastructure/web/server');

describe('Role Endpoints Integration Tests', () => {
  let server;
  let app;
  let createdCompanyId;
  let createdRoleId;

  beforeAll(async () => {
    server = new Server();
    await server.start();
    app = server.app;

    // Crear una empresa de prueba para los roles
    const companyResponse = await request(app)
      .post('/api/companies')
      .send({
        name: 'Test Company for Roles',
        description: 'Company created for role testing',
        documentNumber: '900555444',
        documentType: 'NIT',
        type: 'PAYER'
      });

    expect(companyResponse.status).toBe(201);
    createdCompanyId = companyResponse.body.data.id;
  });

  afterAll(async () => {
    if (server) {
      await server.shutdown();
    }
  });

  describe('POST /api/companies/:companyId/roles', () => {
    test('should create a new role successfully', async () => {
      const roleData = {
        name: 'Administrator',
        description: 'Admin role with full permissions',
        isActive: true
      };

      const response = await request(app)
        .post(`/api/companies/${createdCompanyId}/roles`)
        .send(roleData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(roleData.name);
      expect(response.body.data.description).toBe(roleData.description);
      expect(response.body.data.companyId).toBe(createdCompanyId);
      expect(response.body.data.isActive).toBe(true);

      // Guardar el ID para tests posteriores
      createdRoleId = response.body.data.id;
    });

    test('should fail when creating role with missing name', async () => {
      const roleData = {
        description: 'Role without name'
      };

      const response = await request(app)
        .post(`/api/companies/${createdCompanyId}/roles`)
        .send(roleData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail when creating role with duplicate name in same company', async () => {
      const roleData = {
        name: 'Administrator', // Nombre duplicado
        description: 'Another admin role'
      };

      const response = await request(app)
        .post(`/api/companies/${createdCompanyId}/roles`)
        .send(roleData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('should fail when creating role for non-existent company', async () => {
      const roleData = {
        name: 'Test Role',
        description: 'Role for non-existent company'
      };

      const response = await request(app)
        .post('/api/companies/99999/roles')
        .send(roleData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/companies/:companyId/roles', () => {
    test('should get all roles for a company', async () => {
      const response = await request(app)
        .get(`/api/companies/${createdCompanyId}/roles`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('count');
    });

    test('should filter roles by active status', async () => {
      const response = await request(app)
        .get(`/api/companies/${createdCompanyId}/roles?isActive=true`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Verificar que todos los roles retornados están activos
      response.body.data.forEach(role => {
        expect(role.isActive).toBe(true);
      });
    });

    test('should filter roles by name', async () => {
      const response = await request(app)
        .get(`/api/companies/${createdCompanyId}/roles?name=Admin`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/companies/:companyId/roles/active', () => {
    test('should get only active roles', async () => {
      const response = await request(app)
        .get(`/api/companies/${createdCompanyId}/roles/active`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      // Verificar que todos los roles retornados están activos
      response.body.data.forEach(role => {
        expect(role.isActive).toBe(true);
      });
    });
  });

  describe('GET /api/companies/:companyId/roles/search', () => {
    test('should search roles by name', async () => {
      const response = await request(app)
        .get(`/api/companies/${createdCompanyId}/roles/search?q=Admin`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('should fail search without query parameter', async () => {
      const response = await request(app)
        .get(`/api/companies/${createdCompanyId}/roles/search`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should limit search results', async () => {
      const response = await request(app)
        .get(`/api/companies/${createdCompanyId}/roles/search?q=Admin&limit=1`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/companies/:companyId/roles/:roleId', () => {
    test('should get a specific role by ID', async () => {
      const response = await request(app)
        .get(`/api/companies/${createdCompanyId}/roles/${createdRoleId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', createdRoleId);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data).toHaveProperty('companyId', createdCompanyId);
    });

    test('should fail when getting non-existent role', async () => {
      const response = await request(app)
        .get(`/api/companies/${createdCompanyId}/roles/99999`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should fail when getting role from wrong company', async () => {
      // Crear otra empresa
      const anotherCompanyResponse = await request(app)
        .post('/api/companies')
        .send({
          name: 'Another Test Company',
          documentNumber: '900777888',
          documentType: 'NIT',
          type: 'PROVIDER'
        });

      const anotherCompanyId = anotherCompanyResponse.body.data.id;

      const response = await request(app)
        .get(`/api/companies/${anotherCompanyId}/roles/${createdRoleId}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/companies/:companyId/roles/:roleId', () => {
    test('should update a role successfully', async () => {
      const updateData = {
        name: 'Super Administrator',
        description: 'Updated admin role with enhanced permissions',
        isActive: true
      };

      const response = await request(app)
        .put(`/api/companies/${createdCompanyId}/roles/${createdRoleId}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.id).toBe(createdRoleId);
    });

    test('should fail when updating to duplicate name', async () => {
      // Crear otro rol
      const anotherRoleResponse = await request(app)
        .post(`/api/companies/${createdCompanyId}/roles`)
        .send({
          name: 'Editor',
          description: 'Editor role'
        });

      const anotherRoleId = anotherRoleResponse.body.data.id;

      // Intentar actualizar con nombre duplicado
      const response = await request(app)
        .put(`/api/companies/${createdCompanyId}/roles/${anotherRoleId}`)
        .send({
          name: 'Super Administrator' // Nombre que ya existe
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    test('should fail when updating non-existent role', async () => {
      const response = await request(app)
        .put(`/api/companies/${createdCompanyId}/roles/99999`)
        .send({
          name: 'Updated Role'
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/companies/:companyId/roles/:roleId', () => {
    test('should delete a role successfully', async () => {
      // Crear un rol específico para eliminar
      const roleToDeleteResponse = await request(app)
        .post(`/api/companies/${createdCompanyId}/roles`)
        .send({
          name: 'Temporary Role',
          description: 'Role to be deleted'
        });

      const roleToDeleteId = roleToDeleteResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/companies/${createdCompanyId}/roles/${roleToDeleteId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');

      // Verificar que el rol realmente fue eliminado
      const getResponse = await request(app)
        .get(`/api/companies/${createdCompanyId}/roles/${roleToDeleteId}`);

      expect(getResponse.status).toBe(404);
    });

    test('should fail when deleting non-existent role', async () => {
      const response = await request(app)
        .delete(`/api/companies/${createdCompanyId}/roles/99999`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    test('should handle invalid company ID format', async () => {
      const response = await request(app)
        .get('/api/companies/invalid/roles');

      expect(response.status).toBe(400);
    });

    test('should handle invalid role ID format', async () => {
      const response = await request(app)
        .get(`/api/companies/${createdCompanyId}/roles/invalid`);

      expect(response.status).toBe(400);
    });
  });
});
