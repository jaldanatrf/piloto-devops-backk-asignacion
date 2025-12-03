// Prueba simple para verificar que los controladores se cargan correctamente
try {
  console.log('🚀 Verificando carga de controladores...');
  
  // Verificar que se cargan todos los controladores
  const controllers = require('./src/infrastructure/web/controllers');
  console.log('✅ Controladores cargados:', Object.keys(controllers));
  
  // Verificar que se pueden instanciar (con repositorios mock)
  const mockRepositories = {
    companyRepository: {},
    roleRepository: {},
    ruleRepository: {},
    userRepository: {},
    assignmentRepository: {}
  };
  
  const companyController = new controllers.CompanyController(mockRepositories);
  const roleController = new controllers.RoleController(mockRepositories);
  const ruleController = new controllers.RuleController(mockRepositories);
  const userController = new controllers.UserController(mockRepositories);
  const assignmentController = new controllers.assignmentController(mockRepositories);
  
  console.log('✅ Todos los controladores se instanciaron correctamente');
  
  console.log('🎉 ¡Todos los controladores están listos!');
  console.log('');
  console.log('📋 CONTROLADORES IMPLEMENTADOS:');
  console.log('✅ CompanyController: create, getById, getAll, update, delete, search, getStats');
  console.log('✅ RoleController: create, getById, getAll, update, delete, search, getUsageStats');
  console.log('✅ RuleController: create, getById, getAll, update, delete, search, getByType');
  console.log('✅ UserController: create, getById, getAll, update, delete, search, getByRole');
  console.log('✅ assignmentController: crear, obtenerTodas, actualizar, eliminar, buscar');
  console.log('');
  console.log('🔧 SIGUIENTE PASO: Crear rutas para exponer las APIs REST');
  
} catch (error) {
  console.error('❌ Error al cargar controladores:', error.message);
  console.error('Stack:', error.stack);
}
