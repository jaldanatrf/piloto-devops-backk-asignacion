-- ============================================================
-- Script para limpiar base de datos y permitir regeneración
-- ADVERTENCIA: Esto eliminará todas las tablas y datos
-- ============================================================

USE [master];
GO

PRINT '⚠️  INICIANDO LIMPIEZA DE BASE DE DATOS';
PRINT '⚠️  Este proceso eliminará todas las tablas';
GO

-- Cambiar a la base de datos objetivo
-- USE [NOMBRE_DE_TU_BASE_DE_DATOS];
-- GO

-- 1. Eliminar todas las Foreign Keys
DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql += 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id))
    + '.' + QUOTENAME(OBJECT_NAME(parent_object_id))
    + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';' + CHAR(13)
FROM sys.foreign_keys;

IF LEN(@sql) > 0
BEGIN
    PRINT '🔧 Eliminando Foreign Keys...';
    EXEC sp_executesql @sql;
    PRINT '✅ Foreign Keys eliminadas';
END
ELSE
BEGIN
    PRINT 'ℹ️  No hay Foreign Keys para eliminar';
END
GO

-- 2. Eliminar todas las tablas
DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql += 'DROP TABLE ' + QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME) + ';' + CHAR(13)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
  AND TABLE_NAME != 'sysdiagrams'; -- Preservar tabla del sistema

IF LEN(@sql) > 0
BEGIN
    PRINT '🗑️  Eliminando tablas...';
    EXEC sp_executesql @sql;
    PRINT '✅ Todas las tablas eliminadas';
END
ELSE
BEGIN
    PRINT 'ℹ️  No hay tablas para eliminar';
END
GO

-- 3. Verificar limpieza
DECLARE @tableCount INT;
SELECT @tableCount = COUNT(*)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
  AND TABLE_NAME != 'sysdiagrams';

IF @tableCount = 0
BEGIN
    PRINT '';
    PRINT '✅ LIMPIEZA COMPLETADA EXITOSAMENTE';
    PRINT 'ℹ️  La base de datos está vacía y lista para regeneración';
    PRINT '';
    PRINT '📝 Siguiente paso:';
    PRINT '   1. Ejecutar: npm run db:schema';
    PRINT '   2. O bien: npm start (creación automática)';
END
ELSE
BEGIN
    PRINT '';
    PRINT '⚠️  ADVERTENCIA: Aún quedan ' + CAST(@tableCount AS NVARCHAR(10)) + ' tabla(s)';
    PRINT 'ℹ️  Revisar manualmente las tablas restantes';
END
GO
