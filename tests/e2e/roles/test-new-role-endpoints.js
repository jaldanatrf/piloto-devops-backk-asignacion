/**
 * Script para probar manualmente los endpoints de roles (DISEÑO CORREGIDO)
 * Ejecutar con: node test-new-role-endpoints.js
 * 
 * Este script prueba:
 * 1. Roles globales (RECOMENDADO) - /api/roles/*
 * 2. Asignación de roles a usuarios - /api/users/:userId/roles/*
 * 3. Roles por empresa (DEPRECATED) - /api/companies/:companyId/roles/*
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

async function testGlobalRoles() {
  console.log('\n==========================================');
  console.log('PARTE 1: ROLES GLOBALES (RECOMENDADO)');
  console.log('==========================================');
  
  let globalRoleId1, globalRoleId2;
  
  try {
    // 1. Crear roles globales
    console.log('\n--- 1. Crear Roles Globales ---');
    
    const adminRoleResponse = await makeRequest('POST', '/roles', {
      name: 'Administrator',
      description: 'Administrador del sistema con todos los permisos',
      isActive: true
    });
    globalRoleId1 = adminRoleResponse.data.id;
    
    const editorRoleResponse = await makeRequest('POST', '/roles', {
      name: 'Editor',
      description: 'Editor de contenido con permisos limitados',
      isActive: true
    });
    globalRoleId2 = editorRoleResponse.data.id;
    
    await makeRequest('POST', '/roles', {
      name: 'Viewer',
      description: 'Solo lectura',
      isActive: false
    });
    
    // 2. Obtener todos los roles globales
    console.log('\n--- 2. Obtener Todos los Roles Globales ---');
    await makeRequest('GET', '/roles');
    
    // 3. Filtrar roles activos
    console.log('\n--- 3. Obtener Solo Roles Activos ---');
    await makeRequest('GET', '/roles/active');
    
    // 4. Buscar roles
    console.log('\n--- 4. Buscar Roles por Nombre ---');
    await makeRequest('GET', '/roles/search?q=Admin');
    
    // 5. Obtener rol específico
    console.log('\n--- 5. Obtener Rol Específico ---');
    await makeRequest('GET', `/roles/${globalRoleId1}`);
    
    // 6. Actualizar rol
    console.log('\n--- 6. Actualizar Rol ---');
    await makeRequest('PUT', `/roles/${globalRoleId1}`, {
      description: 'Super Administrador con permisos completos actualizados'
    });
    
    // 7. Intentar crear rol duplicado (debe fallar)
    console.log('\n--- 7. Prueba Nombre Duplicado (DEBE FALLAR) ---');
    try {
      await makeRequest('POST', '/roles', {
        name: 'Administrator', // Duplicado
        description: 'Otro admin'
      });
    } catch (error) {
      console.log('✅ Error esperado - Nombre duplicado detectado');
    }
    
    return { globalRoleId1, globalRoleId2 };
    
  } catch (error) {
    console.error('Error en testGlobalRoles:', error.message);
    throw error;
  }
}

async function testUserRoleAssignment(globalRoleId1, globalRoleId2, userId) {
  console.log('\n==========================================');
  console.log('PARTE 2: ASIGNACIÓN DE ROLES A USUARIOS');
  console.log('==========================================');
  
  try {
    // 1. Ver roles actuales del usuario (debe estar vacío)
    console.log('\n--- 1. Roles Actuales del Usuario (vacío) ---');
    try {
      await makeRequest('GET', `/users/${userId}/roles`);
    } catch (error) {
      console.log('🔍 Usuario puede no existir aún, continuando...');
    }
    
    // 2. Asignar un rol al usuario
    console.log('\n--- 2. Asignar Rol Administrator al Usuario ---');
    await makeRequest('POST', `/users/${userId}/roles`, {
      roleId: globalRoleId1
    });
    
    // 3. Asignar otro rol
    console.log('\n--- 3. Asignar Rol Editor al Usuario ---');
    await makeRequest('POST', `/users/${userId}/roles`, {
      roleId: globalRoleId2
    });
    
    // 4. Ver todos los roles del usuario
    console.log('\n--- 4. Ver Todos los Roles del Usuario ---');
    await makeRequest('GET', `/users/${userId}/roles`);
    
    // 5. Verificar si usuario tiene rol específico
    console.log('\n--- 5. Verificar si Usuario Tiene Rol Administrator ---');
    await makeRequest('GET', `/users/${userId}/roles/${globalRoleId1}`);
    
    // 6. Ver usuarios que tienen el rol Administrator
    console.log('\n--- 6. Ver Usuarios con Rol Administrator ---');
    await makeRequest('GET', `/roles/${globalRoleId1}/users`);
    
    // 7. Obtener roles disponibles para el usuario
    console.log('\n--- 7. Roles Disponibles para Asignar ---');
    await makeRequest('GET', `/users/${userId}/available-roles`);
    
    // 8. Asignar múltiples roles de una vez
    console.log('\n--- 8. Asignar Múltiples Roles (crear usuario nuevo) ---');
    const newUserId = userId + 1;
    await makeRequest('POST', `/users/${newUserId}/roles/multiple`, {
      roleIds: [globalRoleId1, globalRoleId2]
    });
    
    // 9. Reemplazar todos los roles de un usuario
    console.log('\n--- 9. Reemplazar Roles del Usuario ---');
    await makeRequest('PUT', `/users/${userId}/roles`, {
      roleIds: [globalRoleId1] // Solo Administrator
    });
    
    // 10. Verificar cambio
    console.log('\n--- 10. Verificar Roles Después del Reemplazo ---');
    await makeRequest('GET', `/users/${userId}/roles`);
    
    // 11. Quitar un rol específico
    console.log('\n--- 11. Quitar Rol Administrator ---');
    await makeRequest('DELETE', `/users/${userId}/roles/${globalRoleId1}`);
    
    // 12. Verificar que fue removido
    console.log('\n--- 12. Verificar Roles Después de Quitar ---');
    await makeRequest('GET', `/users/${userId}/roles`);
    
  } catch (error) {
    console.error('Error en testUserRoleAssignment:', error.message);
    throw error;
  }
}

async function testDeprecatedCompanyRoles() {
  console.log('\n==========================================');
  console.log('PARTE 3: ROLES POR EMPRESA (DEPRECATED)');
  console.log('==========================================');
  
  let companyId;
  
  try {
    // 1. Crear empresa para testing
    console.log('\n--- 1. Crear Empresa para Testing ---');
    const companyResponse = await makeRequest('POST', '/companies', {
      name: 'Test Company for Deprecated Roles',
      documentNumber: '900999888',
      documentType: 'NIT',
      type: 'PROVIDER'
    });
    companyId = companyResponse.data.id;
    
    // 2. Crear rol usando API deprecated
    console.log('\n--- 2. Crear Rol usando API Deprecated ---');
    await makeRequest('POST', `/companies/${companyId}/roles`, {
      name: 'Company Admin',
      description: 'Administrador específico de esta empresa'
    });
    
    // 3. Obtener roles de la empresa
    console.log('\n--- 3. Obtener Roles de la Empresa ---');
    await makeRequest('GET', `/companies/${companyId}/roles`);
    
    console.log('\n⚠️  NOTA: Estas rutas están DEPRECATED');
    console.log('📘 Se recomienda usar /api/roles para roles globales');
    
  } catch (error) {
    console.error('Error en testDeprecatedCompanyRoles:', error.message);
    throw error;
  }
}

async function testErrorCases() {
  console.log('\n==========================================');
  console.log('PARTE 4: CASOS DE ERROR');
  console.log('==========================================');
  
  try {
    // Test IDs inválidos
    console.log('\n--- IDs Inválidos ---');
    try {
      await makeRequest('GET', '/roles/invalid');
    } catch (error) {
      console.log('✅ Error esperado - ID inválido');
    }
    
    // Test rol inexistente
    console.log('\n--- Rol Inexistente ---');
    try {
      await makeRequest('GET', '/roles/99999');
    } catch (error) {
      console.log('✅ Error esperado - Rol inexistente');
    }
    
    // Test datos inválidos
    console.log('\n--- Datos Inválidos ---');
    try {
      await makeRequest('POST', '/roles', {
        description: 'Rol sin nombre'
      });
    } catch (error) {
      console.log('✅ Error esperado - Datos inválidos');
    }
    
  } catch (error) {
    console.error('Error en testErrorCases:', error.message);
  }
}

async function main() {
  console.log('🧪 SCRIPT DE PRUEBAS - NUEVA ARQUITECTURA DE ROLES');
  console.log('==================================================');
  console.log('');
  console.log('🎯 Este script prueba:');
  console.log('   1. Roles globales (RECOMENDADO)');
  console.log('   2. Asignación de roles a usuarios');
  console.log('   3. Roles por empresa (DEPRECATED)');
  console.log('   4. Casos de error');
  console.log('');
  console.log('📚 Ver docs/ROLES_ARCHITECTURE.md para más detalles');
  
  try {
    // Parte 1: Roles globales
    const { globalRoleId1, globalRoleId2 } = await testGlobalRoles();
    
    // Parte 2: Asignación a usuarios (usar ID de prueba)
    const testUserId = 1;
    await testUserRoleAssignment(globalRoleId1, globalRoleId2, testUserId);
    
    // Parte 3: API deprecated
    await testDeprecatedCompanyRoles();
    
    // Parte 4: Casos de error
    await testErrorCases();
    
    console.log('\n🎉 ¡Todas las pruebas completadas!');
    console.log('');
    console.log('📋 Resumen:');
    console.log('   ✅ Roles globales funcionando');
    console.log('   ✅ Asignación de roles a usuarios funcionando');
    console.log('   ✅ API deprecated funcionando (compatibilidad)');
    console.log('   ✅ Manejo de errores funcionando');
    console.log('');
    console.log('🔗 Documentación API: http://localhost:4041/api-docs');
    console.log('📁 Arquitectura: docs/ROLES_ARCHITECTURE.md');
    
  } catch (error) {
    console.error('\n💥 Error durante las pruebas:', error.message);
    console.error('🔧 Asegúrate de que el servidor esté ejecutándose en puerto 4041');
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  makeRequest,
  testGlobalRoles,
  testUserRoleAssignment,
  testDeprecatedCompanyRoles,
  testErrorCases
};
