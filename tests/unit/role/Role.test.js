const Role = require('../../../src/domain/entities/Role');

describe('Role Entity', () => {
  test('should create a valid role', () => {
    const role = new Role(
      1,
      'Administrator',
      'Full system administrator role',
      'company-123',
      true,
      new Date()
    );

    expect(role.id).toBe(1);
    expect(role.name).toBe('Administrator');
    expect(role.description).toBe('Full system administrator role');
    expect(role.companyId).toBe('company-123');
    expect(role.isActive).toBe(true);
    expect(role.createdAt).toBeInstanceOf(Date);
    expect(role.permissions).toEqual([]);
  });

  test('should create role with default values', () => {
    const role = new Role(null, 'Basic Role', null, 'company-123');

    expect(role.id).toBeNull();
    expect(role.description).toBeNull();
    expect(role.isActive).toBe(true);
    expect(role.createdAt).toBeInstanceOf(Date);
    expect(role.permissions).toEqual([]);
  });

  test('should throw error for empty name', () => {
    expect(() => {
      new Role(1, '', 'Description', 'company-123');
    }).toThrow('Role name is required');
  });

  test('should throw error for short name', () => {
    expect(() => {
      new Role(1, 'A', 'Description', 'company-123');
    }).toThrow('Role name must be at least 2 characters long');
  });

  test('should throw error for long name', () => {
    const longName = 'a'.repeat(101);
    expect(() => {
      new Role(1, longName, 'Description', 'company-123');
    }).toThrow('Role name cannot exceed 100 characters');
  });

  test('should throw error for missing company ID', () => {
    expect(() => {
      new Role(1, 'Admin', 'Description', null);
    }).toThrow('Company ID is required');
  });

  test('should throw error for long description', () => {
    const longDescription = 'a'.repeat(501);
    expect(() => {
      new Role(1, 'Admin', longDescription, 'company-123');
    }).toThrow('Role description cannot exceed 500 characters');
  });

  test('should throw error for invalid permissions array', () => {
    expect(() => {
      new Role(1, 'Admin', 'Description', 'company-123', true, new Date(), 'invalid');
    }).toThrow('Permissions must be an array');
  });

  describe('Permission Management', () => {
    let role;

    beforeEach(() => {
      role = new Role(1, 'Editor', 'Content editor role', 'company-123');
    });

    test('should add permission successfully', () => {
      role.addPermission('read');
      
      expect(role.permissions).toContain('read');
      expect(role.hasPermission('read')).toBe(true);
    });

    test('should not add duplicate permissions', () => {
      role.addPermission('read');
      role.addPermission('read');
      
      expect(role.permissions.length).toBe(1);
      expect(role.permissions.filter(p => p === 'read').length).toBe(1);
    });

    test('should throw error when adding empty permission', () => {
      expect(() => {
        role.addPermission('');
      }).toThrow('Permission cannot be empty');
    });

    test('should remove permission successfully', () => {
      role.addPermission('read');
      role.addPermission('write');
      
      role.removePermission('read');
      
      expect(role.permissions).not.toContain('read');
      expect(role.permissions).toContain('write');
    });

    test('should throw error when removing non-existent permission', () => {
      expect(() => {
        role.removePermission('nonexistent');
      }).toThrow('Permission not found in this role');
    });

    test('should set permissions array', () => {
      const newPermissions = ['read', 'write', 'delete'];
      role.setPermissions(newPermissions);
      
      expect(role.permissions).toEqual(newPermissions);
    });

    test('should throw error when setting invalid permissions', () => {
      expect(() => {
        role.setPermissions('invalid');
      }).toThrow('Permissions must be an array');
    });

    test('should clear all permissions', () => {
      role.addPermission('read');
      role.addPermission('write');
      
      role.clearPermissions();
      
      expect(role.permissions).toEqual([]);
    });

    test('should get permissions count', () => {
      role.addPermission('read');
      role.addPermission('write');
      
      expect(role.getPermissionsCount()).toBe(2);
    });
  });

  describe('State Management', () => {
    let role;

    beforeEach(() => {
      role = new Role(1, 'Manager', 'Management role', 'company-123');
    });

    test('should activate and deactivate role', () => {
      role.deactivate();
      expect(role.isActive).toBe(false);
      
      role.activate();
      expect(role.isActive).toBe(true);
    });

    test('should update name successfully', () => {
      role.updateName('Senior Manager');
      expect(role.name).toBe('Senior Manager');
    });

    test('should throw error when updating with invalid name', () => {
      expect(() => {
        role.updateName('');
      }).toThrow('Role name is required');
      
      expect(() => {
        role.updateName('A');
      }).toThrow('Role name must be at least 2 characters long');
    });

    test('should update description successfully', () => {
      role.updateDescription('Updated description');
      expect(role.description).toBe('Updated description');
    });

    test('should allow null description', () => {
      role.updateDescription(null);
      expect(role.description).toBeNull();
    });

    test('should throw error for long description update', () => {
      const longDescription = 'a'.repeat(501);
      expect(() => {
        role.updateDescription(longDescription);
      }).toThrow('Role description cannot exceed 500 characters');
    });
  });

  describe('Company Validation', () => {
    test('should validate company belonging correctly', () => {
      const role = new Role(1, 'Admin', 'Admin role', 'company-123');
      
      expect(role.belongsToCompany('company-123')).toBe(true);
      expect(role.belongsToCompany('company-456')).toBe(false);
    });
  });

  describe('Information Methods', () => {
    let role;

    beforeEach(() => {
      role = new Role(1, 'Administrator', 'Full admin access', 'company-123', true);
      role.addPermission('read');
      role.addPermission('write');
      role.addPermission('delete');
    });

    test('should get basic info correctly', () => {
      const basicInfo = role.getBasicInfo();
      
      expect(basicInfo).toEqual({
        id: 1,
        name: 'Administrator',
        description: 'Full admin access',
        companyId: 'company-123',
        isActive: true,
        permissionsCount: 3,
        createdAt: expect.any(Date)
      });
    });

    test('should get complete info correctly', () => {
      const completeInfo = role.getCompleteInfo();
      
      expect(completeInfo).toEqual({
        id: 1,
        name: 'Administrator',
        description: 'Full admin access',
        companyId: 'company-123',
        isActive: true,
        permissionsCount: 3,
        createdAt: expect.any(Date),
        permissions: ['read', 'write', 'delete']
      });
    });

    test('should get stats correctly', () => {
      const stats = role.getStats();
      
      expect(stats).toEqual({
        permissionsCount: 3,
        isActive: true,
        createdAt: expect.any(Date),
        companyId: 'company-123'
      });
    });
  });

  describe('Validation Edge Cases', () => {
    test('should handle whitespace in names correctly', () => {
      const role = new Role(1, '  Admin  ', 'Description', 'company-123');
      expect(role.name).toBe('Admin'); // Should trim whitespace
    });

    test('should handle whitespace in description correctly', () => {
      const role = new Role(1, 'Admin', '  Description  ', 'company-123');
      expect(role.description).toBe('Description'); // Should trim whitespace
    });

    test('should validate permissions with special characters', () => {
      const role = new Role(1, 'Admin', 'Description', 'company-123');
      
      // Should allow permissions with special characters
      role.addPermission('user:read');
      role.addPermission('admin.write');
      role.addPermission('system_delete');
      
      expect(role.permissions).toContain('user:read');
      expect(role.permissions).toContain('admin.write');
      expect(role.permissions).toContain('system_delete');
    });
  });
});
