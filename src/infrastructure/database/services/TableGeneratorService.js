const { logger } = require('../../../shared/logger');

/**
 * Servicio para generar y crear tablas automáticamente desde modelos Sequelize
 * Útil para inicialización de bases de datos nuevas en diferentes ambientes
 */
class TableGeneratorService {
  constructor(sequelize, models) {
    this.sequelize = sequelize;
    this.models = models;
  }

  /**
   * Obtiene todas las tablas existentes en la base de datos
   */
  async getExistingTables() {
    try {
      const queryInterface = this.sequelize.getQueryInterface();
      const tables = await queryInterface.showAllTables();

      // SQL Server devuelve objetos {TABLE_NAME: '...', TABLE_SCHEMA: '...'}
      return tables.map(t => {
        if (typeof t === 'string') {
          return t.toLowerCase();
        } else if (t.TABLE_NAME) {
          return t.TABLE_NAME.toLowerCase();
        } else {
          return String(t).toLowerCase();
        }
      });
    } catch (error) {
      logger.error('Error getting existing tables:', error);
      throw error;
    }
  }

  /**
   * Verifica qué tablas faltan crear
   */
  async getMissingTables() {
    const existingTables = await this.getExistingTables();
    const modelTables = Object.values(this.models)
      .filter(model => model.tableName)
      .map(model => model.tableName.toLowerCase());

    return modelTables.filter(table => !existingTables.includes(table));
  }

  /**
   * Genera el DDL SQL para crear todas las tablas desde los modelos
   * @param {boolean} includeGO - Si true, incluye comandos GO para archivos SQL
   */
  async generateCreateTableSQL(includeGO = true) {
    const ddlStatements = [];
    const queryInterface = this.sequelize.getQueryInterface();

    // Orden de creación de tablas (respetando dependencias FK)
    const tableOrder = [
      'companies',
      'roles',
      'rules',
      'users',
      'user_roles',
      'assignments',
      'rule_roles',
      'configurations',
      'logs'
    ];

    for (const tableName of tableOrder) {
      const model = Object.values(this.models).find(
        m => m.tableName === tableName
      );

      if (!model) {
        logger.warn(`Model for table ${tableName} not found, skipping...`);
        continue;
      }

      try {
        // Obtener definición de columnas del modelo
        const attributes = model.rawAttributes;
        const tableDefinition = this.buildTableDefinition(tableName, attributes, model, includeGO);

        ddlStatements.push({
          table: tableName,
          sql: tableDefinition
        });

      } catch (error) {
        logger.error(`Error generating DDL for ${tableName}:`, error);
        throw error;
      }
    }

    return ddlStatements;
  }

  /**
   * Construye la definición SQL de una tabla
   * @param {boolean} includeGO - Si true, incluye comando GO al final
   */
  buildTableDefinition(tableName, attributes, model, includeGO = true) {
    const columns = [];
    const fkColumns = [];
    const seenColumns = new Set(); // Para evitar columnas duplicadas

    // Procesar cada columna
    for (const [fieldName, attr] of Object.entries(attributes)) {
      const field = attr.field || fieldName;

      // Skip si ya procesamos esta columna
      if (seenColumns.has(field)) {
        logger.debug(`Skipping duplicate column definition: ${field} in ${tableName}`);
        continue;
      }
      seenColumns.add(field);

      const columnDef = this.buildColumnDefinition(fieldName, attr);

      // Separar columnas con FK de las normales
      if (attr.references) {
        fkColumns.push({ fieldName, attr, columnDef, field });
      } else {
        columns.push(columnDef);
      }
    }

    // Agregar columnas FK (sin constraint inline)
    for (const { columnDef } of fkColumns) {
      columns.push(columnDef);
    }

    // Construir CREATE TABLE statement
    let sql = `-- Crear tabla ${tableName}\n`;
    sql += `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='${tableName}' AND xtype='U')\n`;
    sql += `BEGIN\n`;
    sql += `    CREATE TABLE ${tableName} (\n`;
    sql += `        ${columns.join(',\n        ')}\n`;
    sql += `    );\n`;

    // Agregar constraints FK DESPUÉS de crear la tabla
    // Solo si hay FK columns y estamos en una tabla que puede tener FK
    if (fkColumns.length > 0) {
      sql += `\n    -- Agregar Foreign Keys\n`;

      const seenFKs = new Set();

      for (const { field, attr } of fkColumns) {
        const refTable = attr.references.model?.tableName || attr.references.model;
        const refKey = attr.references.key || 'id';
        const constraintName = `FK_${tableName}_${field}`;

        // Skip FK duplicadas
        if (seenFKs.has(constraintName)) {
          continue;
        }
        seenFKs.add(constraintName);

        // Escapar palabras reservadas en nombres de columnas
        const escapedField = this.escapeReservedWord(field);
        const escapedRefKey = this.escapeReservedWord(refKey);

        // Verificar si la FK existe antes de agregarla
        sql += `    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = '${constraintName}')\n`;
        sql += `    BEGIN\n`;
        sql += `        ALTER TABLE ${tableName}\n`;
        sql += `        ADD CONSTRAINT ${constraintName}\n`;
        sql += `        FOREIGN KEY (${escapedField}) REFERENCES ${refTable}(${escapedRefKey});\n`;
        sql += `        PRINT 'FK ${constraintName} creada';\n`;
        sql += `    END\n`;
      }
    }

    // Agregar índices
    const indexes = this.buildIndexes(tableName, model);
    if (indexes.length > 0) {
      sql += '\n    ' + indexes.join('\n    ');
    }

    sql += `\n    PRINT 'Tabla ${tableName} creada exitosamente';\n`;
    sql += `END\n`;
    sql += `ELSE\n`;
    sql += `BEGIN\n`;
    sql += `    PRINT 'Tabla ${tableName} ya existe, omitiendo...';\n`;
    sql += `END\n`;

    // Solo agregar GO si estamos generando para archivo SQL
    if (includeGO) {
      sql += `GO\n`;
    }

    return sql;
  }

