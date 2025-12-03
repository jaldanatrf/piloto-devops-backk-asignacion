-- Migración para agregar campo code a tabla rules
-- Fecha: 2025-11-14
-- Descripción: Agrega soporte para nuevos tipos de reglas basadas en ObjectionCode

-- 1. Agregar campo code a tabla rules
IF COL_LENGTH('rules', 'code') IS NULL
BEGIN
    ALTER TABLE rules ADD code VARCHAR(100) NULL;
    PRINT 'Columna code agregada a rules exitosamente';
END
ELSE
BEGIN
    PRINT 'Columna code ya existe en rules, continuando...';
END
GO

-- 2. Crear índice para optimizar búsquedas por code
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_rules_code' AND object_id = OBJECT_ID('rules'))
BEGIN
    CREATE INDEX IX_rules_code ON rules (code);
    PRINT 'Índice IX_rules_code creado exitosamente';
END
ELSE
BEGIN
    PRINT 'Índice IX_rules_code ya existe';
END
GO

-- 3. Crear índice compuesto para búsquedas por company_id y code
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_rules_company_code' AND object_id = OBJECT_ID('rules'))
BEGIN
    CREATE INDEX IX_rules_company_code ON rules (company_id, code);
    PRINT 'Índice IX_rules_company_code creado exitosamente';
END
ELSE
BEGIN
    PRINT 'Índice IX_rules_company_code ya existe';
END
GO

-- 4. Crear índice compuesto para búsquedas por company_id y type
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_rules_company_type' AND object_id = OBJECT_ID('rules'))
BEGIN
    CREATE INDEX IX_rules_company_type ON rules (company_id, type);
    PRINT 'Índice IX_rules_company_type creado exitosamente';
END
ELSE
BEGIN
    PRINT 'Índice IX_rules_company_type ya existe';
END
GO

-- 5. Verificar que la columna se agregó correctamente
IF COL_LENGTH('rules', 'code') IS NOT NULL
BEGIN
    PRINT '';
    PRINT '✅ Migración completada exitosamente';
    PRINT '';
    PRINT 'Cambios realizados:';
    PRINT '1. ✅ Campo code (VARCHAR(100), NULL) agregado a tabla rules';
    PRINT '2. ✅ Índice IX_rules_code para búsquedas por code';
    PRINT '3. ✅ Índice IX_rules_company_code para búsquedas por empresa y code';
    PRINT '4. ✅ Índice IX_rules_company_type para búsquedas por empresa y tipo';
    PRINT '';
    PRINT 'Nuevos tipos de reglas soportados:';
    PRINT '- CODE: Solo código de objeción';
    PRINT '- CODE-AMOUNT: Código + rango de montos';
    PRINT '- COMPANY-CODE: NIT + código';
    PRINT '- CODE-AMOUNT-COMPANY: Código + rango + NIT (máxima especificidad)';
    PRINT '';
    PRINT 'NOTAS:';
    PRINT '- El campo code es NULL por defecto (retrocompatibilidad)';
    PRINT '- Las reglas existentes NO requieren migración de datos';
    PRINT '- Los índices optimizan validaciones de duplicados y búsquedas';
END
ELSE
BEGIN
    PRINT '❌ Error: La columna code no se agregó correctamente';
END
GO
