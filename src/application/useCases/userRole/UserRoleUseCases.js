/**
 * UserRoleUseCases - Casos de uso para la gestión de asignación de roles a usuarios
 * Maneja la relación N:M entre usuarios y roles
 */
class UserRoleUseCases {
  constructor(userRepository, roleRepository, userRoleRepository) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.userRoleRepository = userRoleRepository;
  }

  /**
   * Obtener todos los roles de un usuario
   */
  async getUserRoles(userId) {
    // Verificar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }

    // Obtener roles del usuario
    const userRoles = await this.userRoleRepository.getUserRoles(userId);
    
    return {
      success: true,
      data: {
        userId,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        roles: userRoles,
        roleCount: userRoles.length
      }
    };
  }

  /**
   * Verificar si un usuario tiene un rol específico
   */
  async hasUserRole(userId, roleId) {
    // Verificar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar que el rol existe
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error(`Rol con ID ${roleId} no encontrado`);
    }

    const hasRole = await this.userRoleRepository.hasUserRole(userId, roleId);
    
    return {
      success: true,
      data: {
        userId,
        roleId,
        hasRole,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        role: {
          id: role.id,
          name: role.name,
          description: role.description
        }
      }
    };
  }

  /**
   * Asignar un rol a un usuario
   */
  async assignRole(userId, roleId) {
    // Verificar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar que el rol existe y está activo
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error(`Rol con ID ${roleId} no encontrado`);
    }

    if (!role.isActive) {
      throw new Error(`No se puede asignar el rol '${role.name}' porque está inactivo`);
    }

    // Verificar que el usuario no tenga ya este rol
    const hasRole = await this.userRoleRepository.hasUserRole(userId, roleId);
    if (hasRole) {
      throw new Error(`El usuario ya tiene asignado el rol '${role.name}'`);
    }

    // Asignar el rol
    const userRole = await this.userRoleRepository.assignRole(userId, roleId);
    
    return {
      success: true,
      message: `Rol '${role.name}' asignado exitosamente al usuario`,
      data: {
        userRole,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        role: {
          id: role.id,
          name: role.name,
          description: role.description
        }
      }
    };
  }

  /**
   * Quitar un rol de un usuario
   */
  async removeRole(userId, roleId) {
    // Verificar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar que el rol existe
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error(`Rol con ID ${roleId} no encontrado`);
    }

    // Verificar que el usuario tiene este rol
    const hasRole = await this.userRoleRepository.hasUserRole(userId, roleId);
    if (!hasRole) {
      throw new Error(`El usuario no tiene asignado el rol '${role.name}'`);
    }

    // Quitar el rol
    await this.userRoleRepository.removeRole(userId, roleId);
    
    return {
      success: true,
      message: `Rol '${role.name}' removido exitosamente del usuario`,
      data: {
        userId,
        roleId,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        role: {
          id: role.id,
          name: role.name,
          description: role.description
        }
      }
    };
  }

  /**
   * Asignar múltiples roles a un usuario
   */
  async assignMultipleRoles(userId, roleIds) {
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      throw new Error('Se debe proporcionar al menos un ID de rol');
    }

    // Verificar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }

    const results = {
      assigned: [],
      skipped: [],
      errors: []
    };

    for (const roleId of roleIds) {
      try {
        // Verificar que el rol existe y está activo
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
          results.errors.push({ roleId, error: 'Rol no encontrado' });
          continue;
        }

        if (!role.isActive) {
          results.errors.push({ roleId, error: 'Rol inactivo' });
          continue;
        }

        // Verificar si ya tiene el rol
        const hasRole = await this.userRoleRepository.hasUserRole(userId, roleId);
        if (hasRole) {
          results.skipped.push({ 
            roleId, 
            roleName: role.name, 
            reason: 'Usuario ya tiene este rol' 
          });
          continue;
        }

        // Asignar el rol
        await this.userRoleRepository.assignRole(userId, roleId);
        results.assigned.push({ 
          roleId, 
          roleName: role.name 
        });

      } catch (error) {
        results.errors.push({ roleId, error: error.message });
      }
    }

    return {
      success: true,
      message: `Procesados ${roleIds.length} roles para el usuario`,
      data: {
        userId,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        results
      }
    };
  }

  /**
   * Reemplazar todos los roles de un usuario
   */
  async replaceUserRoles(userId, roleIds) {
    if (!Array.isArray(roleIds)) {
      throw new Error('roleIds debe ser un array');
    }

    // Verificar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }

    // Verificar que todos los roles existen y están activos
    for (const roleId of roleIds) {
      const role = await this.roleRepository.findById(roleId);
      if (!role) {
        throw new Error(`Rol con ID ${roleId} no encontrado`);
      }
      if (!role.isActive) {
        throw new Error(`No se puede asignar el rol '${role.name}' porque está inactivo`);
      }
    }

    // Obtener roles actuales del usuario
    const currentRoles = await this.userRoleRepository.getUserRoles(userId);
    const currentRoleIds = currentRoles.map(role => role.id);

    // Remover todos los roles actuales
    for (const currentRoleId of currentRoleIds) {
      await this.userRoleRepository.removeRole(userId, currentRoleId);
    }

    // Asignar los nuevos roles
    const assignedRoles = [];
    for (const roleId of roleIds) {
      await this.userRoleRepository.assignRole(userId, roleId);
      const role = await this.roleRepository.findById(roleId);
      assignedRoles.push(role);
    }

    return {
      success: true,
      message: 'Roles del usuario actualizados exitosamente',
      data: {
        userId,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        previousRoles: currentRoles,
        newRoles: assignedRoles,
        changes: {
          removed: currentRoles.length,
          added: assignedRoles.length
        }
      }
    };
  }

  /**
   * Obtener usuarios que tienen un rol específico
   */
  async getUsersByRole(roleId) {
    // Verificar que el rol existe
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error(`Rol con ID ${roleId} no encontrado`);
    }

    const users = await this.userRoleRepository.getUsersByRole(roleId);
    
    return {
      success: true,
      data: {
        roleId,
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          isActive: role.isActive
        },
        users,
        userCount: users.length
      }
    };
  }

  /**
   * Obtener roles disponibles para asignar a un usuario
   */
  async getAvailableRoles(userId) {
    // Verificar que el usuario existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`Usuario con ID ${userId} no encontrado`);
    }

    // Obtener todos los roles activos
    const allActiveRoles = await this.roleRepository.getByFilters({ isActive: true });
    
    // Obtener roles que ya tiene el usuario
    const userRoles = await this.userRoleRepository.getUserRoles(userId);
    const userRoleIds = userRoles.map(role => role.id);

    // Filtrar roles disponibles
    const availableRoles = allActiveRoles.filter(role => 
      !userRoleIds.includes(role.id)
    );

    return {
      success: true,
      data: {
        userId,
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        availableRoles,
        currentRoles: userRoles,
        counts: {
          available: availableRoles.length,
          current: userRoles.length,
          total: allActiveRoles.length
        }
      }
    };
  }
}

module.exports = UserRoleUseCases;
