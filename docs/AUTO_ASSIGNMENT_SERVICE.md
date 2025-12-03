# 🚀 Servicio de Asignaciones Automáticas - RabbitMQ

## 📋 Descripción General

El servicio de asignaciones automáticas es un sistema que consume mensajes desde una cola RabbitMQ y procesa asignaciones de forma automática. El sistema utiliza el motor de reglas empresariales existente para determinar qué usuarios deben ser notificados y selecciona automáticamente al usuario con menor carga de trabajo.

## 🏗️ Arquitectura del Sistema

```
[RabbitMQ Queue] → [AssignmentQueueService] → [BusinessRuleProcessor] → [AutoAssignmentUseCases] → [Database]
                                          ↓
                               [Usuario con menor carga] ← [Evaluación de reglas]
```

### Componentes Principales

1. **AssignmentQueueService**: Servicio principal que maneja la conexión a RabbitMQ
2. **AutoAssignmentUseCases**: Casos de uso para procesamiento automático de asignaciones
3. **AutoAssignmentController**: Controlador REST para gestión manual del servicio
4. **AutoAssignmentBootstrap**: Configuración de inicialización automática

## ⚙️ Configuración

### Variables de Entorno (.env.local)

```bash
# Cola de asignaciones (REQUERIDO)
ASSIGNMENT_QUEUE="amqps://usuario:password@host/vhost"

# Auto-inicio del servicio (OPCIONAL)
AUTO_START_QUEUE=false  # true para iniciar automáticamente con el servidor
```

### Configuración de RabbitMQ

- **Cola**: `assignment_queue` (creada automáticamente)
- **Durabilidad**: Habilitada
- **Acknowledgment**: Manual (garantiza procesamiento)
- **Prefetch**: 1 mensaje a la vez

## 📨 Estructura del Mensaje

### Formato JSON Requerido

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

### Campos Obligatorios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ProcessId` | number | Identificador único del proceso |
| `Target` | string | NIT de la empresa objetivo |
| `Source` | string | NIT de la empresa fuente |
| `DocumentNumber` | string | Número del documento |
| `InvoiceAmount` | number | Monto de la factura (≥ 0) |
| `ExternalReference` | string | Referencia externa |
| `ClaimId` | string | ID único de la reclamación |
| `ConceptApplicationCode` | string | Código de concepto |
| `ObjectionCode` | string | 🆕 Código de objeción (usado por reglas CODE) |
| `Value` | number | Valor de la reclamación (≥ 0) |

## 📋 Tipos de Reglas de Negocio

El sistema soporta 8 tipos de reglas con diferentes niveles de especificidad:

### Jerarquía de Especificidad (1 = más específica)

| Nivel | Tipo | Criterios de Evaluación | Campos Requeridos |
|-------|------|------------------------|-------------------|
| 1 | `CODE-AMOUNT-COMPANY` | ObjectionCode + Monto + NIT | `code`, `minimumAmount`, `maximumAmount`, `nitAssociatedCompany` |
| 2 | `COMPANY-CODE` | NIT + ObjectionCode | `nitAssociatedCompany`, `code` |
| 3 | `CODE-AMOUNT` | ObjectionCode + Monto | `code`, `minimumAmount`, `maximumAmount` |
| 4 | `COMPANY-AMOUNT` | NIT + Monto | `nitAssociatedCompany`, `minimumAmount`, `maximumAmount` |
| 5 | `COMPANY` | Solo NIT | `nitAssociatedCompany` |
| 6 | `CODE` | Solo ObjectionCode | `code` |
| 7 | `AMOUNT` | Solo Monto | `minimumAmount`, `maximumAmount` |
| 8 | `CUSTOM` | Sin criterios automáticos | - |

### 🆕 Reglas CODE (Nuevas)

Las reglas CODE permiten validar el campo `ObjectionCode` del mensaje para asignaciones más específicas:

**Características:**
- **Coincidencia exacta**: Case-sensitive, sin normalización
- **Null handling**: Claims sin `ObjectionCode` no coinciden con reglas CODE
- **Combinaciones**: Pueden combinarse con AMOUNT y COMPANY para mayor especificidad

**Ejemplos:**

