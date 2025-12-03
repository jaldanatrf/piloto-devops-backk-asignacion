# 🏗️ Backend Sistema de Asignaciones

## 📖 Descripción General

Sistema backend desarrollado con **arquitectura hexagonal (Clean Architecture)** para la gestión de asignaciones automáticas y manuales. El sistema procesa reclamaciones desde colas RabbitMQ, aplica reglas empresariales y asigna tareas a usuarios según su carga de trabajo.

## 🏛️ Arquitectura

### Arquitectura Hexagonal

El proyecto sigue los principios de **Clean Architecture** con separación clara de responsabilidades:

```
┌─────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Database  │  │  RabbitMQ   │  │     Web/REST API    │  │
│  │  (SQL Srv)  │  │   Queue     │  │    (Express.js)     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   APPLICATION                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Use Cases  │  │  Services   │  │   Business Rules    │  │
│  │             │  │             │  │    Processor        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Entities   │  │ Repositories│  │   Value Objects     │  │
│  │             │  │ (Interfaces)│  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Procesamiento Principal

```mermaid
graph TD
    A[RabbitMQ Queue] --> B[AssignmentQueueService]
    B --> C{Validar Mensaje}
    C -->|Válido| D[BusinessRuleProcessor]
    C -->|Inválido| E[Rechazar Mensaje]
    
    D --> F[Buscar Empresa Target]
    F --> G[Evaluar Reglas Activas]
    G --> H[Filtrar Usuarios Candidatos]
    H --> I[Seleccionar Usuario con Menor Carga]
    I --> J[Crear Asignación]
    J --> K[Confirmar Mensaje ACK]
    
    K --> L[Base de Datos]
    
    subgraph "Manejo de Errores"
        E --> M[Log Error]
        N[Error Procesamiento] --> O[NACK + Retry]
        P[Error Conexión] --> Q[Reconexión Automática]
    end
    
    subgraph "APIs REST"
        R[/api/auto-assignments] --> S[Control Manual]
        T[/api/assignments] --> U[CRUD Asignaciones]
        V[/api/business-rules] --> W[Gestión Reglas]
    end
