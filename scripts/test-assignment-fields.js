// Script de prueba para verificar extracción de campos personalizados en assignments
const models = require('../src/infrastructure/database/models/models');

async function testAssignmentFields() {
  try {
    // Trae el primer registro de assignments
    const assignment = await models.Assignment.findOne({
      attributes: [
        'id', 'userId', 'companyId', 'status', 'startDate', 'endDate', 'assignedAt', 'createdAt', 'updatedAt',
        'ProcessId', 'Source', 'DocumentNumber', 'InvoiceAmount', 'ExternalReference', 'ClaimId', 'ConceptApplicationCode', 'ObjectionCode', 'Value'
      ]
    });
    console.log('Assignment:', assignment ? assignment.toJSON() : null);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testAssignmentFields().then(() => process.exit());
}
