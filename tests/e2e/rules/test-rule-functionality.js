const axios = require('axios');

const BASE_URL = 'http://localhost:4041';

async function testRuleFunctionality() {
  console.log('🚀 Iniciando pruebas de funcionalidad de reglas...\n');

  try {
    // 1. Health check
    console.log('1️⃣ Verificando health check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check OK\n');

    // 2. Listar empresas existentes
    console.log('2️⃣ Listando empresas existentes...');
    const companiesResponse = await axios.get(`${BASE_URL}/api/companies`);
    const companies = companiesResponse.data.data;
    console.log(`✅ Encontradas ${companies.length} empresas`);
    
    if (companies.length === 0) {
      console.log('❌ No hay empresas disponibles para crear reglas');
      return;
    }

    const testCompany = companies[0];
    console.log(`📍 Usando empresa: ${testCompany.name} (ID: ${testCompany.id})\n`);

    // 3. Listar reglas existentes
    console.log('3️⃣ Listando reglas existentes...');
    const rulesResponse = await axios.get(`${BASE_URL}/api/rules`);
    const existingRules = rulesResponse.data.data || [];
    console.log(`✅ Encontradas ${existingRules.length} reglas existentes\n`);

    // 4. Crear regla tipo AMOUNT
    console.log('4️⃣ Creando regla tipo AMOUNT...');
    const amountRule = {
      name: 'Regla de Monto Test',
      description: 'Regla para validar montos entre 1000 y 5000',
      type: 'AMOUNT',
      minimumAmount: 1000.00,
      maximumAmount: 5000.00,
      isActive: true
    };

    try {
      const amountRuleResponse = await axios.post(`${BASE_URL}/api/companies/${testCompany.id}/rules`, amountRule);
      console.log('✅ Regla AMOUNT creada exitosamente:', amountRuleResponse.data.data);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('⚠️ Regla AMOUNT ya existe (409 conflict)');
      } else {
        console.log('❌ Error creando regla AMOUNT:', error.response?.data || error.message);
      }
    }

    // 5. Crear regla tipo COMPANY
    console.log('\n5️⃣ Creando regla tipo COMPANY...');
    const companyRule = {
      name: 'Regla de Empresa Test',
      description: 'Regla para validar NIT específico',
      type: 'COMPANY',
      nitAssociatedCompany: '123456789-0',
      isActive: true
    };

    try {
      const companyRuleResponse = await axios.post(`${BASE_URL}/api/companies/${testCompany.id}/rules`, companyRule);
      console.log('✅ Regla COMPANY creada exitosamente:', companyRuleResponse.data.data);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('⚠️ Regla COMPANY ya existe (409 conflict)');
      } else {
        console.log('❌ Error creando regla COMPANY:', error.response?.data || error.message);
      }
    }

    // 6. Crear regla tipo COMPANY-AMOUNT
    console.log('\n6️⃣ Creando regla tipo COMPANY-AMOUNT...');
    const companyAmountRule = {
      name: 'Regla Empresa-Monto Test',
      description: 'Regla combinada para empresa y monto',
      type: 'COMPANY-AMOUNT',
      minimumAmount: 500.00,
      maximumAmount: 10000.00,
      nitAssociatedCompany: '987654321-1',
      isActive: true
    };

    try {
      const companyAmountRuleResponse = await axios.post(`${BASE_URL}/api/companies/${testCompany.id}/rules`, companyAmountRule);
      console.log('✅ Regla COMPANY-AMOUNT creada exitosamente:', companyAmountRuleResponse.data.data);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log('⚠️ Regla COMPANY-AMOUNT ya existe (409 conflict)');
      } else {
        console.log('❌ Error creando regla COMPANY-AMOUNT:', error.response?.data || error.message);
      }
    }

    // 7. Listar todas las reglas después de crear
    console.log('\n7️⃣ Listando todas las reglas después de crear...');
    const finalRulesResponse = await axios.get(`${BASE_URL}/api/rules`);
    const finalRules = finalRulesResponse.data.data || [];
    console.log(`✅ Total de reglas: ${finalRules.length}`);
    
    // Mostrar reglas por tipo
    const rulesByType = finalRules.reduce((acc, rule) => {
      acc[rule.type] = (acc[rule.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Reglas por tipo:');
    Object.entries(rulesByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} reglas`);
    });

    // 8. Mostrar algunas reglas de los nuevos tipos
    console.log('\n8️⃣ Mostrando reglas de los nuevos tipos...');
    const newTypeRules = finalRules.filter(rule => 
      ['AMOUNT', 'COMPANY', 'COMPANY-AMOUNT'].includes(rule.type)
    );
    
    newTypeRules.forEach(rule => {
      console.log(`\n📋 Regla: ${rule.name}`);
      console.log(`   Tipo: ${rule.type}`);
      console.log(`   Empresa: ${rule.companyId}`);
      if (rule.minimumAmount) console.log(`   Monto mínimo: ${rule.minimumAmount}`);
      if (rule.maximumAmount) console.log(`   Monto máximo: ${rule.maximumAmount}`);
      if (rule.nitAssociatedCompany) console.log(`   NIT: ${rule.nitAssociatedCompany}`);
      console.log(`   Activa: ${rule.isActive}`);
    });

    console.log('\n🎉 Pruebas completadas exitosamente!');

  } catch (error) {
    console.error('❌ Error en las pruebas:', error.response?.data || error.message);
  }
}

// Ejecutar las pruebas
testRuleFunctionality();
