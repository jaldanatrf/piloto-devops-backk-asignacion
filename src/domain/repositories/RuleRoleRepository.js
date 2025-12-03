// Puerto para el repositorio de relaciones Rule-Role
class RuleRoleRepository {
  async save(ruleRole) {
    throw new Error('Method save must be implemented');
  }

  async findById(id) {
    throw new Error('Method findById must be implemented');
  }

  async findByRuleId(ruleId) {
    throw new Error('Method findByRuleId must be implemented');
  }

  async findByRoleId(roleId) {
    throw new Error('Method findByRoleId must be implemented');
  }

  async findByRuleAndRole(ruleId, roleId) {
    throw new Error('Method findByRuleAndRole must be implemented');
  }

  async delete(id) {
    throw new Error('Method delete must be implemented');
  }

  async deleteByRuleId(ruleId) {
    throw new Error('Method deleteByRuleId must be implemented');
  }

  async deleteByRoleId(roleId) {
    throw new Error('Method deleteByRoleId must be implemented');
  }

  async deleteByRuleAndRole(ruleId, roleId) {
    throw new Error('Method deleteByRuleAndRole must be implemented');
  }

  async bulkCreate(ruleRoles) {
    throw new Error('Method bulkCreate must be implemented');
  }
}

module.exports = RuleRoleRepository;
