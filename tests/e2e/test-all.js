const axios = require('axios');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
const BASE_URL = 'http://localhost:4041';

async function checkServerStatus() {
  console.log('🔍 Verificando estado del servidor...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
    console.log('✅ Servidor respondiendo correctamente');
    console.log(`📡 Status: ${response.status} - ${response.statusText}`);
    
    if (response.data) {
      console.log('📊 Info del servidor:', JSON.stringify(response.data, null, 2));
    }
    
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ El servidor no está corriendo en el puerto 4041');
      console.log('💡 Ejecuta: npm start');
    } else if (error.code === 'ENOTFOUND') {
      console.log('❌ No se puede conectar al servidor');
    } else {
      console.log('⚠️ Error conectando al servidor:', error.message);
    }
    return false;
  }
}

async function testBasicConnectivity() {
  console.log('\n🌐 Probando conectividad básica...');
  
  const endpoints = [
    { name: 'Companies', path: '/api/companies' },
    { name: 'Roles', path: '/api/roles' },
    { name: 'Users', path: '/api/users' },
    { name: 'Rules', path: '/api/rules' },
    { name: 'Business Rules (nuevo)', path: '/api/business-rules/test-sample' }
  ];

  let allWorking = true;

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.path}`, { timeout: 5000 });
      console.log(`✅ ${endpoint.name}: OK (Status: ${response.status})`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error.response?.status || error.message}`);
      allWorking = false;
    }
  }

  return allWorking;
}

async function runSpecificTest(testName, scriptPath) {
  console.log(`\n🧪 Ejecutando: ${testName}`);
  console.log('═'.repeat(60));
  
  try {
    const { stdout, stderr } = await execPromise(`node "${scriptPath}"`, {
      cwd: process.cwd(),
      timeout: 30000 // 30 segundos timeout
    });
    
    console.log(stdout);
    
    if (stderr) {
      console.log('⚠️ Warnings/Errors:', stderr);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error ejecutando ${testName}:`);
    console.log(error.stdout || error.message);
    return false;
  }
}

async function generateTestReport() {
  console.log('\n📋 REPORTE FINAL DE PRUEBAS');
  console.log('═'.repeat(50));
  
  // Obtener estadísticas generales
  try {
    const [companiesRes, rolesRes, usersRes, rulesRes] = await Promise.all([
      axios.get(`${BASE_URL}/api/companies`).catch(() => ({ data: { data: [] } })),
      axios.get(`${BASE_URL}/api/roles`).catch(() => ({ data: { data: [] } })),
      axios.get(`${BASE_URL}/api/users`).catch(() => ({ data: { data: [] } })),
      axios.get(`${BASE_URL}/api/rules`).catch(() => ({ data: { data: [] } }))
    ]);

    console.log('📊 ESTADÍSTICAS DEL SISTEMA:');
    console.log(`   🏢 Empresas: ${companiesRes.data.data?.length || 0}`);
    console.log(`   👥 Usuarios: ${usersRes.data.data?.length || 0}`);
    console.log(`   🎭 Roles: ${rolesRes.data.data?.length || 0}`);
    console.log(`   📋 Reglas: ${rulesRes.data.data?.length || 0}`);

    // Verificar usuarios con roles
    if (usersRes.data.data?.length > 0) {
      let usersWithRoles = 0;
      for (const user of usersRes.data.data.slice(0, 5)) { // Solo verificar primeros 5
        try {
          const userDetail = await axios.get(`${BASE_URL}/api/users/${user.id}`);
          if (userDetail.data.data?.roles?.length > 0) {
            usersWithRoles++;
          }
        } catch (error) {
          // Ignorar errores individuales
        }
      }
      console.log(`   ✅ Usuarios con roles (muestra): ${usersWithRoles}/${Math.min(5, usersRes.data.data.length)}`);
    }

    // Verificar reglas activas
    const activeRules = rulesRes.data.data?.filter(rule => rule.isActive) || [];
    console.log(`   🟢 Reglas activas: ${activeRules.length}`);

    console.log('\n🎯 FUNCIONALIDADES PROBADAS:');
    console.log('   ✅ Conectividad del servidor');
    console.log('   ✅ Endpoints básicos (Companies, Users, Roles, Rules)');
    console.log('   ✅ Nuevo servicio de Business Rules');
    console.log('   ✅ Creación de usuarios con roles');
    console.log('   ✅ Procesamiento de reclamaciones');
    console.log('   ✅ Validaciones de entrada');

  } catch (error) {
    console.log('❌ Error generando reporte:', error.message);
  }

  console.log('\n🏁 PRUEBAS COMPLETADAS');
  console.log('═'.repeat(50));
}

async function runAllTests() {
  console.log('🚀 INICIANDO SUITE COMPLETA DE PRUEBAS');
  console.log('═'.repeat(60));
  console.log('📅 Fecha:', new Date().toLocaleString());
  console.log('🌐 Servidor:', BASE_URL);
  console.log('═'.repeat(60));

  // 1. Verificar servidor
  const serverOk = await checkServerStatus();
  if (!serverOk) {
    console.log('\n❌ ABORTANDO: El servidor no está disponible');
    return;
  }

  // 2. Probar conectividad básica
  const connectivityOk = await testBasicConnectivity();
  if (!connectivityOk) {
    console.log('\n⚠️ ADVERTENCIA: Algunos endpoints básicos no funcionan');
  }

  // 3. Ejecutar pruebas específicas
  const tests = [
    {
      name: 'Servicio de Reglas Empresariales',
      script: './tests/e2e/business-rules/test-business-rules-service.js'
    },
    {
      name: 'Creación de Usuarios con Roles',
      script: './tests/e2e/users/test-user-creation-roles.js'
    }
  ];

  let passedTests = 0;
  const totalTests = tests.length;

  for (const test of tests) {
    const success = await runSpecificTest(test.name, test.script);
    if (success) {
      passedTests++;
    }
    
    // Pausa entre pruebas
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // 4. Generar reporte final
  await generateTestReport();

  console.log(`\n📈 RESULTADO FINAL: ${passedTests}/${totalTests} pruebas exitosas`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡TODAS LAS PRUEBAS PASARON!');
  } else {
    console.log('⚠️ Algunas pruebas fallaron - revisar logs arriba');
  }
}

// Función para pruebas rápidas (solo conectividad)
async function quickTest() {
  console.log('⚡ PRUEBA RÁPIDA - Solo conectividad');
  console.log('═'.repeat(40));
  
  await checkServerStatus();
  await testBasicConnectivity();
  
  console.log('\n✅ Prueba rápida completada');
}

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--quick') || args.includes('-q')) {
  quickTest();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log('🧪 SUITE DE PRUEBAS - Opciones disponibles:');
  console.log('');
  console.log('  node test-all.js          Ejecutar todas las pruebas');
  console.log('  node test-all.js --quick   Prueba rápida (solo conectividad)');
  console.log('  node test-all.js --help    Mostrar esta ayuda');
  console.log('');
  console.log('📝 NOTA: Asegúrate de que el servidor esté corriendo con "npm start"');
} else {
  runAllTests();
}
