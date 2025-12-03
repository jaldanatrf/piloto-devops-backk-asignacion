-- Migración para reestructuración del modelo de datos
-- Ejecutar en orden secuencial

-- 1. Eliminar la FK constraint entre users y company
-- (Convertir la relación en informativa)
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_users_company_id')
BEGIN
    ALTER TABLE users DROP CONSTRAINT FK_users_company_id;
    PRINT 'FK constraint FK_users_company_id eliminada exitosamente';
END
ELSE
BEGIN
    PRINT 'FK constraint FK_users_company_id no existe, continuando...';
END
GO

-- 2. Crear tabla rule_roles para relación muchos a muchos
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='rule_roles' AND xtype='U')
BEGIN
    CREATE TABLE rule_roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        rule_id INT NOT NULL,
        role_id INT NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        
        -- Constraints
        CONSTRAINT FK_rule_roles_rule_id FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
        CONSTRAINT FK_rule_roles_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        CONSTRAINT UQ_rule_roles_rule_role UNIQUE (rule_id, role_id)
    );
    
    -- Índices para performance
    CREATE INDEX IX_rule_roles_rule_id ON rule_roles (rule_id);
    CREATE INDEX IX_rule_roles_role_id ON rule_roles (role_id);
    
    PRINT 'Tabla rule_roles creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla rule_roles ya existe, continuando...';
END
GO

-- 3. Hacer que company_id en users sea nullable (campo informativo)
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'company_id' AND is_nullable = 0)
BEGIN
    ALTER TABLE users ALTER COLUMN company_id INT NULL;
    PRINT 'Campo company_id en users convertido a nullable';
END
ELSE
BEGIN
    PRINT 'Campo company_id en users ya es nullable o no existe';
END
GO

-- 4. Trigger para actualizar updated_at en rule_roles
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_rule_roles_updated_at')
BEGIN
    EXEC('
    CREATE TRIGGER tr_rule_roles_updated_at
    ON rule_roles
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE rule_roles 
        SET updated_at = GETDATE()
        FROM inserted
        WHERE rule_roles.id = inserted.id;
    END
    ');
    PRINT 'Trigger tr_rule_roles_updated_at creado exitosamente';
END
ELSE
BEGIN
    PRINT 'Trigger tr_rule_roles_updated_at ya existe';
END
GO

PRINT 'Migración completada exitosamente';
-- 5. Agregar nuevas columnas a assignments para capturar datos del mensaje de la cola
IF COL_LENGTH('assignments', 'ProcessId') IS NULL
BEGIN
    ALTER TABLE assignments ADD ProcessId VARCHAR(50);
    PRINT 'Columna ProcessId agregada a assignments';
END
IF COL_LENGTH('assignments', 'Source') IS NULL
BEGIN
    ALTER TABLE assignments ADD Source VARCHAR(50);
    PRINT 'Columna Source agregada a assignments';
END
IF COL_LENGTH('assignments', 'DocumentNumber') IS NULL
BEGIN
    ALTER TABLE assignments ADD DocumentNumber VARCHAR(50);
    PRINT 'Columna DocumentNumber agregada a assignments';
END
IF COL_LENGTH('assignments', 'InvoiceAmount') IS NULL
BEGIN
    ALTER TABLE assignments ADD InvoiceAmount FLOAT;
    PRINT 'Columna InvoiceAmount agregada a assignments';
END
IF COL_LENGTH('assignments', 'ExternalReference') IS NULL
BEGIN
    ALTER TABLE assignments ADD ExternalReference VARCHAR(50);
    PRINT 'Columna ExternalReference agregada a assignments';
END
IF COL_LENGTH('assignments', 'ClaimId') IS NULL
BEGIN
    ALTER TABLE assignments ADD ClaimId VARCHAR(50);
    PRINT 'Columna ClaimId agregada a assignments';
END
IF COL_LENGTH('assignments', 'ConceptApplicationCode') IS NULL
BEGIN
    ALTER TABLE assignments ADD ConceptApplicationCode VARCHAR(50);
    PRINT 'Columna ConceptApplicationCode agregada a assignments';
END
IF COL_LENGTH('assignments', 'ObjectionCode') IS NULL
BEGIN
    ALTER TABLE assignments ADD ObjectionCode VARCHAR(50);
    PRINT 'Columna ObjectionCode agregada a assignments';
END
IF COL_LENGTH('assignments', 'Value') IS NULL
BEGIN
    ALTER TABLE assignments ADD Value FLOAT;
    PRINT 'Columna Value agregada a assignments';
END
PRINT 'Cambios realizados:';
PRINT '1. ✅ Eliminada FK constraint entre users y company';
PRINT '2. ✅ Creada tabla rule_roles para relación N:M entre rules y roles';
PRINT '3. ✅ Campo company_id en users convertido a informativo (nullable)';
PRINT '4. ✅ Trigger para updated_at en rule_roles';
PRINT '';

-- 6. Eliminar columnas innecesarias y agregar DUD en users
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'first_name')
BEGIN
    ALTER TABLE users DROP COLUMN first_name;
    PRINT 'Columna first_name eliminada de users';
END
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'last_name')
BEGIN
    ALTER TABLE users DROP COLUMN last_name;
    PRINT 'Columna last_name eliminada de users';
END
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'email')
BEGIN
    ALTER TABLE users DROP COLUMN email;
    PRINT 'Columna email eliminada de users';
END
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'document_type')
BEGIN
    ALTER TABLE users DROP COLUMN document_type;
    PRINT 'Columna document_type eliminada de users';
END
IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'document_number')
BEGIN
    ALTER TABLE users DROP COLUMN document_number;
    PRINT 'Columna document_number eliminada de users';
END
IF COL_LENGTH('users', 'dud') IS NULL
BEGIN
    ALTER TABLE users ADD dud VARCHAR(30) NOT NULL;
    PRINT 'Columna dud agregada a users';
END

PRINT 'IMPORTANTE: Verificar que las aplicaciones manejen correctamente:';
PRINT '- La ausencia de FK constraint en users.company_id';
PRINT '- Las nuevas relaciones N:M entre rules y roles';
PRINT '- La eliminación de first_name, last_name, email, document_type, document_number y el uso de dud en users';
