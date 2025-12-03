const { Sequelize } = require('sequelize');
const config = require('../../config');

async function runMigration() {
  // Crear instancia de Sequelize usando la configuración existente
  const sequelize = new Sequelize({
    dialect: 'mssql',
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    username: config.database.user,
    password: config.database.password,
    dialectOptions: {
      encrypt: false,
      trustServerCertificate: true
    },
    logging: console.log
  });

  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // MIGRACIÓN DE TABLA USERS
    console.log('=== MIGRATING USERS TABLE ===');
    
    // Primero, verificar qué columnas existen en la tabla users
    console.log('Checking existing columns in users table...');
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Existing columns:', results);

    // Agregar first_name si no existe
    console.log('Adding first_name column...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'first_name')
      BEGIN
        ALTER TABLE [users] ADD [first_name] NVARCHAR(50) NULL;
      END
    `);

    // Agregar last_name si no existe
    console.log('Adding last_name column...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'last_name')
      BEGIN
        ALTER TABLE [users] ADD [last_name] NVARCHAR(50) NULL;
      END
    `);

    // Agregar company_id si no existe
    console.log('Adding company_id column...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'company_id')
      BEGIN
        ALTER TABLE [users] ADD [company_id] INT NULL;
      END
    `);

    // Ejecutar las consultas de migración para document fields
    console.log('Adding document_type column...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'document_type')
      BEGIN
        ALTER TABLE [users] ADD [document_type] NVARCHAR(10) NULL;
      END
    `);

    console.log('Adding document_number column...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'document_number')
      BEGIN
        ALTER TABLE [users] ADD [document_number] NVARCHAR(20) NULL;
      END
    `);

    console.log('Adding email column...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'email')
      BEGIN
        ALTER TABLE [users] ADD [email] NVARCHAR(100) NULL;
      END
    `);

    // Agregar is_active si no existe
    console.log('Adding is_active column...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'is_active')
      BEGIN
        ALTER TABLE [users] ADD [is_active] BIT NULL DEFAULT 1;
      END
    `);

    // Agregar created_at si no existe
    console.log('Adding created_at column...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'created_at')
      BEGIN
        ALTER TABLE [users] ADD [created_at] DATETIME2 NULL DEFAULT GETDATE();
      END
    `);

    // Agregar updated_at si no existe
    console.log('Adding updated_at column...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = 'updated_at')
      BEGIN
        ALTER TABLE [users] ADD [updated_at] DATETIME2 NULL DEFAULT GETDATE();
      END
    `);

    console.log('Creating unique index on document_type and document_number...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'users_document_type_document_number')
      BEGIN
        CREATE UNIQUE INDEX users_document_type_document_number 
        ON [users] ([document_type], [document_number]) 
        WHERE [document_type] IS NOT NULL AND [document_number] IS NOT NULL;
      END
    `);

    console.log('Creating unique index on email...');
    await sequelize.query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'users_email')
      BEGIN
        CREATE UNIQUE INDEX users_email 
        ON [users] ([email]) 
        WHERE [email] IS NOT NULL;
      END
    `);

    // Verificar las columnas después de la migración
    console.log('Checking columns after migration...');
    const [finalResults] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('Final columns:', finalResults);

    // MIGRACIÓN DE TABLA ASSIGNMENTS
    console.log('\n=== MIGRATING ASSIGNMENTS TABLE ===');
    
    // Verificar si la tabla assignments existe
    console.log('Checking if assignments table exists...');
    const [assignmentsTables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' 
      AND TABLE_NAME = 'assignments'
    `);

    if (assignmentsTables.length === 0) {
      console.log('Assignments table does not exist. Creating...');
      
      // Crear tabla assignments
      await sequelize.query(`
        CREATE TABLE [assignments] (
          [id] INT IDENTITY(1,1) PRIMARY KEY,
          [assigned_user_id] INT NOT NULL,
          [type] NVARCHAR(100) NOT NULL,
          [date_assignated] DATETIME2 NOT NULL DEFAULT GETDATE(),
          [status] NVARCHAR(20) NOT NULL DEFAULT 'pending',
          [company_id] INT NOT NULL,
          [created_at] DATETIME2 DEFAULT GETDATE(),
          [updated_at] DATETIME2 DEFAULT GETDATE(),
          
          CONSTRAINT [chk_assignment_status] 
            CHECK ([status] IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'unassigned'))
        );
      `);

      console.log('Creating foreign key constraints...');
      
      // Crear constraint de foreign key para assigned_user_id
      await sequelize.query(`
        IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_assignment_user')
        BEGIN
          ALTER TABLE [assignments] 
          ADD CONSTRAINT [fk_assignment_user] 
          FOREIGN KEY ([assigned_user_id]) REFERENCES [users]([id]) 
          ON DELETE CASCADE;
        END
      `);

      // Crear constraint de foreign key para company_id (asumiendo que existe tabla companies)
      await sequelize.query(`
        IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'companies')
        BEGIN
          IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_assignment_company')
          BEGIN
            ALTER TABLE [assignments] 
            ADD CONSTRAINT [fk_assignment_company] 
            FOREIGN KEY ([company_id]) REFERENCES [companies]([id]) 
            ON DELETE CASCADE;
          END
        END
      `);

      console.log('Creating indexes...');
      
      // Crear índices
      await sequelize.query(`
        CREATE INDEX [idx_assigned_user] ON [assignments] ([assigned_user_id]);
        CREATE INDEX [idx_company] ON [assignments] ([company_id]);
        CREATE INDEX [idx_status] ON [assignments] ([status]);
        CREATE INDEX [idx_date_assignated] ON [assignments] ([date_assignated]);
        CREATE INDEX [idx_type] ON [assignments] ([type]);
      `);

      console.log('Assignments table created successfully!');
    } else {
      console.log('Assignments table already exists.');
      
      // Verificar columnas existentes en assignments
      console.log('Checking existing columns in assignments table...');
      const [assignmentsColumns] = await sequelize.query(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'assignments' 
        ORDER BY ORDINAL_POSITION
      `);
      
      console.log('Existing assignments columns:', assignmentsColumns);
    }

    console.log('\n=== MIGRATION SUMMARY ===');
    console.log('✅ Users table migration completed');
    console.log('✅ Assignments table migration completed');
    console.log('All migrations completed successfully!');

  } catch (error) {
    console.error('Unable to connect to the database or run migration:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

runMigration();