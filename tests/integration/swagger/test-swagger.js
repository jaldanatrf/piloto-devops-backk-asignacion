const axios = require('axios');

async function testSwaggerEndpoints() {
  const baseURL = 'http://localhost:4041';
  
  console.log('🧪 Probando endpoints de documentación...\n');
  
  try {
    // Probar página de inicio
    console.log('📤 Probando página de inicio...');
    const homeResponse = await axios.get(baseURL);
    console.log('✅ Página de inicio funciona correctamente');
    console.log(`📊 Status: ${homeResponse.status}`);
    console.log('');
    
    // Probar health check
    console.log('📤 Probando health check...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    console.log('✅ Health check funciona');
    console.log('📊 Respuesta:');
    console.log(JSON.stringify(healthResponse.data, null, 2));
    console.log('');
    
    // Probar OpenAPI spec JSON
    console.log('📤 Probando OpenAPI spec...');
    const specResponse = await axios.get(`${baseURL}/api-docs.json`);
    console.log('✅ OpenAPI spec disponible');
    console.log(`📊 Status: ${specResponse.status}`);
    console.log(`📋 Title: ${specResponse.data.info.title}`);
    console.log(`📋 Version: ${specResponse.data.info.version}`);
    console.log(`📋 Paths count: ${Object.keys(specResponse.data.paths).length}`);
    console.log('');
    
    // Probar Swagger UI (verificar que responde)
    console.log('📤 Probando Swagger UI...');
    const swaggerResponse = await axios.get(`${baseURL}/api-docs`);
    console.log('✅ Swagger UI disponible');
    console.log(`📊 Status: ${swaggerResponse.status}`);
    console.log('');
    
    console.log('🎉 ¡Todas las pruebas de documentación exitosas!');
    console.log('\n📋 RESUMEN:');
    console.log('✅ Página de inicio: http://localhost:4041/');
    console.log('✅ Health check: http://localhost:4041/health');
    console.log('✅ Swagger UI: http://localhost:4041/api-docs');
    console.log('✅ OpenAPI spec: http://localhost:4041/api-docs.json');
    console.log('\n🚀 ¡Tu API está completamente documentada y lista para usar!');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Data:', error.response.data);
    } else if (error.request) {
      console.error('📡 Error de conexión - ¿Está el servidor corriendo?');
    }
  }
}

testSwaggerEndpoints();
