const { ValidationError, NotFoundError, ConflictError } = require('../../../shared/errors');
const Role = require('../../../domain/entities/Role');
const { logToDatabase } = require('../../../shared/logger/logToDatabase');

class CreateRoleUseCase {
  constructor(roleRepository) {
    this.roleRepository = roleRepository;
  }
  
  async execute(roleData, companyId) {
    try {
      // Validaciones de entrada
      if (!roleData.name) {
        throw new ValidationError('Role name is required');
      }
      if (!companyId) {
        throw new ValidationError('Company ID is required');
      }
      // Verificar que el nombre del rol no exista en la misma compañía
      const existingRole = await this.roleRepository.findByName(roleData.name.trim(), companyId);
      if (existingRole) {
        throw new ConflictError(`Role with name '${roleData.name}' already exists in this company`);
      }
      // Crear la entidad
      const role = new Role(
        null, // ID será generado por el repositorio
        roleData.name.trim(),
        roleData.description?.trim() || null,
        companyId,
        roleData.isActive !== undefined ? roleData.isActive : true,
        new Date()
      );
      // Guardar usando el repositorio
      const savedRole = await this.roleRepository.save(role);
      await logToDatabase({ level: 'info', message: 'Rol creado', meta: { roleId: savedRole.id, roleData, companyId }, service: 'RoleUseCase' });
      return savedRole;
    } catch (error) {
      await logToDatabase({ level: 'error', message: 'Error creando rol', meta: { error: error.message, roleData, companyId }, service: 'RoleUseCase' });
      throw error;
    }
  }
}

class GetRoleByIdUseCase {
  constructor(roleRepository) {
    this.roleRepository = roleRepository;
  }
  
  async execute(roleId, companyId) {
    if (!roleId) {
      throw new ValidationError('Role ID is required');
    }

    if (!companyId) {
      throw new ValidationError('Company ID is required');
    }
    
    const role = await this.roleRepository.findById(roleId, companyId);
    
    if (!role) {
      throw new NotFoundError(`Role with ID ${roleId} not found in this company`);
    }
    
    return role;
  }
}

class GetAllRolesUseCase {
  constructor(roleRepository) {
    this.roleRepository = roleRepository;
  }
  
  async execute(companyId, filters = {}) {
    if (!companyId) {
      throw new ValidationError('Company ID is required');
    }
    
    return await this.roleRepository.findByCompany(companyId, filters);
  }
}

class UpdateRoleUseCase {
  constructor(roleRepository) {
    this.roleRepository = roleRepository;
  }
  
  async execute(roleId, companyId, updateData) {
    try {
      if (!roleId) {
        throw new ValidationError('Role ID is required');
      }
      if (!companyId) {
        throw new ValidationError('Company ID is required');
      }
      // Verificar que el rol existe en la compañía
      const existingRole = await this.roleRepository.findById(roleId, companyId);
      if (!existingRole) {
        throw new NotFoundError(`Role with ID ${roleId} not found in this company`);
      }
      // Si se está actualizando el nombre, verificar que no exista otro rol con ese nombre en la misma compañía
      if (updateData.name && updateData.name.trim() !== existingRole.name) {
        const roleWithSameName = await this.roleRepository.findByName(updateData.name.trim(), companyId);
        if (roleWithSameName && roleWithSameName.id !== roleId) {
          throw new ConflictError(`Role with name '${updateData.name}' already exists in this company`);
        }
      }
      // Actualizar usando el repositorio
      const updatedRole = await this.roleRepository.update(roleId, companyId, updateData);
      await logToDatabase({ level: 'info', message: 'Rol actualizado', meta: { roleId, updateData, companyId }, service: 'RoleUseCase' });
      return updatedRole;
    } catch (error) {
      await logToDatabase({ level: 'error', message: 'Error actualizando rol', meta: { error: error.message, roleId, updateData, companyId }, service: 'RoleUseCase' });
      throw error;
    }
  }
}

class DeleteRoleUseCase {
  constructor(roleRepository) {
    this.roleRepository = roleRepository;
  }
  
  async execute(roleId, companyId) {
    try {
      if (!roleId) {
        throw new ValidationError('Role ID is required');
      }
      if (!companyId) {
        throw new ValidationError('Company ID is required');
      }
      // Verificar que el rol existe en la compañía
      const existingRole = await this.roleRepository.findById(roleId, companyId);
      if (!existingRole) {
        throw new NotFoundError(`Role with ID ${roleId} not found in this company`);
      }
      // TODO: Verificar que el rol no esté siendo usado por usuarios en esta compañía
      // Esta validación se implementará cuando tengamos la relación User-Role
      const result = await this.roleRepository.delete(roleId, companyId);
      await logToDatabase({ level: 'info', message: 'Rol eliminado', meta: { roleId, companyId }, service: 'RoleUseCase' });
      return result;
    } catch (error) {
      await logToDatabase({ level: 'error', message: 'Error eliminando rol', meta: { error: error.message, roleId, companyId }, service: 'RoleUseCase' });
      throw error;
    }
  }
}

module.exports = {
  CreateRoleUseCase,
  GetRoleByIdUseCase,
  GetAllRolesUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase
};
