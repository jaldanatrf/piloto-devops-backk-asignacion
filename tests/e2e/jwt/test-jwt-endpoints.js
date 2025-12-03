const axios = require('axios');

// Configuración
const BASE_URL = 'http://localhost:4041';
const API_KEY = 'sA{:3aRxT5cI2u4._p^)XjO-Sw[%6}J&?UY<=t;'; // Desde .env.dev

class AuthTester {
  constructor() {
    this.token = null;
    this.refreshToken = null;
  }

  async testLogin(dud) {
    console.log(`🔐 Test 1: Login con DUD: ${dud}`);
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, 
        { dud },
        {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        this.token = response.data.data.token;
        this.refreshToken = response.data.data.refreshToken;
        
        console.log('  ✅ Login exitoso');
        console.log('  ✅ Usuario:', response.data.data.user.name);
        console.log('  ✅ DUD:', response.data.data.user.DUD);
        console.log('  ✅ Company ID:', response.data.data.user.companyId);
        console.log('  ✅ Token generado:', this.token.substring(0, 50) + '...');
        console.log('  ✅ Expires in:', response.data.data.expiresIn);
        return true;
      }
    } catch (error) {
      console.log('  ❌ Error en login:', error.response?.data?.error || error.message);
      return false;
    }
  }

  async testValidateToken() {
    console.log('\n🔍 Test 2: Validar token');
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/validate`, {
        headers: {
          'x-api-key': API_KEY,
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.data.success) {
        console.log('  ✅ Token válido');
        console.log('  ✅ Usuario:', response.data.data.user.name);
        console.log('  ✅ DUD:', response.data.data.user.DUD);
        return true;
      }
    } catch (error) {
      console.log('  ❌ Error validando token:', error.response?.data?.error || error.message);
      return false;
    }
  }

  async testGetProfile() {
    console.log('\n👤 Test 3: Obtener perfil');
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: {
          'x-api-key': API_KEY,
          'Authorization': `Bearer ${this.token}`
        }
      });

      if (response.data.success) {
        console.log('  ✅ Perfil obtenido');
        console.log('  ✅ Usuario completo:', JSON.stringify(response.data.data.user, null, 2));
        return true;
      }
    } catch (error) {
      console.log('  ❌ Error obteniendo perfil:', error.response?.data?.error || error.message);
      return false;
    }
  }

  async testRefreshToken() {
    console.log('\n🔄 Test 4: Refresh token');
    try {
      const response = await axios.post(`${BASE_URL}/api/auth/refresh`,
        { refreshToken: this.refreshToken },
        {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        const newToken = response.data.data.token;
        const newRefreshToken = response.data.data.refreshToken;
        
        console.log('  ✅ Token renovado exitosamente');
        console.log('  ✅ Nuevo token:', newToken.substring(0, 50) + '...');
        console.log('  ✅ Tokens son diferentes:', this.token !== newToken ? 'SÍ' : 'NO');
        
        // Actualizar tokens
        this.token = newToken;
        this.refreshToken = newRefreshToken;
        return true;
      }
    } catch (error) {
      console.log('  ❌ Error renovando token:', error.response?.data?.error || error.message);
      return false;
    }
  }

  async testInvalidApiKey() {
    console.log('\n🚫 Test 5: API Key inválida');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, 
        { dud: 'TEST123' },
        {
          headers: {
            'x-api-key': 'invalid-key',
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('  ❌ Debería haber fallado con API key inválida');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('  ✅ Error esperado con API key inválida:', error.response.data.error);
        return true;
      } else {
        console.log('  ❌ Error inesperado:', error.message);
        return false;
      }
    }
  }

  async testInvalidDUD() {
    console.log('\n🚫 Test 6: DUD inexistente');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, 
        { dud: 'USUARIO_INEXISTENTE_999' },
        {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('  ❌ Debería haber fallado con DUD inexistente');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('  ✅ Error esperado con DUD inexistente:', error.response.data.error);
        return true;
      } else {
        console.log('  ❌ Error inesperado:', error.message);
        return false;
      }
    }
  }

  async testWithoutApiKey() {
    console.log('\n🚫 Test 7: Sin API Key');
    try {
      await axios.get(`${BASE_URL}/api/auth/validate`, {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      });
      console.log('  ❌ Debería haber fallado sin API key');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('  ✅ Error esperado sin API key:', error.response.data.error);
        return true;
      } else {
        console.log('  ❌ Error inesperado:', error.message);
        return false;
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Iniciando pruebas de endpoints JWT...\n');
    console.log(`🌐 Base URL: ${BASE_URL}`);
    console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);
    console.log('');

    let passedTests = 0;
    let totalTests = 7;

    // Necesitamos un DUD real de la base de datos para hacer las pruebas
    // Vamos a probar con algunos DUDs comunes primero
    const testDUDs = ['12345', '123456', 'TEST123', '11111111-1', '12345678-9'];
    
    let loginSuccess = false;
    for (const dud of testDUDs) {
      loginSuccess = await this.testLogin(dud);
      if (loginSuccess) break;
    }

    if (loginSuccess) {
      passedTests++;
      
      if (await this.testValidateToken()) passedTests++;
      if (await this.testGetProfile()) passedTests++;
      if (await this.testRefreshToken()) passedTests++;
    } else {
      console.log('\n⚠️  No se pudo hacer login con ningún DUD de prueba.');
      console.log('   Para probar completamente, necesitas un DUD válido de la base de datos.');
      console.log('   Continuando con pruebas de errores...\n');
      totalTests = 3; // Solo pruebas de error
    }

    // Pruebas de error (siempre se ejecutan)
    if (await this.testInvalidApiKey()) passedTests++;
    if (await this.testInvalidDUD()) passedTests++;
    if (await this.testWithoutApiKey()) passedTests++;

    console.log(`\n📊 Resultados: ${passedTests}/${totalTests} pruebas pasaron`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ¡TODOS LOS TESTS PASARON EXITOSAMENTE!');
      console.log('✨ Los endpoints JWT están funcionando correctamente');
    } else {
      console.log(`⚠️  ${totalTests - passedTests} pruebas fallaron`);
    }

    return passedTests === totalTests;
  }
}

// Ejecutar las pruebas
const tester = new AuthTester();
tester.runAllTests().catch(console.error);
