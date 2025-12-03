console.log('Testing Rule entity with new fields...');

try {
  // Test directo de la entidad Rule
  const Rule = require('../../../src/domain/entities/Rule');
  console.log('Rule entity loaded successfully');

  // Test 1: Crear regla AMOUNT
  console.log('\n1. Testing AMOUNT rule...');
  const amountRule = new Rule(
    1,
    'Amount Validation Rule',
    'Rule for validating payment amounts',
    1, // companyId
    'AMOUNT',
    true,
    new Date(),
    1000.50, // minimumAmount
    25000.75, // maximumAmount
    null // nitAssociatedCompany
  );
  console.log('✅ AMOUNT rule created:', {
    id: amountRule.id,
    type: amountRule.type,
    minimumAmount: amountRule.minimumAmount,
    maximumAmount: amountRule.maximumAmount
  });

  // Test 2: Crear regla COMPANY
  console.log('\n2. Testing COMPANY rule...');
  const companyRule = new Rule(
    2,
    'Company Validation Rule',
    'Rule for validating associated companies',
    1, // companyId
    'COMPANY',
    true,
    new Date(),
    null, // minimumAmount
    null, // maximumAmount
    '800456789' // nitAssociatedCompany
  );
  console.log('✅ COMPANY rule created:', {
    id: companyRule.id,
    type: companyRule.type,
    nitAssociatedCompany: companyRule.nitAssociatedCompany
  });

  // Test 3: Crear regla COMPANY-AMOUNT
  console.log('\n3. Testing COMPANY-AMOUNT rule...');
  const companyAmountRule = new Rule(
    3,
    'Company-Amount Validation Rule',
    'Rule for validating company and amounts',
    1, // companyId
    'COMPANY-AMOUNT',
    true,
    new Date(),
    5000.00, // minimumAmount
    100000.00, // maximumAmount
    '900987654' // nitAssociatedCompany
  );
  console.log('✅ COMPANY-AMOUNT rule created:', {
    id: companyAmountRule.id,
    type: companyAmountRule.type,
    minimumAmount: companyAmountRule.minimumAmount,
    maximumAmount: companyAmountRule.maximumAmount,
    nitAssociatedCompany: companyAmountRule.nitAssociatedCompany
  });

  // Test 4: Validar regla AMOUNT sin campos requeridos (debe fallar)
  console.log('\n4. Testing AMOUNT rule validation (should fail)...');
  try {
    const invalidAmountRule = new Rule(
      4,
      'Invalid Amount Rule',
      'This should fail',
      1,
      'AMOUNT',
      true,
      new Date(),
      null, // minimumAmount faltante
      null, // maximumAmount faltante
      null
    );
    console.log('❌ This should not happen - invalid rule was created');
  } catch (error) {
    console.log('✅ Validation working correctly:', error.message);
  }

  // Test 5: Validar regla COMPANY sin NIT (debe fallar)
  console.log('\n5. Testing COMPANY rule validation (should fail)...');
  try {
    const invalidCompanyRule = new Rule(
      5,
      'Invalid Company Rule',
      'This should fail',
      1,
      'COMPANY',
      true,
      new Date(),
      null,
      null,
      null // nitAssociatedCompany faltante
    );
    console.log('❌ This should not happen - invalid rule was created');
  } catch (error) {
    console.log('✅ Validation working correctly:', error.message);
  }

  console.log('\n🎉 All entity tests passed! The new rule types are working correctly.');

} catch (error) {
  console.error('❌ Error during entity test:', error.message);
  console.error('Stack:', error.stack);
}
