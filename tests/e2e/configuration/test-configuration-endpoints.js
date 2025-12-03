const axios = require('axios');

/**
 * Script de prueba manual para endpoints de Configuration
 *
 * Ejecutar con: node tests/e2e/configuration/test-configuration-endpoints.js
 *
 * Aseg\u00farate de que el servidor est\u00e9 corriendo en http://localhost:4041
 */

const baseURL = 'http://localhost:4041/api';
let configId = null;
let companyId = null;

async function log(message, data = null) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`\u2705 ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log('='.repeat(60));
}

async function logError(message, error) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`\u274c ${message}`);
  if (error.response) {
    console.log('Status:', error.response.status);
    console.log('Data:', JSON.stringify(error.response.data, null, 2));
  } else {
    console.log('Error:', error.message);
  }
  console.log('='.repeat(60));
}

async function testGetAvailableVariables() {
  try {
    const response = await axios.get(`${baseURL}/configurations/variables/available`);
    await log('GET /configurations/variables/available - Variables disponibles obtenidas', response.data);
  } catch (error) {
    await logError('GET /configurations/variables/available - FAILED', error);
    throw error;
  }
}

async function testCreateCompany() {
  try {
    const timestamp = Date.now();
    const companyData = {
      name: `Config Test Company ${timestamp}`,
      description: 'Company for configuration testing',
      documentNumber: `${timestamp}`,
      documentType: 'NIT'
    };

    const response = await axios.post(`${baseURL}/companies`, companyData);
    companyId = response.data.data.id;
    await log('POST /companies - Empresa de prueba creada', { companyId });
  } catch (error) {
    await logError('POST /companies - FAILED', error);
    throw error;
  }
}

async function testCreateConfiguration() {
  try {
    const configData = {
      companyId: companyId,
      tokenEndpoint: 'https://api.gestorcuentas.com/api/Authentication/Authenticate',
      tokenMethod: 'POST',
      listQueryEndpoint: 'https://api.orchestrator.com/api/admonCtas/lists',
      listQueryMethod: 'GET',
      notificationEndpoint: 'https://api.orchestrator.com/api/admonCtas/disputes/assignments',
      notificationMethod: 'POST',
      authType: 'BEARER',
      authUsername: 'admin',
      authPassword: 'admin123',
      authAdditionalFields: {
        grant_type: 'password',
        additionalClaims: {
          nit: '{source}',
          user: '{documentNumber}',
          rol: 'emiter'
        }
      },
      pathVariableMapping: {
        documentType: 'assignment.documentType',
        documentNumber: 'assignment.documentNumber'
      },
      bodyVariableMapping: {
        assignments: 'assignment.assignments',
        claimId: 'assignment.claimId',
        assignedUser: 'user.dud'
      },
      customHeaders: {
        'Content-Type': 'application/json',
        'X-API-Version': '1.0'
      },
      isActive: true,
      description: 'Configuraci\u00f3n para integraci\u00f3n con Orquestador'
    };

    const response = await axios.post(`${baseURL}/configurations`, configData);
    configId = response.data.data.id;
    await log('POST /configurations - Configuraci\u00f3n creada exitosamente', response.data);
  } catch (error) {
    await logError('POST /configurations - FAILED', error);
    throw error;
  }
}

async function testGetConfigurationById() {
  try {
    const response = await axios.get(`${baseURL}/configurations/${configId}`);
    await log(`GET /configurations/${configId} - Configuraci\u00f3n obtenida por ID`, response.data);
  } catch (error) {
    await logError('GET /configurations/:id - FAILED', error);
    throw error;
  }
}

async function testGetConfigurationByCompanyId() {
  try {
    const response = await axios.get(`${baseURL}/configurations/company/${companyId}`);
    await log(`GET /configurations/company/${companyId} - Configuraci\u00f3n obtenida por Company ID`, response.data);
  } catch (error) {
    await logError('GET /configurations/company/:companyId - FAILED', error);
    throw error;
  }
}

async function testGetAllConfigurations() {
  try {
    const response = await axios.get(`${baseURL}/configurations`);
    await log('GET /configurations - Todas las configuraciones obtenidas', {
      count: response.data.count,
      data: response.data.data
    });
  } catch (error) {
    await logError('GET /configurations - FAILED', error);
    throw error;
  }
}

async function testGetActiveConfigurations() {
  try {
    const response = await axios.get(`${baseURL}/configurations/active`);
    await log('GET /configurations/active - Configuraciones activas obtenidas', {
      count: response.data.count,
      data: response.data.data
    });
  } catch (error) {
    await logError('GET /configurations/active - FAILED', error);
    throw error;
  }
}

async function testUpdateConfiguration() {
  try {
    const updateData = {
      description: 'Descripci\u00f3n actualizada - Test',
      customHeaders: {
        'Content-Type': 'application/json',
        'X-API-Version': '2.0',
        'X-Custom-Header': 'test-value'
      }
    };

    const response = await axios.put(`${baseURL}/configurations/${configId}`, updateData);
    await log(`PUT /configurations/${configId} - Configuraci\u00f3n actualizada`, response.data);
  } catch (error) {
    await logError('PUT /configurations/:id - FAILED', error);
    throw error;
  }
}

async function testDeactivateConfiguration() {
  try {
    const response = await axios.patch(`${baseURL}/configurations/${configId}/deactivate`);
    await log(`PATCH /configurations/${configId}/deactivate - Configuraci\u00f3n desactivada`, response.data);
  } catch (error) {
    await logError('PATCH /configurations/:id/deactivate - FAILED', error);
    throw error;
  }
}

async function testActivateConfiguration() {
  try {
    const response = await axios.patch(`${baseURL}/configurations/${configId}/activate`);
    await log(`PATCH /configurations/${configId}/activate - Configuraci\u00f3n activada`, response.data);
  } catch (error) {
    await logError('PATCH /configurations/:id/activate - FAILED', error);
    throw error;
  }
}

async function testDeleteConfiguration() {
  try {
    const response = await axios.delete(`${baseURL}/configurations/${configId}`);
    await log(`DELETE /configurations/${configId} - Configuraci\u00f3n eliminada`, response.data);
  } catch (error) {
    await logError('DELETE /configurations/:id - FAILED', error);
    throw error;
  }
}

async function testDeleteCompany() {
  try {
    const response = await axios.delete(`${baseURL}/companies/${companyId}`);
    await log(`DELETE /companies/${companyId} - Empresa de prueba eliminada`, response.data);
  } catch (error) {
    await logError('DELETE /companies/:id - FAILED', error);
    // No throw, es limpieza
  }
}

async function testErrorCases() {
  console.log('\n' + '='.repeat(60));
  console.log('\u26a0\ufe0f TESTING ERROR CASES');
  console.log('='.repeat(60));

  // Test 1: Crear configuraci\u00f3n sin empresa
  try {
    await axios.post(`${baseURL}/configurations`, {
      companyId: 999999,
      tokenEndpoint: 'https://api.example.com/token',
      listQueryEndpoint: 'https://api.example.com/lists',
      notificationEndpoint: 'https://api.example.com/notifications',
      authType: 'BEARER',
      authUsername: 'test',
      authPassword: 'test'
    });
    console.log('\u274c TEST FAILED: Should have thrown 404 for non-existent company');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('\u2705 Correctly rejected configuration for non-existent company');
    } else {
      console.log('\u274c Unexpected error:', error.message);
    }
  }

  // Test 2: Crear configuraci\u00f3n con URL inv\u00e1lida
  try {
    await axios.post(`${baseURL}/configurations`, {
      companyId: companyId,
      tokenEndpoint: 'not-a-valid-url',
      listQueryEndpoint: 'https://api.example.com/lists',
      notificationEndpoint: 'https://api.example.com/notifications',
      authType: 'BEARER',
      authUsername: 'test',
      authPassword: 'test'
    });
    console.log('\u274c TEST FAILED: Should have thrown 400 for invalid URL');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('\u2705 Correctly rejected invalid URL');
    } else {
      console.log('\u274c Unexpected error:', error.message);
    }
  }

  // Test 3: Obtener configuraci\u00f3n inexistente
  try {
    await axios.get(`${baseURL}/configurations/999999`);
    console.log('\u274c TEST FAILED: Should have thrown 404 for non-existent configuration');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('\u2705 Correctly returned 404 for non-existent configuration');
    } else {
      console.log('\u274c Unexpected error:', error.message);
    }
  }
}

async function runAllTests() {
  console.log('\n\u2728 INICIANDO TESTS DE CONFIGURATION ENDPOINTS \u2728\n');

  try {
    await testGetAvailableVariables();
    await testCreateCompany();
    await testCreateConfiguration();
    await testGetConfigurationById();
    await testGetConfigurationByCompanyId();
    await testGetAllConfigurations();
    await testGetActiveConfigurations();
    await testUpdateConfiguration();
    await testDeactivateConfiguration();
    await testActivateConfiguration();
    await testErrorCases();
    await testDeleteConfiguration();
    await testDeleteCompany();

    console.log('\n\u2728 TODOS LOS TESTS COMPLETADOS EXITOSAMENTE \u2728\n');
  } catch (error) {
    console.log('\n\u274c TESTS FAILED - Deteniendo ejecuci\u00f3n\n');
    // Limpiar recursos si existe
    if (configId) {
      try {
        await axios.delete(`${baseURL}/configurations/${configId}`);
        console.log('Limpieza: Configuraci\u00f3n eliminada');
      } catch (e) {
        // Ignorar errores de limpieza
      }
    }
    if (companyId) {
      try {
        await axios.delete(`${baseURL}/companies/${companyId}`);
        console.log('Limpieza: Empresa eliminada');
      } catch (e) {
        // Ignorar errores de limpieza
      }
    }
    process.exit(1);
  }
}

// Ejecutar tests
runAllTests();
