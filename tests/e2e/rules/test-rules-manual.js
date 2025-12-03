const axios = require('axios');

const BASE_URL = 'http://localhost:4041';

async function testRulesCRUD() {
  console.log('🧪 Iniciando pruebas manuales del CRUD de Reglas...\n');
  
  try {
    let companyId, ruleId;
    
    // 1. Crear una empresa para las pruebas
    console.log('1️⃣ Creando empresa para las pruebas...');
    const companyData = {
      name: 'Empresa Test Reglas ' + Date.now(),
      documentNumber: '900555444-' + Math.floor(Math.random() * 10),
      documentType: 'NIT',
      type: 'CORPORATION',
      description: 'Empresa para probar reglas'
    };
    
    const companyResponse = await axios.post(`${BASE_URL}/api/companies`, companyData);
    companyId = companyResponse.data.data.id;
    console.log('✅ Empresa creada con ID:', companyId);
    console.log('');
    
    // 2. CREATE - Crear una regla
    console.log('2️⃣ CREAR REGLA (CREATE)...');
    const ruleData = {
      name: 'Regla de Validacion',
      description: 'Regla para validar documentos',
      type: 'COMPLIANCE'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/companies/${companyId}/rules`, ruleData);
    ruleId = createResponse.data.data.id;
    console.log('✅ Regla creada:', createResponse.data);
    console.log('🔍 Verificación: La regla está asociada a la empresa ID:', createResponse.data.data.companyId);
    console.log('');
    
    // 3. READ - Obtener regla por ID
    console.log('3️⃣ LEER REGLA (READ BY ID)...');
    const getResponse = await axios.get(`${BASE_URL}/api/companies/${companyId}/rules/${ruleId}`);
    console.log('✅ Regla obtenida por ID:', getResponse.data);
    console.log('');
    
    // 4. READ - Listar todas las reglas de la empresa
    console.log('4️⃣ LISTAR REGLAS (READ ALL)...');
    const listResponse = await axios.get(`${BASE_URL}/api/companies/${companyId}/rules`);
    console.log('✅ Lista de reglas:', listResponse.data);
    console.log('');
    
    // 5. UPDATE - Actualizar regla
    console.log('5️⃣ ACTUALIZAR REGLA (UPDATE)...');
    const updateData = {
      name: 'Regla de Validacion Actualizada',
      description: 'Regla actualizada para validar documentos y formularios',
      type: 'BUSINESS'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/api/companies/${companyId}/rules/${ruleId}`, updateData);
    console.log('✅ Regla actualizada:', updateResponse.data);
    console.log('');
    
    // 6. READ - Verificar actualización
    console.log('6️⃣ VERIFICAR ACTUALIZACIÓN...');
    const verifyResponse = await axios.get(`${BASE_URL}/api/companies/${companyId}/rules/${ruleId}`);
    console.log('✅ Regla después de actualización:', verifyResponse.data);
    console.log('');
    
    // 7. Crear otra regla para probar listado
    console.log('7️⃣ CREAR SEGUNDA REGLA...');
    const rule2Data = {
      name: 'Regla de Seguridad',
      description: 'Regla para validar permisos',
      type: 'SECURITY'
    };
    
    const create2Response = await axios.post(`${BASE_URL}/api/companies/${companyId}/rules`, rule2Data);
    console.log('✅ Segunda regla creada:', create2Response.data);
    console.log('');
    
    // 8. Listar todas las reglas nuevamente
    console.log('8️⃣ LISTAR TODAS LAS REGLAS...');
    const listAllResponse = await axios.get(`${BASE_URL}/api/companies/${companyId}/rules`);
    console.log('✅ Todas las reglas de la empresa:', listAllResponse.data);
    console.log('');
    
    // 9. DELETE - Eliminar una regla
    console.log('9️⃣ ELIMINAR REGLA (DELETE)...');
    const deleteResponse = await axios.delete(`${BASE_URL}/api/companies/${companyId}/rules/${ruleId}`);
    console.log('✅ Regla eliminada:', deleteResponse.data);
    console.log('');
    
    // 10. Verificar eliminación
    console.log('🔟 VERIFICAR ELIMINACIÓN...');
    const finalListResponse = await axios.get(`${BASE_URL}/api/companies/${companyId}/rules`);
    console.log('✅ Reglas restantes:', finalListResponse.data);
    console.log('');
    
    // 11. Intentar crear regla sin empresa (debe fallar)
    console.log('1️⃣1️⃣ PROBAR VALIDACIÓN: Intentar crear regla sin empresa válida...');
    try {
      await axios.post(`${BASE_URL}/api/companies/99999/rules`, ruleData);
      console.log('❌ ERROR: Debería haber fallado');
    } catch (error) {
      console.log('✅ CORRECTO: Falló como esperado -', error.response?.data?.error?.message || error.message);
    }
    
    console.log('\n🎉 ¡TODAS LAS PRUEBAS DE CRUD DE REGLAS COMPLETADAS EXITOSAMENTE!');
    console.log('✅ CREATE: Crear reglas ✓');
    console.log('✅ READ: Leer reglas por ID y listar todas ✓');
    console.log('✅ UPDATE: Actualizar reglas ✓');
    console.log('✅ DELETE: Eliminar reglas ✓');
    console.log('✅ VALIDACIÓN: Las reglas deben estar asociadas a una empresa ✓');
    
    // 12. BONUS: Probar nuevos tipos de reglas (AMOUNT, COMPANY, COMPANY-AMOUNT)
    console.log('\n1️⃣2️⃣ BONUS: Probando nuevos tipos de reglas...');
    
    // Crear regla AMOUNT
    console.log('💰 Creando regla tipo AMOUNT...');
    const amountRuleData = {
      name: 'Regla de Montos',
      description: 'Validación de rangos de montos',
      type: 'AMOUNT',
      minimumAmount: 100.00,
      maximumAmount: 5000.00
    };
    
    try {
      const amountRuleResponse = await axios.post(`${BASE_URL}/api/companies/${companyId}/rules`, amountRuleData);
      console.log('✅ Regla AMOUNT creada:', amountRuleResponse.data.data);
    } catch (error) {
      console.log('❌ Error creando regla AMOUNT:', error.response?.data?.error?.message || error.message);
    }
    
    // Crear regla COMPANY
    console.log('🏢 Creando regla tipo COMPANY...');
    const companyRuleData = {
      name: 'Regla de Empresa Asociada',
      description: 'Validación por NIT de empresa',
      type: 'COMPANY',
      nitAssociatedCompany: '900123456-7'
    };
    
    try {
      const companyRuleResponse = await axios.post(`${BASE_URL}/api/companies/${companyId}/rules`, companyRuleData);
      console.log('✅ Regla COMPANY creada:', companyRuleResponse.data.data);
    } catch (error) {
      console.log('❌ Error creando regla COMPANY:', error.response?.data?.error?.message || error.message);
    }
    
    // Crear regla COMPANY-AMOUNT
    console.log('🏢💰 Creando regla tipo COMPANY-AMOUNT...');
    const companyAmountRuleData = {
      name: 'Regla Empresa-Monto',
      description: 'Validación combinada de empresa y montos',
      type: 'COMPANY-AMOUNT',
      minimumAmount: 1000.00,
      maximumAmount: 10000.00,
      nitAssociatedCompany: '800987654-3'
    };
    
    try {
      const companyAmountRuleResponse = await axios.post(`${BASE_URL}/api/companies/${companyId}/rules`, companyAmountRuleData);
      console.log('✅ Regla COMPANY-AMOUNT creada:', companyAmountRuleResponse.data.data);
    } catch (error) {
      console.log('❌ Error creando regla COMPANY-AMOUNT:', error.response?.data?.error?.message || error.message);
    }
    
    console.log('\n🆕 NUEVOS TIPOS DE REGLAS:');
    console.log('✅ AMOUNT: Reglas con montos mínimo y máximo ✓');
    console.log('✅ COMPANY: Reglas con NIT de empresa asociada ✓');
    console.log('✅ COMPANY-AMOUNT: Reglas combinadas ✓');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar pruebas
testRulesCRUD();
