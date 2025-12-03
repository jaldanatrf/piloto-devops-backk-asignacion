/**
 * Script para ejecutar la migración de la tabla configurations
 * Este script ejecuta el archivo SQL de migración directamente en la base de datos
 */

const fs = require('fs');
const path = require('path');
const sql = require('mssql');
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

async function runMigration() {
  let pool = null;

  try {
    console.log('🔄 Conectando a la base de datos...');
    console.log(`   Host: ${config.server}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log('');

    // Conectar a la base de datos
    pool = await sql.connect(config);
    console.log('✅ Conexión exitosa a la base de datos\n');

    // Leer el archivo de migración simplificado
    const migrationPath = path.join(__dirname, 'create-configurations-simple.sql');
    console.log('📄 Leyendo archivo de migración...');
    console.log(`   Path: ${migrationPath}\n`);

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Archivo de migración no encontrado: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log(`📝 Ejecutando migración...\n`);
    console.log('━'.repeat(60));

    // Ejecutar el script completo
    try {
      const result = await pool.request().query(migrationSQL);
      console.log('\n✅ Script ejecutado exitosamente');

      // Mostrar mensajes de print
      if (result.recordset && result.recordset.length > 0) {
        result.recordset.forEach(row => console.log(`   ${JSON.stringify(row)}`));
      }
    } catch (sqlError) {
      console.error('❌ Error ejecutando SQL:', sqlError.message);
      throw sqlError;
    }

    console.log('\n' + '━'.repeat(60));
    console.log('\n✅ Migración completada exitosamente\n');

    // Verificar que la tabla existe
    console.log('🔍 Verificando tabla configurations...');
    const checkResult = await pool.request().query(`
      SELECT
        OBJECT_ID('configurations') as table_id,
        (SELECT COUNT(*) FROM sys.columns WHERE object_id = OBJECT_ID('configurations')) as column_count,
        (SELECT COUNT(*) FROM sys.indexes WHERE object_id = OBJECT_ID('configurations')) as index_count,
        (SELECT COUNT(*) FROM sys.triggers WHERE parent_id = OBJECT_ID('configurations')) as trigger_count
    `);

    if (checkResult.recordset[0].table_id) {
      console.log('✅ Tabla configurations verificada:');
      console.log(`   - Columnas: ${checkResult.recordset[0].column_count}`);
      console.log(`   - Índices: ${checkResult.recordset[0].index_count}`);
      console.log(`   - Triggers: ${checkResult.recordset[0].trigger_count}`);
      console.log('');
    } else {
      console.error('❌ La tabla configurations no se creó correctamente');
      process.exit(1);
    }

    // Mostrar estructura de la tabla
    console.log('📋 Estructura de la tabla:\n');
    const columnsResult = await pool.request().query(`
      SELECT
        c.name as column_name,
        t.name as data_type,
        c.max_length,
        c.is_nullable,
        c.is_identity
      FROM sys.columns c
      JOIN sys.types t ON c.user_type_id = t.user_type_id
      WHERE c.object_id = OBJECT_ID('configurations')
      ORDER BY c.column_id
    `);

    console.table(columnsResult.recordset);

  } catch (error) {
    console.error('\n❌ Error ejecutando migración:');
    console.error(`   ${error.message}\n`);

    if (error.originalError) {
      console.error('Detalles del error:', error.originalError);
    }

    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar migración
console.log('');
console.log('═'.repeat(60));
console.log('   MIGRACIÓN: Tabla configurations');
console.log('═'.repeat(60));
console.log('');

runMigration().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
