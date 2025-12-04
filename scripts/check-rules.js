const DatabaseFactory = require('../src/infrastructure/factories/DatabaseFactory');

(async () => {
  try {
    const db = await DatabaseFactory.initializeDatabase();
    const repos = DatabaseFactory.getRepositories(db);

    // Buscar empresa Source
    const company = await repos.companyRepository.findByDocumentNumber('901002487');
    console.log('\n🏢 Empresa encontrada:');
    console.log('   ID:', company.id);
    console.log('   Nombre:', company.name);
    console.log('   NIT:', company.documentNumber);

    // Buscar TODAS las reglas sin importar si están activas
    const sequelize = db.databaseAdapter.getSequelizeInstance();
    const [rules] = await sequelize.query(`
      SELECT
        id,
        name,
        type,
        company_id,
        nit_associated_company,
        code,
        is_active,
        minimum_amount,
        maximum_amount
      FROM rules
      WHERE company_id = ${company.id}
    `);

    console.log(`\n📋 Total de reglas encontradas: ${rules.length}\n`);

    if (rules.length === 0) {
      console.log('❌ No se encontraron reglas para esta empresa');

      // Buscar todas las reglas en el sistema
      console.log('\n🔍 Buscando todas las reglas en el sistema...\n');
      const [allRules] = await sequelize.query(`
        SELECT r.id, r.name, r.type, r.company_id, c.name as company_name, c.document_number,
               r.nit_associated_company, r.code, r.is_active
        FROM rules r
        INNER JOIN companies c ON c.id = r.company_id
        ORDER BY c.document_number, r.type
      `);

      console.log(`📊 Total de reglas en el sistema: ${allRules.length}\n`);

      const groupedByCompany = {};
      allRules.forEach(rule => {
        if (!groupedByCompany[rule.document_number]) {
          groupedByCompany[rule.document_number] = [];
        }
        groupedByCompany[rule.document_number].push(rule);
      });

      Object.keys(groupedByCompany).forEach(nit => {
        const companyRules = groupedByCompany[nit];
        console.log(`🏢 Empresa: ${companyRules[0].company_name} (${nit})`);
        console.log(`   Total reglas: ${companyRules.length}`);
        companyRules.forEach(rule => {
          console.log(`   - ${rule.type} | ${rule.name} | Activa: ${rule.is_active ? 'SÍ' : 'NO'}`);
          if (rule.nit_associated_company) console.log(`     NIT: ${rule.nit_associated_company}`);
          if (rule.code) console.log(`     Code: ${rule.code}`);
        });
        console.log('');
      });
    } else {
      rules.forEach((rule, i) => {
        console.log(`${i + 1}. ID: ${rule.id}`);
        console.log(`   Nombre: ${rule.name}`);
        console.log(`   Tipo: ${rule.type}`);
        console.log(`   Activa: ${rule.is_active ? '✅ SÍ' : '❌ NO'}`);
        console.log(`   NIT asociado: ${rule.nit_associated_company || 'N/A'}`);
        console.log(`   Código: ${rule.code || 'N/A'}`);
        console.log(`   Monto min: ${rule.minimum_amount || 'N/A'}`);
        console.log(`   Monto max: ${rule.maximum_amount || 'N/A'}`);
        console.log('');
      });
    }

    await db.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();
