/**
 * Servicio de validación de esquema
 * Compara modelos Sequelize con estructura real de tablas en BD
 * Alerta sobre diferencias entre código y base de datos
 */
class SchemaValidatorService {
  constructor(sequelize, models) {
    this.sequelize = sequelize;
    this.models = models;
  }

  /**
   * Obtiene las columnas de una tabla en la BD
   */
  async getTableColumns(tableName) {
    const [columns] = await this.sequelize.query(`
      SELECT
        COLUMN_NAME as name,
        DATA_TYPE as type,
        CHARACTER_MAXIMUM_LENGTH as maxLength,
        IS_NULLABLE as nullable,
        COLUMN_DEFAULT as defaultValue
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = :tableName
      ORDER BY ORDINAL_POSITION
    `, {
      replacements: { tableName }
    });

    return columns.map(col => ({
      name: col.name,
      type: col.type,
      maxLength: col.maxLength,
      nullable: col.nullable === 'YES',
      defaultValue: col.defaultValue
    }));
  }

  /**
   * Obtiene las columnas definidas en un modelo Sequelize
   */
  getModelColumns(model) {
    const attributes = model.rawAttributes || model.tableAttributes;
    const columns = [];

    for (const [attrName, attr] of Object.entries(attributes)) {
      // Obtener nombre de columna (puede ser diferente al nombre del atributo)
      const columnName = attr.field || attrName;

      // Mapear tipo Sequelize a tipo SQL Server
      let sqlType = 'unknown';
      if (attr.type) {
        const typeKey = attr.type.key || attr.type.constructor.name;
        sqlType = this.mapSequelizeTypeToSQL(typeKey, attr.type);
      }

      columns.push({
        attributeName: attrName,
        columnName: columnName,
        type: sqlType,
        allowNull: attr.allowNull !== false,
        primaryKey: attr.primaryKey || false,
        autoIncrement: attr.autoIncrement || false
      });
    }

    return columns;
  }

  /**
   * Mapea tipos Sequelize a tipos SQL Server
   */
  mapSequelizeTypeToSQL(typeKey, typeInstance) {
    const typeMap = {
      'INTEGER': 'int',
      'BIGINT': 'bigint',
      'STRING': 'nvarchar',
      'TEXT': 'nvarchar',
      'BOOLEAN': 'bit',
      'DATE': 'datetime',
      'DATEONLY': 'date',
      'DECIMAL': 'decimal',
      'FLOAT': 'float',
      'DOUBLE': 'float',
      'UUID': 'uniqueidentifier',
      'JSON': 'nvarchar',
      'JSONB': 'nvarchar'
    };

    return typeMap[typeKey] || typeKey.toLowerCase();
  }

  /**
   * Compara un modelo con su tabla en BD
   */
  async validateModel(modelName, model) {
    const tableName = model.tableName || model.name;
    const modelColumns = this.getModelColumns(model);
    const dbColumns = await this.getTableColumns(tableName);

    const dbColumnNames = new Set(dbColumns.map(c => c.name.toLowerCase()));
    const modelColumnNames = new Set(modelColumns.map(c => c.columnName.toLowerCase()));

    const differences = {
      modelName,
      tableName,
      inModelNotInDB: [],
      inDBNotInModel: [],
      typeMismatches: [],
      synced: true
    };

    // Columnas en modelo que no están en BD
    for (const col of modelColumns) {
      if (!dbColumnNames.has(col.columnName.toLowerCase())) {
        differences.inModelNotInDB.push({
          column: col.columnName,
          attribute: col.attributeName,
          type: col.type
        });
        differences.synced = false;
      }
    }

    // Columnas en BD que no están en modelo (solo warning, puede ser intencional)
    for (const col of dbColumns) {
      if (!modelColumnNames.has(col.name.toLowerCase())) {
        differences.inDBNotInModel.push({
          column: col.name,
          type: col.type
        });
        // No marcar como no sincronizado, puede ser intencional
      }
    }

    // Verificar tipos (simplificado)
    for (const modelCol of modelColumns) {
      const dbCol = dbColumns.find(
        c => c.name.toLowerCase() === modelCol.columnName.toLowerCase()
      );

      if (dbCol) {
        const modelType = modelCol.type.toLowerCase();
        const dbType = dbCol.type.toLowerCase();

        // Comparación simplificada de tipos
        if (!this.typesAreCompatible(modelType, dbType)) {
          differences.typeMismatches.push({
            column: modelCol.columnName,
            modelType: modelCol.type,
            dbType: dbCol.type
          });
        }
      }
    }

    return differences;
  }

