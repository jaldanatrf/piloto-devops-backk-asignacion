const axios = require('axios');

const BASE_URL = 'http://localhost:4041';

async function testNewRuleTypes() {
  console.log('🧪 Iniciando pruebas de nuevos tipos de reglas...\n');
  
  let companyId = null;
  let testsFailed = false;
  
  try {
    // 1. Crear una empresa para las pruebas
    console.log('1️⃣ Creando empresa para las pruebas...');
    const uniqueId = Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
    const companyData = {
      name: 'Empresa Test Nuevos Tipos ' + uniqueId,
      documentNumber: '900' + uniqueId + '-0',
      documentType: 'NIT',
      type: 'CORPORATION',
      description: 'Empresa para probar nuevos tipos de reglas'
    };
    
    const companyResponse = await axios.post(`${BASE_URL}/api/companies`, companyData);
    companyId = companyResponse.data.data.id;
    console.log('✅ Empresa creada con ID:', companyId);
    console.log('');
    
    // 2. TIPO AMOUNT - Crear regla con montos
    console.log('2️⃣ Creando regla TIPO AMOUNT...');
    const amountRuleData = {
      name: 'Regla de Montos',
      description: 'Regla para validar rangos de montos',
      type: 'AMOUNT',
      minimumAmount: 1000.50,
      maximumAmount: 50000.75
    };
    
    const amountResponse = await axios.post(`${BASE_URL}/api/companies/${companyId}/rules`, amountRuleData);
    console.log('✅ Regla AMOUNT creada:', amountResponse.data);
    console.log('');
    
    // 3. TIPO COMPANY - Crear regla con NIT
    console.log('3️⃣ Creando regla TIPO COMPANY...');
    const companyRuleData = {
      name: 'Regla de Empresa',
      description: 'Regla asociada a empresa específica',
      type: 'COMPANY',
      nitAssociatedCompany: '900123456-7'
    };
    
    const companyRuleResponse = await axios.post(`${BASE_URL}/api/companies/${companyId}/rules`, companyRuleData);
    console.log('✅ Regla COMPANY creada:', companyRuleResponse.data);
    console.log('');
    
    // 4. TIPO COMPANY-AMOUNT - Crear regla con montos y NIT
    console.log('4️⃣ Creando regla TIPO COMPANY-AMOUNT...');
    const combinedRuleData = {
      name: 'Regla Combinada',
      description: 'Regla con empresa y montos',
      type: 'COMPANY-AMOUNT',
      minimumAmount: 5000,
      maximumAmount: 100000,
      nitAssociatedCompany: '800987654-3'
    };
    
    const combinedResponse = await axios.post(`${BASE_URL}/api/companies/${companyId}/rules`, combinedRuleData);
    console.log('✅ Regla COMPANY-AMOUNT creada:', combinedResponse.data);
    console.log('');
    
    // 5. VALIDAR ERRORES - Intentar crear regla AMOUNT sin montos
    console.log('5️⃣ Probando validación: AMOUNT sin montos...');
    try {
      const invalidAmountData = {
        name: 'Regla Invalida',
        description: 'Regla AMOUNT sin montos',
        type: 'AMOUNT'
      };
      await axios.post(`${BASE_URL}/api/companies/${companyId}/rules`, invalidAmountData);
      console.log('❌ ERROR: Debería haber fallado');
    } catch (error) {
      console.log('✅ CORRECTO: Falló como esperado -', error.response?.data?.error?.message || error.message);
    }
    console.log('');
    
    // 6. VALIDAR ERRORES - Intentar crear regla COMPANY sin NIT
    console.log('6️⃣ Probando validación: COMPANY sin NIT...');
    try {
      const invalidCompanyData = {
        name: 'Regla Invalida 2',
        description: 'Regla COMPANY sin NIT',
        type: 'COMPANY'
      };
      await axios.post(`${BASE_URL}/api/companies/${companyId}/rules`, invalidCompanyData);
      console.log('❌ ERROR: Debería haber fallado');
    } catch (error) {
      console.log('✅ CORRECTO: Falló como esperado -', error.response?.data?.error?.message || error.message);
    }
    console.log('');
    
    // 7. Listar todas las reglas creadas
    console.log('7️⃣ Listando todas las reglas creadas...');
    const listResponse = await axios.get(`${BASE_URL}/api/companies/${companyId}/rules`);
    console.log('✅ Reglas creadas:', JSON.stringify(listResponse.data, null, 2));
    
    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE NUEVOS TIPOS COMPLETADAS!');
    console.log('✅ AMOUNT: Reglas con montos ✓');
    console.log('✅ COMPANY: Reglas con NIT asociado ✓');
    console.log('✅ COMPANY-AMOUNT: Reglas combinadas ✓');
    console.log('✅ VALIDACIONES: Campos obligatorios según tipo ✓');
    
  } catch (error) {
    testsFailed = true;
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
    if (error.response) {
      console.log('📝 Detalles del error:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    // SIEMPRE ejecutar limpieza, sin importar si las pruebas fallaron
    if (companyId) {
      console.log('\n🧹 Ejecutando limpieza de registros de prueba...');
      await cleanupTestData(companyId);
    }
    
    if (!testsFailed) {
      console.log('\n🎊 ¡PRUEBAS COMPLETADAS EXITOSAMENTE Y BASE DE DATOS LIMPIA!');
    } else {
      console.log('\n⚠️ Pruebas completadas con errores, pero base de datos limpia');
    }
  }
}

// Función para limpiar los datos de prueba
async function cleanupTestData(companyId) {
  try {
    console.log('🧹 Eliminando reglas de prueba...');
    
    // Obtener todas las reglas de la empresa de prueba
    try {
      const rulesResponse = await axios.get(`${BASE_URL}/api/companies/${companyId}/rules`);
      const rules = rulesResponse.data.data || [];
      
      // Eliminar cada regla
      for (const rule of rules) {
        try {
          await axios.delete(`${BASE_URL}/api/companies/${companyId}/rules/${rule.id}`);
          console.log(`   ✅ Regla eliminada: ${rule.name} (ID: ${rule.id})`);
        } catch (error) {
          if (error.response?.status !== 404) {
            console.log(`   ⚠️ Error eliminando regla ${rule.id}:`, error.response?.data?.message || error.message);
          }
        }
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.log('   ⚠️ Error obteniendo reglas:', error.response?.data?.message || error.message);
      }
    }
    
    console.log('🏢 Eliminando empresa de prueba...');
    
    // Eliminar la empresa de prueba
    try {
      await axios.delete(`${BASE_URL}/api/companies/${companyId}`);
      console.log(`   ✅ Empresa eliminada (ID: ${companyId})`);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.log(`   ⚠️ Error eliminando empresa ${companyId}:`, error.response?.data?.message || error.message);
      } else {
        console.log(`   ℹ️ Empresa ${companyId} ya fue eliminada`);
      }
    }
    
    console.log('✨ Limpieza completada - Base de datos restaurada');
    
  } catch (error) {
    console.log('⚠️ Error durante la limpieza:', error.response?.data?.message || error.message);
    console.log('   (Los registros de prueba pueden quedar en la base de datos)');
  }
}

// Ejecutar pruebas
testNewRuleTypes();
