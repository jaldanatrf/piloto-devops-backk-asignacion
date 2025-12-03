-- =====================================================
-- Migración: Tabla configurations para parametrización de endpoints
-- Descripción: Tabla para almacenar configuraciones de endpoints externos por empresa
-- Autor: Sistema de Asignaciones
-- Fecha: 2025-01-17
-- =====================================================

-- Crear tabla configurations
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='configurations' AND xtype='U')
BEGIN
    CREATE TABLE configurations (
        -- ========== IDENTIFICACIÓN ==========
        id INT IDENTITY(1,1) PRIMARY KEY,
        company_id INT NOT NULL,

        -- ========== ENDPOINTS ==========
        -- Token generation endpoint
        token_endpoint VARCHAR(500) NOT NULL,
        token_method VARCHAR(10) NOT NULL DEFAULT 'POST',

        -- List query endpoint
        list_query_endpoint VARCHAR(500) NOT NULL,
        list_query_method VARCHAR(10) NOT NULL DEFAULT 'GET',

        -- Assignment notification endpoint
        notification_endpoint VARCHAR(500) NOT NULL,
        notification_method VARCHAR(10) NOT NULL DEFAULT 'POST',

        -- ========== AUTENTICACIÓN ==========
        auth_type VARCHAR(50) NOT NULL,              -- 'BASIC', 'BEARER', 'API_KEY', 'OAUTH2'
        auth_username VARCHAR(200),                  -- Usuario para autenticación
        auth_password VARCHAR(500),                  -- Contraseña (encriptada)
        auth_api_key VARCHAR(500),                   -- API Key alternativa
        auth_additional_fields NVARCHAR(MAX),        -- JSON: campos adicionales para auth

        -- ========== MAPEO DE DATOS ==========
        -- Mapeo para construir URLs dinámicamente
        path_variable_mapping NVARCHAR(MAX),         -- JSON: mapeo de variables en path

        -- Mapeo para construir body de requests
        body_variable_mapping NVARCHAR(MAX),         -- JSON: mapeo de variables en body

        -- Headers personalizados
        custom_headers NVARCHAR(MAX),                -- JSON: headers estáticos

        -- ========== METADATOS ==========
        is_active BIT NOT NULL DEFAULT 1,
        description VARCHAR(500),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),

        -- ========== CONSTRAINTS ==========
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

    -- ========== ÍNDICES ==========
    CREATE INDEX IX_configurations_company_id ON configurations (company_id)
    CREATE INDEX IX_configurations_is_active ON configurations (is_active)

    PRINT 'Tabla configurations creada exitosamente'
END
ELSE
BEGIN
    PRINT 'Tabla configurations ya existe, continuando...'
END
GO

-- ========== TRIGGER PARA UPDATED_AT ==========
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_configurations_updated_at')
BEGIN
    CREATE TRIGGER tr_configurations_updated_at
    ON configurations
    AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON
        UPDATE configurations
        SET updated_at = GETDATE()
        FROM inserted
        WHERE configurations.id = inserted.id
    END
    PRINT 'Trigger tr_configurations_updated_at creado exitosamente'
END
ELSE
BEGIN
    PRINT 'Trigger tr_configurations_updated_at ya existe'
END
GO

-- ========== DATOS DE EJEMPLO (OPCIONAL - COMENTADO) ==========
-- Descomentar para insertar configuración de ejemplo
/*
INSERT INTO configurations (
    company_id,
    token_endpoint,
    token_method,
    list_query_endpoint,
    list_query_method,
    notification_endpoint,
    notification_method,
    auth_type,
    auth_username,
    auth_password,
    auth_additional_fields,
    path_variable_mapping,
    body_variable_mapping,
    custom_headers,
    is_active,
    description
) VALUES (
    1, -- company_id (debe existir en companies)
    'https://api.gestorcuentas.com/api/Authentication/Authenticate',
    'POST',
    'https://api.orchestrator.com/api/admonCtas/lists',
    'GET',
    'https://api.orchestrator.com/api/admonCtas/disputes/assignments',
    'POST',
    'BEARER',
    'admin',
    'encrypted_password_here',
    '{"grant_type":"password","additionalClaims":{"nit":"{source}","user":"{documentNumber}","rol":"emiter"}}',
    '{"processId":"assignment.processId","documentType":"assignment.documentType","documentNumber":"assignment.documentNumber"}',
    '{"assignments":"assignment.assignments","claimId":"assignment.claimId","assignedUser":"assignment.newAssignmentUserId"}',
    '{"Content-Type":"application/json","X-API-Version":"1.0"}',
    1,
    'Configuración para integración con Orquestador'
);
*/

PRINT ''
PRINT '========================================'
PRINT 'Migración completada exitosamente'
PRINT '========================================'
PRINT ''
PRINT 'Tabla creada: configurations'
PRINT 'Índices: IX_configurations_company_id, IX_configurations_is_active'
PRINT 'Trigger: tr_configurations_updated_at'
PRINT ''
PRINT 'IMPORTANTE:'
PRINT '- La tabla tiene relación 1:1 con companies (una configuración por empresa)'
PRINT '- Los campos JSON permiten mapeo flexible de variables'
PRINT '- Las contraseñas deben encriptarse antes de almacenarse'
PRINT '- La resiliencia y reintentos se manejan globalmente en httpClient'
PRINT ''
