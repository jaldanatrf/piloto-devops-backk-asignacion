const axios = require('axios');

const BASE_URL = 'http://localhost:4041';

async function testAPI() {
  console.log('🚀 Iniciando pruebas de la API...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Probando health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check OK:', healthResponse.data);
    console.log('');
    
    // Test 2: Crear una empresa
    console.log('2️⃣ Creando una empresa...');
    const companyData = {
      name: 'Empresa Test',
      documentNumber: '900123456-7',
      documentType: 'NIT',
      type: 'CORPORATION',
      description: 'Empresa de prueba para testing'
    };
    
    const companyResponse = await axios.post(`${BASE_URL}/api/companies`, companyData);
    console.log('✅ Empresa creada:', companyResponse.data);
    const companyId = companyResponse.data.data.id;
    console.log('');
    
    // Test 3: Crear un rol
    console.log('3️⃣ Creando un rol...');
    const roleData = {
      name: 'Administrador',
      description: 'Rol de administrador'
    };
    
    const roleResponse = await axios.post(`${BASE_URL}/api/companies/${companyId}/roles`, roleData);
    console.log('✅ Rol creado:', roleResponse.data);
    const roleId = roleResponse.data.data.id;
    console.log('');
    
    // Test 4: Crear una regla
    console.log('4️⃣ Creando una regla...');
    const ruleData = {
      name: 'Regla Test',
      description: 'Regla de prueba',
      type: 'BUSINESS'
    };
    
    const ruleResponse = await axios.post(`${BASE_URL}/api/companies/${companyId}/rules`, ruleData);
    console.log('✅ Regla creada:', ruleResponse.data);
    console.log('');
    
    // Test 5: Crear un usuario
    console.log('5️⃣ Creando un usuario...');
    const userData = {
      email: 'usuario@test.com',
      name: 'Usuario Test',
      password: 'password123'
    };
    
    const userResponse = await axios.post(`${BASE_URL}/api/users`, userData);
    console.log('✅ Usuario creado:', userResponse.data);
    const userId = userResponse.data.data.id;
    console.log('');
    
    // Test 6: Crear una asignación
    console.log('6️⃣ Creando una asignación...');
    const assignmentData = {
      userId: userId,
      roleId: roleId,
      companyId: companyId,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 año
    };
    
    const assignmentResponse = await axios.post(`${BASE_URL}/api/asignaciones`, assignmentData);
    console.log('✅ Asignación creada:', assignmentResponse.data);
    console.log('');
    
    // Test 7: Listar todos los datos
    console.log('7️⃣ Listando datos creados...');
    
    console.log('📋 Empresas:');
    const companiesResponse = await axios.get(`${BASE_URL}/api/companies`);
    console.log(companiesResponse.data);
    
    console.log('👥 Usuarios:');
    const usersResponse = await axios.get(`${BASE_URL}/api/users`);
    console.log(usersResponse.data);
    
    console.log('🎭 Roles:');
    const rolesResponse = await axios.get(`${BASE_URL}/api/companies/${companyId}/roles`);
    console.log(rolesResponse.data);
    
    console.log('📜 Reglas:');
    const rulesResponse = await axios.get(`${BASE_URL}/api/companies/${companyId}/rules`);
    console.log(rulesResponse.data);
    
    console.log('📋 Asignaciones:');
    const assignmentsResponse = await axios.get(`${BASE_URL}/api/asignaciones`);
    console.log(assignmentsResponse.data);
    
    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('✅ El sistema puede crear usuarios, roles, reglas y empresas en la base de datos');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    console.log('\n📝 Para más detalles del error:', error);
  }
}

// Ejecutar pruebas
testAPI();
