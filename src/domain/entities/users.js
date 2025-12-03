
class User {
    constructor(id, name, dud, companyId, isActive, roles, createdAt, updatedAt) {
        if (typeof id === 'object' && id !== null) {
            // If first argument is an object, extract fields
            const obj = id;
            this.id = obj.id || null;
            this.name = obj.name;
            // Accept both 'dud' and 'DUD' and store as received
            this.dud = obj.dud || obj.DUD;
            this.companyId = obj.companyId;
            this.isActive = obj.isActive !== undefined ? obj.isActive : true;
            this.roles = obj.roles || [];
            this.createdAt = obj.createdAt;
            this.updatedAt = obj.updatedAt;
        } else {
            this.id = id;
            this.name = name;
            this.dud = dud;
            this.companyId = companyId;
            this.isActive = isActive !== undefined ? isActive : true;
            this.roles = roles || [];
            this.createdAt = createdAt;
            this.updatedAt = updatedAt;
        }
        this.validate();
    }

    validate() {
        if (!this.name || this.name.trim().length === 0) {
            throw new Error('Name is required');
        }
        if (this.name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters long');
        }
        if (this.name.trim().length > 100) {
            throw new Error('Name cannot exceed 100 characters');
        }
        const nameRegex = /^[a-zA-ZÀ-ÿ\s.-]+$/;
        if (!nameRegex.test(this.name.trim())) {
            throw new Error('Name can only contain letters, spaces, dots and hyphens');
        }
        if (!this.dud || this.dud.trim().length === 0) {
            throw new Error('dud is required');
        }
        if (this.dud.trim().length < 5) {
            throw new Error('dud must be at least 5 characters long');
        }
        if (this.dud.trim().length > 30) {
            throw new Error('dud cannot exceed 30 characters');
        }
        const dudRegex = /^[0-9A-Za-z-]+$/;
        if (!dudRegex.test(this.dud.trim())) {
            throw new Error('dud can only contain numbers, letters and hyphens');
        }
        if (!this.companyId) {
            throw new Error('Company ID is required');
        }
        if (!Array.isArray(this.roles)) {
            throw new Error('Roles must be an array');
        }
    }

    activate() {
        this.isActive = true;
    }

    deactivate() {
        this.isActive = false;
    }

    addRole(role) {
        if (!role) {
            throw new Error('Role is required');
        }
        if (role.companyId && role.companyId !== this.companyId) {
            throw new Error('Role must belong to the same company as the user');
        }
        const existingRole = this.roles.find(r => r.id === role.id);
        if (existingRole) {
            throw new Error('Role is already assigned to this user');
        }
        this.roles.push(role);
    }

    removeRole(roleId) {
        if (!roleId) {
            throw new Error('Role ID is required');
        }
        const initialLength = this.roles.length;
        this.roles = this.roles.filter(r => r.id !== roleId);
        if (this.roles.length === initialLength) {
            throw new Error('Role not found for this user');
        }
    }

    hasRole(roleId) {
        return this.roles.some(r => r.id === roleId);
    }

    hasRoleByName(roleName) {
        return this.roles.some(r => r.name === roleName);
    }

    getRoles() {
        return this.roles;
    }

    getActiveRoles() {
        return this.roles.filter(r => r.isActive);
    }

    getRolesCount() {
        return this.roles.length;
    }

    getActiveRolesCount() {
        return this.getActiveRoles().length;
    }

    clearRoles() {
        this.roles = [];
    }

    getAllPermissions() {
        const permissions = new Set();
        this.getActiveRoles().forEach(role => {
            if (role.permissions && Array.isArray(role.permissions)) {
                role.permissions.forEach(permission => permissions.add(permission));
            }
        });
        return Array.from(permissions);
    }

    hasPermission(permission) {
        return this.getAllPermissions().includes(permission);
    }

    getBasicInfo() {
        return {
            id: this.id,
            name: this.name,
            dud: this.dud,
            companyId: this.companyId,
            isActive: this.isActive,
            rolesCount: this.getRolesCount(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    getCompleteInfo() {
        return {
            ...this.getBasicInfo(),
            roles: this.roles.map(role => role.getBasicInfo ? role.getBasicInfo() : role),
            permissions: this.getAllPermissions()
        };
    }

    belongsToCompany(companyId) {
        return this.companyId === companyId;
    }

    canPerformOperations() {
        return this.isActive && this.getActiveRolesCount() > 0;
    }

    getStats() {
        return {
            rolesCount: this.getRolesCount(),
            activeRolesCount: this.getActiveRolesCount(),
            permissionsCount: this.getAllPermissions().length,
            isActive: this.isActive,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = User;
