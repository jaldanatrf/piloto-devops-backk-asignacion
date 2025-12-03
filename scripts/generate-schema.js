#!/usr/bin/env node

/**
 * Script para generar el esquema inicial de base de datos
 * Útil para crear archivos SQL para deployment manual en nuevos ambientes
 *
 * Uso:
 *   node scripts/generate-schema.js
 *   node scripts/generate-schema.js --output ./output/schema.sql
 */

const path = require('path');
const DatabaseFactory = require('../src/infrastructure/factories/DatabaseFactory');

async function generateSchema() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          GENERADOR DE ESQUEMA INICIAL DE BASE DE DATOS        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  let databaseService;

  try {
    // Parsear argumentos
    const args = process.argv.slice(2);
    const outputIndex = args.indexOf('--output');
    const outputPath = outputIndex !== -1 && args[outputIndex + 1]
      ? args[outputIndex + 1]
      : './initial_schema.sql';

    console.log(`📋 Archivo de salida: ${path.resolve(outputPath)}\n`);

    // Inicializar conexión a BD
    console.log('🔌 Conectando a base de datos...');
    databaseService = await DatabaseFactory.initializeDatabase();
    console.log('✅ Conexión establecida\n');

    // Generar esquema
    const dbInitService = databaseService.dbInitService;
    await dbInitService.generateInitialSchema(outputPath);

    console.log('\n✅ Proceso completado exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error generando esquema:', error.message);
    console.error(error.stack);
    process.exit(1);

  } finally {
    // Cerrar conexión
    if (databaseService) {
      try {
        await databaseService.disconnect();
        console.log('🔌 Conexión cerrada');
      } catch (err) {
        console.error('Error cerrando conexión:', err.message);
      }
    }
  }
}

// Ejecutar
generateSchema();