```javascript
// Regla: CODE
{ type: 'CODE', code: 'OBJ-001' }
// Aplica cuando ObjectionCode === 'OBJ-001'

// Regla: CODE-AMOUNT
{ type: 'CODE-AMOUNT', code: 'OBJ-001', minimumAmount: 1000000, maximumAmount: 5000000 }
// Aplica cuando ObjectionCode === 'OBJ-001' Y monto entre 1M-5M

// Regla: COMPANY-CODE
{ type: 'COMPANY-CODE', nitAssociatedCompany: '800000513', code: 'OBJ-001' }
// Aplica cuando NIT === '800000513' Y ObjectionCode === 'OBJ-001'

// Regla: CODE-AMOUNT-COMPANY (más específica)
{
  type: 'CODE-AMOUNT-COMPANY',
  code: 'OBJ-001',
  minimumAmount: 1000000,
  maximumAmount: 5000000,
  nitAssociatedCompany: '800000513'
}
// Aplica cuando ObjectionCode === 'OBJ-001' Y monto 1M-5M Y NIT === '800000513'
```

### Regla de Priorización

**Solo se aplican usuarios de la regla MÁS ESPECÍFICA que coincida**

Si múltiples reglas coinciden, el sistema:
1. Identifica todas las reglas que cumplen los criterios
2. Selecciona solo las de mayor especificidad (menor nivel)
3. Ignora completamente las reglas menos específicas

**Ejemplo de Priorización:**

```javascript
// Reglas configuradas:
1. CODE-AMOUNT-COMPANY: code='OBJ-001', amount=[1M-5M], NIT='800000513' → 5 usuarios
2. COMPANY-CODE: NIT='800000513', code='OBJ-001' → 3 usuarios
3. CODE-AMOUNT: code='OBJ-001', amount=[1M-5M] → 8 usuarios
4. CODE: code='OBJ-001' → 10 usuarios

// Mensaje recibido:
{
  "ObjectionCode": "OBJ-001",
  "InvoiceAmount": 2500000,
  "Source": "800000513"
}

// Resultado: Solo los 5 usuarios de la regla #1 (más específica)
// Las reglas #2, #3 y #4 se ignoran aunque tengan más usuarios
```

## 🔄 Flujo de Procesamiento

### 1. Recepción del Mensaje
- El servicio consume mensajes de la cola RabbitMQ
- Valida la estructura y campos obligatorios
- Parsea el JSON y crea entidad `Claim`

### 2. Procesamiento de Reglas Empresariales
- Utiliza `BusinessRuleProcessorUseCases.processClaim()`
- Busca la empresa objetivo por `Target`
- Evalúa TODAS las reglas activas de la empresa (incluidas CODE)
- Aplica algoritmo de priorización por especificidad
- Determina usuarios candidatos de la regla más específica

### 3. Selección de Usuario Óptimo
- Cuenta asignaciones pendientes por usuario candidato
- Selecciona el usuario con menor número de asignaciones pendientes
- Considera solo usuarios activos

### 4. Creación de Asignación
- Crea nueva asignación en estado `pending`
- Asigna tipo basado en códigos de la reclamación
- Registra fecha de asignación automática

### 5. Confirmación
- Confirma procesamiento del mensaje (ACK)
- Registra logs detallados del proceso
- Actualiza estadísticas del sistema

## 🛠️ API Endpoints

### Estado del Servicio

#### `GET /api/auto-assignments/service/status`
Obtiene el estado actual del servicio de cola.

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "queueName": "assignment_queue",
    "reconnectAttempts": 0,
    "connectionStatus": "active",
    "channelStatus": "active",
    "environment": "local"
  }
}
```

### Control del Servicio

#### `POST /api/auto-assignments/service/start`
Inicia el servicio de cola automática.

#### `POST /api/auto-assignments/service/stop`
Detiene el servicio de cola automática.

### Procesamiento Manual

#### `POST /api/auto-assignments/process-manually`
Procesa una reclamación sin usar la cola (útil para testing).

**Body:**
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

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Assignment created successfully",
  "data": {
    "assignment": {
      "id": 123,
      "userId": 45,
      "status": "pending",
      "type": "AUTO_CLAIM_GLO"
    },
    "selectedUser": {
      "id": 45,
      "name": "Juan Pérez",
      "email": "juan@empresa.com",
      "pendingAssignments": 2
    },
    "processResult": {
      "appliedRules": [
        {
          "id": 10,
          "name": "Objeciones Críticas NIT Específico",
          "type": "CODE-AMOUNT-COMPANY",
          "code": "OBJ-001",
          "minimumAmount": 1000000,
          "maximumAmount": 5000000,
          "nitAssociatedCompany": "800000513",
          "applies": true,
          "reason": "coincide"
        }
      ],
      "totalRulesEvaluated": 5,
      "totalRulesApplied": 1,
      "company": {
        "id": 1,
        "name": "Empresa ABC",
        "documentNumber": "9000054312"
      }
    }
  }
}
```

