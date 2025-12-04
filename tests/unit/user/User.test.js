const User = require('../../../src/domain/entities/users');

describe('User Entity', () => {
  test('should create a valid user', () => {
    const user = new User(
      1,
      'John',
      'Doe',
      'company-123',
      true,
      [],
      new Date()
    );

    expect(user.id).toBe(1);
    expect(user.firstName).toBe('John');
    expect(user.lastName).toBe('Doe');
    expect(user.companyId).toBe('company-123');
    expect(user.isActive).toBe(true);
    expect(user.roles).toEqual([]);
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  test('should throw error for empty first name', () => {
    expect(() => {
      new User(1, '', 'Doe', 'company-123');
    }).toThrow('First name is required');
  });

  test('should throw error for empty last name', () => {
    expect(() => {
      new User(1, 'John', '', 'company-123');
    }).toThrow('Last name is required');
  });

  test('should throw error for missing company ID', () => {
    expect(() => {
      new User(1, 'John', 'Doe', null);
    }).toThrow('Company ID is required');
  });

  test('should throw error for short first name', () => {
    expect(() => {
      new User(1, 'J', 'Doe', 'company-123');
    }).toThrow('First name must be at least 2 characters long');
  });

  test('should throw error for long first name', () => {
    const longName = 'a'.repeat(51);
    expect(() => {
      new User(1, longName, 'Doe', 'company-123');
    }).toThrow('First name cannot exceed 50 characters');
  });

  test('should throw error for invalid name characters', () => {
    expect(() => {
      new User(1, 'John123', 'Doe', 'company-123');
    }).toThrow('Names can only contain letters, spaces, dots and hyphens');
  });

  test('should get full name correctly', () => {
    const user = new User(1, 'John', 'Doe', 'company-123');
    expect(user.getFullName()).toBe('John Doe');
  });

  test('should activate and deactivate user', () => {
    const user = new User(1, 'John', 'Doe', 'company-123', false);
    
    expect(user.isActive).toBe(false);
    
    user.activate();
    expect(user.isActive).toBe(true);
    
    user.deactivate();
    expect(user.isActive).toBe(false);
  });

  test('should update names correctly', () => {
    const user = new User(1, 'John', 'Doe', 'company-123');
    
    user.updateNames('Jane', 'Smith');
    expect(user.firstName).toBe('Jane');
    expect(user.lastName).toBe('Smith');
  });

  test('should throw error when updating with invalid names', () => {
    const user = new User(1, 'John', 'Doe', 'company-123');
    
    expect(() => {
      user.updateNames('', 'Smith');
    }).toThrow('First name is required');
    
    expect(() => {
      user.updateNames('Jane', '');
    }).toThrow('Last name is required');
    
    expect(() => {
      user.updateNames('Jane123', 'Smith');
    }).toThrow('Names can only contain letters, spaces, dots and hyphens');
  });

  describe('Role Management', () => {
    let user, mockRole;

    beforeEach(() => {
      user = new User(1, 'John', 'Doe', 'company-123');
      mockRole = {
        id: 1,
        name: 'Admin',
        companyId: 'company-123',
        isActive: true
      };
    });

    test('should add role successfully', () => {
      user.addRole(mockRole);
      
      expect(user.getRolesCount()).toBe(1);
      expect(user.hasRole(1)).toBe(true);
      expect(user.roles[0]).toBe(mockRole);
    });

    test('should throw error when adding role from different company', () => {
      const roleFromOtherCompany = {
        id: 2,
        name: 'Manager',
        companyId: 'company-456',
        isActive: true
      };

      expect(() => {
        user.addRole(roleFromOtherCompany);
      }).toThrow('Role must belong to the same company as the user');
    });

    test('should throw error when adding duplicate role', () => {
      user.addRole(mockRole);
      
      expect(() => {
        user.addRole(mockRole);
      }).toThrow('Role is already assigned to this user');
    });

    test('should remove role successfully', () => {
      user.addRole(mockRole);
      expect(user.getRolesCount()).toBe(1);
      
      user.removeRole(1);
      expect(user.getRolesCount()).toBe(0);
      expect(user.hasRole(1)).toBe(false);
    });

    test('should throw error when removing non-existent role', () => {
      expect(() => {
        user.removeRole(999);
      }).toThrow('Role not found for this user');
    });

    test('should check role by name correctly', () => {
      user.addRole(mockRole);
      
      expect(user.hasRoleByName('Admin')).toBe(true);
      expect(user.hasRoleByName('Manager')).toBe(false);
    });

    test('should get active roles only', () => {
      const inactiveRole = {
        id: 2,
        name: 'Inactive Role',
        companyId: 'company-123',
        isActive: false
      };

      user.addRole(mockRole);
      user.addRole(inactiveRole);
      
      expect(user.getRolesCount()).toBe(2);
      expect(user.getActiveRolesCount()).toBe(1);
      expect(user.getActiveRoles()).toEqual([mockRole]);
    });

    test('should clear all roles', () => {
      user.addRole(mockRole);
      expect(user.getRolesCount()).toBe(1);
      
      user.clearRoles();
      expect(user.getRolesCount()).toBe(0);
      expect(user.roles).toEqual([]);
    });
  });

  describe('Permissions Management', () => {
    let user;

    beforeEach(() => {
      user = new User(1, 'John', 'Doe', 'company-123');
    });

    test('should get all permissions from active roles', () => {
      const role1 = {
        id: 1,
        name: 'Admin',
        companyId: 'company-123',
        isActive: true,
        permissions: ['read', 'write', 'delete']
      };

      const role2 = {
        id: 2,
        name: 'Editor',
        companyId: 'company-123',
        isActive: true,
        permissions: ['read', 'write', 'edit']
      };

      user.addRole(role1);
      user.addRole(role2);

      const permissions = user.getAllPermissions();
      expect(permissions).toEqual(expect.arrayContaining(['read', 'write', 'delete', 'edit']));
      expect(permissions.length).toBe(4); // Duplicates should be removed
    });

    test('should check if user has specific permission', () => {
      const role = {
        id: 1,
        name: 'Editor',
        companyId: 'company-123',
        isActive: true,
        permissions: ['read', 'write']
      };

      user.addRole(role);
      
      expect(user.hasPermission('read')).toBe(true);
      expect(user.hasPermission('write')).toBe(true);
      expect(user.hasPermission('delete')).toBe(false);
    });

    test('should not include permissions from inactive roles', () => {
      const inactiveRole = {
        id: 1,
        name: 'Inactive Admin',
        companyId: 'company-123',
        isActive: false,
        permissions: ['delete', 'admin']
      };

      user.addRole(inactiveRole);
      
      const permissions = user.getAllPermissions();
      expect(permissions).not.toContain('delete');
      expect(permissions).not.toContain('admin');
    });
  });

  describe('Information Methods', () => {
    let user, mockRole;

    beforeEach(() => {
      user = new User(1, 'John', 'Doe', 'company-123');
      mockRole = {
        id: 1,
        name: 'Admin',
        companyId: 'company-123',
        isActive: true,
        permissions: ['read', 'write'],
        getBasicInfo: () => ({ id: 1, name: 'Admin' })
      };
    });

    test('should get basic info correctly', () => {
      user.addRole(mockRole);
      const basicInfo = user.getBasicInfo();
      
      expect(basicInfo).toEqual({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        companyId: 'company-123',
        isActive: true,
        rolesCount: 1,
        createdAt: expect.any(Date)
      });
    });

    test('should get complete info correctly', () => {
      user.addRole(mockRole);
      const completeInfo = user.getCompleteInfo();
      
      expect(completeInfo).toEqual({
        id: 1,
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        companyId: 'company-123',
        isActive: true,
        rolesCount: 1,
        createdAt: expect.any(Date),
        roles: [{ id: 1, name: 'Admin' }],
        permissions: ['read', 'write']
      });
    });

    test('should get stats correctly', () => {
      user.addRole(mockRole);
      const stats = user.getStats();
      
      expect(stats).toEqual({
        rolesCount: 1,
        activeRolesCount: 1,
        permissionsCount: 2,
        isActive: true,
        createdAt: expect.any(Date)
      });
    });
  });

  describe('Company Validation', () => {
    test('should validate company belonging correctly', () => {
      const user = new User(1, 'John', 'Doe', 'company-123');
      
      expect(user.belongsToCompany('company-123')).toBe(true);
      expect(user.belongsToCompany('company-456')).toBe(false);
    });

    test('should check if user can perform operations', () => {
      const user = new User(1, 'John', 'Doe', 'company-123', true);
      const mockRole = {
        id: 1,
        name: 'Admin',
        companyId: 'company-123',
        isActive: true
      };

      // User without roles cannot perform operations
      expect(user.canPerformOperations()).toBe(false);

      // User with active role can perform operations
      user.addRole(mockRole);
      expect(user.canPerformOperations()).toBe(true);

      // Inactive user cannot perform operations
      user.deactivate();
      expect(user.canPerformOperations()).toBe(false);
    });
  });
});