  /**
   * Verifica si dos tipos son compatibles
   */
  typesAreCompatible(modelType, dbType) {
    // Mapeo de compatibilidades
    const compatibleTypes = {
      'int': ['int', 'integer'],
      'nvarchar': ['nvarchar', 'varchar', 'string', 'text'],
      'varchar': ['varchar', 'nvarchar', 'string'],
      'bit': ['bit', 'boolean', 'tinyint'],
      'decimal': ['decimal', 'numeric', 'money'],
      'float': ['float', 'real', 'double'],
      'datetime': ['datetime', 'datetime2', 'datetimeoffset', 'date'],
      'datetimeoffset': ['datetimeoffset', 'datetime', 'datetime2']
    };

    const modelTypeLower = modelType.toLowerCase();
    const dbTypeLower = dbType.toLowerCase();

    // Si son iguales
    if (modelTypeLower === dbTypeLower) return true;

    // Verificar compatibilidad
    for (const [type, compatibles] of Object.entries(compatibleTypes)) {
      if (compatibles.includes(modelTypeLower) && compatibles.includes(dbTypeLower)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Valida todos los modelos
   */
  async validateAllModels() {
    const results = {
      timestamp: new Date().toISOString(),
      totalModels: 0,
      syncedModels: 0,
      unsyncedModels: 0,
      models: []
    };

    // Modelos a validar (excluir modelos internos de Sequelize)
    const modelsToValidate = ['Company', 'Role', 'Rule', 'User', 'UserRole', 'Assignment', 'Configuration', 'RuleRole'];

    for (const modelName of modelsToValidate) {
      const model = this.models[modelName];

      if (!model) continue;

      results.totalModels++;

      try {
        const validation = await this.validateModel(modelName, model);
        results.models.push(validation);

        if (validation.synced && validation.inModelNotInDB.length === 0) {
          results.syncedModels++;
        } else {
          results.unsyncedModels++;
        }
      } catch (error) {
        results.models.push({
          modelName,
          error: error.message,
          synced: false
        });
        results.unsyncedModels++;
      }
    }

    return results;
  }

  /**
   * Genera reporte formateado para consola
   */
  formatReport(validationResults) {
    const lines = [];

    lines.push('╔════════════════════════════════════════════════════════════════╗');
    lines.push('║                    SCHEMA VALIDATION REPORT                    ║');
    lines.push('╠════════════════════════════════════════════════════════════════╣');

    for (const model of validationResults.models) {
      if (model.error) {
        lines.push(`║ ❌ ${model.modelName}: ERROR - ${model.error}`);
        continue;
      }

      const totalCols = model.inModelNotInDB.length === 0 ? '✅' : '⚠️';
      const modelCols = this.getModelColumns(this.models[model.modelName]).length;

      if (model.inModelNotInDB.length === 0 && model.typeMismatches.length === 0) {
        lines.push(`║ ✅ ${model.modelName}: ${modelCols} campos sincronizados`);
      } else {
        lines.push(`║ ⚠️  ${model.modelName}: ${model.inModelNotInDB.length} diferencia(s)`);

        for (const diff of model.inModelNotInDB) {
          lines.push(`║    🔴 ${diff.column} (${diff.type}) → NO EXISTE EN BD`);
        }

        for (const diff of model.typeMismatches) {
          lines.push(`║    🟠 ${diff.column}: modelo(${diff.modelType}) vs BD(${diff.dbType})`);
        }
      }

      // Mostrar columnas en BD que no están en modelo (solo si hay)
      if (model.inDBNotInModel.length > 0) {
        for (const diff of model.inDBNotInModel) {
          lines.push(`║    🟡 ${diff.column} existe en BD pero no en modelo`);
        }
      }
    }

    lines.push('╠════════════════════════════════════════════════════════════════╣');
    lines.push(`║ 📊 Resumen: ${validationResults.syncedModels}/${validationResults.totalModels} modelos sincronizados`);

    if (validationResults.unsyncedModels > 0) {
      lines.push('║ ⚠️  ACCIÓN REQUERIDA: Crear migración para campos faltantes');
    }

    lines.push('╚════════════════════════════════════════════════════════════════╝');

    return lines.join('\n');
  }

  /**
   * Obtiene campos que requieren migración
   */
  async getRequiredMigrations() {
    const validation = await this.validateAllModels();
    const required = [];

    for (const model of validation.models) {
      if (model.inModelNotInDB && model.inModelNotInDB.length > 0) {
        required.push({
          model: model.modelName,
          table: model.tableName,
          missingColumns: model.inModelNotInDB
        });
      }
    }

    return required;
  }
}

module.exports = SchemaValidatorService;
