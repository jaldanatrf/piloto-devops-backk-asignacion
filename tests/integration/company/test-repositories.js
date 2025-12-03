const DatabaseFactory = require('./src/infrastructure/factories/DatabaseFactory');

async function testRepositories() {
  console.log('🚀 Iniciando prueba de repositorios...');
  
  try {
    // Inicializar base de datos
    console.log('📊 Inicializando base de datos...');
    const databaseService = await DatabaseFactory.initializeDatabase();
    
    // Obtener repositorios
    const repositories = DatabaseFactory.getRepositories(databaseService);
    console.log('✅ Repositorios obtenidos:', Object.keys(repositories));
    
    // Obtener modelos
    const models = DatabaseFactory.getModels(databaseService);
    console.log('✅ Modelos obtenidos:', Object.keys(models));
    
    console.log('🎉 ¡Todos los repositorios se crearon correctamente!');
    
    // Cerrar conexión
    await databaseService.shutdown();
    console.log('🔒 Conexión cerrada.');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar la prueba si el archivo se ejecuta directamente
if (require.main === module) {
  testRepositories();
}

module.exports = testRepositories;
