const axios = require('axios');

/**
 * Script para verificar que la documentación Swagger esté actualizada correctamente
 */
async function verifySwaggerDocumentation() {
  console.log('📚 VERIFICANDO DOCUMENTACIÓN SWAGGER');
  console.log('=' .repeat(60));
  
  const baseUrl = 'http://localhost:4041';
  
  try {
    // Verificar Swagger externo
    console.log('\n🌐 Verificando Swagger EXTERNO...');
    const externalSwagger = await axios.get(`${baseUrl}/api-docs/external.json`);
    
    const externalPaths = externalSwagger.data.paths;
    const importEndpoint = externalPaths['/api/companies/import-users/{documentType}/{documentNumber}'];
    
    if (importEndpoint) {
      console.log('✅ Endpoint encontrado en Swagger externo');
      console.log(`📝 Descripción: ${importEndpoint.post.description}`);
      console.log(`🔓 Seguridad: ${importEndpoint.post.security ? 'Requerida' : 'NO requerida (público)'}`);
      
      // Verificar parámetros
      const params = importEndpoint.post.parameters;
      console.log(`📋 Parámetros definidos: ${params.length}`);
      params.forEach(param => {
        console.log(`   • ${param.name} (${param.schema.type}): ${param.description}`);
      });
    } else {
      console.log('❌ Endpoint NO encontrado en Swagger externo');
    }
    
    // Verificar Swagger interno (requiere autenticación básica)
    console.log('\n🔒 Verificando Swagger INTERNO...');
    
    const credentials = Buffer.from('admin:asignaciones2025').toString('base64');
    const internalSwagger = await axios.get(`${baseUrl}/api-docs/internal.json`, {
      headers: {
        'Authorization': `Basic ${credentials}`
      }
    });
    
    // Buscar el endpoint en la documentación interna
    const internalPaths = Object.keys(internalSwagger.data.paths);
    const importEndpoints = internalPaths.filter(path => path.includes('import-users'));
    
    console.log(`✅ Swagger interno accesible`);
    console.log(`📊 Total de paths: ${internalPaths.length}`);
    console.log(`🔍 Endpoints de import-users encontrados: ${importEndpoints.length}`);
    
    importEndpoints.forEach(endpoint => {
      const endpointData = internalSwagger.data.paths[endpoint];
      console.log(`\n📍 Endpoint: ${endpoint}`);
      if (endpointData.post) {
        console.log(`   📝 Resumen: ${endpointData.post.summary}`);
        console.log(`   🔒 Seguridad: ${endpointData.post.security ? JSON.stringify(endpointData.post.security) : 'No especificada'}`);
        console.log(`   🏷️  Tags: ${endpointData.post.tags?.join(', ')}`);
      }
    });
    
    // Verificar que hay al menos un endpoint sin autenticación
    const hasPublicEndpoint = importEndpoints.some(endpoint => {
      const endpointData = internalSwagger.data.paths[endpoint];
      return endpointData.post && (
        !endpointData.post.security || 
        endpointData.post.security.length === 0 ||
        endpointData.post.security.some(sec => Object.keys(sec).length === 0)
      );
    });
    
    console.log(`\n🔓 Endpoint público documentado: ${hasPublicEndpoint ? '✅ SÍ' : '❌ NO'}`);
    
    // Resumen final
    console.log('\n📊 RESUMEN DE DOCUMENTACIÓN');
    console.log('=' .repeat(60));
    console.log(`🌐 Swagger externo: ${importEndpoint ? '✅ Documentado' : '❌ Falta documentación'}`);
    console.log(`🔒 Swagger interno: ${importEndpoints.length > 0 ? '✅ Documentado' : '❌ Falta documentación'}`);
    console.log(`🔓 Endpoint público: ${hasPublicEndpoint ? '✅ Correctamente marcado' : '❌ Necesita corrección'}`);
    
    if (importEndpoint && importEndpoints.length > 0 && hasPublicEndpoint) {
      console.log('\n🎉 ¡ÉXITO! Documentación Swagger completamente actualizada');
    } else {
      console.log('\n⚠️  Algunas partes de la documentación necesitan corrección');
    }
    
  } catch (error) {
    console.error('\n❌ Error verificando Swagger:');
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      
      if (error.response.status === 401) {
        console.log('🔐 Error de autenticación - verificar credenciales de Swagger interno');
        console.log('   Usuario: admin');
        console.log('   Contraseña: asignaciones2025');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('📡 Servidor no disponible - verificar que esté ejecutándose');
    } else {
      console.log(`⚠️  Error: ${error.message}`);
    }
  }
}

/**
 * Verificar que los URLs de Swagger estén accesibles
 */
async function verifySwaggerUrls() {
  console.log('\n🌐 VERIFICANDO URLs DE SWAGGER');
  console.log('=' .repeat(40));
  
  const baseUrl = 'http://localhost:4041';
  const urls = [
    { name: 'Swagger Externo UI', url: `${baseUrl}/api-docs/external`, auth: false },
    { name: 'Swagger Externo JSON', url: `${baseUrl}/api-docs/external.json`, auth: false },
    { name: 'Swagger Interno UI', url: `${baseUrl}/api-docs/internal`, auth: true },
    { name: 'Swagger Interno JSON', url: `${baseUrl}/api-docs/internal.json`, auth: true }
  ];
  
  for (const item of urls) {
    try {
      const config = { timeout: 5000 };
      
      if (item.auth) {
        const credentials = Buffer.from('admin:asignaciones2025').toString('base64');
        config.headers = { 'Authorization': `Basic ${credentials}` };
      }
      
      const response = await axios.get(item.url, config);
      console.log(`✅ ${item.name}: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${item.name}: ${error.response?.status || error.code}`);
    }
  }
}

// Ejecutar verificaciones
if (require.main === module) {
  console.log('🔍 VERIFICACIÓN COMPLETA DE SWAGGER DOCUMENTATION');
  console.log('🎯 Verificando que el endpoint de importación esté correctamente documentado\n');
  
  verifySwaggerUrls()
    .then(() => verifySwaggerDocumentation())
    .then(() => {
      console.log('\n✅ Verificación de Swagger completada');
    })
    .catch(error => {
      console.error('\n❌ Error en verificación:', error.message);
    });
}

module.exports = {
  verifySwaggerDocumentation,
  verifySwaggerUrls
};
