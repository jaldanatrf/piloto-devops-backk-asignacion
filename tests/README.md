# Tests Organization

Esta carpeta contiene todas las pruebas del proyecto organizadas por tipo y entidad.

## 📁 Estructura

```
tests/
├── unit/                     # Pruebas unitarias
│   ├── company/             # Pruebas de entidad Company
│   │   ├── Company.test.js
│   │   └── CompanyUseCases.test.js
│   ├── role/                # Pruebas de entidad Role
│   │   ├── Role.test.js
│   │   └── RoleUseCases.test.js
│   ├── rule/                # Pruebas de entidad Rule
│   │   └── RuleUseCases.test.js
│   └── user/                # Pruebas de entidad User
│       └── User.test.js
├── integration/             # Pruebas de integración
│   ├── company/             # Pruebas de endpoints y repositorio de Company
│   │   ├── company-endpoints.test.js
│   │   └── test-repositories.js
│   └── swagger/             # Pruebas de documentación API
│       └── test-swagger.js
├── e2e/                     # Pruebas end-to-end
│   ├── general/             # Pruebas generales del sistema
│   │   ├── test-api.js
│   │   ├── test-connection.js
│   │   └── quick-test.js
│   └── rules/               # Pruebas específicas de funcionalidad de reglas
│       ├── test-rules-manual.js
│       ├── test-new-rule-types.js
│       └── test-rule-functionality.js
├── fixtures/                # Datos de prueba
│   └── company/             # Datos de prueba para Company
│       ├── test_company.json
│       └── test_company2.json
├── utils/                   # Utilidades de testing
│   ├── verify-controllers.js
│   └── verify-setup.js
└── README.md               # Este archivo
```

## 🧪 Tipos de Pruebas

### **Unit Tests (Pruebas Unitarias)**
- Prueban componentes individuales en aislamiento
- Entidades, casos de uso, servicios
- Ejecutar: `npm test tests/unit`

### **Integration Tests (Pruebas de Integración)**
- Prueban la integración entre componentes
- Endpoints, repositorios, bases de datos
- Ejecutar: `npm test tests/integration`

### **End-to-End Tests (Pruebas E2E)**
- Prueban el flujo completo del sistema
- Conexiones, APIs completas, nuevos tipos de reglas
- Ejecutar: `npm test tests/e2e`

#### **General:**
- `test-api.js`: Prueba general de API
- `test-connection.js`: Prueba de conexión a la base de datos
- `quick-test.js`: Prueba rápida del sistema

#### **Funcionalidad de Reglas:**
- `test-rules-manual.js`: CRUD completo de reglas + nuevos tipos
- `test-new-rule-types.js`: Prueba completa de los nuevos tipos AMOUNT, COMPANY y COMPANY-AMOUNT con limpieza automática
- `test-rule-functionality.js`: Prueba básica de funcionalidad de reglas usando empresas existentes

## 📊 Comandos útiles

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar solo pruebas unitarias
npm test tests/unit

# Ejecutar solo pruebas de company
npm test tests/unit/company

# Ejecutar pruebas E2E específicas de reglas
node tests/e2e/rules/test-rules-manual.js
node tests/e2e/rules/test-new-rule-types.js
node tests/e2e/rules/test-rule-functionality.js

# Ejecutar con cobertura
npm run test:coverage

# Ejecutar en modo watch
npm run test:watch
```

## 📋 Organización por Entidad

Cada entidad tiene su propia subcarpeta con:
- **Pruebas unitarias**: Lógica de negocio
- **Pruebas de integración**: Endpoints y persistencia  
- **Fixtures**: Datos de prueba específicos

## 📁 Organización por Funcionalidad (E2E)

Las pruebas E2E están organizadas por funcionalidad específica:
- **`general/`**: Pruebas generales del sistema (conexión, API básica, health checks)
- **`rules/`**: Pruebas específicas de funcionalidad de reglas (CRUD, nuevos tipos, validaciones)

Esta organización facilita:
- Localizar pruebas por funcionalidad específica
- Mantener separadas las pruebas generales de las específicas
- Ejecutar solo las pruebas de una funcionalidad particular
- Escalar la estructura para nuevas funcionalidades

## 🔄 Archivos Consolidados

Se eliminaron archivos duplicados y se consolidaron en:
- `company-endpoints.test.js`: Combina funcionalidad de test-company.js, test-simple-company.js y test-company-endpoint.js
- Estructura organizada por responsabilidad y entidad

## 🛠️ Utilidades

La carpeta `utils/` contiene herramientas de testing:
- Verificadores de configuración
- Helpers de controladores
- Configuraciones compartidas

## 🆕 Nuevos Tipos de Reglas (2025-08-15)

Se implementaron 3 nuevos tipos de reglas con validaciones específicas:

### **Tipos Soportados:**
- `AMOUNT`: Requiere `minimumAmount` y `maximumAmount`
- `COMPANY`: Requiere `nitAssociatedCompany`
- `COMPANY-AMOUNT`: Requiere ambos (montos y NIT)

### **Pruebas Automatizadas:**
- **`test-new-rule-types.js`**: Test completo con limpieza automática
  - Crea empresa temporal única
  - Prueba los 3 nuevos tipos de reglas
  - Valida campos obligatorios según tipo
  - Limpia automáticamente todos los registros de prueba
  
- **`test-rule-functionality.js`**: Test básico sin limpieza
  - Usa empresas existentes
  - Crea reglas de los nuevos tipos
  - Muestra estadísticas por tipo

### **Ejecutar Pruebas Específicas:**
```bash
# Test CRUD completo con nuevos tipos
node tests/e2e/rules/test-rules-manual.js

# Test completo con limpieza (recomendado)
node tests/e2e/rules/test-new-rule-types.js

# Test básico sin limpieza
node tests/e2e/rules/test-rule-functionality.js
```