```

## 🗂️ Estructura del Proyecto

```
back-asignaciones/
├── 📁 src/
│   ├── 📁 application/           # Capa de Aplicación
│   │   ├── 📁 services/          # Servicios de aplicación
│   │   │   ├── AssignmentQueueService.js      # Servicio RabbitMQ
│   │   │   ├── AssignmentProcessService.js    # Procesamiento asignaciones
│   │   │   ├── CompanyAssignmentService.js    # Servicio empresas
│   │   │   └── DatabaseService.js             # Servicio base de datos
│   │   └── 📁 useCases/          # Casos de uso por dominio
│   │       ├── assignment/       # Casos de uso asignaciones
│   │       ├── businessRules/    # Casos de uso reglas negocio
│   │       ├── company/          # Casos de uso empresas
│   │       ├── roles/            # Casos de uso roles
│   │       └── users/            # Casos de uso usuarios
│   │
│   ├── 📁 domain/                # Capa de Dominio
│   │   ├── 📁 entities/          # Entidades de negocio
│   │   │   ├── assignment.js     # Entidad Asignación
│   │   │   ├── Company.js        # Entidad Empresa
│   │   │   ├── Role.js           # Entidad Rol
│   │   │   ├── Rule.js           # Entidad Regla
│   │   │   └── users.js          # Entidad Usuario
│   │   ├── 📁 repositories/      # Interfaces repositorios
│   │   └── 📁 value-objects/     # Objetos de valor
│   │
│   ├── 📁 infrastructure/        # Capa de Infraestructura
│   │   ├── 📁 bootstrap/         # Configuración inicial
│   │   ├── 📁 config/            # Configuraciones
│   │   ├── 📁 database/          # Base de datos
│   │   │   ├── 📁 models/        # Modelos Sequelize
│   │   │   ├── 📁 repositories/  # Implementaciones repositorios
│   │   │   └── 📁 migrations/    # Migraciones BD
│   │   ├── 📁 external/          # Integraciones externas
│   │   └── 📁 web/               # API REST
│   │       ├── 📁 controllers/   # Controladores
│   │       ├── 📁 middleware/    # Middlewares
│   │       └── 📁 routes/        # Rutas
│   │
│   └── 📁 shared/                # Utilidades compartidas
│       ├── 📁 errors/            # Manejo de errores
│       ├── 📁 logger/            # Sistema de logs
│       └── 📁 security/          # Seguridad JWT
│
├── 📁 tests/                     # Suite de pruebas
│   ├── 📁 e2e/                   # Pruebas end-to-end
│   ├── 📁 integration/           # Pruebas de integración
│   └── 📁 unit/                  # Pruebas unitarias
│
├── 📁 docs/                      # Documentación
├── 📁 scripts/                   # Scripts utilitarios
└── 📁 logs/                      # Archivos de log
```

## 🧩 Componentes Principales

### 🏢 Entidades de Dominio

| Entidad | Descripción | Relaciones |
|---------|-------------|------------|
| **Company** | Empresas del sistema (PAYER/PROVIDER) | 1:N con Users, Rules |
| **User** | Usuarios del sistema | N:1 con Company, N:M con Roles |
| **Role** | Roles de usuario por empresa | N:1 con Company, N:M con Users |
| **Rule** | Reglas empresariales | N:1 con Company, N:M con Roles |
| **Assignment** | Asignaciones de trabajo | N:1 con User, Company |

### 🔄 Servicios Principales

#### AssignmentQueueService
- **Función**: Consume mensajes de RabbitMQ
- **Características**:
  - Conexión persistente con reconexión automática
  - Procesamiento asíncrono de reclamaciones
  - Manejo de errores con ACK/NACK

#### BusinessRuleProcessor
- **Función**: Motor de reglas empresariales
- **Características**:
  - Evaluación de reglas por monto, empresa, tipo
  - Selección de usuarios candidatos
  - Optimización de carga de trabajo

#### AssignmentProcessService
- **Función**: Gestión del ciclo de vida de asignaciones
- **Características**:
  - Creación automática y manual
  - Seguimiento de estados
  - Métricas y estadísticas

## ✨ Características

- 🏗️ **Arquitectura Hexagonal**: Separación clara de responsabilidades entre dominio, aplicación e infraestructura
- � **Procesamiento Automático**: Consumer RabbitMQ con reconexión automática y manejo de errores
- �📊 **Base de datos SQL Server**: Persistencia robusta con Sequelize ORM y migraciones
- 🧠 **Motor de Reglas**: Sistema inteligente de asignaciones basado en reglas empresariales
- 📖 **Documentación Swagger**: OpenAPI 3.0 completamente integrada y actualizada
- ✅ **Validación robusta**: Validación de datos en múltiples capas con mensajes descriptivos
- 🔍 **Logging estructurado**: Trazabilidad completa de operaciones con Winston
- 🛡️ **Manejo de errores**: Respuestas de error consistentes y recuperación automática
- 🧪 **Testing completo**: Suite de pruebas E2E, integración y unitarias
- 🔐 **Seguridad**: Helmet, CORS, validaciones de entrada y preparado para JWT

## 🛠️ Tecnologías

### Backend Core
- **Node.js** 16+ - Runtime JavaScript
- **Express.js** - Framework web minimalista y robusto
- **Sequelize** - ORM para SQL Server con soporte para migraciones

### Base de Datos
- **SQL Server** - Base de datos empresarial
- **Migraciones** - Control de versiones de base de datos

### Mensajería
- **RabbitMQ** - Cola de mensajes confiable
- **AMQP** - Protocolo de mensajería asíncrona

### Herramientas
- **Winston** - Sistema de logs estructurado
- **Swagger/OpenAPI** - Documentación interactiva de API
- **Jest** - Framework de testing con cobertura
- **Helmet** - Middlewares de seguridad HTTP
- **CORS** - Control de acceso cross-origin

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** 16+ 
- **SQL Server** (local o remoto)
- **RabbitMQ Server** (opcional para funcionalidad completa)
- **npm** o **yarn**

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd back-asignaciones
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Crear archivo de configuración
   cp .env.example .env.local
   
   # Configurar base de datos
   DB_HOST=192.168.11.175
   DB_PORT=1433
   DB_NAME=Northwind
   DB_USER=usrbizuit
   DB_PASSWORD=your_password
   
   # Configurar RabbitMQ (opcional)
   ASSIGNMENT_QUEUE="amqps://user:pass@host/vhost"
   AUTO_START_QUEUE=false
   
   # JWT (preparado para autenticación)
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=24h
   ```

