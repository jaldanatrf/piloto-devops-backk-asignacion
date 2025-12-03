/**
 * SequelizeUserRoleRepository - Implementación de UserRoleRepository usando Sequelize
 */
const UserRoleRepository = require('../../../domain/repositories/UserRoleRepository');
const { ValidationError } = require('../../../shared/errors');

class SequelizeUserRoleRepository extends UserRoleRepository {
  constructor(sequelize, models) {
    super(sequelize);
    this.sequelize = sequelize;
    this.models = models;
    this.User = models.User;
    this.Role = models.Role;
    this.UserRole = models.UserRole;
  }

  /**
   * Obtener todos los roles de un usuario
   */
  async getUserRoles(userId) {
    const user = await this.User.findByPk(userId, {
      include: [{
        model: this.Role,
        as: 'roles',
        through: {
          attributes: ['assignedAt']
        },
        where: {
          deletedAt: null
        },
        required: false
      }]
    });

    if (!user) {
      return [];
    }

    return user.roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      assignedAt: role.UserRole.assignedAt
    }));
  }

  /**
   * Obtener usuarios que tienen un rol específico
   */
  async getUsersByRole(roleId) {

    // Buscar usuarios activos asociados al rol
    const role = await this.Role.findByPk(roleId);
    if (!role) {
      return [];
    }

    // Filtrar usuarios activos que tienen el rol especificado
    // NOTA: NO filtrar por companyId del rol, ya que las reglas determinan
    // qué usuarios se notifican basándose en la asociación usuario-rol,
    // independientemente de la empresa del rol
    const users = await this.User.findAll({

      include: [{
        model: this.Role,
        as: 'roles',
        where: {
          id: roleId,
          is_active: true
        },
        through: {
          attributes: []
        },
        required: true
      }],
      where: {
        is_active: true
      }

    });


    return users.map(user => ({
      id: user.id,
      name: user.name,
      dud: user.dud || user.DUD,
      companyId: user.companyId,
      isActive: user.is_active === undefined ? user.isActive : user.is_active,
      // Si necesitas assignedAt, obténlo desde la tabla assignment
    }));
  }

  /**
   * Verificar si un usuario tiene un rol específico
   */
  async hasUserRole(userId, roleId) {
    const userRole = await this.UserRole.findOne({
      where: {
        userId,
        roleId
      },
      include: [{
        model: this.Role,
        where: {
          deletedAt: null
        }
      }]
    });

    return !!userRole;
  }

  /**
   * Asignar un rol a un usuario
   */
  async assignRole(userId, roleId) {
    const assignedAt = new Date();

    const userRole = await this.UserRole.create({
      userId,
      roleId,
      assignedAt
    });

    return {
      userId: userRole.userId,
      roleId: userRole.roleId,
      assignedAt: userRole.assignedAt,
      id: userRole.id
    };
  }

  /**
   * Quitar un rol de un usuario
   */
  async removeRole(userId, roleId) {
    const result = await this.UserRole.destroy({
      where: {
        userId,
        roleId
      }
    });

    return result > 0;
  }

  /**
   * Obtener estadísticas de asignación de roles
   */
  async getRoleAssignmentStats() {
    const stats = await this.Role.findAll({
      attributes: [
        'id',
        'name',
        'description',
        'isActive',
        [this.sequelize.fn('COUNT', this.sequelize.col('users.id')), 'userCount']
      ],
      include: [{
        model: this.User,
        as: 'users',
        attributes: [],
        required: false
      }],
      where: {
        deletedAt: null
      },
      group: ['Role.id', 'Role.name', 'Role.description', 'Role.isActive'],
      order: [
        [this.sequelize.literal('userCount'), 'DESC'],
        ['name', 'ASC']
      ]
    });

    return stats.map(stat => ({
      id: stat.id,
      name: stat.name,
      description: stat.description,
      isActive: stat.isActive,
      userCount: parseInt(stat.getDataValue('userCount') || 0)
    }));
  }

  /**
   * Obtener usuarios sin roles asignados
   */
  async getUsersWithoutRoles() {
    const users = await this.User.findAll({
      attributes: ['id', 'name', 'email', 'documentNumber', 'documentType'],
      include: [{
        model: this.Role,
        as: 'roles',
        required: false
      }],
      where: {
        deletedAt: null
      }
    });

    // Filtrar usuarios que no tienen roles
    return users
      .filter(user => !user.roles || user.roles.length === 0)
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        documentNumber: user.documentNumber,
        documentType: user.documentType
      }));
  }

  /**
   * Obtener roles no asignados (sin usuarios)
   */
  async getUnassignedRoles() {
    const roles = await this.Role.findAll({
      attributes: ['id', 'name', 'description', 'isActive'],
      include: [{
        model: this.User,
        as: 'users',
        required: false
      }],
      where: {
        deletedAt: null,
        isActive: true
      }
    });

    // Filtrar roles que no tienen usuarios
    return roles
      .filter(role => !role.users || role.users.length === 0)
      .map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive
      }));
  }

  /**
   * Contar roles de un usuario
   */
  async countUserRoles(userId) {
    const count = await this.UserRole.count({
      where: {
        userId
      },
      include: [{
        model: this.Role,
        where: {
          deletedAt: null
        }
      }]
    });

    return count;
  }

  /**
   * Contar usuarios de un rol
   */
  async countRoleUsers(roleId) {
    const count = await this.UserRole.count({
      where: {
        roleId
      },
      include: [{
        model: this.User,
        where: {
          deletedAt: null
        }
      }]
    });

    return count;
  }

  /**
   * Obtener historial de asignaciones de un usuario
   */
  async getUserRoleHistory(userId) {
    const userRoles = await this.UserRole.findAll({
      where: {
        userId
      },
      include: [{
        model: this.Role,
        attributes: ['id', 'name', 'description'],
        where: {
          deletedAt: null
        }
      }],
      order: [['assignedAt', 'DESC']]
    });

    return userRoles.map(userRole => ({
      id: userRole.Role.id,
      name: userRole.Role.name,
      description: userRole.Role.description,
      assignedAt: userRole.assignedAt,
      action: 'ASSIGNED'
    }));
  }

  /**
   * Buscar asignaciones por criterios
   */
  async searchAssignments(filters = {}) {
    const whereClause = {};
    const userWhere = {};
    const roleWhere = {};

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters.roleId) {
      whereClause.roleId = filters.roleId;
    }

    if (filters.userName) {
      userWhere.name = {
        [this.sequelize.Sequelize.Op.like]: `%${filters.userName}%`
      };
    }

    if (filters.roleName) {
      roleWhere.name = {
        [this.sequelize.Sequelize.Op.like]: `%${filters.roleName}%`
      };
    }

    if (filters.isActive !== undefined) {
      roleWhere.isActive = filters.isActive;
    }

    // Agregar condiciones de no eliminado
    userWhere.deletedAt = null;
    roleWhere.deletedAt = null;

    const options = {
      where: whereClause,
      include: [
        {
          model: this.User,
          attributes: ['id', 'name', 'email'],
          where: userWhere
        },
        {
          model: this.Role,
          attributes: ['id', 'name', 'description'],
          where: roleWhere
        }
      ],
      order: [['assignedAt', 'DESC']]
    };

    if (filters.limit) {
      options.limit = filters.limit;
    }

    const assignments = await this.UserRole.findAll(options);

    return assignments.map(assignment => ({
      userId: assignment.User.id,
      userName: assignment.User.name,
      userEmail: assignment.User.email,
      roleId: assignment.Role.id,
      roleName: assignment.Role.name,
      roleDescription: assignment.Role.description,
      assignedAt: assignment.assignedAt
    }));
  }

  /**
   * Verificar integridad de las asignaciones
   */
  async checkIntegrity() {
    const issues = [];

    // Verificar asignaciones con usuarios inexistentes
    const orphanUserRoles = await this.UserRole.findAll({
      include: [{
        model: this.User,
        required: false
      }],
      where: {
        '$User.id$': null
      }
    });

    issues.push(...orphanUserRoles.map(ur => ({
      ...ur.toJSON(),
      issue: 'ORPHAN_USER'
    })));

    // Verificar asignaciones con roles inexistentes o eliminados
    const orphanRoleAssignments = await this.UserRole.findAll({
      include: [{
        model: this.Role,
        required: false,
        paranoid: false
      }],
      where: {
        [this.sequelize.Sequelize.Op.or]: [
          { '$Role.id$': null },
          { '$Role.deletedAt$': { [this.sequelize.Sequelize.Op.ne]: null } }
        ]
      }
    });

    issues.push(...orphanRoleAssignments.map(ur => ({
      ...ur.toJSON(),
      issue: 'ORPHAN_ROLE'
    })));

    return issues;
  }

  /**
   * Limpiar asignaciones huérfanas
   */
  async cleanOrphanAssignments() {
    // Eliminar asignaciones con usuarios inexistentes o eliminados
    const orphanUserAssignments = await this.UserRole.destroy({
      include: [{
        model: this.User,
        required: false
      }],
      where: {
        [this.sequelize.Sequelize.Op.or]: [
          { '$User.id$': null },
          { '$User.deletedAt$': { [this.sequelize.Sequelize.Op.ne]: null } }
        ]
      }
    });

    // Eliminar asignaciones con roles inexistentes o eliminados
    const orphanRoleAssignments = await this.UserRole.destroy({
      include: [{
        model: this.Role,
        required: false,
        paranoid: false
      }],
      where: {
        [this.sequelize.Sequelize.Op.or]: [
          { '$Role.id$': null },
          { '$Role.deletedAt$': { [this.sequelize.Sequelize.Op.ne]: null } }
        ]
      }
    });

    return {
      orphanUserAssignments,
      orphanRoleAssignments,
      totalCleaned: orphanUserAssignments + orphanRoleAssignments
    };
  }

  /**
   * Crear múltiples relaciones usuario-rol en bulk
   * Maneja duplicados para SQL Server sin usar ignoreDuplicates
   */
  async bulkCreate(userRoles) {
    try {
      const userRoleData = userRoles.map(ur => ({
        userId: ur.userId,
        roleId: ur.roleId,
        assignedAt: ur.assignedAt || new Date()
      }));

      // Para SQL Server, manejar duplicados manualmente
      // Primero, verificar qué relaciones ya existen
      const existingRelationships = await this.UserRole.findAll({
        where: {
          userId: userRoles[0].userId, // Todos deben tener el mismo userId
          roleId: userRoleData.map(ur => ur.roleId)
        }
      });

      // Filtrar relaciones existentes
      const existingRoleIds = existingRelationships.map(rel => rel.roleId);
      const newUserRoleData = userRoleData.filter(ur => !existingRoleIds.includes(ur.roleId));

      let savedUserRoles = [];

      // Crear solo nuevas relaciones
      if (newUserRoleData.length > 0) {
        const createdUserRoles = await this.UserRole.bulkCreate(newUserRoleData, {
          returning: true
        });
        savedUserRoles = createdUserRoles;
      }

      // Retornar todas las relaciones (existentes + nuevas)
      const allRelationships = await this.UserRole.findAll({
        where: {
          userId: userRoles[0].userId,
          roleId: userRoleData.map(ur => ur.roleId)
        }
      });

      return allRelationships.map(ur => this._toUserRoleEntity(ur));
    } catch (error) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new ValidationError('One or more User IDs or Role IDs do not exist');
      }
      throw error;
    }
  }

  /**
   * Eliminar todas las relaciones de un usuario
   */
  async deleteByUserId(userId) {
    try {
      const result = await this.UserRole.destroy({
        where: { userId }
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Buscar relaciones por userId
   */
  async findByUserId(userId) {
    try {
      const userRoles = await this.UserRole.findAll({
        where: { userId },
        include: [
          {
            model: this.Role,
            as: 'role'
          }
        ]
      });

      return userRoles.map(ur => this._toUserRoleEntity(ur));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Método privado para convertir modelo de Sequelize a entidad de dominio
   */
  _toUserRoleEntity(sequelizeUserRole) {
    const UserRole = require('../../../domain/entities/UserRole');

    return new UserRole(
      sequelizeUserRole.id,
      sequelizeUserRole.userId,
      sequelizeUserRole.roleId,
      sequelizeUserRole.assignedAt || sequelizeUserRole.createdAt
    );
  }
}

module.exports = SequelizeUserRoleRepository;
