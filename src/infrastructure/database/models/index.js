const { Sequelize, DataTypes } = require('sequelize');

// Función para definir todos los modelos de Sequelize
function defineModels(sequelize) {
  // Modelo Company
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    documentNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'document_number',
      validate: {
        len: [5, 20],
        notEmpty: true
      }
    },
    documentType: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'document_type',
      validate: {
        isIn: [['NIT', 'CC', 'CE', 'RUT']],
        notEmpty: true
      }
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'PROVIDER', // Valor por defecto para instalaciones nuevas
      validate: {
        notEmpty: true,
        isIn: [['PAYER', 'PROVIDER']]
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'companies',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['name']
      },
      {
        unique: true,
        fields: ['document_type', 'document_number']
      },
      {
        fields: ['type']
      }
    ]
  });

  // Modelo Role
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'company_id',
      references: {
        model: Company,
        key: 'id'
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'roles',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['name', 'company_id']
      }
    ]
  });

  // Definir modelo Log después de los modelos principales
  const Log = require('./log')(sequelize);

  // Modelo Rule
  const Rule = sequelize.define('Rule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,

      defaultValue: 'AMOUNT', // Valor por defecto actualizado
      validate: {
        notEmpty: true,
        isIn: [[
          'AMOUNT',
          'COMPANY',
          'COMPANY-AMOUNT',
          'CODE',
          'CODE-AMOUNT',
          'COMPANY-CODE',
          'CODE-AMOUNT-COMPANY',
          'CUSTOM'
        ]]
      }
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'company_id',
      references: {
        model: Company,
        key: 'id'
      }
  
    },
    minimumAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'minimum_amount',
      validate: {
        min: 0
      }
    },
    maximumAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'maximum_amount',
      validate: {
        min: 0
      }
    },
    nitAssociatedCompany: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'nit_associated_company',
      validate: {
        len: [0, 20]
      }
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'code',
      validate: {
        len: [0, 100]
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'rules',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['name', 'company_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['company_id', 'type']
      },
      {
        fields: ['code']
      },
      {
        fields: ['company_id', 'code']
      }
      // Los siguientes índices se crearán manualmente después de la migración
      // {
      //   fields: ['minimum_amount']
      // },
      // {
      //   fields: ['maximum_amount']
      // },
      // {
      //   fields: ['nit_associated_company']
      // }
    ]
  });

  // Modelo User
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true
      }
    },
    dud: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      field: 'dud',
      validate: {
        len: [5, 30],
        notEmpty: true
      }
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Campo informativo sin FK
      field: 'company_id'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['company_id']
      },
      {
        fields: ['name']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Modelo UserRole (tabla de relación muchos a muchos)
  const UserRole = sequelize.define('UserRole', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: User,
        key: 'id'
      }
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'role_id',
      references: {
        model: Role,
        key: 'id'
      }
    }
  }, {
    tableName: 'user_roles',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'role_id']
      }
    ]
  });

  // Importar modelo Assignment completo
  const Assignment = require('./assignment')(sequelize);

  // Modelo Configuration
  const Configuration = sequelize.define('Configuration', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'company_id',
      references: {
        model: Company,
        key: 'id'
      }
    },
    // Endpoints
    tokenEndpoint: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'token_endpoint',
      validate: {
        notEmpty: true,
        isUrl: true
      }
    },
    tokenMethod: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'POST',
      field: 'token_method',
      validate: {
        isIn: [['GET', 'POST', 'PUT', 'DELETE', 'PATCH']]
      }
    },
    listQueryEndpoint: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'list_query_endpoint',
      validate: {
        notEmpty: true,
        isUrl: true
      }
    },
    listQueryMethod: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'GET',
      field: 'list_query_method',
      validate: {
        isIn: [['GET', 'POST', 'PUT', 'DELETE', 'PATCH']]
      }
    },
    notificationEndpoint: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'notification_endpoint',
      validate: {
        notEmpty: true,
        isUrl: true
      }
    },
    notificationMethod: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'POST',
      field: 'notification_method',
      validate: {
        isIn: [['GET', 'POST', 'PUT', 'DELETE', 'PATCH']]
      }
    },
    // Autenticación
    authType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'auth_type',
      validate: {
        isIn: [['BASIC', 'BEARER', 'API_KEY', 'OAUTH2']]
      }
    },
    authUsername: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'auth_username'
    },
    authPassword: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'auth_password'
    },
    authApiKey: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'auth_api_key'
    },
    authAdditionalFields: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'auth_additional_fields',
      get() {
        const rawValue = this.getDataValue('authAdditionalFields');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('authAdditionalFields', value ? JSON.stringify(value) : null);
      }
    },
    // Mapeo de variables
    pathVariableMapping: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'path_variable_mapping',
      get() {
        const rawValue = this.getDataValue('pathVariableMapping');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('pathVariableMapping', value ? JSON.stringify(value) : null);
      }
    },
    bodyVariableMapping: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'body_variable_mapping',
      get() {
        const rawValue = this.getDataValue('bodyVariableMapping');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('bodyVariableMapping', value ? JSON.stringify(value) : null);
      }
    },
    customHeaders: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'custom_headers',
      get() {
        const rawValue = this.getDataValue('customHeaders');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('customHeaders', value ? JSON.stringify(value) : null);
      }
    },
    // Metadatos
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    tableName: 'configurations',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['company_id']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  // Modelo RuleRole (tabla intermedia muchos a muchos)
  const RuleRole = sequelize.define('RuleRole', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    ruleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'rule_id',
      references: {
        model: Rule,
        key: 'id'
      }
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'role_id',
      references: {
        model: Role,
        key: 'id'
      }
    }
  }, {
    tableName: 'rule_roles',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['rule_id', 'role_id']
      }
    ]
  });

  // Definir asociaciones
  setupAssociations(Company, Role, Rule, User, UserRole, Assignment, RuleRole, Configuration);

  return {
    Company,
    Role,
    Rule,
    User,
    UserRole,
    Assignment,
    RuleRole,
    Configuration,
    Log
  };
}

