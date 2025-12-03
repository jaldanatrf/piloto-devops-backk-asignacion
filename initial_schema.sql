-- ============================================================
-- MIGRACIÓN INICIAL: Creación de todas las tablas
-- Generado automáticamente desde modelos Sequelize
-- Fecha: 2025-12-01T15:57:09.309Z
-- ============================================================

-- Crear tabla companies
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='companies' AND xtype='U')
BEGIN
    CREATE TABLE companies (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NULL,
        document_number NVARCHAR(20) NOT NULL,
        document_type NVARCHAR(10) NOT NULL,
        [type] NVARCHAR(50) NOT NULL DEFAULT 'PROVIDER',
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIMEOFFSET NOT NULL,
        updated_at DATETIMEOFFSET NOT NULL
    );

    CREATE UNIQUE INDEX companies_name ON companies (name);
    CREATE UNIQUE INDEX companies_document_type_document_number ON companies (document_type, document_number);
    CREATE INDEX companies_type ON companies (type);
    PRINT 'Tabla companies creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla companies ya existe, omitiendo...';
END
GO

-- Crear tabla roles
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='roles' AND xtype='U')
BEGIN
    CREATE TABLE roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIMEOFFSET NOT NULL,
        updated_at DATETIMEOFFSET NOT NULL,
        company_id INT NOT NULL
    );

    -- Agregar Foreign Keys
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_roles_company_id')
    BEGIN
        ALTER TABLE roles
        ADD CONSTRAINT FK_roles_company_id
        FOREIGN KEY (company_id) REFERENCES companies(id);
        PRINT 'FK FK_roles_company_id creada';
    END

    CREATE UNIQUE INDEX roles_name_company_id ON roles (name, company_id);
    PRINT 'Tabla roles creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla roles ya existe, omitiendo...';
END
GO

-- Crear tabla rules
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='rules' AND xtype='U')
BEGIN
    CREATE TABLE rules (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500) NOT NULL,
        [type] NVARCHAR(50) NOT NULL DEFAULT 'AMOUNT',
        minimum_amount DECIMAL(15,2) NULL,
        maximum_amount DECIMAL(15,2) NULL,
        nit_associated_company NVARCHAR(20) NULL,
        code NVARCHAR(100) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIMEOFFSET NOT NULL,
        updated_at DATETIMEOFFSET NOT NULL,
        company_id INT NOT NULL
    );

    -- Agregar Foreign Keys
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_rules_company_id')
    BEGIN
        ALTER TABLE rules
        ADD CONSTRAINT FK_rules_company_id
        FOREIGN KEY (company_id) REFERENCES companies(id);
        PRINT 'FK FK_rules_company_id creada';
    END

    CREATE UNIQUE INDEX rules_name_company_id ON rules (name, company_id);
    CREATE INDEX rules_type ON rules (type);
    CREATE INDEX rules_company_id_type ON rules (company_id, type);
    CREATE INDEX rules_code ON rules (code);
    CREATE INDEX rules_company_id_code ON rules (company_id, code);
    PRINT 'Tabla rules creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla rules ya existe, omitiendo...';
END
GO

-- Crear tabla users
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        dud NVARCHAR(30) NOT NULL,
        company_id INT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIMEOFFSET NOT NULL,
        updated_at DATETIMEOFFSET NOT NULL
    );

    CREATE INDEX users_company_id ON users (company_id);
    CREATE INDEX users_name ON users (name);
    CREATE INDEX users_dud ON users (dud);
    CREATE INDEX users_is_active ON users (is_active);
    PRINT 'Tabla users creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla users ya existe, omitiendo...';
END
GO

-- Crear tabla user_roles
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='user_roles' AND xtype='U')
BEGIN
    CREATE TABLE user_roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        created_at DATETIMEOFFSET NOT NULL,
        updated_at DATETIMEOFFSET NOT NULL,
        user_id INT NOT NULL,
        role_id INT NOT NULL
    );

    -- Agregar Foreign Keys
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_user_roles_user_id')
    BEGIN
        ALTER TABLE user_roles
        ADD CONSTRAINT FK_user_roles_user_id
        FOREIGN KEY (user_id) REFERENCES users(id);
        PRINT 'FK FK_user_roles_user_id creada';
    END
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_user_roles_role_id')
    BEGIN
        ALTER TABLE user_roles
        ADD CONSTRAINT FK_user_roles_role_id
        FOREIGN KEY (role_id) REFERENCES roles(id);
        PRINT 'FK FK_user_roles_role_id creada';
    END

    CREATE UNIQUE INDEX user_roles_user_id_role_id ON user_roles (user_id, role_id);
    PRINT 'Tabla user_roles creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla user_roles ya existe, omitiendo...';
END
GO

