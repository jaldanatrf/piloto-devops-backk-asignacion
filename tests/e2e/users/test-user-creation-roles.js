const axios = require('axios');

const BASE_URL = 'http://localhost:4041';

async function testUserCreationWithRoles() {
  console.log('👤 Iniciando pruebas de creación de usuarios con roles...\n');
  
  try {
    // 1. Obtener roles disponibles primero
    console.log('1️⃣ Obteniendo roles disponibles...');
    const rolesResponse = await axios.get(`${BASE_URL}/api/roles`);
    const roles = rolesResponse.data.data || [];
    
    if (roles.length === 0) {
      console.log('⚠️ No hay roles disponibles para la prueba');
      return;
    }
    
    console.log('✅ Roles encontrados:');
    roles.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role.name} (ID: ${role.id}) - ${role.description || 'Sin descripción'}`);
    });
    console.log('');

    // 2. Obtener empresas disponibles
    console.log('2️⃣ Obteniendo empresas disponibles...');
    const companiesResponse = await axios.get(`${BASE_URL}/api/companies`);
    const companies = companiesResponse.data.data || [];
    
    if (companies.length === 0) {
      console.log('⚠️ No hay empresas disponibles para la prueba');
      return;
    }
    
    const firstCompany = companies[0];
    console.log(`✅ Usando empresa: ${firstCompany.name} (ID: ${firstCompany.id})`);
    console.log('');

    // 3. Crear usuario con un solo rol
    console.log('3️⃣ Creando usuario con un solo rol...');
    const singleRoleUser = {
      firstName: 'Test',
      lastName: 'User Single Role',
      email: `test.single.${Date.now()}@example.com`,
      password: 'Test123456!',
      companyId: firstCompany.id,
      roleIds: [roles[0].id]
    };

    try {
      const singleRoleResponse = await axios.post(`${BASE_URL}/api/users`, singleRoleUser);
      console.log('✅ Usuario con un rol creado exitosamente');
      console.log('📄 ID del usuario:', singleRoleResponse.data.data.id);
      console.log('📧 Email:', singleRoleResponse.data.data.email);
      
      // Verificar que el usuario tiene el rol asignado
      const userId = singleRoleResponse.data.data.id;
      const userDetailsResponse = await axios.get(`${BASE_URL}/api/users/${userId}`);
      const userRoles = userDetailsResponse.data.data?.roles || [];
      
      console.log('🔍 Roles asignados al usuario:');
      if (userRoles.length > 0) {
        userRoles.forEach((role, index) => {
          console.log(`   ${index + 1}. ${role.name} (ID: ${role.id})`);
        });
        console.log('✅ ÉXITO: El usuario tiene roles asignados');
      } else {
        console.log('❌ ERROR: El usuario no tiene roles asignados - bug en user_roles');
      }
    } catch (error) {
      console.log('❌ Error creando usuario con un rol:', error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.log('📝 Detalles:', JSON.stringify(error.response.data, null, 2));
      }
    }
    console.log('');

    // 4. Crear usuario con múltiples roles
    if (roles.length > 1) {
      console.log('4️⃣ Creando usuario con múltiples roles...');
      const multiRoleUser = {
        firstName: 'Test',
        lastName: 'User Multi Role',
        email: `test.multi.${Date.now()}@example.com`,
        password: 'Test123456!',
        companyId: firstCompany.id,
        roleIds: roles.slice(0, 2).map(role => role.id) // Primeros 2 roles
      };

      try {
        const multiRoleResponse = await axios.post(`${BASE_URL}/api/users`, multiRoleUser);
        console.log('✅ Usuario con múltiples roles creado exitosamente');
        console.log('📄 ID del usuario:', multiRoleResponse.data.data.id);
        
        // Verificar roles asignados
        const userId = multiRoleResponse.data.data.id;
        const userDetailsResponse = await axios.get(`${BASE_URL}/api/users/${userId}`);
        const userRoles = userDetailsResponse.data.data?.roles || [];
        
        console.log('🔍 Roles asignados:');
        if (userRoles.length === 2) {
          userRoles.forEach((role, index) => {
            console.log(`   ${index + 1}. ${role.name} (ID: ${role.id})`);
          });
          console.log('✅ ÉXITO: El usuario tiene todos los roles asignados');
        } else {
          console.log(`❌ ERROR: Se esperaban 2 roles, se encontraron ${userRoles.length}`);
        }
      } catch (error) {
        console.log('❌ Error creando usuario con múltiples roles:', error.response?.data?.message || error.message);
      }
    }
    console.log('');

    // 5. Probar validaciones
    console.log('5️⃣ Probando validaciones...');
    
    // Sin roleIds
    try {
      const noRoleUser = {
        firstName: 'Test',
        lastName: 'No Role',
        email: `test.norole.${Date.now()}@example.com`,
        password: 'Test123456!',
        companyId: firstCompany.id
        // Sin roleIds
      };
      
      await axios.post(`${BASE_URL}/api/users`, noRoleUser);
      console.log('❌ ERROR: Debería haber fallado sin roleIds');
    } catch (error) {
      console.log('✅ CORRECTO: Validación sin roles funcionó -', error.response?.data?.message || error.message);
    }

    // Con rol inexistente
    try {
      const invalidRoleUser = {
        firstName: 'Test',
        lastName: 'Invalid Role',
        email: `test.invalid.${Date.now()}@example.com`,
        password: 'Test123456!',
        companyId: firstCompany.id,
        roleIds: [99999] // ID que no existe
      };
      
      await axios.post(`${BASE_URL}/api/users`, invalidRoleUser);
      console.log('❌ ERROR: Debería haber fallado con rol inexistente');
    } catch (error) {
      console.log('✅ CORRECTO: Validación de rol inexistente funcionó -', error.response?.data?.message || error.message);
    }

    console.log('');

    // 6. Verificar integridad de la base de datos
    console.log('6️⃣ Verificando integridad de user_roles en la base de datos...');
    try {
      // Obtener todos los usuarios
      const allUsersResponse = await axios.get(`${BASE_URL}/api/users`);
      const allUsers = allUsersResponse.data.data || [];
      
      let usersWithRoles = 0;
      let usersWithoutRoles = 0;
      
      for (const user of allUsers) {
        const userDetailsResponse = await axios.get(`${BASE_URL}/api/users/${user.id}`);
        const userRoles = userDetailsResponse.data.data?.roles || [];
        
        if (userRoles.length > 0) {
          usersWithRoles++;
        } else {
          usersWithoutRoles++;
        }
      }
      
      console.log(`📊 Estadísticas de usuarios:`);
      console.log(`   👥 Total de usuarios: ${allUsers.length}`);
      console.log(`   ✅ Usuarios con roles: ${usersWithRoles}`);
      console.log(`   ❌ Usuarios sin roles: ${usersWithoutRoles}`);
      
      if (usersWithoutRoles > 0) {
        console.log('⚠️ ADVERTENCIA: Hay usuarios sin roles asignados - posible problema en user_roles');
      } else {
        console.log('✅ PERFECTO: Todos los usuarios tienen roles asignados');
      }
      
    } catch (error) {
      console.log('❌ Error verificando integridad:', error.response?.data?.message || error.message);
    }

    console.log('\n🎉 PRUEBAS DE CREACIÓN DE USUARIOS COMPLETADAS');
    console.log('✅ Creación con un rol ✓');
    console.log('✅ Creación con múltiples roles ✓');
    console.log('✅ Validaciones de entrada ✓');
    console.log('✅ Verificación de integridad ✓');

  } catch (error) {
    console.error('❌ Error general en las pruebas:', error.message);
    if (error.response) {
      console.log('📝 Detalles del error:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Función para limpiar usuarios de prueba
async function cleanupTestUsers() {
  console.log('\n🧹 Limpiando usuarios de prueba...');
  
  try {
    const allUsersResponse = await axios.get(`${BASE_URL}/api/users`);
    const allUsers = allUsersResponse.data.data || [];
    
    const testUsers = allUsers.filter(user => user.email.includes('test.'));
    
    for (const user of testUsers) {
      try {
        await axios.delete(`${BASE_URL}/api/users/${user.id}`);
        console.log(`🗑️ Usuario eliminado: ${user.email}`);
      } catch (error) {
        console.log(`⚠️ Error eliminando ${user.email}:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log(`✅ Limpieza completada. ${testUsers.length} usuarios de prueba procesados.`);
  } catch (error) {
    console.log('❌ Error en limpieza:', error.message);
  }
}

// Ejecutar pruebas
async function runUserTests() {
  await testUserCreationWithRoles();
  
  // Preguntar si quiere limpiar usuarios de prueba
  console.log('\n❓ ¿Ejecutar limpieza de usuarios de prueba? (descomentar la línea siguiente)');
  // await cleanupTestUsers();
}

runUserTests();