4. **Verificar configuración**
   ```bash
   npm run check:auto-assignment-setup
   ```

5. **Ejecutar el servidor**
   ```bash
   npm run dev
   ```

6. **Acceder a la aplicación**
   - **API Home**: http://localhost:3000/
   - **Swagger UI**: http://localhost:3000/api-docs
   - **Health Check**: http://localhost:3000/health

## 🌐 API REST

### Endpoints Principales

| Grupo | Base URL | Descripción |
|-------|----------|-------------|
| **Empresas** | `/api/companies` | CRUD empresas |
| **Usuarios** | `/api/users` | Gestión usuarios |
| **Roles** | `/api/companies/:id/roles` | Roles por empresa |
| **Reglas** | `/api/companies/:id/rules` | Reglas empresariales |
| **Asignaciones** | `/api/assignments` | CRUD asignaciones |
| **Auto-Asignaciones** | `/api/auto-assignments` | Control servicio automático |
| **Reglas Negocio** | `/api/business-rules` | Procesamiento reglas |

### Documentación API
- **Swagger UI**: `http://localhost:3000/api-docs`
- **JSON Spec**: `http://localhost:3000/api-docs.json`
- **API Home**: `http://localhost:3000/` - Información general

## 🎯 Uso del Sistema

### 1. Iniciar Servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

### 2. Verificar Estado
```bash
# Health check
curl http://localhost:3000/health

# Estado del servicio de cola
curl http://localhost:3000/api/auto-assignments/service/status
```

### 3. Iniciar Servicio Automático
```bash
# Iniciar procesamiento automático
curl -X POST http://localhost:3000/api/auto-assignments/service/start
```

### 4. Procesar Reclamación Manual
```bash
curl -X POST http://localhost:3000/api/auto-assignments/process-manually \
  -H "Content-Type: application/json" \
  -d '{
    "ProcessId": 1234,
    "Target": "9000054312",
    "Source": "800000513",
    "DocumentNumber": "FC98654",
    "InvoiceAmount": 200000,
    "ExternalReference": "100048",
    "ClaimId": "1111154",
    "ConceptApplicationCode": "GLO",
    "ObjectionCode": "FF4412",
    "Value": 200000
  }'
```

## 🧪 Testing

### Scripts de Prueba
```bash
# Todas las pruebas
npm test

# Pruebas específicas
npm run test:auto-assignments        # Asignaciones automáticas
npm run test:auto-assignments:quick  # Pruebas rápidas
npm run check:auto-assignment-setup  # Verificar configuración

# Pruebas manuales por componente
npm run test:manual:company
npm run test:manual:roles
npm run test:manual:rules
```

### Cobertura de Código
```bash
# Generar reporte de cobertura
npm run test:coverage

# Servir reporte en navegador
npm run coverage:serve
```

## 📊 Monitoreo y Logs

### Sistema de Logs
- **Archivos**: `logs/combined.log`, `logs/error.log`
- **Niveles**: error, warn, info, debug
- **Formato**: JSON estructurado con timestamps

### Métricas Disponibles
```bash
# Estadísticas de asignaciones
GET /api/auto-assignments/stats

# Parámetros de filtrado
?startDate=2024-01-01&endDate=2024-12-31
&userId=1&status=pending&type=AUTO_CLAIM
```