### Estadísticas

#### `GET /api/auto-assignments/stats`
Obtiene estadísticas de asignaciones automáticas.

**Parámetros de consulta:**
- `startDate`: Fecha inicio (ISO 8601)
- `endDate`: Fecha fin (ISO 8601)
- `userId`: Filtrar por usuario
- `status`: Filtrar por estado
- `type`: Filtrar por tipo

### Testing

#### `POST /api/auto-assignments/test-message`
Envía un mensaje de prueba a la cola.

#### `GET /api/auto-assignments/message-example`
Obtiene ejemplo de estructura de mensaje.

## 🚦 Inicialización del Servicio

### Automática
1. Configurar `AUTO_START_QUEUE=true` en `.env.local`
2. Reiniciar el servidor
3. El servicio se iniciará automáticamente

### Manual via API
```bash
curl -X POST http://localhost:4041/api/auto-assignments/service/start
```

### Manual via Código
```javascript
const autoAssignmentUseCases = // ... obtener instancia
await autoAssignmentUseCases.initializeQueueService();
```

## 🔍 Monitoreo y Logs

### Logs del Sistema
El servicio genera logs detallados:

- `🔌 Connecting to RabbitMQ...` - Conexión iniciada
- `✅ Connected to RabbitMQ successfully` - Conexión exitosa
- `📨 Started consuming messages` - Consumo iniciado
- `📥 Received message` - Mensaje recibido
- `🎯 Selected user for assignment` - Usuario seleccionado
- `✅ Assignment created successfully` - Asignación creada

### Reconexión Automática
- Máximo 5 intentos de reconexión
- Delay de 5 segundos entre intentos
- Logs detallados de cada intento

## 🧪 Testing

### Scripts de Prueba

```bash
# Prueba completa
node tests/e2e/auto-assignments/test-auto-assignments.js

# Prueba rápida
node tests/e2e/auto-assignments/test-auto-assignments.js --quick

# Ayuda
node tests/e2e/auto-assignments/test-auto-assignments.js --help
```

### Casos de Prueba

1. **Conectividad**: Verificar conexión a RabbitMQ
2. **Procesamiento Manual**: Probar sin cola
3. **Mensaje de Prueba**: Enviar a cola real
4. **Estadísticas**: Verificar métricas
5. **Estados del Servicio**: Iniciar/detener

## 🚨 Manejo de Errores

### Errores de Conexión
- Reconexión automática
- Logs detallados
- Fallback a modo manual

### Errores de Procesamiento
- Mensaje rechazado (NACK)
- Log del error específico
- Continuación con siguiente mensaje

### Errores de Validación
- Mensaje descartado
- Log de validación fallida
- ACK para evitar reprocessamiento

## 📊 Métricas y Estadísticas

### Disponibles via API
- Total de asignaciones automáticas
- Asignaciones por estado (pending, completed, etc.)
- Distribución por usuario
- Distribución por tipo
- Tasa de completitud

### Logs de Rendimiento
- Tiempo de procesamiento por mensaje
- Número de reglas evaluadas/aplicadas
- Usuarios candidatos encontrados

## 🔧 Configuración Avanzada

### Personalización de Cola
```javascript
// En AssignmentQueueService.js
this.queueName = 'custom_assignment_queue';
```

### Configuración de Reconexión
```javascript
this.maxReconnectAttempts = 10;
this.reconnectDelay = 3000; // 3 segundos
```

### Tipos de Asignación Personalizados
```javascript
determineAssignmentType(claimData, processResult) {
  // Lógica personalizada para tipos
  if (claimData.ConceptApplicationCode === 'URGENT') {
    return 'URGENT_ASSIGNMENT';
  }
  return 'STANDARD_ASSIGNMENT';
}
```

## 🏃‍♂️ Inicio Rápido

1. **Configurar variables de entorno**
   ```bash
   ASSIGNMENT_QUEUE="amqps://user:pass@host/vhost"
   AUTO_START_QUEUE=true
   ```

2. **Iniciar servidor**
   ```bash
   npm run local
   ```

3. **Verificar estado**
   ```bash
   curl http://localhost:4041/api/auto-assignments/service/status
   ```

