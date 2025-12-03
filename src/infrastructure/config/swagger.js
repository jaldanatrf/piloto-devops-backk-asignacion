const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Configuración básica de Swagger
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Back Asignaciones API',
    version: '1.0.0',
    description: 'API para gestión de empresas, roles, reglas y asignaciones',
    contact: {
      name: 'API Support',
      email: 'support@back-asignaciones.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:4041',
      description: 'Servidor de desarrollo'
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  components: {
    schemas: {
      Company: {
        type: 'object',
        required: ['name', 'documentNumber'],
        properties: {
          id: {
            type: 'integer',
            description: 'ID único de la empresa',
            example: 1
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Nombre de la empresa',
            example: 'Innovación Digital S.A.S.'
          },
          description: {
            type: 'string',
            maxLength: 500,
            description: 'Descripción de la empresa',
            example: 'Empresa de desarrollo de software y soluciones digitales'
          },
          documentNumber: {
            type: 'string',
            minLength: 5,
            maxLength: 20,
            description: 'Número de documento de la empresa',
            example: '900123456'
          },
          documentType: {
            type: 'string',
            maxLength: 10,
            description: 'Tipo de documento',
            example: 'NIT',
            enum: ['NIT', 'CC', 'CE', 'RUT']
          },
          type: {
            type: 'string',
            description: 'Tipo de empresa',
            example: 'PAYER',
            enum: ['PAYER', 'PROVIDER']
          },
          isActive: {
            type: 'boolean',
            description: 'Estado activo de la empresa',
            default: true,
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación',
            example: '2025-08-14T14:17:21.215Z'
          },
          rules: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Rule'
            },
            description: 'Reglas asociadas a la empresa'
          }
        }
      },
      CompanyInput: {
        type: 'object',
        required: ['name', 'documentNumber', 'type'],
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Nombre de la empresa',
            example: 'Innovación Digital S.A.S.'
          },
          description: {
            type: 'string',
            maxLength: 500,
            description: 'Descripción de la empresa',
            example: 'Empresa de desarrollo de software y soluciones digitales'
          },
          documentNumber: {
            type: 'string',
            minLength: 5,
            maxLength: 20,
            description: 'Número de documento de la empresa',
            example: '900123456'
          },
          documentType: {
            type: 'string',
            maxLength: 10,
            description: 'Tipo de documento',
            example: 'NIT',
            enum: ['NIT', 'CC', 'CE', 'RUT']
          },
          type: {
            type: 'string',
            description: 'Tipo de empresa',
            example: 'PAYER',
            enum: ['PAYER', 'PROVIDER']
          },
          isActive: {
            type: 'boolean',
            description: 'Estado activo de la empresa',
            default: true,
            example: true
          }
        }
      },
      Role: {
        type: 'object',
        required: ['name', 'companyId'],
        properties: {
          id: {
            type: 'integer',
            description: 'ID único del rol',
            example: 1
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Nombre del rol',
            example: 'Administrador'
          },
          description: {
            type: 'string',
            maxLength: 500,
            description: 'Descripción del rol',
            example: 'Rol con permisos administrativos completos'
          },
          companyId: {
            type: 'integer',
            description: 'ID de la empresa asociada',
            example: 1
          },
          isActive: {
            type: 'boolean',
            description: 'Estado activo del rol',
            default: true,
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación',
            example: '2025-08-14T14:17:21.215Z'
          }
        }
      },
      Rule: {
        type: 'object',
        required: ['name', 'description', 'type'],
        properties: {
          id: {
            type: 'integer',
            description: 'ID único de la regla',
            example: 1
          },
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            description: 'Nombre de la regla (solo caracteres alfanuméricos, espacios, puntos, guiones y guiones bajos)',
            example: 'Regla de acceso'
          },
          description: {
            type: 'string',
            maxLength: 500,
            description: 'Descripción de la regla',
            example: 'Regla para controlar el acceso a recursos'
          },
          type: {
            type: 'string',
            description: 'Tipo de regla. Los nuevos tipos CODE permiten validar por código de objeción.',
            example: 'CODE-AMOUNT',
            enum: [
              'AMOUNT',
              'COMPANY',
              'COMPANY-AMOUNT',
              'CODE',
              'CODE-AMOUNT',
              'COMPANY-CODE',
              'CODE-AMOUNT-COMPANY',
              'CUSTOM'
            ]
          },
          minimumAmount: {
            type: 'number',
            format: 'decimal',
            description: 'Monto mínimo (requerido para tipos: AMOUNT, COMPANY-AMOUNT, CODE-AMOUNT, CODE-AMOUNT-COMPANY)',
            example: 1000.00,
            minimum: 0,
            nullable: true
          },
          maximumAmount: {
            type: 'number',
            format: 'decimal',
            description: 'Monto máximo (requerido para tipos: AMOUNT, COMPANY-AMOUNT, CODE-AMOUNT, CODE-AMOUNT-COMPANY)',
            example: 50000.00,
            minimum: 0,
            nullable: true
          },
          nitAssociatedCompany: {
            type: 'string',
            maxLength: 20,
            description: 'NIT de la empresa asociada (requerido para tipos: COMPANY, COMPANY-AMOUNT, COMPANY-CODE, CODE-AMOUNT-COMPANY)',
            example: '900123456-7',
            nullable: true
          },
          code: {
            type: 'string',
            maxLength: 100,
            description: 'Código de objeción (requerido para tipos: CODE, CODE-AMOUNT, COMPANY-CODE, CODE-AMOUNT-COMPANY). Comparación exacta y case-sensitive.',
            example: 'OBJ-001',
            nullable: true
          },
          isActive: {
            type: 'boolean',
            description: 'Estado activo de la regla',
            default: true,
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de creación',
            example: '2025-08-14T14:17:21.215Z'
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            description: 'Datos de respuesta'
          },
          message: {
            type: 'string',
            description: 'Mensaje descriptivo',
            example: 'Operation completed successfully'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Mensaje de error',
                example: 'Error description'
              }
            }
          }
        }
      },
      CompanyStats: {
        type: 'object',
        properties: {
          totalRules: {
            type: 'integer',
            description: 'Número total de reglas',
            example: 5
          },
          activeRules: {
            type: 'integer',
            description: 'Número de reglas activas',
            example: 3
          },
          inactiveRules: {
            type: 'integer',
            description: 'Número de reglas inactivas',
            example: 2
          },
          isActive: {
            type: 'boolean',
            description: 'Estado de la empresa',
            example: true
          }
        }
      },
      // JWT Authentication Schemas
      LoginRequest: {
        type: 'object',
        required: ['dud'],
        properties: {
          dud: {
            type: 'string',
            description: 'Document Unique ID del usuario',
            example: 'CC10059444888'
          }
        }
      },
      AppLoginRequest: {
        type: 'object',
        required: ['companyId'],
        properties: {
          companyId: {
            type: 'integer',
            description: 'ID de la empresa para autenticación de aplicación',
            example: 4
          },
          description: {
            type: 'string',
            description: 'Descripción opcional del uso de la aplicación',
            example: 'Integración sistema externo'
          }
        }
      },
      IntegrationLoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: {
            type: 'string',
            description: 'Nombre de usuario del sistema de integración',
            example: 'integration_system'
          },
          password: {
            type: 'string',
            description: 'Contraseña del sistema de integración',
            example: 'Int3gr4t10n@2024#Secure'
          }
        }
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            description: 'Token de renovación válido',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Authentication successful'
          },
          data: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                description: 'JWT access token',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              refreshToken: {
                type: 'string',
                description: 'JWT refresh token',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              expiresIn: {
                type: 'string',
                example: '24h'
              },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'integer', example: 1 },
                  name: { type: 'string', example: 'Juan Pérez' },
                  DUD: { type: 'string', example: 'CC10059444888' },
                  companyId: { type: 'integer', example: 4 },
                  isActive: { type: 'boolean', example: true },
                  rolesCount: { type: 'integer', example: 2 },
                  type: { type: 'string', example: 'USER', enum: ['USER', 'APPLICATION'] }
                }
              }
            }
          }
        }
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Juan Pérez' },
          DUD: { type: 'string', example: 'CC10059444888' },
          companyId: { type: 'integer', example: 4 },
          isActive: { type: 'boolean', example: true },
          rolesCount: { type: 'integer', example: 2 },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            example: ['read', 'write', 'admin']
          }
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtenido del endpoint de login. Formato: Bearer {token}'
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API Key para autenticación'
      }
    },
  responses: {
      NotFound: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      ValidationError: {
        description: 'Error de validación',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      ConflictError: {
        description: 'Conflicto - Recurso ya existe',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      InternalServerError: {
        description: 'Error interno del servidor',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      },
      UnauthorizedError: {
        description: 'No autorizado - API key inválida o token JWT inválido/expirado',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: { type: 'string', example: 'Invalid API key' },
                code: { type: 'string', example: 'UNAUTHORIZED' }
              }
            }
          }
        }
      }
    }
    },
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Autenticar usuario con DUD y API key',
        description: 'Autentica un usuario usando su Document Unique ID (DUD) y valida la API key. Retorna JWT token y refresh token.',
        security: [
          {
            apiKeyAuth: []
          }
        ],
        parameters: [
          {
            name: 'x-api-key',
            in: 'header',
            required: true,
            schema: { type: 'string' },
            description: 'API Key requerida para autenticación',
            example: 'sA{:3aRxT5cI2u4._p^)XjO-Sw[%6}J&?UY<=t;'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/LoginRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Autenticación exitosa',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse'
                }
              }
            }
          },
          '400': {
            description: 'Datos de entrada inválidos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'DUD is required in request body' },
                    code: { type: 'string', example: 'VALIDATION_ERROR' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/api/auth/app-login': {
      post: {
        tags: ['Authentication'],
        summary: 'Autenticar aplicación con Company ID y API key',
        description: 'Autentica una aplicación usando el ID de la empresa y valida la API key. Útil para integraciones que no conocen usuarios específicos.',
        security: [
          {
            apiKeyAuth: []
          }
        ],
        parameters: [
          {
            name: 'x-api-key',
            in: 'header',
            required: true,
            schema: { type: 'string' },
            description: 'API Key requerida para autenticación',
            example: 'sA{:3aRxT5cI2u4._p^)XjO-Sw[%6}J&?UY<=t;'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AppLoginRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Autenticación de aplicación exitosa',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse'
                }
              }
            }
          },
          '400': {
            description: 'Datos de entrada inválidos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Company ID is required in request body' },
                    code: { type: 'string', example: 'VALIDATION_ERROR' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/api/auth/integration-login': {
      post: {
        tags: ['Authentication'],
        summary: 'Autenticar sistema de integración con API key y credenciales',
        description: 'Autentica un sistema de integración usando API key específica y credenciales hardcodeadas. Retorna JWT token con permisos completos del sistema.',
        security: [
          {
            apiKeyAuth: []
          }
        ],
        parameters: [
          {
            name: 'x-api-key',
            in: 'header',
            required: true,
            schema: { type: 'string' },
            description: 'API Key específica para integraciones',
            example: 'INT_2024_sK9mP3qR7wX@#vN5zL8jE1tY6uI0pA4cF'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/IntegrationLoginRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Autenticación de integración exitosa',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Integration authentication successful' },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', description: 'JWT access token con permisos de sistema' },
                        refreshToken: { type: 'string', description: 'JWT refresh token' },
                        expiresIn: { type: 'string', example: '24h' },
                        user: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', example: 'integration_system_001' },
                            name: { type: 'string', example: 'Integration System User' },
                            DUD: { type: 'string', example: 'INT_SYSTEM' },
                            type: { type: 'string', example: 'INTEGRATION' },
                            permissions: { 
                              type: 'array', 
                              items: { type: 'string' }, 
                              example: ['INTEGRATION_ACCESS', 'READ_ALL_COMPANIES', 'WRITE_ALL_COMPANIES'] 
                            },
                            canAccessAllCompanies: { type: 'boolean', example: true },
                            isActive: { type: 'boolean', example: true },
                            rolesCount: { type: 'integer', example: 1 }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: 'Datos de entrada inválidos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Username and password are required in request body' },
                    code: { type: 'string', example: 'VALIDATION_ERROR' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Renovar token JWT',
        description: 'Renueva un token JWT usando el refresh token válido.',
        security: [
          {
            apiKeyAuth: []
          }
        ],
        parameters: [
          {
            name: 'x-api-key',
            in: 'header',
            required: true,
            schema: { type: 'string' },
            description: 'API Key requerida para autenticación',
            example: 'sA{:3aRxT5cI2u4._p^)XjO-Sw[%6}J&?UY<=t;'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RefreshTokenRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Token renovado exitosamente',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthResponse'
                }
              }
            }
          },
          '400': {
            description: 'Refresh token requerido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: { type: 'string', example: 'Refresh token is required' },
                    code: { type: 'string', example: 'VALIDATION_ERROR' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/api/auth/validate': {
      get: {
        tags: ['Authentication'],
        summary: 'Validar token JWT actual',
        description: 'Valida que el token JWT actual sea válido y esté activo. REQUIERE: Token JWT en el header Authorization.',
        responses: {
          '200': {
            description: 'Token válido',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Token is valid' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/UserProfile' },
                        isValid: { type: 'boolean', example: true }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/api/auth/profile': {
      get: {
        tags: ['Authentication'],
        summary: 'Obtener perfil del usuario autenticado',
        description: 'Obtiene la información completa del perfil del usuario o aplicación autenticada. REQUIERE: Token JWT en el header Authorization.',
        responses: {
          '200': {
            description: 'Perfil obtenido exitosamente',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: 'Profile retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/UserProfile' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/api/assignments/process/{processId}/complete': {
      post: {
        tags: ['Assignments'],
        summary: 'Completa una asignación usando el processId',
        description: 'Marca como completada la asignación que corresponde al processId indicado. REQUIERE: Token JWT en el header Authorization.',
        parameters: [
          {
            name: 'processId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'ID del proceso (processId)'
          }
        ],
        responses: {
          '200': {
            description: 'Asignación completada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          },
          '400': { description: 'processId inválido' },
          '404': { description: 'Asignación no encontrada' },
          '500': { description: 'Error interno del servidor' }
        }
      }
    },
    '/assignments/company/{companyId}': {
      get: {
        tags: ['Assignments'],
        summary: 'Consulta asignaciones por ID de compañía',
        description: 'Devuelve las asignaciones de la compañía con los campos requeridos. REQUIERE: Token JWT en el header Authorization.',
        parameters: [
          {
            name: 'companyId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
            description: 'ID de la compañía',
            example: 900123456
          }
        ],
        responses: {
          '200': {
            description: 'Lista de asignaciones por compañía',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      assignmentStatus: { type: 'string', example: 'ASSIGNED' },
                      assignmentDate: { type: 'string', format: 'date-time', example: '2025-08-28T10:00:00.000Z' },
                      processId: { type: 'string', example: 'PROC-123' },
                      documentNumber: { type: 'string', example: 'INV-456' },
                      invoiceAmount: { type: 'number', example: 1500.75 },
                      externalReference: { type: 'string', example: 'EXT-789' },
                      claimId: { type: 'string', example: 'CLM-001' },
                      objectionCode: { type: 'string', example: 'OBJ-01' },
                      value: { type: 'number', example: 100.00 },
                      userDud: { type: 'string', example: '12345678' },
                      userName: { type: 'string', example: 'Juan Pérez' }
                    }
                  }
                }
              }
            }
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'Autenticación JWT con API Key y validación de usuarios'
    },
    {
      name: 'Companies',
      description: 'Operaciones relacionadas con empresas'
    },
    {
      name: 'Roles',
      description: 'Operaciones relacionadas con roles'
    },
    {
      name: 'Rules',
      description: 'Operaciones relacionadas con reglas'
    },
    {
      name: 'Users',
      description: 'Operaciones relacionadas con usuarios'
    },
    {
      name: 'Assignments',
      description: 'Operaciones relacionadas con asignaciones'
    }
  ]
};

// ...existing code...
// Opciones para swagger-jsdoc
const options = {
  definition: swaggerDefinition,
  apis: [
    './src/infrastructure/web/routes/*.js',
    './src/infrastructure/web/controllers/*.js'
  ]
};

// Inicializar swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerSpec,
  swaggerUi
};
