# Limpieza de Logs de Inicio y Conversión a Logger.debug()

## 📋 Objetivo

Reducir significativamente los logs mostrados al iniciar el servidor, manteniendo solo información crítica visible y moviendo logs de negocio a `logger.debug()`.

---

## ✅ Cambios Realizados

### 1. **Logs de Negocio → `logger.debug()`**

#### Archivo: `BusinessRuleProcessorUseCases.js`

**ANTES:**
```javascript
console.log(`\n📋 Resultado del procesamiento de reclamación:`);
console.log(`   📊 Empresa: ${targetCompany.name}...`);
console.log(`   📝 Claim ID: ${claim.claimId}...`);
console.log(`   🔍 Reglas evaluadas: ${activeRules.length}...`);
console.log(`   ✅ Reglas aplicadas:`);
appliedRules.forEach(rule => {
  console.log(`      - ${rule.rule.name}...`);
});
console.log(`   👥 Usuarios filtrados: ${uniqueUsers.length}`);
uniqueUsers.forEach(user => {
  console.log(`      - ${user.name}...`);
});
```

**DESPUÉS:**
```javascript
logger.debug('Resultado del procesamiento de reclamación', {
  empresa: {
    source: {
      name: sourceCompany.name,
      documentNumber: sourceCompany.documentNumber
    },
    target: claim.target
  },
  claim: {
    claimId: claim.claimId || 'N/A',
    objectionCode: claim.objectionCode || 'N/A'
  },
  reglas: {
    evaluadas: activeRules.length,
    aplicadas: appliedRules.length,
    detalle: appliedRules.map(rule => ({
      name: rule.rule.name,
      type: rule.rule.type,
      nitAssociatedCompany: rule.rule.nitAssociatedCompany || 'N/A',
      code: rule.rule.code || 'N/A'
    }))
  },
  usuarios: {
    filtrados: uniqueUsers.length,
    detalle: uniqueUsers.map(user => ({
      name: user.name,
      dud: user.dud,
      role: user.role?.name || 'N/A'
    }))
  }
});
```

**Beneficios:**
- ✅ Formato estructurado JSON para fácil parsing
- ✅ Solo se muestra si el nivel de log es DEBUG
- ✅ Toda la información del negocio está disponible para debugging
- ✅ No contamina logs de producción

---

### 2. **Reducción de Logs de Inicialización**

#### Archivo: `config/index.js`

**ANTES:**
```javascript
console.log(`[Config] Loading environment from: ${envFile} (NODE_ENV: ${process.env.NODE_ENV || 'not set'})`);
```

**DESPUÉS:**
```javascript
// Solo log en desarrollo si es necesario
// console.log(`[Config] Loading environment from: ${envFile} (NODE_ENV: ${process.env.NODE_ENV || 'not set'})`);
```

---

#### Archivo: `SequelizeAdapter.js`

**ANTES:**
```javascript
logger.info('Initializing Sequelize connection to SQL Server...');
logger.info(`Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
// ...
logger.info('Successfully connected to SQL Server database using Sequelize');
```

**DESPUÉS:**
```javascript
logger.debug('Initializing Sequelize connection to SQL Server...');
logger.debug(`Database: ${config.database.host}:${config.database.port}/${config.database.name}`);
// ...
logger.debug('Successfully connected to SQL Server database using Sequelize');
```

**Eliminado:**
- ❌ Logs de queries individuales de Sequelize (ya configurados como `logger.debug()`)
- ❌ Logs de autenticación de BD (ya en debug)

---

#### Archivo: `DatabaseInitService.js`

**ANTES:**
```javascript
console.log('\n' + '═'.repeat(66));
console.log('              DATABASE INITIALIZATION SERVICE');
console.log('═'.repeat(66) + '\n');

