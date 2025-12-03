const RoleRepository = require('../../../domain/repositories/RoleRepository');
const Role = require('../../../domain/entities/Role');
const { ValidationError, NotFoundError } = require('../../../shared/errors');

class SequelizeRoleRepository extends RoleRepository {
  constructor(sequelizeModels) {
    super();
    this.RoleModel = sequelizeModels.Role;
    this.CompanyModel = sequelizeModels.Company;
    this.UserRoleModel = sequelizeModels.UserRole;
  }

  async save(role) {
    try {
      const roleData = {
        name: role.name,
        description: role.description,
        companyId: role.companyId,
        isActive: role.isActive
      };

      const savedRole = await this.RoleModel.create(roleData);
      
      return new Role(
        savedRole.id,
        savedRole.name,
        savedRole.description,
        savedRole.companyId,
        savedRole.isActive,
        savedRole.createdAt,
        savedRole.updatedAt
      );
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ValidationError(`Role with name '${role.name}' already exists in this company`);
      }
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new ValidationError(`Company with ID ${role.companyId} does not exist`);
      }
      throw error;
    }
  }

  async findById(id, companyId) {
    try {
      const whereClause = { id: id };
      if (companyId) {
        whereClause.companyId = companyId;
      }

      const roleData = await this.RoleModel.findOne({
        where: whereClause
      });
      
      if (!roleData) {
        return null;
      }

      return new Role(
        roleData.id,
        roleData.name,
        roleData.description,
        roleData.companyId,
        roleData.isActive,
        roleData.createdAt,
        roleData.updatedAt
      );
    } catch (error) {
      throw error;
    }
  }

  async findByName(name, companyId) {
    try {
      const roleData = await this.RoleModel.findOne({
        where: {
          name: name,
          companyId: companyId
        }
      });

      if (!roleData) {
        return null;
      }

      return new Role(
        roleData.id,
        roleData.name,
        roleData.description,
        roleData.companyId,
        roleData.isActive,
        roleData.createdAt,
        roleData.updatedAt
      );
    } catch (error) {
      throw error;
    }
  }

  async findByCompany(companyId, filters = {}) {
    try {
      const whereClause = { companyId: companyId };
      
      // Aplicar filtros
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }
      
      if (filters.name) {
        whereClause.name = {
          [this.RoleModel.sequelize.Sequelize.Op.LIKE]: `%${filters.name}%`
        };
      }

      const rolesData = await this.RoleModel.findAll({
        where: whereClause,
        order: [['name', 'ASC']]
      });

      return rolesData.map(roleData =>
        new Role(
          roleData.id,
          roleData.name,
          roleData.description,
          roleData.companyId,
          roleData.isActive,
          roleData.createdAt,
          roleData.updatedAt
        )
      );
    } catch (error) {
      throw error;
    }
  }

  async findAll(filters = {}) {
    try {
      const whereClause = {};
      
      // Aplicar filtros
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }
      
      if (filters.companyId) {
        whereClause.companyId = filters.companyId;
      }

      if (filters.name) {
        whereClause.name = {
          [this.RoleModel.sequelize.Sequelize.Op.LIKE]: `%${filters.name}%`
        };
      }

      const rolesData = await this.RoleModel.findAll({
        where: whereClause,
        include: [{
          model: this.CompanyModel,
          as: 'company',
          attributes: ['id', 'name']
        }],
        order: [['name', 'ASC']]
      });

      return rolesData.map(roleData => {
        const role = new Role(
          roleData.id,
          roleData.name,
          roleData.description,
          roleData.companyId,
          roleData.isActive,
          roleData.createdAt,
          roleData.updatedAt
        );

        // Agregar información de la compañía si está disponible
        if (roleData.company) {
          role.companyName = roleData.company.name;
        }

        return role;
      });
    } catch (error) {
      throw error;
    }
  }

  async update(id, companyId, updateData) {
    try {
      const whereClause = { id: id };
      if (companyId) {
        whereClause.companyId = companyId;
      }

      const [updatedRowsCount] = await this.RoleModel.update(updateData, {
        where: whereClause
      });

      if (updatedRowsCount === 0) {
        throw new NotFoundError(`Role with ID ${id} not found in this company`);
      }

      // Obtener el rol actualizado
      return await this.findById(id, companyId);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ValidationError(`Role with name '${updateData.name}' already exists in this company`);
      }
      throw error;
    }
  }

  async delete(id, companyId) {
    try {
      const whereClause = { id: id };
      if (companyId) {
        whereClause.companyId = companyId;
      }

      const deletedRowsCount = await this.RoleModel.destroy({
        where: whereClause
      });

      if (deletedRowsCount === 0) {
        throw new NotFoundError(`Role with ID ${id} not found in this company`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Método auxiliar para verificar si un rol existe
  async exists(id, companyId) {
    try {
      const whereClause = { id: id };
      if (companyId) {
        whereClause.companyId = companyId;
      }

      const count = await this.RoleModel.count({
        where: whereClause
      });
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  // Método auxiliar para obtener roles activos
  async findActiveByCompany(companyId) {
    return await this.findByCompany(companyId, { isActive: true });
  }

    // Implementación requerida por la interfaz: obtener roles activos por companyId
    async findActive(companyId) {
      return await this.findByCompany(companyId, { isActive: true });
    }

  // Método auxiliar para búsqueda de roles por texto
  async search(searchTerm, companyId = null, limit = 10) {
    try {
      const whereClause = {
        name: {
          [this.RoleModel.sequelize.Sequelize.Op.LIKE]: `%${searchTerm}%`
        }
      };

      if (companyId) {
        whereClause.companyId = companyId;
      }

      const rolesData = await this.RoleModel.findAll({
        where: whereClause,
        include: [{
          model: this.CompanyModel,
          as: 'company',
          attributes: ['id', 'name']
        }],
        limit: limit,
        order: [['name', 'ASC']]
      });

      return rolesData.map(roleData => {
        const role = new Role(
          roleData.id,
          roleData.name,
          roleData.description,
          roleData.companyId,
          roleData.isActive,
          roleData.createdAt,
          roleData.updatedAt
        );

        if (roleData.company) {
          role.companyName = roleData.company.name;
        }

        return role;
      });
    } catch (error) {
      throw error;
    }
  }

  // Método para obtener estadísticas de uso de roles
  async getUsageStats(roleId, companyId) {
    try {
      const role = await this.findById(roleId, companyId);
      if (!role) {
        throw new NotFoundError(`Role with ID ${roleId} not found in this company`);
      }

      // Contar cuántos usuarios tienen este rol
      const userCount = await this.UserRoleModel.count({
        where: { roleId: roleId }
      });

      return {
        roleId: roleId,
        roleName: role.name,
        companyId: role.companyId,
        usersCount: userCount,
        isActive: role.isActive,
        createdAt: role.createdAt
      };
    } catch (error) {
      throw error;
    }
  }

  // Método para verificar si un rol puede ser eliminado
  async canBeDeleted(roleId, companyId) {
    try {
      const usageStats = await this.getUsageStats(roleId, companyId);
      return usageStats.usersCount === 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obtener roles con filtrado, ordenamiento y paginación en BD
   * @param {number} companyId - ID de la empresa
   * @param {Object} options - Opciones de filtrado, ordenamiento y paginación
   * @param {Object} options.filters - Filtros a aplicar
   * @param {string} options.filters.name - Filtrar por nombre (LIKE)
   * @param {boolean} options.filters.isActive - Filtrar por estado activo
   * @param {Object} options.pagination - Configuración de paginación
   * @param {number} options.pagination.limit - Límite de resultados
   * @param {number} options.pagination.offset - Desplazamiento (offset)
   * @param {Object} options.sorting - Configuración de ordenamiento
   * @param {string} options.sorting.sortBy - Campo por el cual ordenar
   * @param {string} options.sorting.sortOrder - Orden: 'asc' o 'desc'
   * @returns {Promise<Object>} - Objeto con data (roles) y total (total sin paginar)
   */
  async findByCompanyFiltered(companyId, options = {}) {
    try {
      const {
        filters = {},
        pagination = { limit: 10, offset: 0 },
        sorting = { sortBy: 'name', sortOrder: 'asc' }
      } = options;

      // Construir cláusula WHERE con filtros
      const whereClause = { companyId };

      // Filtro por isActive
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }

      // Filtro por nombre (LIKE)
      if (filters.name && filters.name.trim()) {
        whereClause.name = {
          [this.RoleModel.sequelize.Sequelize.Op.like]: `%${filters.name.trim()}%`
        };
      }

      // Mapear sortBy a nombres de columnas reales en BD
      const sortByMapping = {
        'name': 'name',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'isActive': 'is_active'
      };

      const dbSortBy = sortByMapping[sorting.sortBy] || 'name';
      const dbSortOrder = sorting.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Obtener total de registros que coinciden con los filtros (sin paginación)
      const totalCount = await this.RoleModel.count({ where: whereClause });

      // Obtener roles aplicando filtros, ordenamiento y paginación
      const rolesData = await this.RoleModel.findAll({
        where: whereClause,
        order: [[this.RoleModel.sequelize.literal(dbSortBy), dbSortOrder]],
        limit: pagination.limit,
        offset: pagination.offset
      });

      const roles = rolesData.map(roleData => {
        // Access snake_case fields directly from dataValues
        const values = roleData.dataValues || roleData;
        return new Role(
          values.id,
          values.name,
          values.description,
          values.companyId,
          values.isActive,
          values.created_at,  // Use snake_case as returned by Sequelize
          values.updated_at   // Use snake_case as returned by Sequelize
        );
      });

      return {
        data: roles,
        total: totalCount
      };

    } catch (error) {
      console.error('Error in findByCompanyFiltered:', error);
      throw error;
    }
  }
}

module.exports = SequelizeRoleRepository;
