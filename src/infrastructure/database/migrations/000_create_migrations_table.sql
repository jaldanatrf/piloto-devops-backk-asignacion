-- Migración inicial: Crear tabla de tracking de migraciones
-- Fecha: 2025-11-25
-- Descripción: Tabla para registrar migraciones ejecutadas

-- Crear tabla _migrations si no existe
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

    PRINT '✅ Tabla _migrations creada exitosamente';
END
ELSE
BEGIN
    PRINT 'ℹ️ Tabla _migrations ya existe';
END
GO
