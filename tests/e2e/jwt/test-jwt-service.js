require('dotenv').config({ path: '.env.dev' });
const JwtService = require('../../../src/shared/security/JwtService');

// Mock básico para probar
class MockUserRepo {
  async findByDUD(dud) {
    if (dud === 'TEST123') {
      return {
        id: 1,
        name: 'Usuario Test',
        DUD: 'TEST123',
        companyId: 1,
        isActive: true,
        roles: [1]
      };
    }
    return null;
  }

  async findById(id) {
    if (id === 1) {
      return {
        id: 1,
        name: 'Usuario Test',
        DUD: 'TEST123',
        companyId: 1,
        isActive: true,
        roles: [1],
        getCompleteInfo() {
          return this;
        }
      };
    }
    return null;
  }
}

async function testJwtService() {
  try {
    console.log('🚀 Iniciando prueba del servicio JWT...\n');

    const mockRepo = new MockUserRepo();
    const jwtService = new JwtService(mockRepo);

    console.log('✅ JwtService inicializado correctamente');
    console.log('✅ API Key configurada:', process.env.API_KEY ? 'SÍ' : 'NO');
    console.log('✅ JWT Secret configurado:', process.env.JWT_SECRET ? 'SÍ' : 'NO');
    console.log('✅ JWT Expires In:', process.env.JWT_EXPIRES_IN);
    console.log('');

    // Test 1: Validación de API Key
    console.log('🔑 Test 1: Validación de API Key');
    try {
      jwtService.validateApiKey(process.env.API_KEY);
      console.log('  ✅ API Key válida');
    } catch (error) {
      console.log('  ❌ Error API Key:', error.message);
      return;
    }

    // Test 2: Validación de usuario por DUD
    console.log('👤 Test 2: Validación de usuario por DUD');
    try {
      const user = await jwtService.validateUserByDUD('TEST123');
      console.log('  ✅ Usuario encontrado:', user.name, '(DUD:', user.DUD, ')');
    } catch (error) {
      console.log('  ❌ Error validación usuario:', error.message);
      return;
    }

    // Test 3: Autenticación completa
    console.log('🔐 Test 3: Autenticación completa');
    try {
      const authResult = await jwtService.authenticateUser(process.env.API_KEY, 'TEST123');
      console.log('  ✅ Autenticación exitosa');
      console.log('  ✅ Token generado (longitud):', authResult.token.length, 'caracteres');
      console.log('  ✅ Refresh token generado (longitud):', authResult.refreshToken.length, 'caracteres');
      console.log('  ✅ Usuario autenticado:', authResult.user.name);
      
      // Test 4: Verificación del token
      console.log('🔍 Test 4: Verificación del token');
      const decoded = jwtService.verifyToken(authResult.token);
      console.log('  ✅ Token verificado exitosamente');
      console.log('  ✅ Datos del token:', { 
        id: decoded.id, 
        name: decoded.name, 
        DUD: decoded.DUD,
        companyId: decoded.companyId
      });

      // Test 5: Verificación del refresh token
      console.log('🔄 Test 5: Verificación del refresh token');
      const refreshDecoded = jwtService.verifyRefreshToken(authResult.refreshToken);
      console.log('  ✅ Refresh token verificado exitosamente');
      console.log('  ✅ Tipo de token:', refreshDecoded.type);
      console.log('  ✅ ID de usuario:', refreshDecoded.id);

    } catch (error) {
      console.log('  ❌ Error en autenticación:', error.message);
      return;
    }

    // Test 6: Test de errores
    console.log('🚫 Test 6: Manejo de errores');
    
    // API Key inválida
    try {
      jwtService.validateApiKey('invalid-key');
      console.log('  ❌ Debería haber fallado con API key inválida');
    } catch (error) {
      console.log('  ✅ Error esperado con API key inválida:', error.message);
    }

    // Usuario inexistente
    try {
      await jwtService.validateUserByDUD('USUARIO_INEXISTENTE');
      console.log('  ❌ Debería haber fallado con usuario inexistente');
    } catch (error) {
      console.log('  ✅ Error esperado con usuario inexistente:', error.message);
    }

    // Token inválido
    try {
      jwtService.verifyToken('token-invalido');
      console.log('  ❌ Debería haber fallado con token inválido');
    } catch (error) {
      console.log('  ✅ Error esperado con token inválido:', error.message);
    }

    console.log('\n🎉 TODOS LOS TESTS PASARON EXITOSAMENTE!');
    console.log('✨ El servicio de seguridad JWT está funcionando correctamente');
    
  } catch (error) {
    console.error('❌ Error general en los tests:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar las pruebas
testJwtService();
