#!/usr/bin/env node
/**
 * Script de migración de base de datos
 * Uso:
 *   npm run migrate           - Ejecuta migraciones pendientes
 *   npm run migrate -- --status - Muestra estado de migraciones
 *   npm run migrate -- --validate - Solo valida esquema sin ejecutar migraciones
 */

const { Sequelize } = require('sequelize');
const config = require('../src/infrastructure/config');
const MigrationService = require('../src/infrastructure/database/services/MigrationService');
const SchemaValidatorService = require('../src/infrastructure/database/services/SchemaValidatorService');
const { defineModels } = require('../src/infrastructure/database/models');

async function main() {
  const args = process.argv.slice(2);
  const showStatus = args.includes('--status');
  const validateOnly = args.includes('--validate');

  // Crear conexión a BD
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
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida\n');

    const migrationService = new MigrationService(sequelize);

    if (showStatus) {
      // Solo mostrar estado
      const status = await migrationService.getStatus();

      console.log('═'.repeat(50));
      console.log('         ESTADO DE MIGRACIONES');
      console.log('═'.repeat(50));
      console.log(`Total de archivos:    ${status.total}`);
      console.log(`Ejecutadas:           ${status.executed}`);
      console.log(`Pendientes:           ${status.pending}`);

      if (status.pending > 0) {
        console.log('\n📋 Migraciones pendientes:');
        for (const file of status.pendingFiles) {
          console.log(`   - ${file}`);
        }
      }

      if (status.executed > 0) {
        console.log('\n✅ Migraciones ejecutadas:');
        for (const file of status.executedFiles) {
          const statusIcon = file.status === 'SUCCESS' ? '✅' : '❌';
          console.log(`   ${statusIcon} ${file.name}`);
        }
      }

      // Verificar modificaciones
      const modified = await migrationService.checkModifiedMigrations();
      if (modified.length > 0) {
        console.log('\n⚠️  Migraciones modificadas:');
        for (const m of modified) {
          console.log(`   - ${m.name}`);
        }
      }

      console.log('═'.repeat(50));

    } else if (validateOnly) {
      // Solo validar esquema
      const models = defineModels(sequelize);
      const schemaValidator = new SchemaValidatorService(sequelize, models);
      const validation = await schemaValidator.validateAllModels();

      console.log(schemaValidator.formatReport(validation));

    } else {
      // Ejecutar migraciones pendientes
      console.log('📦 Ejecutando migraciones pendientes...\n');

      const results = await migrationService.runPendingMigrations();

      if (results.total === 0) {
        console.log('✅ No hay migraciones pendientes');
      } else {
        for (const detail of results.details) {
          if (detail.success) {
            console.log(`✅ ${detail.name} (${detail.executionTime}ms)`);
          } else {
            console.log(`❌ ${detail.name} - ERROR: ${detail.error}`);
          }
        }

        console.log(`\n📊 Resultado: ${results.executed}/${results.total} ejecutadas`);

        if (results.failed > 0) {
          process.exit(1);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
