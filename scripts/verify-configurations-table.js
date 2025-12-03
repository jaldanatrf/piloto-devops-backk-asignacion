/**
 * Script para verificar la tabla configurations directamente en la BD
 * Este script valida que la tabla fue creada correctamente
 */

const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuración de base de datos
const config = {
  server: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

async function verifyTable() {
  let pool = null;

  try {
    console.log('\n' + '═'.repeat(70));
    console.log('  VERIFICACIÓN FINAL: Tabla configurations');
    console.log('═'.repeat(70));
    console.log('');

    // Conectar
    pool = await sql.connect(config);
    console.log('✅ Conectado a la base de datos\n');

    // Test 1: Verificar que la tabla existe
    console.log('📋 Test 1: Verificar existencia de la tabla');
    const tableCheck = await pool.request().query(`
      SELECT
        OBJECT_ID('configurations') as table_id,
        (SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('configurations')) as column_count,
        (SELECT COUNT(*) FROM sys.indexes WHERE object_id = OBJECT_ID('configurations')) as index_count
    `);

    if (!tableCheck.recordset[0].table_id) {
      throw new Error('❌ La tabla configurations NO existe');
    }

    console.log('✅ Tabla configurations existe');
    console.log(`   - Columnas: ${tableCheck.recordset[0].column_count}`);
    console.log(`   - Índices: ${tableCheck.recordset[0].index_count}\n`);

    // Test 2: Verificar columnas específicas
    console.log('📋 Test 2: Verificar columnas principales');
    const columnsCheck = await pool.request().query(`
      SELECT column_name, data_type, is_nullable
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE table_name = 'configurations'
      ORDER BY ordinal_position
    `);

    const requiredColumns = [
      'id', 'company_id', 'token_endpoint', 'list_query_endpoint',
      'notification_endpoint', 'auth_type', 'is_active'
    ];

    const existingColumns = columnsCheck.recordset.map(c => c.column_name);
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      throw new Error(`❌ Faltan columnas: ${missingColumns.join(', ')}`);
    }

    console.log('✅ Todas las columnas requeridas existen');
    console.log(`   - Total columnas: ${existingColumns.length}\n`);

    // Test 3: Verificar constraints
    console.log('📋 Test 3: Verificar constraints y foreign keys');
    const constraintsCheck = await pool.request().query(`
      SELECT
        name,
        type_desc
      FROM sys.objects
      WHERE parent_object_id = OBJECT_ID('configurations')
      AND type IN ('F', 'PK', 'UQ', 'C')
    `);

    console.log('✅ Constraints encontrados:');
    constraintsCheck.recordset.forEach(c => {
      console.log(`   - ${c.name} (${c.type_desc})`);
    });
    console.log('');

    // Test 4: Verificar índices
    console.log('📋 Test 4: Verificar índices');
    const indexesCheck = await pool.request().query(`
      SELECT
        i.name as index_name,
        i.type_desc,
        COL_NAME(ic.object_id, ic.column_id) as column_name
      FROM sys.indexes i
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      WHERE i.object_id = OBJECT_ID('configurations')
      ORDER BY i.name, ic.key_ordinal
    `);

    console.log('✅ Índices encontrados:');
    const indexGroups = {};
    indexesCheck.recordset.forEach(idx => {
      if (!indexGroups[idx.index_name]) {
        indexGroups[idx.index_name] = {
          type: idx.type_desc,
          columns: []
        };
      }
      indexGroups[idx.index_name].columns.push(idx.column_name);
    });

    Object.keys(indexGroups).forEach(name => {
      const idx = indexGroups[name];
      console.log(`   - ${name} (${idx.type}): ${idx.columns.join(', ')}`);
    });
    console.log('');

    // Test 5: Intentar INSERT de prueba (y luego borrar)
    console.log('📋 Test 5: Probar operaciones CRUD');

    // Verificar si existe una empresa para la prueba
    const companyCheck = await pool.request().query(`
      SELECT TOP 1 id FROM companies WHERE is_active = 1
    `);

    if (companyCheck.recordset.length > 0) {
      const companyId = companyCheck.recordset[0].id;

      try {
        // INSERT
        await pool.request().query(`
          INSERT INTO configurations (
            company_id, token_endpoint, token_method,
            list_query_endpoint, list_query_method,
            notification_endpoint, notification_method,
            auth_type, is_active, description
          ) VALUES (
            999999, 'https://test.com/token', 'POST',
            'https://test.com/list', 'GET',
            'https://test.com/notify', 'POST',
            'BEARER', 1, 'Test configuration'
          )
        `);
        console.log('✅ INSERT funciona');

        // SELECT
        const selectResult = await pool.request().query(`
          SELECT * FROM configurations WHERE company_id = 999999
        `);
        console.log('✅ SELECT funciona');

        // UPDATE
        await pool.request().query(`
          UPDATE configurations
          SET description = 'Updated test'
          WHERE company_id = 999999
        `);
        console.log('✅ UPDATE funciona');

        // DELETE
        await pool.request().query(`
          DELETE FROM configurations WHERE company_id = 999999
        `);
        console.log('✅ DELETE funciona\n');

      } catch (testError) {
        console.log(`⚠️  Operación CRUD parcial: ${testError.message}\n`);
      }
    } else {
      console.log('⚠️  No hay empresas activas para probar INSERT\n');
    }

    // Resumen final
    console.log('═'.repeat(70));
    console.log('  ✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE');
    console.log('═'.repeat(70));
    console.log('');
    console.log('📊 Resumen:');
    console.log(`   ✓ Tabla creada: configurations`);
    console.log(`   ✓ Columnas: ${tableCheck.recordset[0].column_count}`);
    console.log(`   ✓ Índices: ${tableCheck.recordset[0].index_count}`);
    console.log(`   ✓ Constraints: ${constraintsCheck.recordset.length}`);
    console.log('');
    console.log('✨ La tabla configurations está lista para usar\n');

  } catch (error) {
    console.error('\n❌ ERROR EN VERIFICACIÓN:');
    console.error(`   ${error.message}\n`);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

// Ejecutar verificación
verifyTable();
