require('dotenv').config({ path: '.env.dev' });
const DatabaseFactory = require('./src/infrastructure/factories/DatabaseFactory');

async function getValidDUDs() {
  let databaseService = null;
  
  try {
    console.log('🔍 Consultando usuarios válidos en la base de datos...\n');

    // Inicializar conexión a la base de datos
    databaseService = await DatabaseFactory.initializeDatabase();
    const repositories = DatabaseFactory.getRepositories(databaseService);
    
    // Buscar usuarios activos con DUD
    const users = await repositories.userRepository.findAll({ isActive: true });
    
    if (users.length === 0) {
      console.log('❌ No se encontraron usuarios activos en la base de datos');
      return;
    }

    console.log(`✅ Se encontraron ${users.length} usuarios activos:`);
    console.log('');

    users.slice(0, 10).forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   DUD: ${user.DUD}`);
      console.log(`   Company ID: ${user.companyId}`);
      console.log(`   Active: ${user.isActive}`);
      console.log('   ---');
    });

    if (users.length > 10) {
      console.log(`... y ${users.length - 10} usuarios más`);
    }

    console.log('\n📝 Para probar el JWT, puedes usar cualquiera de estos DUDs en el endpoint:');
    console.log('POST http://localhost:4041/api/auth/login');
    console.log('Headers: { "x-api-key": "sA{:3aRxT5cI2u4._p^)XjO-Sw[%6}J&?UY<=t;" }');
    console.log(`Body: { "dud": "${users[0].DUD}" }`);
    
    return users.slice(0, 5).map(u => u.DUD);
    
  } catch (error) {
    console.error('❌ Error consultando la base de datos:', error.message);
    if (error.message.includes('Failed to connect')) {
      console.log('\n💡 Asegúrate de que:');
      console.log('   1. El servidor de base de datos esté ejecutándose');
      console.log('   2. Las credenciales en .env.dev sean correctas');
      console.log('   3. La base de datos y tabla "users" existan');
    }
  } finally {
    if (databaseService) {
      await databaseService.shutdown();
    }
  }
}

// Ejecutar la consulta
getValidDUDs();
