const RuleRepository = require('../../../domain/repositories/RuleRepository');
const Rule = require('../../../domain/entities/Rule');
const { ValidationError, NotFoundError } = require('../../../shared/errors');

class SequelizeRuleRepository extends RuleRepository {
  constructor(sequelizeModels) {
    super();
    this.RuleModel = sequelizeModels.Rule;
    this.CompanyModel = sequelizeModels.Company;
    this.AssignmentModel = sequelizeModels.Assignment;
  }

  // Helper method to convert Sequelize model to Rule entity
  _toRuleEntity(ruleData) {
    return new Rule(
      ruleData.id,
      ruleData.name,
      ruleData.description,
      ruleData.companyId,
      ruleData.type,
      ruleData.isActive,
      ruleData.createdAt,
      ruleData.minimumAmount,
      ruleData.maximumAmount,
      ruleData.nitAssociatedCompany,
      ruleData.code
    );
  }

  async save(rule) {
    try {
      const ruleData = {
        name: rule.name,
        description: rule.description,
        type: rule.type,
        companyId: rule.companyId,
        isActive: rule.isActive,
        minimumAmount: rule.minimumAmount,
        maximumAmount: rule.maximumAmount,
        nitAssociatedCompany: rule.nitAssociatedCompany,
        code: rule.code
      };

      const savedRule = await this.RuleModel.create(ruleData);
      
      return this._toRuleEntity(savedRule);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ValidationError(`Rule with name '${rule.name}' already exists in this company`);
      }
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new ValidationError(`Company with ID ${rule.companyId} does not exist`);
      }
      throw error;
    }
  }

  async findById(id, companyId = null) {
    try {
      const whereClause = { id: id };
      
      if (companyId) {
        whereClause.companyId = companyId;
      }

      const ruleData = await this.RuleModel.findOne({
        where: whereClause
      });
      
      if (!ruleData) {
        return null;
      }

      return this._toRuleEntity(ruleData);
    } catch (error) {
      throw error;
    }
  }

  async findByName(name, companyId) {
    try {
      const ruleData = await this.RuleModel.findOne({
        where: { 
          name: name,
          companyId: companyId
        }
      });
      
      if (!ruleData) {
        return null;
      }

      return this._toRuleEntity(ruleData);
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
          [this.RuleModel.sequelize.Sequelize.Op.LIKE]: `%${filters.name}%`
        };
      }

      if (filters.type) {
        whereClause.type = filters.type;
      }

      const rulesData = await this.RuleModel.findAll({
        where: whereClause,
        order: [['name', 'ASC']]
      });

      if (!rulesData || !Array.isArray(rulesData)) {
        return [];
      }
      return rulesData.map(ruleData => this._toRuleEntity(ruleData));
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
          [this.RuleModel.sequelize.Sequelize.Op.LIKE]: `%${filters.name}%`
        };
      }

      if (filters.type) {
        whereClause.type = filters.type;
      }

      const rulesData = await this.RuleModel.findAll({
        where: whereClause,
        include: [{
          model: this.CompanyModel,
          as: 'company',
          attributes: ['id', 'name']
        }],
        order: [['name', 'ASC']]
      });

      return rulesData.map(ruleData => {
        const rule = this._toRuleEntity(ruleData);
        
        // Agregar información de la compañía si está disponible
        if (ruleData.company) {
          rule.companyName = ruleData.company.name;
        }
        
        return rule;
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

      const [updatedRowsCount] = await this.RuleModel.update(updateData, {
        where: whereClause
      });

      if (updatedRowsCount === 0) {
        throw new NotFoundError(`Rule with ID ${id} not found in this company`);
      }

      // Obtener la regla actualizada
      return await this.findById(id, companyId);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ValidationError(`Rule with name '${updateData.name}' already exists in this company`);
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

      const deletedRowsCount = await this.RuleModel.destroy({
        where: whereClause
      });

      if (deletedRowsCount === 0) {
        throw new NotFoundError(`Rule with ID ${id} not found in this company`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Método para obtener reglas con detalles de compañía
  async findWithCompanyDetails(filters = {}) {
    try {
      const whereClause = {};
      
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }
      
      if (filters.companyId) {
        whereClause.companyId = filters.companyId;
      }

      if (filters.name) {
        whereClause.name = {
          [this.RuleModel.sequelize.Sequelize.Op.LIKE]: `%${filters.name}%`
        };
      }

      const rulesData = await this.RuleModel.findAll({
        where: whereClause,
        include: [{
          model: this.CompanyModel,
          as: 'company',
          attributes: ['id', 'name']
        }],
        order: [['name', 'ASC']]
      });

      return rulesData.map(ruleData => {
        const rule = this._toRuleEntity(ruleData);
        
        if (ruleData.company) {
          rule.companyName = ruleData.company.name;
        }
        
        return rule;
      });
    } catch (error) {
      throw error;
    }
  }

  // Método auxiliar para búsqueda de reglas por texto
  async search(searchTerm, companyId = null, limit = 10) {
    try {
      const whereClause = {
        [this.RuleModel.sequelize.Sequelize.Op.or]: [
          {
            name: {
              [this.RuleModel.sequelize.Sequelize.Op.LIKE]: `%${searchTerm}%`
            }
          },
          {
            description: {
              [this.RuleModel.sequelize.Sequelize.Op.LIKE]: `%${searchTerm}%`
            }
          }
        ]
      };

      if (companyId) {
        whereClause.companyId = companyId;
      }

      const rulesData = await this.RuleModel.findAll({
        where: whereClause,
        include: [{
          model: this.CompanyModel,
          as: 'company',
          attributes: ['id', 'name']
        }],
        limit: limit,
        order: [['name', 'ASC']]
      });

      return rulesData.map(ruleData => {
        const rule = this._toRuleEntity(ruleData);
        
        if (ruleData.company) {
          rule.companyName = ruleData.company.name;
        }
        
        return rule;
      });
    } catch (error) {
      throw error;
    }
  }

  // Método para obtener estadísticas de uso de reglas
  async getUsageStatistics(companyId = null) {
    try {
      const whereClause = {};
      if (companyId) {
        whereClause.companyId = companyId;
      }

      const totalRules = await this.RuleModel.count({
        where: whereClause
      });

      const activeRules = await this.RuleModel.count({
        where: {
          ...whereClause,
          isActive: true
        }
      });

      const inactiveRules = totalRules - activeRules;

      // Contar reglas por compañía si no se especifica una compañía
      let rulesByCompany = [];
      if (!companyId) {
        const companyCounts = await this.RuleModel.findAll({
          attributes: [
            'companyId',
            [this.RuleModel.sequelize.fn('COUNT', this.RuleModel.sequelize.col('id')), 'count']
          ],
          include: [{
            model: this.CompanyModel,
            as: 'company',
            attributes: ['name']
          }],
          group: ['companyId', 'company.id', 'company.name'],
          order: [[this.RuleModel.sequelize.fn('COUNT', this.RuleModel.sequelize.col('id')), 'DESC']]
        });

        rulesByCompany = companyCounts.map(item => ({
          companyId: item.companyId,
          companyName: item.company.name,
          count: parseInt(item.get('count'))
        }));
      }

      return {
        totalRules,
        activeRules,
        inactiveRules,
        rulesByCompany
      };
    } catch (error) {
      throw error;
    }
  }

  // Método para encontrar reglas por tipo
  async findByType(type, companyId = null) {
    try {
      const whereClause = { type: type };
      
      if (companyId) {
        whereClause.companyId = companyId;
      }

      const rulesData = await this.RuleModel.findAll({
        where: whereClause,
        include: [{
          model: this.CompanyModel,
          as: 'company',
          attributes: ['id', 'name']
        }],
        order: [['name', 'ASC']]
      });

      return rulesData.map(ruleData => {
        const rule = this._toRuleEntity(ruleData);
        
        if (ruleData.company) {
          rule.companyName = ruleData.company.name;
        }
        
        return rule;
      });
    } catch (error) {
      throw error;
    }
  }

  // Método para obtener tipos de reglas disponibles
  async getAvailableTypes(companyId = null) {
    try {
      const whereClause = {};
      if (companyId) {
        whereClause.companyId = companyId;
      }

      const types = await this.RuleModel.findAll({
        attributes: ['type'],
        where: whereClause,
        group: ['type'],
        order: [['type', 'ASC']]
      });

      return types.map(item => item.type);
    } catch (error) {
      throw error;
    }
  }

  // Método para obtener estadísticas por tipo
  async getStatsByType(companyId = null) {
    try {
      const whereClause = {};
      if (companyId) {
        whereClause.companyId = companyId;
      }

      const stats = await this.RuleModel.findAll({
        attributes: [
          'type',
          [this.RuleModel.sequelize.fn('COUNT', this.RuleModel.sequelize.col('id')), 'count'],
          [this.RuleModel.sequelize.fn('SUM', this.RuleModel.sequelize.literal('CASE WHEN is_active = true THEN 1 ELSE 0 END')), 'activeCount']
        ],
        where: whereClause,
        group: ['type'],
        order: [['type', 'ASC']]
      });

      return stats.map(stat => ({
        type: stat.type,
        total: parseInt(stat.get('count')),
        active: parseInt(stat.get('activeCount')),
        inactive: parseInt(stat.get('count')) - parseInt(stat.get('activeCount'))
      }));
    } catch (error) {
      throw error;
    }
  }

  // Obtener reglas con roles asociados por companyId
  async getRulesWithRoles(companyId) {
    // Incluye los roles asociados a cada regla usando la asociación N:M a través de RuleRole
    const rulesData = await this.RuleModel.findAll({
      where: { companyId, isActive: true },
      include: [
        {
          model: this.RuleModel.sequelize.models.Role,
          as: 'roles',
          through: { attributes: [] }, // Solo trae los roles, no los datos de la tabla intermedia
        }
      ]
    });
    return rulesData.map(ruleData => {
      const rule = this._toRuleEntity(ruleData);
      rule.roles = (ruleData.roles || []).map(role => ({
        id: role.id,
        name: role.name,
        description: role.description
      }));
      return rule;
    });
  }

  /**
   * Obtener reglas con roles usando filtrado, ordenamiento y paginación en BD
   * @param {number} companyId - ID de la empresa
   * @param {Object} options - Opciones de filtrado, ordenamiento y paginación
   * @param {Object} options.filters - Filtros a aplicar
   * @param {string} options.filters.name - Filtrar por nombre (LIKE)
   * @param {string} options.filters.description - Filtrar por descripción (LIKE)
   * @param {string} options.filters.type - Filtrar por tipo (exacto)
   * @param {boolean} options.filters.isActive - Filtrar por estado activo
   * @param {Object} options.pagination - Configuración de paginación
   * @param {number} options.pagination.limit - Límite de resultados
   * @param {number} options.pagination.offset - Desplazamiento (offset)
   * @param {Object} options.sorting - Configuración de ordenamiento
   * @param {string} options.sorting.sortBy - Campo por el cual ordenar
   * @param {string} options.sorting.sortOrder - Orden: 'asc' o 'desc'
   * @returns {Promise<Object>} - Objeto con data (reglas) y total (total sin paginar)
   */
  async getRulesWithRolesFiltered(companyId, options = {}) {
    try {
      const {
        filters = {},
        pagination = { limit: 10, offset: 0 },
        sorting = { sortBy: 'createdAt', sortOrder: 'desc' }
      } = options;

      // Construir cláusula WHERE con filtros
      const whereClause = { companyId };

      // Filtro por isActive (por defecto solo activas)
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      } else {
        whereClause.isActive = true; // Por defecto solo activas
      }

      // Filtro por nombre (LIKE)
      if (filters.name && filters.name.trim()) {
        whereClause.name = {
          [this.RuleModel.sequelize.Sequelize.Op.like]: `%${filters.name.trim()}%`
        };
      }

      // Filtro por descripción (LIKE)
      if (filters.description && filters.description.trim()) {
        whereClause.description = {
          [this.RuleModel.sequelize.Sequelize.Op.like]: `%${filters.description.trim()}%`
        };
      }

      // Filtro por tipo (exacto)
      if (filters.type && filters.type.trim()) {
        whereClause.type = filters.type.toUpperCase();
      }

      // Mapear sortBy a nombres de columnas reales en BD
      const sortByMapping = {
        'name': 'name',
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'type': 'type',
        'isActive': 'is_active'
      };

      const dbSortBy = sortByMapping[sorting.sortBy] || 'created_at';
      const dbSortOrder = sorting.sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Obtener total de registros que coinciden con los filtros (sin paginación)
      const totalCount = await this.RuleModel.count({ where: whereClause });

      // Obtener reglas con roles, aplicando filtros, ordenamiento y paginación
      const rulesData = await this.RuleModel.findAll({
        where: whereClause,
        include: [
          {
            model: this.RuleModel.sequelize.models.Role,
            as: 'roles',
            through: { attributes: [] }, // Solo trae los roles, no los datos de la tabla intermedia
          }
        ],
        order: [[this.RuleModel.sequelize.literal(dbSortBy), dbSortOrder]],
        limit: pagination.limit,
        offset: pagination.offset
      });

      const rules = rulesData.map(ruleData => {
        const rule = this._toRuleEntity(ruleData);
        rule.roles = (ruleData.roles || []).map(role => ({
          id: role.id,
          name: role.name,
          description: role.description
        }));
        return rule;
      });

      return {
        data: rules,
        total: totalCount
      };

    } catch (error) {
      console.error('Error in getRulesWithRolesFiltered:', error);
      throw error;
    }
  }
}

module.exports = SequelizeRuleRepository;
