# 🚀 Servicio de Asignaciones Automáticas

## Inicio Rápido

### 1. Verificar Setup
```bash
npm run check:auto-assignment-setup
```

### 2. Configurar Variables de Entorno
Crear `.env.local` con:
```bash
ASSIGNMENT_QUEUE="amqps://usuario:password@host/vhost"
AUTO_START_QUEUE=false
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Iniciar Servidor
```bash
npm run local
```

### 5. Iniciar Servicio de Cola
```bash
curl -X POST http://localhost:4041/api/auto-assignments/service/start
```

### 6. Probar Funcionalidad
```bash
# Tests rápidos (sin RabbitMQ)
npm run test:auto-assignments:quick

# Tests completos (incluye RabbitMQ)
npm run test:auto-assignments
```

## 🆕 Nuevas Características (v2.0)

### Reglas CODE - Asignación por Código de Objeción

El sistema ahora soporta **4 nuevos tipos de reglas** basadas en el campo `ObjectionCode`:

| Tipo | Descripción | Especificidad |
|------|-------------|---------------|
| `CODE` | Solo código de objeción | Baja |
| `CODE-AMOUNT` | Código + rango de monto | Media |
| `COMPANY-CODE` | Código + NIT | Media-Alta |
| `CODE-AMOUNT-COMPANY` | Código + monto + NIT | **Más específica** |

**Sistema de Priorización:** Solo se aplican usuarios de la regla **más específica** que coincida.

**Ejemplo de uso:**
```json
{
  "name": "Objeciones Críticas",
  "type": "CODE-AMOUNT-COMPANY",
  "code": "OBJ-001",
  "minimumAmount": 5000000,
  "maximumAmount": 50000000,
  "nitAssociatedCompany": "800000513",
  "companyId": 1
}
```

⚠️ **Importante:** La comparación del campo `code` es **case-sensitive** (distingue mayúsculas/minúsculas).

### Migración

Para habilitar las reglas CODE en tu instancia:
```bash
npm run migrate:code-rules
```

Ver guía completa: [docs/MIGRATION_CODE_RULES.md](./docs/MIGRATION_CODE_RULES.md)

## 📚 Documentación Completa

- **[AUTO_ASSIGNMENT_SERVICE.md](./docs/AUTO_ASSIGNMENT_SERVICE.md)** - Documentación completa del servicio
- **[FRONTEND_INTEGRATION_CODE_RULES.md](./docs/FRONTEND_INTEGRATION_CODE_RULES.md)** - Guía de integración frontend
- **[MIGRATION_CODE_RULES.md](./docs/MIGRATION_CODE_RULES.md)** - Guía de migración de base de datos

## 🧪 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run check:auto-assignment-setup` | Verificar configuración |
| `npm run test:auto-assignments` | Tests completos |
| `npm run test:auto-assignments:quick` | Tests rápidos |
| `npm run migrate:code-rules` | 🆕 Ejecutar migración reglas CODE |
| `npm test tests/unit/businessRules/` | 🆕 Tests unitarios reglas CODE |
| `npm test tests/integration/CodeRulesE2E.test.js` | 🆕 Tests E2E reglas CODE |
| `npm run local` | Iniciar servidor desarrollo |

## 🛠️ Endpoints Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/auto-assignments/service/status` | Estado del servicio |
| POST | `/api/auto-assignments/service/start` | Iniciar servicio |
| POST | `/api/auto-assignments/service/stop` | Detener servicio |
| POST | `/api/auto-assignments/process-manually` | Procesar claim manual |
| GET | `/api/auto-assignments/stats` | Estadísticas |

## ⚠️ Requisitos

- ✅ Node.js 16+
- ✅ RabbitMQ Server
- ✅ SQL Server Database
- ✅ Variables de entorno configuradas

## 🔧 Troubleshooting

### Error de Conexión RabbitMQ
```bash
# Verificar URL en .env.local
ASSIGNMENT_QUEUE="amqps://usuario:password@host/vhost"

# Verificar conectividad
curl -X GET http://localhost:4041/api/auto-assignments/service/status
```

### Error de Base de Datos
```bash
# Verificar tablas requeridas
# - assignments
# - users  
# - companies
# - rules
```

### Tests Fallando
```bash
# Verificar servidor corriendo
npm run local

# Tests rápidos primero
npm run test:auto-assignments:quick
```

## 📈 Monitoreo

### Logs del Servicio
- `🔌 Connecting to RabbitMQ...`
- `✅ Connected to RabbitMQ successfully`
- `📨 Started consuming messages`
- `📥 Received message`
- `✅ Assignment created successfully`

### Métricas Disponibles
- Total de asignaciones automáticas
- Distribución por usuario
- Distribución por estado
- Tasa de completitud

---

**Desarrollado para el sistema de asignaciones con arquitectura hexagonal**