// Función para configurar las asociaciones entre modelos
function setupAssociations(Company, Role, Rule, User, UserRole, Assignment, RuleRole, Configuration) {
  // Company -> Users (1:N) - Relación informativa sin FK constraint
  // Removemos las asociaciones FK entre Company y User
  // La relación ahora es solo informativa

  // Company -> Configuration (1:1)
  Company.hasOne(Configuration, {
    foreignKey: 'company_id',
    as: 'configuration',
    onDelete: 'CASCADE'
  });
  Configuration.belongsTo(Company, {
    foreignKey: 'company_id',
    as: 'company'
  });

  // Company -> Roles (1:N)
  Company.hasMany(Role, {
    foreignKey: 'company_id',
    as: 'roles',
    onDelete: 'CASCADE'
  });
  Role.belongsTo(Company, {
    foreignKey: 'company_id',
    as: 'company'
  });

  // Company -> Rules (1:N)
  Company.hasMany(Rule, {
    foreignKey: 'company_id',
    as: 'rules',
    onDelete: 'CASCADE'
  });
  Rule.belongsTo(Company, {
    foreignKey: 'company_id',
    as: 'company'
  });

  // Rule -> Role (N:M through RuleRole)
  Rule.belongsToMany(Role, {
    through: RuleRole,
    foreignKey: 'rule_id',
    otherKey: 'role_id',
    as: 'roles'
  });
  
  Role.belongsToMany(Rule, {
    through: RuleRole,
    foreignKey: 'role_id',
    otherKey: 'rule_id',
    as: 'rules'
  });

  // Direct associations for RuleRole
  Rule.hasMany(RuleRole, {
    foreignKey: 'rule_id',
    as: 'ruleRoles'
  });
  RuleRole.belongsTo(Rule, {
    foreignKey: 'rule_id',
    as: 'rule'
  });

  Role.hasMany(RuleRole, {
    foreignKey: 'role_id',
    as: 'ruleRoles'
  });
  RuleRole.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'role'
  });

  // User -> Role (N:M through UserRole)
  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'user_id',
    otherKey: 'role_id',
    as: 'roles'
  });

  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'role_id',
    otherKey: 'user_id',
    as: 'users'
  });

  // Direct associations for UserRole
  User.hasMany(UserRole, {
    foreignKey: 'user_id',
    as: 'userRoles'
  });
  UserRole.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  Role.hasMany(UserRole, {
    foreignKey: 'role_id',
    as: 'userRoles'
  });
  UserRole.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'role'
  });

  // User -> Assignments (1:N)
  User.hasMany(Assignment, {
    foreignKey: 'user_id',
    as: 'assignments',
    onDelete: 'CASCADE'
  });
  Assignment.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });

  // ...existing code...

  // Company -> Assignments (1:N)
  Company.hasMany(Assignment, {
    foreignKey: 'company_id',
    as: 'assignments',
    onDelete: 'CASCADE'
  });
  Assignment.belongsTo(Company, {
    foreignKey: 'company_id',
    as: 'company'
  });
}

module.exports = {
  defineModels,
  setupAssociations
};
