-- ============================================================
-- MIGRACIÓN 004: Agregar constraint UNIQUE en columna dud
-- Previene duplicación de usuarios por documento único
-- Fecha: 2025-12-01
-- ============================================================

-- Primero, identificar y reportar duplicados existentes
PRINT 'Verificando duplicados existentes en columna dud...';

IF EXISTS (
    SELECT dud, COUNT(*) as count
    FROM users
    GROUP BY dud
    HAVING COUNT(*) > 1
)
BEGIN
    PRINT 'ADVERTENCIA: Se encontraron registros duplicados por DUD';

    -- Mostrar duplicados
    SELECT dud, COUNT(*) as count, MIN(id) as first_id, MAX(id) as last_id
    FROM users
    GROUP BY dud
    HAVING COUNT(*) > 1
    ORDER BY count DESC;

    PRINT 'Eliminando duplicados (conservando el registro más antiguo por created_at)...';

    -- Eliminar duplicados, conservando el más antiguo
    WITH CTE AS (
        SELECT id, dud, created_at,
               ROW_NUMBER() OVER(PARTITION BY dud ORDER BY created_at ASC, id ASC) AS rn
        FROM users
    )
    DELETE FROM CTE WHERE rn > 1;

    PRINT 'Duplicados eliminados exitosamente';
END
ELSE
BEGIN
    PRINT 'No se encontraron duplicados';
END

-- Verificar si el constraint ya existe
IF NOT EXISTS (
    SELECT * FROM sys.indexes
    WHERE name='UQ_users_dud' AND object_id = OBJECT_ID('users')
)
BEGIN
    PRINT 'Creando constraint UNIQUE en columna dud...';

    -- Crear índice único
    CREATE UNIQUE INDEX UQ_users_dud ON users(dud);

    PRINT 'Constraint UNIQUE UQ_users_dud creado exitosamente';
END
ELSE
BEGIN
    PRINT 'Constraint UNIQUE UQ_users_dud ya existe, omitiendo...';
END

-- Verificación final
PRINT 'Verificación final:';
SELECT
    i.name AS index_name,
    i.is_unique AS is_unique,
    c.name AS column_name
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('users') AND c.name = 'dud';

PRINT '✅ Migración 004 completada exitosamente';
GO
