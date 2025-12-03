/**
 * Script para probar manualmente los endpoints de roles
 * Ejecutar con: node test-role-endpoints.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4041/api';

// Configurar axios para mostrar errores completos
axios.defaults.timeout = 10000;

// Función helper para hacer requests
async function makeRequest(method, url, data = null) {
  try {
    console.log(`\n🔄 ${method.toUpperCase()} ${url}`);
    if (data) {
      console.log('📤 Data:', JSON.stringify(data, null, 2));
    }
    
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    console.log(`✅ Status: ${response.status}`);
    console.log('📥 Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log(`❌ Error: ${error.response?.status || error.code}`);
    console.log('📥 Error Response:', JSON.stringify(error.response?.data || error.message, null, 2));
    throw error;
  }
}

async function testRoleEndpoints() {
  console.log('🚀 Iniciando pruebas de endpoints de roles...\n');
  
  let companyId, roleId;
  
  try {
    // 1. Crear una empresa de prueba
    console.log('==========================================');
    console.log('1. CREAR EMPRESA DE PRUEBA');
    console.log('==========================================');
    
    const companyData = {
      name: 'Test Company for Roles',
      description: 'Empresa creada para probar endpoints de roles',
      documentNumber: '900111222',
      documentType: 'NIT',
      type: 'PAYER'
    };
    
    const companyResponse = await makeRequest('POST', '/companies', companyData);
    companyId = companyResponse.data.id;
    console.log(`📌 Company ID creado: ${companyId}`);
    
    // 2. Crear roles
    console.log('\n==========================================');
    console.log('2. CREAR ROLES');
    console.log('==========================================');
    
    const roleData = {
      name: 'Administrator',
      description: 'Rol de administrador con permisos completos',
      isActive: true
    };
    
    const roleResponse = await makeRequest('POST', `/companies/${companyId}/roles`, roleData);
    roleId = roleResponse.data.id;
    console.log(`📌 Role ID creado: ${roleId}`);
    
    // Crear más roles para testing
    await makeRequest('POST', `/companies/${companyId}/roles`, {
      name: 'Editor',
      description: 'Rol de editor con permisos limitados',
      isActive: true
    });
    
    await makeRequest('POST', `/companies/${companyId}/roles`, {
      name: 'Viewer',
      description: 'Rol de solo lectura',
      isActive: false
    });
    
    // 3. Obtener todos los roles
    console.log('\n==========================================');
    console.log('3. OBTENER TODOS LOS ROLES');
    console.log('==========================================');
    
    await makeRequest('GET', `/companies/${companyId}/roles`);
    
    // 4. Filtrar roles por estado activo
    console.log('\n==========================================');
    console.log('4. FILTRAR ROLES ACTIVOS');
    console.log('==========================================');
    
    await makeRequest('GET', `/companies/${companyId}/roles?isActive=true`);
    
    // 5. Obtener roles activos usando endpoint específico
    console.log('\n==========================================');
    console.log('5. ENDPOINT DE ROLES ACTIVOS');
    console.log('==========================================');
    
    await makeRequest('GET', `/companies/${companyId}/roles/active`);
    
    // 5.1. Obtener roles disponibles para asignación
    console.log('\n==========================================');
    console.log('5.1. ROLES DISPONIBLES PARA ASIGNACIÓN');
    console.log('==========================================');
    
    await makeRequest('GET', `/companies/${companyId}/roles/available`);
    
    // 6. Buscar roles por nombre
    console.log('\n==========================================');
    console.log('6. BUSCAR ROLES POR NOMBRE');
    console.log('==========================================');
    
    await makeRequest('GET', `/companies/${companyId}/roles/search?q=Admin`);
    
    // 7. Obtener rol específico por ID
    console.log('\n==========================================');
    console.log('7. OBTENER ROL POR ID');
    console.log('==========================================');
    
    await makeRequest('GET', `/companies/${companyId}/roles/${roleId}`);
    
    // 8. Actualizar rol
    console.log('\n==========================================');
    console.log('8. ACTUALIZAR ROL');
    console.log('==========================================');
    
    const updateData = {
      name: 'Super Administrator',
      description: 'Rol de super administrador con todos los permisos',
      isActive: true
    };
    
    await makeRequest('PUT', `/companies/${companyId}/roles/${roleId}`, updateData);
    
    // 9. Intentar crear rol con nombre duplicado (debe fallar)
    console.log('\n==========================================');
    console.log('9. PRUEBA DE NOMBRE DUPLICADO (DEBE FALLAR)');
    console.log('==========================================');
    
    try {
      await makeRequest('POST', `/companies/${companyId}/roles`, {
        name: 'Super Administrator', // Nombre duplicado
        description: 'Otro rol con nombre duplicado'
      });
    } catch (error) {
      console.log('✅ Error esperado - Nombre duplicado detectado correctamente');
    }
    
    // 10. Intentar obtener rol inexistente (debe fallar)
    console.log('\n==========================================');
    console.log('10. PRUEBA DE ROL INEXISTENTE (DEBE FALLAR)');
    console.log('==========================================');
    
    try {
      await makeRequest('GET', `/companies/${companyId}/roles/99999`);
    } catch (error) {
      console.log('✅ Error esperado - Rol inexistente detectado correctamente');
    }
    
    // 11. Crear un rol para eliminar
    console.log('\n==========================================');
    console.log('11. CREAR Y ELIMINAR ROL');
    console.log('==========================================');
    
    const tempRoleResponse = await makeRequest('POST', `/companies/${companyId}/roles`, {
      name: 'Temporary Role',
      description: 'Rol temporal para eliminar'
    });
    
    const tempRoleId = tempRoleResponse.data.id;
    
    // Eliminar el rol temporal
    await makeRequest('DELETE', `/companies/${companyId}/roles/${tempRoleId}`);
    
    // Verificar que fue eliminado
    try {
      await makeRequest('GET', `/companies/${companyId}/roles/${tempRoleId}`);
    } catch (error) {
      console.log('✅ Rol eliminado correctamente - No se encontró después de eliminar');
    }
    
    // 12. Obtener estado final de roles
    console.log('\n==========================================');
    console.log('12. ESTADO FINAL DE ROLES');
    console.log('==========================================');
    
    await makeRequest('GET', `/companies/${companyId}/roles`);
    
    console.log('\n🎉 ¡Todas las pruebas de roles completadas exitosamente!');
    
  } catch (error) {
    console.error('\n💥 Error durante las pruebas:', error.message);
    console.error('Asegúrate de que el servidor esté ejecutándose en puerto 4041');
    process.exit(1);
  }
}

// Función para probar casos de error específicos
async function testErrorCases() {
  console.log('\n==========================================');
  console.log('PRUEBAS DE CASOS DE ERROR');
  console.log('==========================================');
  
  try {
    // Prueba con empresa inexistente
    console.log('\n--- Prueba con empresa inexistente ---');
    try {
      await makeRequest('POST', '/companies/99999/roles', {
        name: 'Test Role'
      });
    } catch (error) {
      console.log('✅ Error esperado - Empresa inexistente');
    }
    
    // Prueba con datos inválidos
    console.log('\n--- Prueba con datos inválidos ---');
    try {
      await makeRequest('POST', '/companies/1/roles', {
        description: 'Rol sin nombre'
      });
    } catch (error) {
      console.log('✅ Error esperado - Datos inválidos');
    }
    
    // Prueba con IDs inválidos
    console.log('\n--- Prueba con IDs inválidos ---');
    try {
      await makeRequest('GET', '/companies/invalid/roles');
    } catch (error) {
      console.log('✅ Error esperado - ID de empresa inválido');
    }
    
  } catch (error) {
    console.error('Error en pruebas de casos de error:', error.message);
  }
}

// Función principal
async function main() {
  console.log('🧪 SCRIPT DE PRUEBAS MANUALES PARA ENDPOINTS DE ROLES');
  console.log('====================================================');
  
  try {
    await testRoleEndpoints();
    await testErrorCases();
    
    console.log('\n✨ Todas las pruebas completadas.');
    console.log('Para ver la documentación de la API, visita: http://localhost:4041/api-docs');
    
  } catch (error) {
    console.error('\n💥 Error general:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  makeRequest,
  testRoleEndpoints,
  testErrorCases
};
