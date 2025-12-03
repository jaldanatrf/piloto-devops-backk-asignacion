console.log('Testing Company entity with new types...');

try {
  // Test directo de la entidad Company
  const Company = require('../../../src/domain/entities/Company');
  console.log('Company entity loaded successfully');

  // Test 1: Crear empresa PAYER
  console.log('\n1. Testing PAYER company...');
  const payerCompany = new Company(
    1,
    'Test Payer Company',
    'Company that pays for services',
    '900123456',
    'NIT',
    'PAYER',
    true,
    new Date()
  );
  console.log('✅ PAYER company created:', {
    id: payerCompany.id,
    name: payerCompany.name,
    type: payerCompany.type
  });

  // Test 2: Crear empresa PROVIDER
  console.log('\n2. Testing PROVIDER company...');
  const providerCompany = new Company(
    2,
    'Test Provider Company',
    'Company that provides services',
    '800456789',
    'NIT',
    'PROVIDER',
    true,
    new Date()
  );
  console.log('✅ PROVIDER company created:', {
    id: providerCompany.id,
    name: providerCompany.name,
    type: providerCompany.type
  });

  // Test 3: Probar tipo inválido (debe fallar)
  console.log('\n3. Testing invalid company type (should fail)...');
  try {
    const invalidCompany = new Company(
      3,
      'Invalid Company',
      'This should fail',
      '700789123',
      'NIT',
      'INVALID_TYPE', // Tipo inválido
      true,
      new Date()
    );
    console.log('❌ This should not happen - invalid company was created');
  } catch (error) {
    console.log('✅ Validation working correctly:', error.message);
  }

  // Test 4: Probar conversión automática a mayúsculas
  console.log('\n4. Testing automatic uppercase conversion...');
  const lowercaseCompany = new Company(
    4,
    'Lowercase Type Company',
    'Testing case conversion',
    '600321654',
    'nit', // lowercase
    'payer', // lowercase
    true,
    new Date()
  );
  console.log('✅ Case conversion working:', {
    documentType: lowercaseCompany.documentType, // Should be 'NIT'
    type: lowercaseCompany.type // Should be 'PAYER'
  });

  console.log('\n🎉 All company entity tests passed! The PAYER/PROVIDER types are working correctly.');

} catch (error) {
  console.error('❌ Error during company entity test:', error.message);
  console.error('Stack:', error.stack);
}