4. **Enviar mensaje de prueba**
   ```bash
   curl -X POST http://localhost:4041/api/auto-assignments/test-message
   ```

5. **Monitorear estadísticas**
   ```bash
   curl http://localhost:4041/api/auto-assignments/stats
   ```

## 🤝 Integración con Sistemas Externos

### Envío desde Aplicación Externa
```javascript
const amqp = require('amqplib');

async function sendClaim(claimData) {
  const connection = await amqp.connect(QUEUE_URL);
  const channel = await connection.createChannel();
  
  await channel.assertQueue('assignment_queue', { durable: true });
  
  const message = JSON.stringify(claimData);
  channel.sendToQueue('assignment_queue', Buffer.from(message), {
    persistent: true
  });
  
  await channel.close();
  await connection.close();
}
```

### Webhook Callback (Futuro)
El sistema puede extenderse para enviar callbacks cuando se complete una asignación:

```javascript
// En createAssignment()
await this.sendAssignmentCallback(assignment, selectedUser);
```

## 🎯 Configuración de Reglas CODE

### Creación de Reglas CODE via API

Las reglas CODE se configuran usando los mismos endpoints de reglas existentes:

#### `POST /api/rules`

```json
// Ejemplo: Regla CODE simple
{
  "name": "Objeciones OBJ-001",
  "description": "Gestión de objeciones con código OBJ-001",
  "type": "CODE",
  "code": "OBJ-001",
  "companyId": 1,
  "isActive": true
}

// Ejemplo: Regla CODE-AMOUNT-COMPANY (más específica)
{
  "name": "Objeciones Críticas Alto Valor",
  "description": "Objeciones OBJ-001 de alto valor para NIT específico",
  "type": "CODE-AMOUNT-COMPANY",
  "code": "OBJ-001",
  "minimumAmount": 5000000,
  "maximumAmount": 50000000,
  "nitAssociatedCompany": "800000513",
  "companyId": 1,
  "isActive": true
}
```

### Validaciones Automáticas

El sistema valida:
- **CODE**: No duplicados de `code` en la misma empresa
- **CODE-AMOUNT**: No solapamiento de rangos con mismo `code`
- **COMPANY-CODE**: No duplicados de `nitAssociatedCompany` + `code`
- **CODE-AMOUNT-COMPANY**: No solapamiento con mismo `code` y `nitAssociatedCompany`

### Case Sensitivity

⚠️ **Importante**: La comparación del campo `code` es **case-sensitive**:
- `"OBJ-001"` ≠ `"obj-001"`
- `"OBJ-001"` ≠ `"OBJ-001 "`
- Coincidencia exacta sin normalización

## 📚 Documentación Adicional

### Guías de Implementación
- **[MIGRATION_CODE_RULES.md](./MIGRATION_CODE_RULES.md)** - Guía completa de migración de base de datos para reglas CODE
- **[FRONTEND_INTEGRATION_CODE_RULES.md](./FRONTEND_INTEGRATION_CODE_RULES.md)** - Documentación de integración frontend con TypeScript, React y validaciones

### Documentación de APIs
- **Swagger UI**: `/api-docs` - Documentación interactiva de todos los endpoints
- **[ASSIGNMENT_API.md](./ASSIGNMENT_API.md)** - Especificación detallada de endpoints de asignaciones

### Testing
```bash
# Tests completos de reglas CODE
npm run test:auto-assignments

# Tests específicos de evaluación CODE
npm test tests/unit/businessRules/CodeRuleEvaluation.test.js

# Tests de priorización
npm test tests/unit/businessRules/RulePrioritization.test.js

# Tests E2E integrados
npm test tests/integration/CodeRulesE2E.test.js
```

## 📈 Roadmap

### Versión Actual (v2.0) 🆕
- ✅ Consumo básico de RabbitMQ
- ✅ Procesamiento automático de reglas
- ✅ Selección por carga de trabajo
- ✅ API de gestión y monitoreo
- ✅ **Reglas CODE con 8 niveles de especificidad**
- ✅ **Algoritmo de priorización por especificidad**
- ✅ **Validaciones de duplicados y solapamiento**

### Próximas Versiones
- 🔄 Dead Letter Queue para mensajes fallidos
- 📧 Notificaciones email automáticas
- 📊 Dashboard de métricas en tiempo real
- ⚡ Procesamiento paralelo de mensajes
- 🔐 Autenticación y autorización de mensajes
- 📱 Notificaciones push móviles
- 🔍 Análisis y reportes de reglas CODE más usadas
