const DatabaseFactory = require('../src/infrastructure/factories/DatabaseFactory');

(async () => {
  try {
    const db = await DatabaseFactory.initializeDatabase();
    const sequelize = db.databaseAdapter.getSequelizeInstance();

    // Ver las últimas asignaciones con información de empresa
    const [assignments] = await sequelize.query(`
      SELECT TOP 10
        a.id,
        a.user_id,
        a.company_id,
        c.name as company_name,
        c.document_number as company_nit,
        a.Source,
        a.status,
        a.ClaimId,
        a.created_at
      FROM assignments a
      LEFT JOIN companies c ON a.company_id = c.id
      ORDER BY a.created_at DESC
    `);

    console.log('\n📋 Últimas 10 asignaciones - Verificando Company vs Source:\n');

    let hasMismatch = false;

    assignments.forEach((a, i) => {
      const mismatch = a.company_nit !== a.Source;
      if (mismatch) hasMismatch = true;

      console.log(`${i+1}. ID: ${a.id}`);
      console.log(`   CompanyID: ${a.company_id} - ${a.company_name} (NIT: ${a.company_nit})`);
      console.log(`   Source del mensaje: ${a.Source}`);
      console.log(`   Estado: ${a.status}, UserID: ${a.user_id || 'NULL'}`);
      console.log(`   ${mismatch ? '❌ PROBLEMA' : '✅ OK'}: CompanyID (${a.company_nit}) ${mismatch ? '!=' : '=='} Source (${a.Source})`);
      console.log('');
    });

    console.log('\n' + '='.repeat(70));
    if (hasMismatch) {
      console.log('⚠️  SE DETECTÓ INCONSISTENCIA:\n');
      console.log('Las asignaciones están guardadas con company_id del TARGET,');
      console.log('pero deberían guardarse con company_id del SOURCE.\n');
      console.log('Explicación:');
      console.log('- Source: Empresa que TIENE las reglas configuradas');
      console.log('- Target: Empresa destino (criterio de evaluación)');
      console.log('- La asignación debe pertenecer a Source (quien procesa)\n');
    } else {
      console.log('✅ Todo correcto: company_id coincide con Source\n');
    }
    console.log('='.repeat(70) + '\n');

    await db.databaseAdapter.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
