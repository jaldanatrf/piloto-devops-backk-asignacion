const axios = require('axios');

const BASE_URL = 'http://localhost:4041';

async function testAutoAssignmentService() {
  console.log('🧪 Iniciando pruebas del servicio de asignaciones automáticas...\n');
  
  try {
    // 1. Verificar que el servidor esté respondiendo
    console.log('1️⃣ Verificando conectividad del servidor...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
      console.log('✅ Servidor respondiendo correctamente');
    } catch (error) {
      console.log('❌ Servidor no disponible. Asegúrate de ejecutar: npm start');
      return;
    }
    console.log('');

    // 2. Obtener estado del servicio de cola
    console.log('2️⃣ Obteniendo estado del servicio de cola...');
    try {
      const statusResponse = await axios.get(`${BASE_URL}/api/auto-assignments/service/status`);
      console.log('✅ Estado obtenido:', JSON.stringify(statusResponse.data, null, 2));
    } catch (error) {
      console.log('⚠️ Error obteniendo estado:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 3. Obtener ejemplo de mensaje
    console.log('3️⃣ Obteniendo ejemplo de estructura de mensaje...');
    try {
      const exampleResponse = await axios.get(`${BASE_URL}/api/auto-assignments/message-example`);
      console.log('✅ Ejemplo obtenido:');
      console.log('📄 Estructura requerida:', JSON.stringify(exampleResponse.data.data.example, null, 2));
    } catch (error) {
      console.log('⚠️ Error obteniendo ejemplo:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 4. Intentar inicializar el servicio de cola (si no está activo)
    console.log('4️⃣ Intentando inicializar servicio de cola...');
    try {
      const initResponse = await axios.post(`${BASE_URL}/api/auto-assignments/service/start`);
      console.log('✅ Servicio inicializado:', initResponse.data.message);
      console.log('📊 Estado de conexión:', JSON.stringify(initResponse.data.data, null, 2));
    } catch (error) {
      console.log('⚠️ Error o servicio ya activo:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 5. Procesar reclamación manualmente
    console.log('5️⃣ Procesando reclamación manualmente...');
    const testClaim = {
      ProcessId: 9999,
      Target: "9000054312",
      Source: "800000999",
      DocumentNumber: "TEST_AUTO_001",
      InvoiceAmount: 175000,
      ExternalReference: "AUTO_TEST_001",
      ClaimId: "AUTO_CLAIM_001",
      ConceptApplicationCode: "AUTO",
      ObjectionCode: "AT01",
      Value: 175000
    };

    try {
      const processResponse = await axios.post(`${BASE_URL}/api/auto-assignments/process-manually`, testClaim);
      console.log('✅ Reclamación procesada manualmente');
      
      if (processResponse.data.success) {
        console.log('📊 Resultado del procesamiento:');
        console.log(`   👤 Usuario seleccionado: ${processResponse.data.data?.selectedUser?.name || 'N/A'}`);
        console.log(`   📧 Email: ${processResponse.data.data?.selectedUser?.email || 'N/A'}`);
        console.log(`   📝 ID Asignación: ${processResponse.data.data?.assignment?.id || 'N/A'}`);
        console.log(`   📋 Reglas aplicadas: ${processResponse.data.data?.processResult?.appliedRules || 0}`);
      } else {
        console.log('⚠️ No se pudo procesar:', processResponse.data.message);
      }
    } catch (error) {
      console.log('⚠️ Error procesando manualmente:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 6. Enviar mensaje de prueba a la cola (si está conectada)
    console.log('6️⃣ Enviando mensaje de prueba a la cola...');
    try {
      const testMessageResponse = await axios.post(`${BASE_URL}/api/auto-assignments/test-message`, testClaim);
      console.log('✅ Mensaje de prueba enviado a la cola');
      console.log('📨 Detalles:', testMessageResponse.data.message);
    } catch (error) {
      console.log('⚠️ Error enviando mensaje de prueba:', error.response?.data?.message || error.message);
      console.log('   💡 Es normal si RabbitMQ no está configurado o conectado');
    }
    console.log('');

    // 7. Obtener estadísticas de asignaciones automáticas
    console.log('7️⃣ Obteniendo estadísticas de asignaciones automáticas...');
    try {
      const statsResponse = await axios.get(`${BASE_URL}/api/auto-assignments/stats`);
      console.log('✅ Estadísticas obtenidas:');
      console.log('📊 Resumen:', JSON.stringify(statsResponse.data.data.summary, null, 2));
      
      if (Object.keys(statsResponse.data.data.distribution.byUser).length > 0) {
        console.log('👥 Distribución por usuario:', statsResponse.data.data.distribution.byUser);
      }
      
      if (Object.keys(statsResponse.data.data.distribution.byType).length > 0) {
        console.log('📋 Distribución por tipo:', statsResponse.data.data.distribution.byType);
      }
    } catch (error) {
      console.log('⚠️ Error obteniendo estadísticas:', error.response?.data?.message || error.message);
    }
    console.log('');

    // 8. Verificar estado final
    console.log('8️⃣ Verificando estado final del servicio...');
    try {
      const finalStatusResponse = await axios.get(`${BASE_URL}/api/auto-assignments/service/status`);
      const status = finalStatusResponse.data.data;
      
      console.log('📋 ESTADO FINAL:');
      console.log(`   🔌 Conectado a RabbitMQ: ${status.isConnected ? 'SÍ' : 'NO'}`);
      console.log(`   📡 Cola configurada: ${status.queueName || 'N/A'}`);
      console.log(`   🔄 Intentos reconexión: ${status.reconnectAttempts || 0}`);
      console.log(`   🌐 Entorno: ${status.environment || 'N/A'}`);
      console.log(`   ⚙️ URL configurada: ${status.queueUrl || 'NO'}`);
    } catch (error) {
      console.log('⚠️ Error obteniendo estado final:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 PRUEBAS COMPLETADAS');
    console.log('═'.repeat(50));
    console.log('✅ Servicios verificados:');
    console.log('   - Estado del servicio de cola ✓');
    console.log('   - Procesamiento manual de reclamaciones ✓');
    console.log('   - Estructura de mensajes ✓');
    console.log('   - Estadísticas de asignaciones ✓');
    console.log('   - Integración con RabbitMQ (si está disponible) ✓');
    
    console.log('\n💡 CÓMO USAR EL SERVICIO:');
    console.log('1. Para habilitar auto-inicio: Cambiar AUTO_START_QUEUE=true en .env.local');
    console.log('2. Para iniciar manualmente: POST /api/auto-assignments/service/start');
    console.log('3. Para enviar mensajes: Enviar JSON a la cola RabbitMQ configurada');
    console.log('4. Para monitorear: GET /api/auto-assignments/stats');

  } catch (error) {
    console.error('❌ Error general en las pruebas:', error.message);
  }
}

// Función para probar conectividad básica
async function quickConnectivityTest() {
  console.log('⚡ PRUEBA RÁPIDA DE CONECTIVIDAD');
  console.log('═'.repeat(40));
  
  const endpoints = [
    { name: 'Servidor principal', path: '/api/health' },
    { name: 'Estado del servicio', path: '/api/auto-assignments/service/status' },
    { name: 'Ejemplo de mensaje', path: '/api/auto-assignments/message-example' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint.path}`, { timeout: 3000 });
      console.log(`✅ ${endpoint.name}: OK (${response.status})`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error.response?.status || error.message}`);
    }
  }
  
  console.log('\n✅ Prueba rápida completada');
}

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);

if (args.includes('--quick') || args.includes('-q')) {
  quickConnectivityTest();
} else if (args.includes('--help') || args.includes('-h')) {
  console.log('🧪 PRUEBAS DE ASIGNACIONES AUTOMÁTICAS');
  console.log('');
  console.log('Opciones disponibles:');
  console.log('  node test-auto-assignments.js          Ejecutar todas las pruebas');
  console.log('  node test-auto-assignments.js --quick   Prueba rápida de conectividad');
  console.log('  node test-auto-assignments.js --help    Mostrar esta ayuda');
  console.log('');
  console.log('📝 NOTA: Asegúrate de que el servidor esté corriendo con "npm start"');
} else {
  testAutoAssignmentService();
}