console.log('🏗️  Verificando tablas requeridas...\n');
console.log(`⚠️  Creando ${missingTables.length} tabla(s) faltante(s)...`);
console.log(`✅ ${tableResults.created} tabla(s) creada(s) exitosamente`);
console.log('   ✅ Todas las tablas requeridas ya existen\n');

console.log('\n' + '─'.repeat(66));
console.log('📦 Verificando migraciones...\n');
console.log(`⏳ Ejecutando ${migrationStatus.pending} migración(es) pendiente(s)...`);
console.log(`   ✅ ${detail.name} (${detail.executionTime}ms)`);
console.log(`✅ ${results.executed}/${results.total} migración(es) ejecutada(s)`);
console.log('   ✅ No hay migraciones pendientes\n');

console.log('\n' + '─'.repeat(66));
console.log('🔍 Validando esquema (Modelo vs BD)...\n');
console.log(this.schemaValidator.formatReport(validation));
console.log('\n📝 Campos que requieren migración:');
// ... detalles de migraciones

console.log('\n' + '═'.repeat(66));
console.log('✅ Base de datos inicializada correctamente');
console.log('═'.repeat(66) + '\n');
```

**DESPUÉS:**
```javascript
// Sin headers decorativos
// Solo mensajes consolidados y críticos

// Si hay errores:
console.log(`❌ ${tableResults.failed} tabla(s) fallaron al crearse`);
console.log(`⚠️  ${results.failed} migración(es) fallida(s)`);
console.log(`⚠️  ${validation.unsyncedModels} modelo(s) desincronizado(s)`);
console.log('❌ Inicialización de BD con errores');

// Si todo está bien:
console.log('✅ BD inicializada correctamente');

// En modo verbose (opcional):
console.log(`✅ ${tableResults.created} tabla(s) creada(s)`);
console.log(`✅ ${results.executed} migración(es) ejecutada(s)`);
console.log('📝 Campos que requieren migración:', required.length);
```

**Reducción:**
- ❌ Headers decorativos (═══, ───)
- ❌ Logs individuales por tabla creada
- ❌ Logs individuales por migración ejecutada
- ❌ Logs de Sequelize queries para validación de esquema
- ❌ Mensajes de "todo OK" repetitivos
- ✅ Solo 1 mensaje consolidado al final

---

## 📊 Comparación Antes vs Después

### ANTES (Startup):
```
[Config] Loading environment from: .env.dev (NODE_ENV: dev)
info: Initializing Sequelize connection to SQL Server...
info: Database: 192.168.11.230:1433/asignación_pru
debug: Sequelize: Executing (default): SELECT 1+1 AS result
debug: Database connection test successful
info: Successfully connected to SQL Server database using Sequelize

═══════════════════════════════════════════════════════════════
              DATABASE INITIALIZATION SERVICE
═══════════════════════════════════════════════════════════════

🏗️  Verificando tablas requeridas...

debug: Sequelize: Executing (default): SELECT TABLE_NAME...
⚠️  Creando 9 tabla(s) faltante(s)...
debug: Sequelize: Executing (default): SELECT TABLE_NAME...
debug: Skipping duplicate column definition: company_id in roles
debug: Skipping duplicate column definition: company_id in rules
debug: Skipping duplicate column definition: user_id in user_roles
[... 50+ líneas más de logs ...]
✅ 9 tabla(s) creada(s) exitosamente

───────────────────────────────────────────────────────────────
📦 Verificando migraciones...

debug: Sequelize: Executing (default): IF NOT EXISTS...
debug: Sequelize: Executing (default): SELECT name, checksum...
   ✅ No hay migraciones pendientes

───────────────────────────────────────────────────────────────
🔍 Validando esquema (Modelo vs BD)...

debug: Sequelize: Executing (default): SELECT COLUMN_NAME...
[... 20+ líneas más de validaciones ...]

