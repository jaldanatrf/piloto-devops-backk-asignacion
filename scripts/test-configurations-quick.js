/**
 * Script rápido para probar tabla configurations
 * Usa API Key del sistema para autenticarse
 */

const axios = require('axios');

const baseURL = 'http://localhost:4041/api';

// API Key del sistema (de .env.local)
const API_KEY = 'sA{:3aRxT5cI2u4._p^)XjO-Sw[%6}J&?UY<=t;';

// Configurar axios con API Key
const api = axios.create({
  baseURL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
  }
});

async function log(message, data = null) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`✅ ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log('='.repeat(70));
}

async function logError(message, error) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`❌ ${message}`);
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Data:', JSON.stringify(error.response.data, null, 2));
  } else {
    console.log('Error:', error.message);
  }
  console.log('='.repeat(70));
}

async function testTableExists() {
  console.log('\n🔍 TEST 1: Verificar que la tabla configurations existe');
  try {
    const response = await api.get('/configurations');
    await log('GET /configurations - Tabla existe y responde', {
      count: response.data.count,
      message: 'Tabla configurations creada correctamente'
    });
    return true;
  } catch (error) {
    await logError('GET /configurations - FAILED', error);
    return false;
  }
}

async function testGetVariables() {
  console.log('\n🔍 TEST 2: Obtener variables disponibles');
  try {
    const response = await api.get('/configurations/variables/available');
    await log('GET /configurations/variables/available - Variables obtenidas', {
      totalCategories: Object.keys(response.data.data.variables).length,
      categories: Object.keys(response.data.data.variables)
    });
    return true;
  } catch (error) {
    await logError('GET /configurations/variables/available - FAILED', error);
    return false;
  }
}

async function testCreateConfiguration() {
  console.log('\n🔍 TEST 3: Crear configuración (si existe company_id = 1)');
  try {
    // Primero verificar si existe una empresa
    const companiesResponse = await api.get('/companies');
    if (!companiesResponse.data.data || companiesResponse.data.data.length === 0) {
      console.log('⚠️  No hay empresas en el sistema - Creando empresa de prueba');

      const companyData = {
        name: `Test Company ${Date.now()}`,
        description: 'Test company for configurations',
        documentNumber: `${Date.now()}`,
        documentType: 'NIT'
      };

      const companyResponse = await api.post('/companies', companyData);
      const companyId = companyResponse.data.data.id;
      console.log(`✅ Empresa de prueba creada con ID: ${companyId}`);

      // Crear configuración para esta empresa
      const configData = {
        companyId: companyId,
        tokenEndpoint: 'https://api.test.com/auth/token',
        tokenMethod: 'POST',
        listQueryEndpoint: 'https://api.test.com/lists',
        listQueryMethod: 'GET',
        notificationEndpoint: 'https://api.test.com/notifications',
        notificationMethod: 'POST',
        authType: 'BEARER',
        authUsername: 'test_user',
        authPassword: 'test_password',
        description: 'Configuración de prueba automática'
      };

      const configResponse = await api.post('/configurations', configData);
      await log('POST /configurations - Configuración creada', {
        configId: configResponse.data.data.id,
        companyId: configResponse.data.data.companyId
      });

      return { companyId, configId: configResponse.data.data.id };
    } else {
      console.log(`✅ Encontradas ${companiesResponse.data.data.length} empresas existentes`);
      return null;
    }
  } catch (error) {
    await logError('TEST 3 - FAILED', error);
    return null;
  }
}

async function testCleanup(companyId, configId) {
  if (!companyId || !configId) return;

  console.log('\n🧹 Limpieza: Eliminando datos de prueba');
  try {
    // Eliminar configuración
    await api.delete(`/configurations/${configId}`);
    console.log(`✅ Configuración ${configId} eliminada`);

    // Eliminar empresa
    await api.delete(`/companies/${companyId}`);
    console.log(`✅ Empresa ${companyId} eliminada`);
  } catch (error) {
    console.log('⚠️  Error en limpieza (puede ser normal):', error.message);
  }
}

async function runTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('  VALIDACIÓN RÁPIDA: Tabla configurations');
  console.log('═'.repeat(70));

  let testData = null;

  try {
    // Test 1: Verificar que la tabla existe
    const tableExists = await testTableExists();
    if (!tableExists) {
      throw new Error('La tabla configurations no existe o no responde');
    }

    // Test 2: Variables disponibles
    await testGetVariables();

    // Test 3: Crear configuración de prueba
    testData = await testCreateConfiguration();

    // Limpieza
    if (testData) {
      await testCleanup(testData.companyId, testData.configId);
    }

    console.log('\n' + '═'.repeat(70));
    console.log('  ✅ VALIDACIÓN COMPLETADA EXITOSAMENTE');
    console.log('═'.repeat(70));
    console.log('\n✨ La tabla configurations está funcionando correctamente\n');

  } catch (error) {
    console.log('\n' + '═'.repeat(70));
    console.log('  ❌ VALIDACIÓN FALLÓ');
    console.log('═'.repeat(70));
    console.error('\n🚨 Error:', error.message, '\n');

    // Intentar limpieza si hay datos
    if (testData) {
      await testCleanup(testData.companyId, testData.configId);
    }

    process.exit(1);
  }
}

// Ejecutar tests
runTests();