  /**
   * Construye la definición de una columna
   */
  buildColumnDefinition(fieldName, attr) {
    const field = attr.field || fieldName;
    const escapedField = this.escapeReservedWord(field);
    let def = `${escapedField} `;

    // Tipo de dato
    const type = this.mapSequelizeTypeToSQL(attr.type);
    def += type;

    // Identity (autoincrement)
    if (attr.autoIncrement) {
      def += ' IDENTITY(1,1)';
    }

    // Primary Key
    if (attr.primaryKey) {
      def += ' PRIMARY KEY';
    }

    // Nullable
    if (attr.allowNull === false && !attr.primaryKey) {
      def += ' NOT NULL';
    } else if (attr.allowNull !== false && !attr.primaryKey) {
      def += ' NULL';
    }

    // Default value
    if (attr.defaultValue !== undefined && !attr.autoIncrement) {
      const defaultVal = this.processDefaultValue(attr.defaultValue);
      if (defaultVal) {
        def += ` DEFAULT ${defaultVal}`;
      }
    }

    return def;
  }

  /**
   * Procesa valores por defecto para SQL Server
   */
  processDefaultValue(defaultValue) {
    // Literal SQL
    if (typeof defaultValue === 'object' && defaultValue.val) {
      return defaultValue.val;
    }

    // Boolean
    if (typeof defaultValue === 'boolean') {
      return defaultValue ? '1' : '0';
    }

    // Number
    if (typeof defaultValue === 'number') {
      return defaultValue;
    }

    // String literal
    if (typeof defaultValue === 'string') {
      // Funciones SQL
      if (defaultValue.toUpperCase() === 'NOW' ||
          defaultValue.toUpperCase() === 'CURRENT_TIMESTAMP') {
        return 'GETDATE()';
      }

      if (defaultValue.toUpperCase() === 'GETDATE()') {
        return 'GETDATE()';
      }

      // String regular
      return `'${defaultValue}'`;
    }

    return null;
  }

