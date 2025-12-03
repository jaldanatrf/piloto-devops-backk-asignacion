// Repositorios de infraestructura con Sequelize
const SequelizeCompanyRepository = require('./SequelizeCompanyRepository');
const SequelizeRoleRepository = require('./SequelizeRoleRepository');
const SequelizeRuleRepository = require('./SequelizeRuleRepository');
const SequelizeUserRepository = require('./SequelizeUserRepository');
const SequelizeUserRoleRepository = require('./SequelizeUserRoleRepository');
const SequelizeAssignmentRepository = require('./SequelizeAssignmentRepository');
const SequelizeRuleRoleRepository = require('./SequelizeRuleRoleRepository');
const SequelizeConfigurationRepository = require('./SequelizeConfigurationRepository');

module.exports = {
  SequelizeCompanyRepository,
  SequelizeRoleRepository,
  SequelizeRuleRepository,
  SequelizeUserRepository,
  SequelizeUserRoleRepository,
  SequelizeAssignmentRepository,
  SequelizeRuleRoleRepository,
  SequelizeConfigurationRepository
};
