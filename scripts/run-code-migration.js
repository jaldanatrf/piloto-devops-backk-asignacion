const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Cargar configuración
const config = require('../src/infrastructure/config');

async function runCodeMigration() {
  // Crear instancia de Sequelize usando la configuración existente
  const sequelize = new Sequelize({
    dialect: 'mssql',
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    username: config.database.user,
    password: config.database.password,
    dialectOptions: {
      encrypt: false,
      trustServerCertificate: true
    },
    logging: console.log
  });

  try {
    console.log('\n=== INICIANDO MIGRACIÓN DE CAMPO CODE ===\n');

    await sequelize.authenticate();
    console.log('✅ Conexión establecida exitosamente.\n');

    // Leer archivo SQL de migración
    const migrationPath = path.join(__dirname, '../src/infrastructure/database/migrations/add_code_field_to_rules.sql');
    const sqlScript = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Ejecutando script de migración: add_code_field_to_rules.sql\n');

    // Dividir el script en bloques separados por GO
    const sqlBlocks = sqlScript.split(/\bGO\b/gi).filter(block => block.trim().length > 0);

    // Ejecutar cada bloque
    for (let i = 0; i < sqlBlocks.length; i++) {
      const block = sqlBlocks[i].trim();
      if (block) {
        console.log(`Ejecutando bloque ${i + 1}/${sqlBlocks.length}...`);
        try {
          await sequelize.query(block);
        } catch (error) {
          console.error(`❌ Error en bloque ${i + 1}:`, error.message);
          throw error;
        }
      }
    }

    console.log('\n=== VALIDACIÓN POST-MIGRACIÓN ===\n');

    // Verificar que la columna code existe
    const [codeColumn] = await sequelize.query(`
      SELECT
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'rules'
        AND COLUMN_NAME = 'code'
    `);

    if (codeColumn.length > 0) {
      console.log('✅ Campo code verificado:');
      console.log('   - Tipo:', codeColumn[0].DATA_TYPE);
      console.log('   - Longitud:', codeColumn[0].CHARACTER_MAXIMUM_LENGTH);
      console.log('   - Nullable:', codeColumn[0].IS_NULLABLE);
    } else {
      console.error('❌ El campo code NO fue creado correctamente');
      throw new Error('Migration failed: code column not found');
    }

    // Verificar índices creados
    const [indexes] = await sequelize.query(`
      SELECT
        i.name AS index_name,
        STRING_AGG(c.name, ', ') AS columns
      FROM sys.indexes i
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE i.object_id = OBJECT_ID('rules')
        AND i.name IN ('IX_rules_code', 'IX_rules_company_code', 'IX_rules_company_type')
      GROUP BY i.name
      ORDER BY i.name
    `);

    console.log('\n✅ Índices creados:');
    indexes.forEach(idx => {
      console.log(`   - ${idx.index_name}: ${idx.columns}`);
    });

    // Mostrar todas las columnas de rules
    console.log('\n📊 Estructura final de tabla rules:');
    const [rulesColumns] = await sequelize.query(`
      SELECT
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'rules'
      ORDER BY ORDINAL_POSITION
    `);

    rulesColumns.forEach(col => {
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      const length = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
      const def = col.COLUMN_DEFAULT ? ` DEFAULT ${col.COLUMN_DEFAULT}` : '';
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE}${length} ${nullable}${def}`);
    });

    console.log('\n=== RESUMEN DE MIGRACIÓN ===');
    console.log('✅ Campo code agregado a tabla rules');
    console.log('✅ Índices de optimización creados');
    console.log('✅ Retrocompatibilidad mantenida (code es NULL)');
    console.log('\n🎉 Migración completada exitosamente!\n');

    console.log('📝 Nuevos tipos de reglas disponibles:');
    console.log('   1. CODE - Solo código de objeción');
    console.log('   2. CODE-AMOUNT - Código + rango de montos');
    console.log('   3. COMPANY-CODE - NIT + código');
    console.log('   4. CODE-AMOUNT-COMPANY - Código + rango + NIT (máxima especificidad)');
    console.log('\n✨ Los tipos existentes (AMOUNT, COMPANY, COMPANY-AMOUNT, CUSTOM) continúan funcionando sin cambios.\n');

  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    console.error('\nDetalles del error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada.\n');
  }
}

// Ejecutar migración
if (require.main === module) {
  runCodeMigration()
    .then(() => {
      console.log('✅ Proceso completado exitosamente');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Proceso fallido:', error.message);
      process.exit(1);
    });
}

module.exports = { runCodeMigration };