### Logs Importantes
```
🔌 Connecting to RabbitMQ...          # Conexión iniciada
✅ Connected to RabbitMQ successfully  # Conexión exitosa
📨 Started consuming messages          # Consumo iniciado
📥 Received message                    # Mensaje recibido
🎯 Selected user for assignment        # Usuario seleccionado
✅ Assignment created successfully     # Asignación creada
❌ Failed to process claim             # Error en procesamiento
```

## 🔒 Seguridad

### Medidas Implementadas
- **Helmet.js** - Headers de seguridad HTTP
- **CORS** - Control de acceso cross-origin
- **JWT** - Autenticación (preparado)
- **Validación** - Entrada de datos sanitizada
- **Logs** - Auditoría de operaciones

### Variables Sensibles
```bash
# Nunca versionar
.env.local
.env.production

# Rotar regularmente
JWT_SECRET
DB_PASSWORD
ASSIGNMENT_QUEUE (credentials)
```

## � Estados del Sistema

### Estados de Asignación
- `pending` - Pendiente de procesamiento
- `in_progress` - En progreso
- `completed` - Completada
- `cancelled` - Cancelada
- `failed` - Fallida

### Estados del Servicio
- `connected` - Conectado a RabbitMQ
- `disconnected` - Desconectado
- `reconnecting` - Reconectando
- `error` - Error de conexión

## 🛠️ Solución de Problemas

### Errores Comunes

#### 1. Error de Conexión RabbitMQ
```bash
# Verificar URL de conexión
echo $ASSIGNMENT_QUEUE

# Verificar conectividad
curl -X GET http://localhost:3000/api/auto-assignments/service/status

# Reiniciar servicio
curl -X POST http://localhost:3000/api/auto-assignments/service/stop
curl -X POST http://localhost:3000/api/auto-assignments/service/start
```

#### 2. Error de Base de Datos
```bash
# Verificar conexión
npm run test:connection

# Verificar configuración
echo $DB_HOST $DB_PORT $DB_NAME
```

#### 3. Tests Fallando
```bash
# Ejecutar tests básicos primero
npm run test:manual:imports

# Verificar servidor corriendo
curl http://localhost:3000/health

# Tests sin dependencias externas
npm run test:auto-assignments:quick
```

## 📈 Roadmap

### Versión Actual (v1.0)
- ✅ Arquitectura hexagonal implementada
- ✅ Procesamiento automático RabbitMQ
- ✅ API REST completa
- ✅ Sistema de reglas empresariales
- ✅ Logging y monitoreo básico

### Próximas Versiones
- 🔄 **v1.1**: Dead Letter Queue para mensajes fallidos
- 📧 **v1.2**: Notificaciones email automáticas
- 📊 **v1.3**: Dashboard de métricas en tiempo real
- ⚡ **v1.4**: Procesamiento paralelo de mensajes
- 🔐 **v1.5**: Autenticación y autorización completa
- 📱 **v1.6**: Notificaciones push móviles
- 🌐 **v2.0**: Microservicios y escalabilidad horizontal

## 🔧 Scripts Disponibles

```bash
npm run start          # Ejecutar servidor producción
npm run dev            # Ejecutar con nodemon
npm run local          # Ejecutar con .env.local
npm run test           # Ejecutar todas las pruebas
npm run test:coverage  # Ejecutar pruebas con cobertura
npm run test:watch     # Ejecutar pruebas en modo watch

# Scripts específicos de testing
npm run test:auto-assignments        # Tests completos auto-asignaciones
npm run test:auto-assignments:quick  # Tests rápidos auto-asignaciones
npm run check:auto-assignment-setup  # Verificar configuración

# Tests manuales por componente
npm run test:manual:company
npm run test:manual:roles
npm run test:manual:rules
npm run test:manual:imports

# Cobertura
npm run coverage:serve  # Servir reporte cobertura
npm run coverage:open   # Abrir reporte en navegador
```

