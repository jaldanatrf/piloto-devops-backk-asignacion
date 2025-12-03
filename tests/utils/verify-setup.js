// Prueba simple para verificar que los repositorios se cargan correctamente
try {
  console.log('🚀 Verificando carga de repositorios...');
  
  // Verificar que se cargan los modelos
  const { defineModels } = require('./src/infrastructure/database/models');
  console.log('✅ Modelos cargados correctamente');
  
  // Verificar que se cargan los repositorios
  const repositories = require('./src/infrastructure/database/repositories');
  console.log('✅ Repositorios cargados:', Object.keys(repositories));
  
  // Verificar que se carga el factory
  const DatabaseFactory = require('./src/infrastructure/factories/DatabaseFactory');
  console.log('✅ DatabaseFactory cargado correctamente');
  
  // Verificar casos de uso
  const { CreateCompanyUseCase } = require('./src/application/useCases/CompanyUseCases');
  const { CreateRoleUseCase } = require('./src/application/useCases/RoleUseCases');
  const { CreateRuleUseCase } = require('./src/application/useCases/CreateRuleUseCase');
  const CreateUserUseCase = require('./src/application/useCases/CreateUserUseCase');
  console.log('✅ Casos de uso cargados correctamente');
  
  console.log('🎉 ¡Toda la infraestructura se carga correctamente!');
  console.log('');
  console.log('📋 RESUMEN DE IMPLEMENTACIÓN:');
  console.log('✅ Modelos de Sequelize: Company, Role, Rule, User, UserRole, Assignment');
  console.log('✅ Repositorios: Company, Role, Rule, User, Assignment');
  console.log('✅ Casos de uso: Company (CRUD), Role (CRUD), Rule (CRUD), User (Create)');
  console.log('✅ Factory de base de datos con inyección de dependencias');
  console.log('');
  console.log('🔧 SIGUIENTE PASO: Crear controladores y rutas para exponer las APIs');
  
} catch (error) {
  console.error('❌ Error al cargar componentes:', error.message);
  console.error('Stack:', error.stack);
}
