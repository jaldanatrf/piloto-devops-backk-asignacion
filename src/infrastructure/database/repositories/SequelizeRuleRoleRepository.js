const RuleRoleRepository = require('../../../domain/repositories/RuleRoleRepository');
const RuleRole = require('../../../domain/entities/RuleRole');
const { ValidationError, NotFoundError } = require('../../../shared/errors');

class SequelizeRuleRoleRepository extends RuleRoleRepository {
  constructor(models) {
    super();
    this.RuleRoleModel = models.RuleRole;
    this.RuleModel = models.Rule;
    this.RoleModel = models.Role;
  }

  async save(ruleRole) {
    try {
      const ruleRoleData = {
        ruleId: ruleRole.ruleId,
        roleId: ruleRole.roleId
      };

      const savedRuleRole = await this.RuleRoleModel.create(ruleRoleData);
      
      return this._toRuleRoleEntity(savedRuleRole);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new ValidationError(`Relationship between rule ${ruleRole.ruleId} and role ${ruleRole.roleId} already exists`);
      }
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new ValidationError(`Rule with ID ${ruleRole.ruleId} or Role with ID ${ruleRole.roleId} does not exist`);
      }
      throw error;
    }
  }

  async findById(id) {
    try {
      const ruleRole = await this.RuleRoleModel.findByPk(id);
      return ruleRole ? this._toRuleRoleEntity(ruleRole) : null;
    } catch (error) {
      throw error;
    }
  }

  async findByRuleId(ruleId) {
    try {
      const ruleRoles = await this.RuleRoleModel.findAll({
        where: { ruleId },
        include: [
          {
            model: this.RoleModel,
            as: 'role'
          }
        ]
      });
      
      return ruleRoles.map(rr => this._toRuleRoleEntity(rr));
    } catch (error) {
      throw error;
    }
  }

  async findByRoleId(roleId) {
    try {
      const ruleRoles = await this.RuleRoleModel.findAll({
        where: { roleId },
        include: [
          {
            model: this.RuleModel,
            as: 'rule'
          }
        ]
      });
      
      return ruleRoles.map(rr => this._toRuleRoleEntity(rr));
    } catch (error) {
      throw error;
    }
  }

  async findByRuleAndRole(ruleId, roleId) {
    try {
      const ruleRole = await this.RuleRoleModel.findOne({
        where: { ruleId, roleId }
      });
      
      return ruleRole ? this._toRuleRoleEntity(ruleRole) : null;
    } catch (error) {
      throw error;
    }
  }

  async delete(id) {
    try {
      const result = await this.RuleRoleModel.destroy({
        where: { id }
      });
      
      return result > 0;
    } catch (error) {
      throw error;
    }
  }

  async deleteByRuleId(ruleId) {
    try {
      const result = await this.RuleRoleModel.destroy({
        where: { ruleId }
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  async deleteByRoleId(roleId) {
    try {
      const result = await this.RuleRoleModel.destroy({
        where: { roleId }
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  async deleteByRuleAndRole(ruleId, roleId) {
    try {
      const result = await this.RuleRoleModel.destroy({
        where: { ruleId, roleId }
      });
      
      return result > 0;
    } catch (error) {
      throw error;
    }
  }

  async bulkCreate(ruleRoles) {
    try {
      const ruleRoleData = ruleRoles.map(rr => ({
        ruleId: rr.ruleId,
        roleId: rr.roleId
      }));

      // For SQL Server, we need to handle duplicates manually
      // First, check which relationships already exist
      const existingRelationships = await this.RuleRoleModel.findAll({
        where: {
          ruleId: ruleRoles[0].ruleId, // All should have the same ruleId
          roleId: ruleRoleData.map(rr => rr.roleId)
        }
      });

      // Filter out existing relationships
      const existingRoleIds = existingRelationships.map(rel => rel.roleId);
      const newRuleRoleData = ruleRoleData.filter(rr => !existingRoleIds.includes(rr.roleId));

      let savedRuleRoles = [];
      
      // Create only new relationships
      if (newRuleRoleData.length > 0) {
        const createdRuleRoles = await this.RuleRoleModel.bulkCreate(newRuleRoleData, {
          returning: true
        });
        savedRuleRoles = createdRuleRoles;
      }

      // Return all relationships (existing + new)
      const allRelationships = await this.RuleRoleModel.findAll({
        where: {
          ruleId: ruleRoles[0].ruleId,
          roleId: ruleRoleData.map(rr => rr.roleId)
        }
      });
      
      return allRelationships.map(rr => this._toRuleRoleEntity(rr));
    } catch (error) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new ValidationError('One or more Rule IDs or Role IDs do not exist');
      }
      throw error;
    }
  }

  // Método privado para convertir modelo de Sequelize a entidad de dominio
  _toRuleRoleEntity(sequelizeRuleRole) {
    return new RuleRole(
      sequelizeRuleRole.id,
      sequelizeRuleRole.ruleId,
      sequelizeRuleRole.roleId,
      sequelizeRuleRole.createdAt
    );
  }
}

module.exports = SequelizeRuleRoleRepository;