## 📋 Esquemas de Datos Principales

### Company (Empresa)
```json
{
  "id": 1,
  "name": "Innovación Digital S.A.S.",
  "description": "Empresa de desarrollo de software",
  "documentNumber": "900123456",
  "documentType": "NIT",
  "type": "PROVIDER",
  "isActive": true,
  "createdAt": "2025-08-14T14:17:21.215Z",
  "rules": []
}
```

### User (Usuario)
```json
{
  "id": 1,
  "name": "Juan Pérez",
  "dud": "juan.perez@empresa.com",
  "companyId": 1,
  "isActive": true,
  "roles": [1, 2]
}
```

### Assignment (Asignación)
```json
{
  "id": 123,
  "userId": 1,
  "companyId": 1,
  "type": "AUTO_CLAIM_GLO",
  "status": "pending",
  "processId": 1234,
  "externalReference": "100048",
  "claimId": "1111154",
  "documentNumber": "FC98654",
  "invoiceAmount": 200000,
  "value": 200000,
  "assignedAt": "2025-09-03T10:30:00.000Z"
}
```

### Rule (Regla Empresarial)
```json
{
  "id": 1,
  "name": "Regla por Monto Alto",
  "description": "Asignaciones automáticas para montos superiores a $1M",
  "type": "AMOUNT",
  "companyId": 1,
  "minimumAmount": 1000000,
  "maximumAmount": null,
  "isActive": true,
  "roles": [
    {"id": 1, "name": "Senior Analyst"},
    {"id": 2, "name": "Team Lead"}
  ]
}
```

### Claim (Reclamación - Mensaje RabbitMQ)
```json
{
  "ProcessId": 1234,
  "Target": "9000054312",
  "Source": "800000513",
  "DocumentNumber": "FC98654",
  "InvoiceAmount": 200000,
  "ExternalReference": "100048",
  "ClaimId": "1111154",
  "ConceptApplicationCode": "GLO",
  "ObjectionCode": "FF4412",
  "Value": 200000
}
```

### Estructura de Respuesta API
```json
{
  "success": true,
  "data": { /* datos solicitados */ },
  "message": "Operation completed successfully",
  "count": 10  // Solo en listados
}
```

### Estructura de Error
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "VALIDATION_ERROR",
    "details": { /* detalles específicos */ }
  }
}
```

## 🔒 Validaciones y Reglas de Negocio

### Validaciones de Datos

#### Empresa (Company)
- **name**: 2-100 caracteres, permite acentos españoles
- **description**: Máximo 500 caracteres (opcional)
- **documentNumber**: 5-20 caracteres, único por tipo
- **documentType**: Enum ["NIT", "CC", "CE", "RUT"]
- **type**: Enum ["PAYER", "PROVIDER"]

#### Usuario (User)
- **name**: 2-100 caracteres, permite acentos
- **dud**: 5-30 caracteres, único, formato DUD/email
- **companyId**: Debe existir empresa activa

#### Regla (Rule)
- **name**: 2-100 caracteres, único por empresa
- **type**: Enum ["AMOUNT", "COMPANY", "COMPANY-AMOUNT", "CUSTOM"]
- **minimumAmount**: ≥ 0, requerido para tipo AMOUNT
- **maximumAmount**: ≥ minimumAmount, opcional

### Reglas de Negocio

1. **Asignación Automática**:
   - Usuario debe pertenecer a empresa Target
   - Usuario debe tener roles asociados a reglas aplicables
   - Selección por menor carga de trabajo (pending assignments)

2. **Procesamiento de Reglas**:
   - Evaluación por orden: AMOUNT → COMPANY → COMPANY-AMOUNT → CUSTOM
   - Solo reglas activas se evalúan
   - Al menos una regla debe aplicar para crear asignación

3. **Estados de Asignación**:
   - `pending` → `in_progress` → `completed` (flujo normal)
   - Cancelación posible desde `pending` o `in_progress`
   - `failed` para errores de procesamiento

### Códigos de Error
- **400**: Error de validación de datos
- **404**: Recurso no encontrado
- **409**: Conflicto (recurso ya existe)
- **422**: Error de reglas de negocio
- **500**: Error interno del servidor

## 🚀 Despliegue

### Variables de Entorno de Producción
```env
# Aplicación
NODE_ENV=production
PORT=3000