  /**
   * Mapea tipos de Sequelize a SQL Server
   */
  mapSequelizeTypeToSQL(type) {
    const typeString = type.toString();

    // Ya es un tipo SQL nativo - retornarlo directamente
    if (typeString.startsWith('NVARCHAR') ||
        typeString.startsWith('VARCHAR') ||
        typeString === 'INT' ||
        typeString === 'BIT' ||
        typeString.startsWith('DECIMAL') ||
        typeString === 'FLOAT' ||
        typeString.startsWith('DATETIME')) {
      return typeString;
    }

    // Tipos de Sequelize que requieren conversión
    const upperType = typeString.toUpperCase();

    if (upperType.includes('INTEGER')) return 'INT';
    if (upperType.includes('STRING')) {
      const match = typeString.match(/\((\d+)\)/);
      const length = match ? match[1] : '255';
      return `NVARCHAR(${length})`;
    }
    if (upperType.includes('TEXT')) return 'NVARCHAR(MAX)';
    if (upperType.includes('BOOLEAN')) return 'BIT';
    if (upperType.includes('DATE')) return 'DATETIME2';
    if (upperType.includes('DECIMAL')) {
      const match = typeString.match(/\((\d+),\s*(\d+)\)/);
      if (match) {
        return `DECIMAL(${match[1]}, ${match[2]})`;
      }
      return 'DECIMAL(15, 2)';
    }
    if (upperType.includes('FLOAT') || upperType.includes('DOUBLE')) return 'FLOAT';

    logger.warn(`Unknown type mapping for: ${typeString}, defaulting to NVARCHAR(255)`);
    return 'NVARCHAR(255)';
  }

  /**
   * Escapa palabras reservadas de SQL Server con corchetes
   */
  escapeReservedWord(word) {
    const reservedWords = [
      'user', 'table', 'index', 'key', 'value', 'order', 'group',
      'option', 'level', 'status', 'type', 'timestamp', 'role',
      'database', 'schema', 'trigger', 'view', 'procedure', 'function'
    ];

    // Si es palabra reservada, escapar con corchetes
    if (reservedWords.includes(word.toLowerCase())) {
      return `[${word}]`;
    }

    return word;
  }

  /**
   * Construye índices para una tabla
   */
  buildIndexes(tableName, model) {
    const indexes = [];

    if (!model.options?.indexes) return indexes;

    model.options.indexes.forEach((index, i) => {
      const fields = index.fields.join(', ');
      const indexName = index.name || `IX_${tableName}_${i}`;
      const unique = index.unique ? 'UNIQUE ' : '';

      indexes.push(
        `CREATE ${unique}INDEX ${indexName} ON ${tableName} (${fields});`
      );
    });

    return indexes;
  }

  /**
   * Crea todas las tablas faltantes en la base de datos
   * @param {boolean} verbose - Si false, reduce logging
   */
  async createMissingTables(verbose = false) {
    const missingTables = await this.getMissingTables();

    if (missingTables.length === 0) {
      if (verbose) {
        logger.info('✅ Todas las tablas ya existen en la base de datos');
      }
      return {
        created: 0,
        skipped: Object.keys(this.models).length,
        tables: []
      };
    }

    if (verbose) {
      logger.info(`📦 Creando ${missingTables.length} tabla(s) faltante(s)...`);
    }

    // Generar SQL SIN comandos GO (para ejecución directa con Sequelize)
    const ddlStatements = await this.generateCreateTableSQL(false);
    const results = {
      created: 0,
      failed: 0,
      skipped: 0,
      tables: []
    };

    for (const { table, sql } of ddlStatements) {
      if (!missingTables.includes(table)) {
        results.skipped++;
        continue;
      }

      try {
        if (verbose) {
          logger.info(`   Creating table: ${table}`);
        }
        await this.sequelize.query(sql);

        results.created++;
        results.tables.push({ table, status: 'created' });

        if (verbose) {
          logger.info(`   ✅ ${table} creada exitosamente`);
        }

      } catch (error) {
        results.failed++;
        results.tables.push({ table, status: 'failed', error: error.message });
        logger.error(`❌ Error creando ${table}:`, error.message);
        if (verbose) {
          logger.error(`Stack:`, error.stack);
        }
      }
    }

    return results;
  }

  /**
   * Genera un archivo SQL con todas las definiciones de tablas
   */
  async generateInitialMigrationFile(outputPath) {
    const ddlStatements = await this.generateCreateTableSQL();

    let fullSQL = `-- ============================================================\n`;
    fullSQL += `-- MIGRACIÓN INICIAL: Creación de todas las tablas\n`;
    fullSQL += `-- Generado automáticamente desde modelos Sequelize\n`;
    fullSQL += `-- Fecha: ${new Date().toISOString()}\n`;
    fullSQL += `-- ============================================================\n\n`;

    for (const { table, sql } of ddlStatements) {
      fullSQL += sql + '\n';
    }

    fullSQL += `\nPRINT '✅ Todas las tablas han sido creadas exitosamente';\n`;

    return fullSQL;
  }
}

module.exports = TableGeneratorService;