═══════════════════════════════════════════════════════════════
✅ Base de datos inicializada correctamente
═══════════════════════════════════════════════════════════════
```

### DESPUÉS (Startup - Nivel INFO):
```
✅ BD inicializada correctamente
```

### DESPUÉS (Startup - Nivel DEBUG):
```
debug: Initializing Sequelize connection to SQL Server...
debug: Database: 192.168.11.230:1433/asignación_pru
debug: Sequelize: Executing (default): SELECT 1+1 AS result
debug: Database connection test successful
debug: Successfully connected to SQL Server database using Sequelize
debug: Sequelize: Executing (default): SELECT TABLE_NAME...
[... todos los logs de Sequelize en DEBUG ...]
✅ BD inicializada correctamente
```

---

## 🎯 Logs de Negocio

### Mensaje Recibido de Cola

**Configurado en:** Futuro - cuando se implemente el consumer de cola

**Formato sugerido:**
```javascript
logger.debug('Mensaje recibido de cola', {
  processId: claim.processId,
  source: claim.source,
  target: claim.target,
  claimId: claim.claimId,
  objectionCode: claim.objectionCode,
  invoiceAmount: claim.invoiceAmount
});
```

### Reglas Aplicadas

**Ya configurado en:** `BusinessRuleProcessorUseCases.js:102-132`

```javascript
logger.debug('Resultado del procesamiento de reclamación', {
  reglas: {
    evaluadas: activeRules.length,
    aplicadas: appliedRules.length,
    detalle: [...]
  }
});
```

### Usuarios Filtrados

**Ya configurado en:** `BusinessRuleProcessorUseCases.js:124-131`

```javascript
logger.debug('Resultado del procesamiento de reclamación', {
  usuarios: {
    filtrados: uniqueUsers.length,
    detalle: [...]
  }
});
```

### Usuario Seleccionado

**Configurado en:** `BusinessRuleProcessorUseCases.js:491-499`

```javascript
logger.debug('Priorización de reglas', {
  totalReglasAplicadas: appliedRules.length,
  nivelEspecificidad: highestSpecificity,
  reglasEspecificas: [...]
});
```

---

## 🔧 Configuración del Logger

Para ver los logs de debug durante desarrollo:

### Opción 1: Variable de Entorno
```bash
# .env.dev
LOG_LEVEL=debug
```

### Opción 2: Configuración de Winston
```javascript
// src/shared/logger.js
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // Cambiar a 'debug' para ver todos los logs
  // ...
});
```

---

## 📝 Resumen

| Categoría | Antes | Después | Reducción |
|-----------|-------|---------|-----------|
| Logs de config | 1 info | 0 (comentado) | 100% |
| Logs de Sequelize | 3 info + múltiples debug | 3 debug + múltiples debug | -3 info |
| Logs de BD init | ~60 líneas (headers + detalles) | 1 línea | ~98% |
| Logs de negocio | console.log (siempre visible) | logger.debug (solo si DEBUG) | Variable |
| **Total startup** | **~80 líneas** | **~1-3 líneas** | **~95%** |

---

## ✅ Resultado Final

**Logs visibles en startup (nivel INFO):**
```
✅ BD inicializada correctamente
🚀 Server running on port 3000
```

**Logs visibles durante procesamiento de claims (nivel INFO):**
```
(ninguno - solo respuestas HTTP)
```

**Logs visibles durante procesamiento de claims (nivel DEBUG):**
```json
{
  "level": "debug",
  "message": "Resultado del procesamiento de reclamación",
  "empresa": {
    "source": {"name": "ABC", "documentNumber": "901002487"},
    "target": "860037950"
  },
  "claim": {"claimId": "...", "objectionCode": "abc123"},
  "reglas": {
    "evaluadas": 5,
    "aplicadas": 2,
    "detalle": [...]
  },
  "usuarios": {
    "filtrados": 3,
    "detalle": [...]
  }
}
```

---

**Fecha de cambios**: 2025-12-03
**Archivos modificados**: 4
**Reducción de logs**: ~95% en startup
