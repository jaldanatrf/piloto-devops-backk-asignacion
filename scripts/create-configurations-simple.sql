-- Crear tabla configurations
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='configurations' AND xtype='U')
BEGIN
    CREATE TABLE configurations (
        -- IDENTIFICACIÓN
        id INT IDENTITY(1,1) PRIMARY KEY,
        company_id INT NOT NULL,

        -- ENDPOINTS
        token_endpoint VARCHAR(500) NOT NULL,
        token_method VARCHAR(10) NOT NULL DEFAULT 'POST',
        list_query_endpoint VARCHAR(500) NOT NULL,
        list_query_method VARCHAR(10) NOT NULL DEFAULT 'GET',
        notification_endpoint VARCHAR(500) NOT NULL,
        notification_method VARCHAR(10) NOT NULL DEFAULT 'POST',

        -- AUTENTICACIÓN
        auth_type VARCHAR(50) NOT NULL,
        auth_username VARCHAR(200),
        auth_password VARCHAR(500),
        auth_api_key VARCHAR(500),
        auth_additional_fields NVARCHAR(MAX),

        -- MAPEO DE DATOS
        path_variable_mapping NVARCHAR(MAX),
        body_variable_mapping NVARCHAR(MAX),
        custom_headers NVARCHAR(MAX),

        -- METADATOS
        is_active BIT NOT NULL DEFAULT 1,
        description VARCHAR(500),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),

        -- CONSTRAINTS
        CONSTRAINT FK_configurations_company_id
            FOREIGN KEY (company_id)
            REFERENCES companies(id)
            ON DELETE CASCADE,

        CONSTRAINT UQ_configurations_company_id
            UNIQUE (company_id),

        CONSTRAINT CHK_configurations_auth_type
            CHECK (auth_type IN ('BASIC', 'BEARER', 'API_KEY', 'OAUTH2')),

        CONSTRAINT CHK_configurations_http_methods
            CHECK (
                token_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH') AND
                list_query_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH') AND
                notification_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH')
            )
    )

    -- ÍNDICES
    CREATE INDEX IX_configurations_company_id ON configurations (company_id)
    CREATE INDEX IX_configurations_is_active ON configurations (is_active)

    PRINT 'Tabla configurations creada exitosamente'
END
ELSE
BEGIN
    PRINT 'Tabla configurations ya existe'
END
