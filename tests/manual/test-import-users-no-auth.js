const axios = require('axios');

/**
 * Script de prueba para el endpoint de importación de usuarios sin token
 */
async function testImportUsersEndpoint() {
  console.log('🧪 Probando endpoint de importación de usuarios SIN TOKEN\n');
  
  const BASE_URL = 'http://localhost:4041';
  const documentType = 'NIT';
  const documentNumber = '900123456'; // Cambia por un NIT válido de tu sistema
  
  try {
    console.log(`📤 Haciendo petición a: POST ${BASE_URL}/api/companies/import-users/${documentType}/${documentNumber}`);
    console.log('🔓 Sin token de autenticación (endpoint público)');
    
    const response = await axios.post(
      `${BASE_URL}/api/companies/import-users/${documentType}/${documentNumber}`,
      {}, // Body vacío
      {
        headers: {
          'Content-Type': 'application/json'
          // Sin Authorization header
        },
        timeout: 30000
      }
    );
    
    console.log('\n✅ Respuesta exitosa:');
    console.log(`📊 Status: ${response.status}`);
    console.log(`📥 Respuesta:`, JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n🎉 Importación completada exitosamente:');
      console.log(`   👥 Usuarios creados: ${response.data.data.created}`);
      console.log(`   👤 Usuarios existentes: ${response.data.data.existing}`);
      console.log(`   🏢 Empresa: ${response.data.data.company}`);
      console.log(`   📈 Total procesados: ${response.data.data.totalProcessed}`);
    }
    
  } catch (error) {
    console.error('\n❌ Error en la petición:');
    
    if (error.response) {
      console.log(`📊 Status: ${error.response.status}`);
      console.log(`📥 Error Response:`, JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n🚨 ERROR: El endpoint todavía requiere autenticación');
        console.log('   Verificar que el servidor esté reiniciado después de los cambios');
      } else if (error.response.status === 404) {
        console.log('\n ℹ️  La empresa no fue encontrada (normal si no existe en el sistema)');
      }
    } else if (error.request) {
      console.log('📡 Error de red - el servidor no está disponible');
      console.log('   Verificar que el servidor esté ejecutándose en:', BASE_URL);
    } else {
      console.log('⚠️  Error:', error.message);
    }
  }
}

/**
 * Prueba con diferentes tipos de documento
 */
async function testMultipleDocumentTypes() {
  console.log('\n🔄 Probando diferentes tipos de documento:\n');
  
  const testCases = [
    { documentType: 'NIT', documentNumber: '900123456' },
    { documentType: 'CC', documentNumber: '12345678' },
    { documentType: 'CE', documentNumber: '87654321' }
  ];
  
  for (const testCase of testCases) {
    console.log(`📋 Probando ${testCase.documentType}: ${testCase.documentNumber}`);
    
    try {
      const response = await axios.post(
        `http://localhost:4041/api/companies/import-users/${testCase.documentType}/${testCase.documentNumber}`,
        {},
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000
        }
      );
      
      console.log(`   ✅ Status: ${response.status} - ${response.data.message}\n`);
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ Status: ${error.response.status} - ${error.response.data.message}\n`);
      } else {
        console.log(`   ❌ Error: ${error.message}\n`);
      }
    }
  }
}

// Ejecutar pruebas
if (require.main === module) {
  console.log('🚀 PRUEBA DEL ENDPOINT DE IMPORTACIÓN DE USUARIOS');
  console.log('=' .repeat(60));
  
  testImportUsersEndpoint()
    .then(() => {
      console.log('\n' + '='.repeat(60));
      return testMultipleDocumentTypes();
    })
    .then(() => {
      console.log('✅ Pruebas completadas');
    })
    .catch(error => {
      console.error('❌ Error en las pruebas:', error.message);
    });
}

module.exports = {
  testImportUsersEndpoint,
  testMultipleDocumentTypes
};
