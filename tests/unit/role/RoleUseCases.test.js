const {
  CreateRoleUseCase,
  GetRoleByIdUseCase,
  GetAllRolesUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase
} = require('../../../src/application/useCases/roles/RoleUseCases');

const { ValidationError, NotFoundError, ConflictError } = require('../../../src/shared/errors');

// Mock del repositorio
const mockRoleRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  findByCompany: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

describe('Role Use Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateRoleUseCase', () => {
    let createRoleUseCase;

    beforeEach(() => {
      createRoleUseCase = new CreateRoleUseCase(mockRoleRepository);
    });

    test('should create role successfully', async () => {
      const roleData = {
        name: 'Admin',
        description: 'Administrator role',
        isActive: true
      };
      const companyId = 'company-123';
      const savedRole = { id: 1, ...roleData, companyId };

      mockRoleRepository.findByName.mockResolvedValue(null);
      mockRoleRepository.save.mockResolvedValue(savedRole);

      const result = await createRoleUseCase.execute(roleData, companyId);

      expect(mockRoleRepository.findByName).toHaveBeenCalledWith('Admin', companyId);
      expect(mockRoleRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedRole);
    });

    test('should throw ValidationError for missing role name', async () => {
      const roleData = { description: 'Test description' };
      const companyId = 'company-123';

      await expect(createRoleUseCase.execute(roleData, companyId))
        .rejects.toThrow(ValidationError);
      await expect(createRoleUseCase.execute(roleData, companyId))
        .rejects.toThrow('Role name is required');
    });

    test('should throw ValidationError for missing company ID', async () => {
      const roleData = { name: 'Admin', description: 'Test description' };

      await expect(createRoleUseCase.execute(roleData, null))
        .rejects.toThrow(ValidationError);
      await expect(createRoleUseCase.execute(roleData, null))
        .rejects.toThrow('Company ID is required');
    });

    test('should throw ConflictError for duplicate role name', async () => {
      const roleData = { name: 'Admin', description: 'Administrator role' };
      const companyId = 'company-123';
      const existingRole = { id: 1, name: 'Admin', companyId };

      mockRoleRepository.findByName.mockResolvedValue(existingRole);

      await expect(createRoleUseCase.execute(roleData, companyId))
        .rejects.toThrow(ConflictError);
      await expect(createRoleUseCase.execute(roleData, companyId))
        .rejects.toThrow("Role with name 'Admin' already exists in this company");
    });
  });

  describe('GetRoleByIdUseCase', () => {
    let getRoleByIdUseCase;

    beforeEach(() => {
      getRoleByIdUseCase = new GetRoleByIdUseCase(mockRoleRepository);
    });

    test('should get role by ID successfully', async () => {
      const roleId = 1;
      const companyId = 'company-123';
      const role = { id: roleId, name: 'Admin', companyId };

      mockRoleRepository.findById.mockResolvedValue(role);

      const result = await getRoleByIdUseCase.execute(roleId, companyId);

      expect(mockRoleRepository.findById).toHaveBeenCalledWith(roleId, companyId);
      expect(result).toEqual(role);
    });

    test('should throw ValidationError for missing role ID', async () => {
      const companyId = 'company-123';

      await expect(getRoleByIdUseCase.execute(null, companyId))
        .rejects.toThrow(ValidationError);
      await expect(getRoleByIdUseCase.execute(null, companyId))
        .rejects.toThrow('Role ID is required');
    });

    test('should throw ValidationError for missing company ID', async () => {
      const roleId = 1;

      await expect(getRoleByIdUseCase.execute(roleId, null))
        .rejects.toThrow(ValidationError);
      await expect(getRoleByIdUseCase.execute(roleId, null))
        .rejects.toThrow('Company ID is required');
    });

    test('should throw NotFoundError when role not found', async () => {
      const roleId = 999;
      const companyId = 'company-123';

      mockRoleRepository.findById.mockResolvedValue(null);

      await expect(getRoleByIdUseCase.execute(roleId, companyId))
        .rejects.toThrow(NotFoundError);
      await expect(getRoleByIdUseCase.execute(roleId, companyId))
        .rejects.toThrow(`Role with ID ${roleId} not found in this company`);
    });
  });

  describe('GetAllRolesUseCase', () => {
    let getAllRolesUseCase;

    beforeEach(() => {
      getAllRolesUseCase = new GetAllRolesUseCase(mockRoleRepository);
    });

    test('should get all roles for company successfully', async () => {
      const companyId = 'company-123';
      const roles = [
        { id: 1, name: 'Admin', companyId },
        { id: 2, name: 'User', companyId }
      ];

      mockRoleRepository.findByCompany.mockResolvedValue(roles);

      const result = await getAllRolesUseCase.execute(companyId);

      expect(mockRoleRepository.findByCompany).toHaveBeenCalledWith(companyId, {});
      expect(result).toEqual(roles);
    });

    test('should get roles with filters', async () => {
      const companyId = 'company-123';
      const filters = { isActive: true };
      const roles = [{ id: 1, name: 'Admin', companyId, isActive: true }];

      mockRoleRepository.findByCompany.mockResolvedValue(roles);

      const result = await getAllRolesUseCase.execute(companyId, filters);

      expect(mockRoleRepository.findByCompany).toHaveBeenCalledWith(companyId, filters);
      expect(result).toEqual(roles);
    });

    test('should throw ValidationError for missing company ID', async () => {
      await expect(getAllRolesUseCase.execute(null))
        .rejects.toThrow(ValidationError);
      await expect(getAllRolesUseCase.execute(null))
        .rejects.toThrow('Company ID is required');
    });
  });

  describe('UpdateRoleUseCase', () => {
    let updateRoleUseCase;

    beforeEach(() => {
      updateRoleUseCase = new UpdateRoleUseCase(mockRoleRepository);
    });

    test('should update role successfully', async () => {
      const roleId = 1;
      const companyId = 'company-123';
      const updateData = { description: 'Updated description' };
      const existingRole = { id: roleId, name: 'Admin', companyId };
      const updatedRole = { ...existingRole, ...updateData };

      mockRoleRepository.findById.mockResolvedValue(existingRole);
      mockRoleRepository.update.mockResolvedValue(updatedRole);

      const result = await updateRoleUseCase.execute(roleId, companyId, updateData);

      expect(mockRoleRepository.findById).toHaveBeenCalledWith(roleId, companyId);
      expect(mockRoleRepository.update).toHaveBeenCalledWith(roleId, companyId, updateData);
      expect(result).toEqual(updatedRole);
    });

    test('should update role name without conflict', async () => {
      const roleId = 1;
      const companyId = 'company-123';
      const updateData = { name: 'Super Admin' };
      const existingRole = { id: roleId, name: 'Admin', companyId };
      const updatedRole = { ...existingRole, ...updateData };

      mockRoleRepository.findById.mockResolvedValue(existingRole);
      mockRoleRepository.findByName.mockResolvedValue(null);
      mockRoleRepository.update.mockResolvedValue(updatedRole);

      const result = await updateRoleUseCase.execute(roleId, companyId, updateData);

      expect(mockRoleRepository.findByName).toHaveBeenCalledWith('Super Admin', companyId);
      expect(result).toEqual(updatedRole);
    });

    test('should throw ValidationError for missing role ID', async () => {
      const companyId = 'company-123';
      const updateData = { description: 'Updated' };

      await expect(updateRoleUseCase.execute(null, companyId, updateData))
        .rejects.toThrow(ValidationError);
      await expect(updateRoleUseCase.execute(null, companyId, updateData))
        .rejects.toThrow('Role ID is required');
    });

    test('should throw NotFoundError when role not found', async () => {
      const roleId = 999;
      const companyId = 'company-123';
      const updateData = { description: 'Updated' };

      mockRoleRepository.findById.mockResolvedValue(null);

      await expect(updateRoleUseCase.execute(roleId, companyId, updateData))
        .rejects.toThrow(NotFoundError);
      await expect(updateRoleUseCase.execute(roleId, companyId, updateData))
        .rejects.toThrow(`Role with ID ${roleId} not found in this company`);
    });

    test('should throw ConflictError for duplicate role name', async () => {
      const roleId = 1;
      const companyId = 'company-123';
      const updateData = { name: 'Manager' };
      const existingRole = { id: roleId, name: 'Admin', companyId };
      const conflictingRole = { id: 2, name: 'Manager', companyId };

      mockRoleRepository.findById.mockResolvedValue(existingRole);
      mockRoleRepository.findByName.mockResolvedValue(conflictingRole);

      await expect(updateRoleUseCase.execute(roleId, companyId, updateData))
        .rejects.toThrow(ConflictError);
      await expect(updateRoleUseCase.execute(roleId, companyId, updateData))
        .rejects.toThrow("Role with name 'Manager' already exists in this company");
    });
  });

  describe('DeleteRoleUseCase', () => {
    let deleteRoleUseCase;

    beforeEach(() => {
      deleteRoleUseCase = new DeleteRoleUseCase(mockRoleRepository);
    });

    test('should delete role successfully', async () => {
      const roleId = 1;
      const companyId = 'company-123';
      const existingRole = { id: roleId, name: 'Admin', companyId };

      mockRoleRepository.findById.mockResolvedValue(existingRole);
      mockRoleRepository.delete.mockResolvedValue(true);

      const result = await deleteRoleUseCase.execute(roleId, companyId);

      expect(mockRoleRepository.findById).toHaveBeenCalledWith(roleId, companyId);
      expect(mockRoleRepository.delete).toHaveBeenCalledWith(roleId, companyId);
      expect(result).toBe(true);
    });

    test('should throw ValidationError for missing role ID', async () => {
      const companyId = 'company-123';

      await expect(deleteRoleUseCase.execute(null, companyId))
        .rejects.toThrow(ValidationError);
      await expect(deleteRoleUseCase.execute(null, companyId))
        .rejects.toThrow('Role ID is required');
    });

    test('should throw ValidationError for missing company ID', async () => {
      const roleId = 1;

      await expect(deleteRoleUseCase.execute(roleId, null))
        .rejects.toThrow(ValidationError);
      await expect(deleteRoleUseCase.execute(roleId, null))
        .rejects.toThrow('Company ID is required');
    });

    test('should throw NotFoundError when role not found', async () => {
      const roleId = 999;
      const companyId = 'company-123';

      mockRoleRepository.findById.mockResolvedValue(null);

      await expect(deleteRoleUseCase.execute(roleId, companyId))
        .rejects.toThrow(NotFoundError);
      await expect(deleteRoleUseCase.execute(roleId, companyId))
        .rejects.toThrow(`Role with ID ${roleId} not found in this company`);
    });
  });
});
