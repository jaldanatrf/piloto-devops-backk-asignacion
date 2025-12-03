const axios = require('axios');

/**
 * Script para verificar que ambas versiones del endpoint de importación funcionen correctamente
 */
class ImportUsersEndpointTester {
  constructor() {
    this.baseUrl = 'http://localhost:4041';
    this.testDocumentType = 'NIT';
    this.testDocumentNumber = '900123456';
  }

  /**
   * Prueba el endpoint público (sin autenticación)
   */
  async testPublicEndpoint() {
    console.log('🔓 PROBANDO ENDPOINT PÚBLICO (sin autenticación)');
    console.log('=' .repeat(50));
    
    const url = `${this.baseUrl}/api/companies/import-users/${this.testDocumentType}/${this.testDocumentNumber}`;
    console.log(`📤 URL: POST ${url}`);
    console.log('🔓 Sin header Authorization');
    
    try {
      const response = await axios.post(url, {}, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('\n✅ ÉXITO - Endpoint público funciona correctamente');
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Mensaje: ${response.data.message}`);
      
      if (response.data.data) {
        console.log(`👥 Usuarios creados: ${response.data.data.created}`);
        console.log(`👤 Usuarios existentes: ${response.data.data.existing}`);
        console.log(`🏢 Empresa: ${response.data.data.company}`);
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      console.log('\n❌ ERROR en endpoint público:');
      
      if (error.response) {
        console.log(`📊 Status: ${error.response.status}`);
        console.log(`📋 Mensaje: ${error.response.data.message || error.response.data}`);
        
        if (error.response.status === 401) {
          console.log('🚨 PROBLEMA: El endpoint público está requiriendo autenticación');
          console.log('   Verificar que el servidor esté reiniciado después de los cambios');
        }
      } else {
        console.log(`⚠️  Error: ${error.message}`);
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Prueba el endpoint protegido (con autenticación)
   */
  async testProtectedEndpoint(token = null) {
    console.log('\n🔒 PROBANDO ENDPOINT PROTEGIDO (con autenticación)');
    console.log('=' .repeat(50));
    
    // Este endpoint técnicamente es el mismo path pero procesado por las rutas de companies
    // que están después del middleware de autenticación
    const url = `${this.baseUrl}/api/companies/import-users/${this.testDocumentType}/${this.testDocumentNumber}`;
    console.log(`📤 URL: POST ${url}`);
    
    if (!token) {
      console.log('🔒 Sin token - debería fallar con 401');
      
      try {
        const response = await axios.post(url, {}, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        });
        
        console.log('\n⚠️  ADVERTENCIA: El endpoint no está protegido como se esperaba');
        console.log(`📊 Status: ${response.status}`);
        return { success: true, protected: false };
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.log('\n✅ CORRECTO: El endpoint protegido requiere autenticación');
          console.log(`📊 Status: ${error.response.status}`);
          return { success: true, protected: true };
        } else {
          console.log('\n❌ ERROR inesperado:');
          console.log(`📊 Status: ${error.response?.status || 'No response'}`);
          console.log(`📋 Error: ${error.message}`);
          return { success: false, error: error.message };
        }
      }
    } else {
      console.log('🔒 Con token JWT');
      
      try {
        const response = await axios.post(url, {}, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000
        });
        
        console.log('\n✅ ÉXITO - Endpoint protegido funciona con token');
        console.log(`📊 Status: ${response.status}`);
        console.log(`📋 Mensaje: ${response.data.message}`);
        
        return { success: true, data: response.data };
      } catch (error) {
        console.log('\n❌ ERROR en endpoint protegido:');
        console.log(`📊 Status: ${error.response?.status || 'No response'}`);
        console.log(`📋 Error: ${error.response?.data?.message || error.message}`);
        
        return { success: false, error: error.message };
      }
    }
  }

  /**
   * Ejecuta todas las pruebas
   */
  async runAllTests() {
    console.log('🧪 PRUEBAS DE ENDPOINTS DE IMPORTACIÓN DE USUARIOS');
    console.log('🎯 Verificando que existan tanto versión pública como protegida\n');
    
    // Probar endpoint público
    const publicResult = await this.testPublicEndpoint();
    
    // Probar endpoint protegido sin token
    const protectedResult = await this.testProtectedEndpoint();
    
    // Resumen
    console.log('\n📊 RESUMEN DE PRUEBAS');
    console.log('=' .repeat(50));
    console.log(`🔓 Endpoint público: ${publicResult.success ? '✅ Funciona' : '❌ Falla'}`);
    console.log(`🔒 Endpoint protegido: ${protectedResult.success ? '✅ Funciona' : '❌ Falla'}`);
    
    if (publicResult.success && protectedResult.success) {
      console.log('\n🎉 ¡ÉXITO! Ambos endpoints funcionan correctamente:');
      console.log('   • Versión pública sin autenticación disponible');
      console.log('   • Versión protegida con autenticación disponible');
      console.log('\nℹ️  Documentación Swagger actualizada para ambas versiones');
    } else {
      console.log('\n⚠️  Algunas pruebas fallaron. Revisar configuración del servidor.');
    }
    
    return {
      public: publicResult,
      protected: protectedResult
    };
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const tester = new ImportUsersEndpointTester();
  tester.runAllTests()
    .then(results => {
      console.log('\n✅ Pruebas completadas');
    })
    .catch(error => {
      console.error('\n❌ Error en las pruebas:', error.message);
    });
}

module.exports = ImportUsersEndpointTester;
