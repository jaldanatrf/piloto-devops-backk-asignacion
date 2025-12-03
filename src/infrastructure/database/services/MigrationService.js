const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Servicio de gestión de migraciones de base de datos
 * - Ejecuta migraciones pendientes automáticamente
 * - Registra migraciones ejecutadas en tabla _migrations
 * - Soporta nomenclatura secuencial: 001_nombre.sql
 */
class MigrationService {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.migrationsPath = path.join(__dirname, '../migrations');
  }

  /**
   * Calcula checksum SHA256 de un archivo
   */
  calculateChecksum(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Asegura que la tabla _migrations existe
   */
  async ensureMigrationsTable() {
    const createTableSQL = `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '_migrations')
      BEGIN
        CREATE TABLE _migrations (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          checksum VARCHAR(64) NOT NULL,
          executed_at DATETIME DEFAULT GETDATE(),
          execution_time_ms INT NULL,
          status VARCHAR(20) DEFAULT 'SUCCESS'
        );
        CREATE INDEX IX_migrations_name ON _migrations(name);
        CREATE INDEX IX_migrations_executed_at ON _migrations(executed_at);
      END
    `;
    await this.sequelize.query(createTableSQL);
  }

  /**
   * Obtiene lista de migraciones ya ejecutadas
   */
  async getExecutedMigrations() {
    try {
      const [results] = await this.sequelize.query(
        'SELECT name, checksum, status FROM _migrations ORDER BY name'
      );
      return results;
    } catch (error) {
      // Si la tabla no existe, retornar array vacío
      if (error.message.includes('Invalid object name')) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Obtiene lista de archivos de migración en el sistema de archivos
   */
  getMigrationFiles() {
    if (!fs.existsSync(this.migrationsPath)) {
      return [];
    }

    return fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.sql') && /^\d{3}_/.test(file))
      .sort();
  }

  /**
   * Obtiene migraciones pendientes de ejecutar
   */
  async getPendingMigrations() {
    const executedMigrations = await this.getExecutedMigrations();
    const executedNames = new Set(executedMigrations.map(m => m.name));
    const migrationFiles = this.getMigrationFiles();

    return migrationFiles.filter(file => !executedNames.has(file));
  }

  /**
   * Ejecuta una migración individual
   */
  async executeMigration(fileName) {
    const filePath = path.join(this.migrationsPath, fileName);
    const content = fs.readFileSync(filePath, 'utf8');
    const checksum = this.calculateChecksum(content);

    const startTime = Date.now();

    try {
      // Dividir por GO para SQL Server
      const blocks = content.split(/\bGO\b/gi).filter(block => block.trim());

      for (const block of blocks) {
        if (block.trim()) {
          await this.sequelize.query(block);
        }
      }

      const executionTime = Date.now() - startTime;

      // Registrar migración exitosa
      await this.sequelize.query(
        `INSERT INTO _migrations (name, checksum, execution_time_ms, status)
         VALUES (:name, :checksum, :executionTime, 'SUCCESS')`,
        {
          replacements: { name: fileName, checksum, executionTime }
        }
      );

      return { success: true, executionTime };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Intentar registrar migración fallida
      try {
        await this.sequelize.query(
          `INSERT INTO _migrations (name, checksum, execution_time_ms, status)
           VALUES (:name, :checksum, :executionTime, 'FAILED')`,
          {
            replacements: { name: fileName, checksum, executionTime }
          }
        );
      } catch (insertError) {
        // Ignorar error de registro si falla
      }

      return { success: false, error: error.message, executionTime };
    }
  }

  /**
   * Ejecuta todas las migraciones pendientes
   */
  async runPendingMigrations() {
    await this.ensureMigrationsTable();

    const pending = await this.getPendingMigrations();
    const results = {
      total: pending.length,
      executed: 0,
      failed: 0,
      details: []
    };

    if (pending.length === 0) {
      return results;
    }

    for (const migration of pending) {
      const result = await this.executeMigration(migration);

      results.details.push({
        name: migration,
        ...result
      });

      if (result.success) {
        results.executed++;
      } else {
        results.failed++;
        // Detener en caso de error
        break;
      }
    }

    return results;
  }

  /**
   * Obtiene el estado completo de migraciones
   */
  async getStatus() {
    await this.ensureMigrationsTable();

    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();
    const files = this.getMigrationFiles();

    return {
      total: files.length,
      executed: executed.length,
      pending: pending.length,
      pendingFiles: pending,
      executedFiles: executed.map(m => ({
        name: m.name,
        status: m.status
      }))
    };
  }

  /**
   * Verifica si hay migraciones con checksum diferente (modificadas)
   */
  async checkModifiedMigrations() {
    const executed = await this.getExecutedMigrations();
    const modified = [];

    for (const migration of executed) {
      const filePath = path.join(this.migrationsPath, migration.name);

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const currentChecksum = this.calculateChecksum(content);

        if (currentChecksum !== migration.checksum) {
          modified.push({
            name: migration.name,
            originalChecksum: migration.checksum,
            currentChecksum
          });
        }
      }
    }

    return modified;
  }
}

module.exports = MigrationService;
