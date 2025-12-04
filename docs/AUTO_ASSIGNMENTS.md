# Servicio de Asignaciones Automáticas

## Inicio Rápido

### 1. Configurar Variables de Entorno
Crear `.env.local` con:
```bash
ASSIGNMENT_QUEUE="amqps://usuario:password@host/vhost"
AUTO_START_QUEUE=false  # true para iniciar automáticamente
```

### 2. Instalar y Ejecutar
```bash
npm install
npm run local

# Iniciar servicio de cola
curl -X POST http://localhost:4041/api/auto-assignments/service/start
```

### 3. Probar Funcionalidad
```bash
# Tests rápidos (sin RabbitMQ)
npm run test:auto-assignments:quick

# Tests completos (incluye RabbitMQ)
npm run test:auto-assignments
```

---

## Arquitectura del Sistema

```
[RabbitMQ Queue] → [AssignmentQueueService] → [BusinessRuleProcessor] → [Database]
                                          ↓
                               [Usuario con menor carga] ← [Evaluación de reglas]
```

### Componentes Principales

1. **AssignmentQueueService**: Conexión a RabbitMQ y gestión de mensajes
2. **BusinessRuleProcessorUseCases**: Motor de reglas de negocio
3. **AutoAssignmentUseCases**: Casos de uso para procesamiento automático
4. **AutoAssignmentController**: API REST para gestión del servicio

---

## Estructura del Mensaje

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
| `Source` | string | NIT de la empresa fuente (tiene las reglas) |
| `DocumentNumber` | string | Número del documento |
| `InvoiceAmount` | number | Monto de la factura (≥ 0) |
| `ExternalReference` | string | Referencia externa |
| `ClaimId` | string | ID único de la reclamación |
| `ConceptApplicationCode` | string | Código de concepto |
| `ObjectionCode` | string | Código de objeción (para reglas CODE) |
| `Value` | number | Valor de la reclamación (≥ 0) |

---

## Tipos de Reglas de Negocio

El sistema soporta 8 tipos de reglas con diferentes niveles de especificidad:

### Jerarquía de Especificidad (1 = más específica)

| Nivel | Tipo | Criterios | Campos Requeridos |
|-------|------|-----------|-------------------|
| 1 | `CODE-AMOUNT-COMPANY` | ObjectionCode + Monto + NIT | `code`, `minimumAmount`, `maximumAmount`, `nitAssociatedCompany` |
| 2 | `COMPANY-CODE` | NIT + ObjectionCode | `nitAssociatedCompany`, `code` |
| 3 | `CODE-AMOUNT` | ObjectionCode + Monto | `code`, `minimumAmount`, `maximumAmount` |
| 4 | `COMPANY-AMOUNT` | NIT + Monto | `nitAssociatedCompany`, `minimumAmount`, `maximumAmount` |
| 5 | `COMPANY` | Solo NIT | `nitAssociatedCompany` |
| 6 | `CODE` | Solo ObjectionCode | `code` |
| 7 | `AMOUNT` | Solo Monto | `minimumAmount`, `maximumAmount` |
| 8 | `CUSTOM` | Sin criterios automáticos | - |

### Reglas CODE

Las reglas CODE permiten validar el campo `ObjectionCode` para asignaciones más específicas:

**Características**:
- **Coincidencia exacta**: Case-sensitive, sin normalización
- **Null handling**: Claims sin `ObjectionCode` no coinciden con reglas CODE
- **Combinaciones**: Pueden combinarse con AMOUNT y COMPANY

**Ejemplos**:

```javascript
// Regla: CODE
{ type: 'CODE', code: 'OBJ-001' }
// Aplica cuando ObjectionCode === 'OBJ-001'

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

Si múltiples reglas coinciden:
1. Identifica todas las reglas que cumplen los criterios
2. Selecciona solo las de mayor especificidad (menor nivel)
3. Ignora completamente las reglas menos específicas

**Ejemplo**:
```javascript
// Reglas configuradas:
1. CODE-AMOUNT-COMPANY → 5 usuarios (Nivel 1)
2. COMPANY-CODE → 3 usuarios (Nivel 2)
3. CODE → 10 usuarios (Nivel 6)

