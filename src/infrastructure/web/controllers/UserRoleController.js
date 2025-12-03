/**
 * Controlador para la gestión de asignación de roles a usuarios
 * 
 * Este controlador maneja la relación N:M entre usuarios y roles.
 * Un usuario puede tener múltiples roles, y un rol puede ser asignado a múltiples usuarios.
 * 
 * URLs:
 * - GET /api/users/:userId/roles - Obtener roles de un usuario
 * - POST /api/users/:userId/roles - Asignar rol a un usuario
 * - DELETE /api/users/:userId/roles/:roleId - Quitar rol de un usuario
 * - GET /api/users/:userId/available-roles - Obtener roles disponibles para asignar
 */

class UserRoleController {
  constructor(userRoleUseCases) {
    this.userRoleUseCases = userRoleUseCases;
  }

  // Obtener todos los roles de un usuario
  async getUserRoles(req, res, next) {
    try {
      const { userId } = req.params;
      
      const validUserId = parseInt(userId);
      if (isNaN(validUserId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid user ID format' }
        });
      }
      
      // Obtener roles del usuario
      const result = await this.userRoleUseCases.getUserRoles(validUserId);
      
      res.json({
        success: true,
        data: result.data,
        count: result.data.roles.length,
        message: result.message || `Roles for user ${validUserId}`
      });
    } catch (error) {
      next(error);
    }
  }

  // Asignar un rol a un usuario
  async assignRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;
      
      const validUserId = parseInt(userId);
      const validRoleId = parseInt(roleId);
      
      if (isNaN(validUserId) || isNaN(validRoleId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid user ID or role ID format' }
        });
      }
      
      // Asignar rol al usuario
      const result = await this.userRoleUseCases.assignRole(validUserId, validRoleId);
      
      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message || `Role ${validRoleId} assigned to user ${validUserId}`
      });
    } catch (error) {
      next(error);
    }
  }

  // Quitar un rol de un usuario
  async removeRole(req, res, next) {
    try {
      const { userId, roleId } = req.params;
      
      const validUserId = parseInt(userId);
      const validRoleId = parseInt(roleId);
      
      if (isNaN(validUserId) || isNaN(validRoleId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid user ID or role ID format' }
        });
      }
      
      // Remover rol del usuario
      const result = await this.userRoleUseCases.removeRole(validUserId, validRoleId);
      
      res.json({
        success: true,
        data: result.data,
        message: result.message || `Role ${validRoleId} removed from user ${validUserId}`
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener roles disponibles para asignar a un usuario
  async getAvailableRoles(req, res, next) {
    try {
      const { userId } = req.params;
      
      const validUserId = parseInt(userId);
      if (isNaN(validUserId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid user ID format' }
        });
      }
      
      // Obtener roles disponibles para el usuario
      const result = await this.userRoleUseCases.getAvailableRoles(validUserId);
      
      res.json({
        success: true,
        data: result.data,
        count: result.data.availableRoles.length,
        message: result.message || `Available roles for user ${validUserId}`
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener usuarios que tienen un rol específico
  async getUsersByRole(req, res, next) {
    try {
      const { roleId } = req.params;
      const { companyId } = req.query; // Filtro opcional por empresa
      
      const validRoleId = parseInt(roleId);
      if (isNaN(validRoleId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid role ID format' }
        });
      }
      
      const validCompanyId = companyId ? parseInt(companyId) : null;
      if (companyId && isNaN(validCompanyId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid company ID format' }
        });
      }
      
      // Obtener usuarios por rol
      const result = await this.userRoleUseCases.getUsersByRole(validRoleId);
      
      res.json({
        success: true,
        data: result.data,
        count: result.data.users.length,
        message: result.message || `Users with role ${validRoleId}${companyId ? ` in company ${validCompanyId}` : ''}`
      });
    } catch (error) {
      next(error);
    }
  }

  // Verificar si un usuario tiene un rol específico
  async hasRole(req, res, next) {
    try {
      const { userId, roleId } = req.params;
      
      const validUserId = parseInt(userId);
      const validRoleId = parseInt(roleId);
      
      if (isNaN(validUserId) || isNaN(validRoleId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid user ID or role ID format' }
        });
      }
      
      // Verificar si el usuario tiene el rol
      const result = await this.userRoleUseCases.hasUserRole(validUserId, validRoleId);
      
      res.json({
        success: true,
        data: result.data,
        message: result.message || `User ${validUserId} ${result.data.hasRole ? 'has' : 'does not have'} role ${validRoleId}`
      });
    } catch (error) {
      next(error);
    }
  }

  // Asignar múltiples roles a un usuario de una vez
  async assignMultipleRoles(req, res, next) {
    try {
      const { userId } = req.params;
      const { roleIds } = req.body;
      
      const validUserId = parseInt(userId);
      if (isNaN(validUserId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid user ID format' }
        });
      }
      
      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'roleIds must be a non-empty array' }
        });
      }
      
      const validRoleIds = roleIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (validRoleIds.length !== roleIds.length) {
        return res.status(400).json({
          success: false,
          error: { message: 'All role IDs must be valid integers' }
        });
      }
      
      // Asignar múltiples roles al usuario
      const result = await this.userRoleUseCases.assignMultipleRoles(validUserId, validRoleIds);
      
      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message || `${result.data.results.assigned.length} roles assigned to user ${validUserId}`
      });
    } catch (error) {
      next(error);
    }
  }

  // Reemplazar todos los roles de un usuario
  async replaceUserRoles(req, res, next) {
    try {
      const { userId } = req.params;
      const { roleIds } = req.body;
      
      const validUserId = parseInt(userId);
      if (isNaN(validUserId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid user ID format' }
        });
      }
      
      if (!Array.isArray(roleIds)) {
        return res.status(400).json({
          success: false,
          error: { message: 'roleIds must be an array' }
        });
      }
      
      const validRoleIds = roleIds.map(id => parseInt(id)).filter(id => !isNaN(id));
      if (validRoleIds.length !== roleIds.length) {
        return res.status(400).json({
          success: false,
          error: { message: 'All role IDs must be valid integers' }
        });
      }
      
      // Reemplazar roles del usuario
      const result = await this.userRoleUseCases.replaceUserRoles(validUserId, validRoleIds);
      
      res.json({
        success: true,
        data: result.data,
        message: result.message || `User ${validUserId} roles replaced. Now has ${result.data.newRoles.length} roles.`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserRoleController;