-- Crear tabla assignments
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='assignments' AND xtype='U')
BEGIN
    CREATE TABLE assignments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NULL,
        company_id INT NOT NULL,
        [status] NVARCHAR(255) NOT NULL DEFAULT 'pending',
        start_date DATETIMEOFFSET NOT NULL,
        end_date DATETIMEOFFSET NULL,
        assigned_at DATETIMEOFFSET NOT NULL,
        created_at DATETIMEOFFSET NOT NULL,
        updated_at DATETIMEOFFSET NOT NULL,
        ProcessId NVARCHAR(255) NULL,
        Source NVARCHAR(255) NULL,
        DocumentNumber NVARCHAR(255) NULL,
        InvoiceAmount FLOAT NULL,
        ExternalReference NVARCHAR(255) NULL,
        ClaimId NVARCHAR(255) NULL,
        ConceptApplicationCode NVARCHAR(255) NULL,
        ObjectionCode NVARCHAR(255) NULL,
        [Value] FLOAT NULL
    );

    PRINT 'Tabla assignments creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla assignments ya existe, omitiendo...';
END
GO

-- Crear tabla rule_roles
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='rule_roles' AND xtype='U')
BEGIN
    CREATE TABLE rule_roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        created_at DATETIMEOFFSET NOT NULL,
        updated_at DATETIMEOFFSET NOT NULL,
        rule_id INT NOT NULL,
        role_id INT NOT NULL
    );

    -- Agregar Foreign Keys
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_rule_roles_rule_id')
    BEGIN
        ALTER TABLE rule_roles
        ADD CONSTRAINT FK_rule_roles_rule_id
        FOREIGN KEY (rule_id) REFERENCES rules(id);
        PRINT 'FK FK_rule_roles_rule_id creada';
    END
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_rule_roles_role_id')
    BEGIN
        ALTER TABLE rule_roles
        ADD CONSTRAINT FK_rule_roles_role_id
        FOREIGN KEY (role_id) REFERENCES roles(id);
        PRINT 'FK FK_rule_roles_role_id creada';
    END

    CREATE UNIQUE INDEX rule_roles_rule_id_role_id ON rule_roles (rule_id, role_id);
    PRINT 'Tabla rule_roles creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla rule_roles ya existe, omitiendo...';
END
GO

-- Crear tabla configurations
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='configurations' AND xtype='U')
BEGIN
    CREATE TABLE configurations (
        id INT IDENTITY(1,1) PRIMARY KEY,
        token_endpoint NVARCHAR(500) NOT NULL,
        token_method NVARCHAR(10) NOT NULL DEFAULT 'POST',
        list_query_endpoint NVARCHAR(500) NOT NULL,
        list_query_method NVARCHAR(10) NOT NULL DEFAULT 'GET',
        notification_endpoint NVARCHAR(500) NOT NULL,
        notification_method NVARCHAR(10) NOT NULL DEFAULT 'POST',
        auth_type NVARCHAR(50) NOT NULL,
        auth_username NVARCHAR(200) NULL,
        auth_password NVARCHAR(500) NULL,
        auth_api_key NVARCHAR(500) NULL,
        auth_additional_fields NVARCHAR(MAX) NULL,
        path_variable_mapping NVARCHAR(MAX) NULL,
        body_variable_mapping NVARCHAR(MAX) NULL,
        custom_headers NVARCHAR(MAX) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        description NVARCHAR(500) NULL,
        created_at DATETIMEOFFSET NOT NULL,
        updated_at DATETIMEOFFSET NOT NULL,
        company_id INT NOT NULL
    );

    -- Agregar Foreign Keys
    IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_configurations_company_id')
    BEGIN
        ALTER TABLE configurations
        ADD CONSTRAINT FK_configurations_company_id
        FOREIGN KEY (company_id) REFERENCES companies(id);
        PRINT 'FK FK_configurations_company_id creada';
    END

    CREATE UNIQUE INDEX configurations_company_id ON configurations (company_id);
    CREATE INDEX configurations_is_active ON configurations (is_active);
    PRINT 'Tabla configurations creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla configurations ya existe, omitiendo...';
END
GO

-- Crear tabla logs
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='logs' AND xtype='U')
BEGIN
    CREATE TABLE logs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        [level] NVARCHAR(20) NOT NULL,
        message NVARCHAR(1000) NOT NULL,
        meta NVARCHAR(MAX) NULL,
        [timestamp] DATETIMEOFFSET NOT NULL,
        [user] NVARCHAR(100) NULL,
        service NVARCHAR(100) NULL
    );

    PRINT 'Tabla logs creada exitosamente';
END
ELSE
BEGIN
    PRINT 'Tabla logs ya existe, omitiendo...';
END
GO


PRINT '✅ Todas las tablas han sido creadas exitosamente';
