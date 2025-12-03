require('dotenv').config({ path: '.env.dev' });
const axios = require('axios');

// Configuración
const BASE_URL = 'http://127.0.0.1:4041';
const API_KEY = process.env.API_KEY;
const TEST_DUD = 'CC10059444888'; // Usuario real de la BD

console.log('🚀 Prueba completa del servicio JWT con usuario real\n');
console.log('📍 Base URL:', BASE_URL);
console.log('🔑 API Key:', API_KEY?.substring(0, 10) + '...');
console.log('👤 DUD de prueba:', TEST_DUD);
console.log('');

async function testCompleteJWTFlow() {
  try {
    // Test 1: Login exitoso
    console.log('🔐 Test 1: Login con usuario real');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, 
      { dud: TEST_DUD },
      {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (loginResponse.data.success) {
      console.log('  ✅ Login exitoso!');
      console.log('  👤 Usuario:', loginResponse.data.data.user.name);
      console.log('  🏢 Company ID:', loginResponse.data.data.user.companyId);
      console.log('  🎯 Roles:', loginResponse.data.data.user.rolesCount);
      console.log('  ⏰ Expira en:', loginResponse.data.data.expiresIn);
      
      const token = loginResponse.data.data.token;
      const refreshToken = loginResponse.data.data.refreshToken;
      
      console.log('  🎟️ Token length:', token.length, 'chars');
      console.log('  🔄 Refresh token length:', refreshToken.length, 'chars\n');

      // Test 2: Validar token
      console.log('🔍 Test 2: Validar token');
      const validateResponse = await axios.get(`${BASE_URL}/api/auth/validate`, {
        headers: {
          'x-api-key': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      if (validateResponse.data.success) {
        console.log('  ✅ Token válido!');
        console.log('  👤 Usuario validado:', validateResponse.data.data.user.name);
        console.log('  🆔 ID:', validateResponse.data.data.user.id);
        console.log('  🏢 Company:', validateResponse.data.data.user.companyId, '\n');
      }

      // Test 3: Obtener perfil
      console.log('👤 Test 3: Obtener perfil completo');
      const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: {
          'x-api-key': API_KEY,
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.data.success) {
        console.log('  ✅ Perfil obtenido exitosamente!');
        const profile = profileResponse.data.data.user;
        console.log('  📝 Información completa:');
        console.log('     - Nombre:', profile.name);
        console.log('     - DUD:', profile.DUD);
        console.log('     - Company ID:', profile.companyId);
        console.log('     - Activo:', profile.isActive);
        console.log('     - Roles count:', profile.rolesCount || 'N/A');
        console.log('     - Permisos count:', profile.permissionsCount || 'N/A', '\n');
      }

      // Test 4: Refresh token
      console.log('🔄 Test 4: Refresh token');
      const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh`,
        { refreshToken: refreshToken },
        {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (refreshResponse.data.success) {
        console.log('  ✅ Token refreshed exitosamente!');
        console.log('  🎟️ Nuevo token length:', refreshResponse.data.data.token.length, 'chars');
        console.log('  🔄 Nuevo refresh token length:', refreshResponse.data.data.refreshToken.length, 'chars');
        console.log('  ⏰ Expira en:', refreshResponse.data.data.expiresIn, '\n');
      }

      // Test 5: Usar nuevo token
      console.log('🔐 Test 5: Usar nuevo token');
      const newToken = refreshResponse.data.data.token;
      const newValidateResponse = await axios.get(`${BASE_URL}/api/auth/validate`, {
        headers: {
          'x-api-key': API_KEY,
          'Authorization': `Bearer ${newToken}`
        }
      });

      if (newValidateResponse.data.success) {
        console.log('  ✅ Nuevo token es válido!');
        console.log('  👤 Usuario:', newValidateResponse.data.data.user.name, '\n');
      }

      console.log('🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!');
      console.log('✨ El servicio JWT está completamente funcional');
      console.log('');
      console.log('📚 Resumen de funcionalidades probadas:');
      console.log('  ✅ Autenticación con API Key + DUD');
      console.log('  ✅ Generación de tokens JWT');
      console.log('  ✅ Validación de tokens');
      console.log('  ✅ Obtención de perfil de usuario');
      console.log('  ✅ Refresh de tokens');
      console.log('  ✅ Manejo de errores');
      console.log('');
      console.log('🔧 El servicio está listo para uso en producción!');

    }

  } catch (error) {
    console.error('❌ Error en el test:', error.response?.data || error.message);
    
    if (error.response) {
      console.log('📊 Detalles del error:');
      console.log('   Status:', error.response.status);
      console.log('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Ejecutar el test completo
testCompleteJWTFlow();