// Mensaje con ObjectionCode='OBJ-001', Amount=2M, NIT='800000513'
// Resultado: Solo los 5 usuarios de regla #1 (más específica)
```

---

## Flujo de Procesamiento

### 1. Recepción del Mensaje
- Consume mensajes de RabbitMQ
- Valida estructura y campos obligatorios
- Parsea JSON y crea entidad `Claim`

### 2. Procesamiento de Reglas
- Busca empresa Source (que tiene las reglas)
- Evalúa TODAS las reglas activas de la empresa
- Aplica algoritmo de priorización por especificidad
- Determina usuarios candidatos de la regla más específica

### 3. Selección de Usuario
- Cuenta asignaciones pendientes por usuario candidato
- Selecciona el usuario con menor número de asignaciones pendientes
- Considera solo usuarios activos

### 4. Creación de Asignación
- Crea nueva asignación en estado `pending`
- Asigna tipo basado en códigos de la reclamación
- Registra fecha de asignación automática

### 5. Confirmación
- Confirma procesamiento del mensaje (ACK)
- Registra logs del proceso
- Actualiza estadísticas del sistema

---

## API Endpoints

### Estado del Servicio

#### `GET /api/auto-assignments/service/status`
Obtiene el estado actual del servicio de cola.

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "isConnected": true,
    "queueName": "assignment_queue",
    "reconnectAttempts": 0,
    "connectionStatus": "active",
    "channelStatus": "active"
  }
}
```

### Control del Servicio

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auto-assignments/service/start` | Iniciar servicio de cola |
| POST | `/api/auto-assignments/service/stop` | Detener servicio de cola |

### Procesamiento Manual

#### `POST /api/auto-assignments/process-manually`
Procesa una reclamación sin usar la cola (útil para testing).

**Body**: Mismo formato que mensaje de cola

**Respuesta exitosa**:
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
      "pendingAssignments": 2
    },
    "processResult": {
      "appliedRules": [...],
      "totalRulesEvaluated": 5,
      "totalRulesApplied": 1
    }
  }
}
```

### Estadísticas

#### `GET /api/auto-assignments/stats`
Obtiene estadísticas de asignaciones automáticas.

**Parámetros**:
- `startDate`: Fecha inicio (ISO 8601)
- `endDate`: Fecha fin (ISO 8601)
- `userId`: Filtrar por usuario
- `status`: Filtrar por estado
- `type`: Filtrar por tipo

---

## Inicialización del Servicio

### Automática
1. Configurar `AUTO_START_QUEUE=true` en `.env.local`
2. Reiniciar el servidor
3. El servicio se iniciará automáticamente

### Manual via API
```bash
curl -X POST http://localhost:4041/api/auto-assignments/service/start
```

---

## Monitoreo y Logs

### Logs del Sistema

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

---

## Testing

### Scripts de Prueba

```bash
# Prueba completa
node tests/e2e/auto-assignments/test-auto-assignments.js

# Prueba rápida
node tests/e2e/auto-assignments/test-auto-assignments.js --quick

# Tests unitarios reglas CODE
npm test tests/unit/businessRules/

# Tests E2E reglas CODE
npm test tests/integration/CodeRulesE2E.test.js
```

---

## Manejo de Errores

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
- ACK para evitar reprocesamiento

---

## Configuración de Reglas CODE

### Creación de Reglas via API

#### `POST /api/rules`

```json
// Ejemplo: Regla CODE simple
{
  "name": "Objeciones OBJ-001",
  "type": "CODE",
  "code": "OBJ-001",
  "companyId": 1,
  "isActive": true
}

// Ejemplo: Regla CODE-AMOUNT-COMPANY (más específica)
{
  "name": "Objeciones Críticas Alto Valor",
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

- **CODE**: No duplicados de `code` en la misma empresa
- **CODE-AMOUNT**: No solapamiento de rangos con mismo `code`
- **COMPANY-CODE**: No duplicados de `nitAssociatedCompany` + `code`
- **CODE-AMOUNT-COMPANY**: No solapamiento con mismo `code` y `nitAssociatedCompany`

### Case Sensitivity

⚠️ **Importante**: La comparación del campo `code` es **case-sensitive**:
- `"OBJ-001"` ≠ `"obj-001"`
- Coincidencia exacta sin normalización

---

## Configuración Avanzada

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

---

## Documentación Adicional

- **[MIGRATION_CODE_RULES.md](./MIGRATION_CODE_RULES.md)** - Guía de migración para reglas CODE
- **[FRONTEND_INTEGRATION_CODE_RULES.md](./FRONTEND_INTEGRATION_CODE_RULES.md)** - Integración frontend
- **[ASSIGNMENT_API.md](./ASSIGNMENT_API.md)** - Especificación de API de asignaciones
- **Swagger UI**: `/api-docs` - Documentación interactiva

---

## Roadmap

### Versión Actual (v2.0)
- ✅ Consumo de RabbitMQ
- ✅ Procesamiento automático de reglas
- ✅ Selección por carga de trabajo
- ✅ API de gestión y monitoreo
- ✅ Reglas CODE con 8 niveles de especificidad
- ✅ Algoritmo de priorización

### Próximas Versiones
- 🔄 Dead Letter Queue para mensajes fallidos
- 📧 Notificaciones email automáticas
- 📊 Dashboard de métricas en tiempo real
- ⚡ Procesamiento paralelo de mensajes
- 🔐 Autenticación y autorización de mensajes
