console.log('Starting test...');

try {
  console.log('Loading configuration...');
  const config = require('../../../src/infrastructure/config');
  console.log('Configuration loaded successfully');

  console.log('Loading SequelizeAdapter...');
  const SequelizeAdapter = require('../../../src/infrastructure/database/SequelizeAdapter');
  console.log('SequelizeAdapter loaded successfully');

  console.log('Loading Company UseCases...');
  const { CreateCompanyUseCase, DeleteCompanyUseCase } = require('../../../src/application/useCases/CompanyUseCases');
  console.log('Company UseCases loaded successfully');

  console.log('Loading Rule UseCase...');
  const { CreateRuleUseCase } = require('../../../src/application/useCases/CreateRuleUseCase');
  console.log('Rule UseCase loaded successfully');

  console.log('All imports successful! ✅');
  
} catch (error) {
  console.error('Error during import:', error.message);
  console.error('Stack:', error.stack);
}