# Base de Datos
DB_HOST=your-production-db-host
DB_PORT=1433
DB_NAME=your-production-db
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# RabbitMQ
ASSIGNMENT_QUEUE="amqps://user:pass@production-rabbitmq/vhost"
AUTO_START_QUEUE=true

# Seguridad
JWT_SECRET=your-production-secret-key
JWT_EXPIRES_IN=24h
API_KEY=your-production-api-key
```

### Docker (Próximamente)
```bash
# Construir imagen
docker build -t back-asignaciones .

# Ejecutar contenedor
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_HOST=your-db-host \
  back-asignaciones
```

### PM2 (Producción Node.js)
```bash
# Instalar PM2
npm install -g pm2

# Iniciar aplicación
pm2 start ecosystem.config.js

# Monitorear
pm2 status
pm2 logs
pm2 restart all
```

### Health Checks
```bash
# Verificar estado aplicación
curl http://your-domain/health

# Verificar servicio de cola
curl http://your-domain/api/auto-assignments/service/status

# Verificar métricas
curl http://your-domain/api/auto-assignments/stats
```

## 👥 Contribución

### Estándares de Código
- **Arquitectura Hexagonal**: Mantener separación de capas
- **ESLint + Prettier**: Configurados para consistencia
- **Testing**: Obligatorio para nuevas funcionalidades
- **Logging**: Usar logger estructurado de Winston
- **Documentación**: Actualizar Swagger para nuevos endpoints

### Flujo de Desarrollo
1. **Fork** del repositorio
2. **Crear branch** para feature: `git checkout -b feature/nueva-funcionalidad`
3. **Desarrollar** siguiendo arquitectura hexagonal
4. **Escribir tests** (unitarios + integración)
5. **Documentar** endpoints en Swagger
6. **Commit** con mensaje descriptivo
7. **Push** y crear Pull Request
8. **Code review** y merge

### Estructura de Commits
```bash
# Formato recomendado
git commit -m "feat(assignments): add automatic user selection algorithm"
git commit -m "fix(database): resolve connection timeout issue"
git commit -m "docs(api): update swagger documentation for rules endpoint"
git commit -m "test(services): add unit tests for BusinessRuleProcessor"
```

## 📞 Soporte y Documentación

### Documentación Adicional
- 📋 [Auto Assignments Service](./README-AUTO-ASSIGNMENTS.md) - Servicio de asignaciones automáticas
- 🏗️ [Architecture Details](./docs/ROLES_ARCHITECTURE.md) - Arquitectura de roles y permisos
- 📊 [API Documentation](./docs/ASSIGNMENT_API.md) - Documentación detallada de API
- 🔧 [Service Documentation](./docs/AUTO_ASSIGNMENT_SERVICE.md) - Servicio RabbitMQ en detalle

### Enlaces Útiles
- **Swagger UI**: http://localhost:3000/api-docs - Documentación interactiva
- **Health Check**: http://localhost:3000/health - Estado del sistema
- **API Home**: http://localhost:3000/ - Información general


---

**Desarrollado con ❤️ usando Clean Architecture y mejores prácticas de desarrollo**

---

## 📊 Métricas del Proyecto

- **Arquitectura**: Hexagonal/Clean Architecture
- **Cobertura de Tests**: >80% (objetivo)
- **Endpoints API**: 50+ documentados en Swagger
- **Dependencias**: Mantenidas y actualizadas
- **Logging**: Estructurado con Winston
- **Performance**: Optimizado para alta concurrencia
- **Seguridad**: Headers seguros + validaciones robustas

---
