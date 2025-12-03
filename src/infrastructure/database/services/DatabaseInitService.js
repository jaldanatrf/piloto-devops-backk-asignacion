const MigrationService = require('./MigrationService');
const SchemaValidatorService = require('./SchemaValidatorService');
const TableGeneratorService = require('./TableGeneratorService');

/**
 * Servicio de inicialización de base de datos
 * Coordina migraciones automáticas y validación de esquema
 */
class DatabaseInitService {
  constructor(sequelize, models) {
    this.sequelize = sequelize;
    this.models = models;
    this.migrationService = new MigrationService(sequelize);
    this.schemaValidator = new SchemaValidatorService(sequelize, models);
    this.tableGenerator = new TableGeneratorService(sequelize, models);
  }

  /**
   * Ejecuta la inicialización completa de la base de datos
   * 1. Crea tablas faltantes (para bases de datos nuevas)
   * 2. Ejecuta migraciones pendientes
   * 3. Valida esquema (modelo vs BD)
   * 4. Reporta estado
   * @param {boolean} verbose - Si false, muestra solo logs esenciales
   */
  async initialize(verbose = false) {
    const report = {
      timestamp: new Date().toISOString(),
      tables: null,
      migrations: null,
      schema: null,
      hasErrors: false,
      hasWarnings: false
    };

    // Solo mostrar header en modo verbose
    // Eliminado para reducir logs de inicio

    // 1. Verificar y crear tablas faltantes (para BD nuevas)

    try {
      const missingTables = await this.tableGenerator.getMissingTables();

      if (missingTables.length > 0) {
        const tableResults = await this.tableGenerator.createMissingTables();
        report.tables = tableResults;

        if (tableResults.failed > 0) {
          console.log(`❌ ${tableResults.failed} tabla(s) fallaron al crearse`);
          report.hasErrors = true;
        } else if (verbose) {
          console.log(`✅ ${tableResults.created} tabla(s) creada(s)`);
        }
      } else {
        report.tables = { created: 0, skipped: Object.keys(this.models).length };
      }
    } catch (error) {
      console.log(`❌ Error verificando/creando tablas: ${error.message}`);
      report.tables = { error: error.message };
      report.hasErrors = true;
    }

    // 2. Ejecutar migraciones pendientes
    try {
      const migrationStatus = await this.migrationService.getStatus();

      if (migrationStatus.pending > 0) {
        const results = await this.migrationService.runPendingMigrations();
        report.migrations = results;

        if (results.failed > 0) {
          console.log(`⚠️  ${results.failed} migración(es) fallida(s)`);
          report.hasErrors = true;
        } else if (verbose) {
          console.log(`✅ ${results.executed} migración(es) ejecutada(s)`);
        }
      } else {
        report.migrations = { total: 0, executed: 0, failed: 0 };
      }

      // Verificar migraciones modificadas
      if (verbose) {
        const modified = await this.migrationService.checkModifiedMigrations();
        if (modified.length > 0) {
          console.log('\n   ⚠️  ADVERTENCIA: Migraciones modificadas detectadas:');
          for (const m of modified) {
            console.log(`      - ${m.name}`);
          }
          report.hasWarnings = true;
        }
      }

    } catch (error) {
      console.log(`❌ Error en migraciones: ${error.message}`);
      report.migrations = { error: error.message };
      report.hasErrors = true;
    }

    // 3. Validar esquema
    try {
      const validation = await this.schemaValidator.validateAllModels();
      report.schema = validation;

      // Solo mostrar si hay problemas o en modo verbose
      if (validation.unsyncedModels > 0) {
        report.hasWarnings = true;
        console.log(`⚠️  ${validation.unsyncedModels} modelo(s) desincronizado(s)`);

        if (verbose) {
          const required = await this.schemaValidator.getRequiredMigrations();
          if (required.length > 0) {
            console.log('📝 Campos que requieren migración:', required.length);
          }
        }
      }

    } catch (error) {
      console.log(`❌ Error en validación: ${error.message}`);
      report.schema = { error: error.message };
      report.hasErrors = true;
    }

    // 4. Resumen final consolidado
    if (report.hasErrors) {
      console.log('❌ Inicialización de BD con errores');
    } else if (report.hasWarnings && verbose) {
      console.log('⚠️  BD inicializada con advertencias');
    } else if (!report.hasErrors && !report.hasWarnings) {
      // Solo mostrar mensaje de éxito si no hay ni errores ni warnings
      console.log('✅ BD inicializada correctamente');
    }

    return report;
  }

  /**
   * Genera archivo SQL con todas las tablas para deployment manual
   */
  async generateInitialSchema(outputPath = './initial_schema.sql') {
    const fs = require('fs');
    const path = require('path');

    console.log('\n📝 Generando archivo de esquema inicial...\n');

    const sqlContent = await this.tableGenerator.generateInitialMigrationFile(outputPath);

    const fullPath = path.resolve(outputPath);
    fs.writeFileSync(fullPath, sqlContent, 'utf8');

    console.log(`✅ Archivo generado exitosamente: ${fullPath}`);
    console.log(`\n💡 Para crear manualmente la BD en otro ambiente:`);
    console.log(`   1. Crear base de datos vacía`);
    console.log(`   2. Ejecutar: sqlcmd -i ${fullPath}`);
    console.log(`   3. Iniciar aplicación normalmente\n`);

    return fullPath;
  }

  /**
   * Solo ejecuta validación de esquema (sin migraciones)
   */
  async validateOnly() {
    console.log('\n🔍 Ejecutando validación de esquema...\n');
    const validation = await this.schemaValidator.validateAllModels();
    console.log(this.schemaValidator.formatReport(validation));
    return validation;
  }

  /**
   * Solo ejecuta migraciones (sin validación)
   */
  async migrateOnly() {
    console.log('\n📦 Ejecutando migraciones pendientes...\n');
    return await this.migrationService.runPendingMigrations();
  }

  /**
   * Obtiene estado actual sin ejecutar nada
   */
  async getStatus() {
    const migrationStatus = await this.migrationService.getStatus();
    const schemaValidation = await this.schemaValidator.validateAllModels();

    return {
      migrations: migrationStatus,
      schema: {
        totalModels: schemaValidation.totalModels,
        syncedModels: schemaValidation.syncedModels,
        unsyncedModels: schemaValidation.unsyncedModels,
        issues: schemaValidation.models.filter(m =>
          (m.inModelNotInDB && m.inModelNotInDB.length > 0) ||
          (m.typeMismatches && m.typeMismatches.length > 0)
        )
      }
    };
  }
}

module.exports = DatabaseInitService;
