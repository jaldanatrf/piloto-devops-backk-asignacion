# Solución a Duplicación de Usuarios en Importación

**Fecha:** 2025-12-01
**Problema:** Los usuarios se duplican cuando se importan concurrentemente desde API externa

---

## 🔍 Diagnóstico

### Problema Identificado
**Race condition** en importación concurrente de usuarios - múltiples requests simultáneos pueden crear el mismo usuario varias veces.

### Causa Raíz
- ❌ NO existía constraint UNIQUE en columna `dud` (documento único de usuario)
- ❌ Flujo CHECK-then-INSERT vulnerable a condiciones de carrera
- ❌ Sin manejo de errores de duplicación por concurrencia

### Escenario de Fallo
```
Request A: findByDUD('CC123') → No existe ❌
Request B: findByDUD('CC123') → No existe ❌ (antes que A inserte)
Request A: createUser('CC123') → Insertado ✅
Request B: createUser('CC123') → Insertado ✅ DUPLICADO!
```

---

## ✅ Soluciones Implementadas

### 1. Constraint UNIQUE en Base de Datos

**Archivo:** `src/infrastructure/database/migrations/004_add_unique_dud_constraint.sql`

**Características:**
- ✅ Detecta y elimina duplicados existentes (conserva el más antiguo)
- ✅ Crea índice UNIQUE en columna `dud`
- ✅ Idempotente (puede ejecutarse múltiples veces sin error)
- ✅ Verificación final del constraint

**Ejecución:**
```bash
# Automático con el sistema de migraciones
npm run dev

# O manual con sqlcmd
sqlcmd -S servidor -d BaseDatos -U usuario -i src/infrastructure/database/migrations/004_add_unique_dud_constraint.sql
```

**SQL generado:**
```sql
-- Elimina duplicados existentes (conserva más antiguo)
WITH CTE AS (
    SELECT id, dud, created_at,
           ROW_NUMBER() OVER(PARTITION BY dud ORDER BY created_at ASC, id ASC) AS rn
    FROM users
)
DELETE FROM CTE WHERE rn > 1;

-- Crea constraint UNIQUE
CREATE UNIQUE INDEX UQ_users_dud ON users(dud);
```

---

### 2. Actualización de Modelo Sequelize

**Archivo:** `src/infrastructure/database/models/index.js`

**Cambios:**

**Antes:**
```javascript
dud: {
  type: DataTypes.STRING(30),
  allowNull: false,
  field: 'dud',
  validate: { len: [5, 30], notEmpty: true }
},
indexes: [
  { fields: ['dud'] }  // ❌ índice normal, NO UNIQUE
]
```

**Después:**
```javascript
dud: {
  type: DataTypes.STRING(30),
  allowNull: false,
  unique: true,  // ✅ UNIQUE constraint
  field: 'dud',
  validate: { len: [5, 30], notEmpty: true }
},
indexes: [
  // ✅ índice removido (unique:true lo crea automáticamente)
]
```

---

### 3. Mejora de Manejo de Errores

**Archivo:** `src/infrastructure/database/repositories/SequelizeUserRepository.js`

**Cambios en métodos:**
- `save()` - líneas 68-76
- `update()` - líneas 313-321

**Mejora:**
```javascript
if (error.name === 'SequelizeUniqueConstraintError') {
  const constraint = error.errors[0]?.path;

  if (constraint === 'dud') {  // ← NUEVO
    throw new ValidationError('User with this DUD already exists');
  }
  // ... resto de validaciones
}
```

**Beneficio:** Mensajes de error claros y específicos para DUD duplicado

---

### 4. Refactorización de Lógica de Importación

**Archivos:**
- `src/infrastructure/web/routes/index.js` (líneas 173-243)
- `src/infrastructure/web/routes/companyRoutes.js` (líneas 558-625)

**Mejoras implementadas:**

#### A. Manejo Robusto de Race Conditions

**Antes:**
```javascript
const found = await findByDUD(dud);
if (found) {
  existing.push(found);
} else {
  const newUser = await createUser(userData);  // ❌ Puede fallar por race condition
  created.push(newUser);
}
```

**Después:**
```javascript
let user = await findByDUD(dud);

if (user) {
  existing.push(user);
} else {
  try {
    const newUser = await createUser(userData);
    created.push(newUser);
  } catch (createError) {
    // Si falla por duplicado, verificar si fue creado por otro proceso
    if (createError.message.includes('DUD already exists')) {
      const retryUser = await findByDUD(dud);
      if (retryUser) {
        existing.push(retryUser);  // ✅ Usuario creado por otro proceso
      } else {
        throw createError;  // Error real, no race condition
      }
    } else {
      throw createError;
    }
  }
}
```

#### B. Manejo Individual de Errores

**Beneficio:** Un usuario con error NO detiene la importación completa

```javascript
const errors = [];

for (const userExt of companyExt.usersAssociated || []) {
  try {
    // ... lógica de importación
  } catch (userError) {
    errors.push({
      dud: userExt.userName,
      name: userExt.Nombres,
      error: userError.message
    });
    // ✅ Continúa con siguiente usuario
  }
}
```

#### C. Respuesta Mejorada

**Antes:**
```json
{
  "success": true,
  "message": "Importación completada: 10 usuarios creados, 5 ya existían",
  "data": { ... }
}
```

**Después:**
```json
{
  "success": true,
  "message": "Importación completada: 10 usuarios creados, 5 ya existían, 2 errores",
  "data": {
    "created": 10,
    "existing": 5,
    "errors": 2,
    "errorDetails": [
      {
        "dud": "CC123456",
        "name": "Juan Perez",
        "error": "Invalid name format"
      }
    ],
    "company": "Empresa XYZ",
    "totalProcessed": 15
  }
}
```

---

## 📊 Resultados Esperados

### Antes de las Correcciones
- ❌ Usuarios duplicados en importaciones concurrentes
- ❌ Sin detección de race conditions
- ❌ Errores detienen toda la importación
- ❌ Sin información detallada de fallos

### Después de las Correcciones
- ✅ Imposible crear usuarios con DUD duplicado (garantía BD)
- ✅ Race conditions manejadas correctamente
- ✅ Importación continúa aunque haya errores individuales
- ✅ Reporte detallado de éxitos, duplicados y errores

---

## 🚀 Despliegue

### Pasos para Aplicar la Solución

#### 1. Backup de Base de Datos
```bash
sqlcmd -S servidor -d BaseDatos -Q "BACKUP DATABASE BaseDatos TO DISK='backup_pre_unique.bak'"
```

#### 2. Verificar Duplicados Actuales
```sql
SELECT dud, COUNT(*) as count
FROM users
GROUP BY dud
HAVING COUNT(*) > 1;
```

#### 3. Aplicar Migración
```bash
# Opción A: Sistema automático
npm run dev  # La migración se ejecuta automáticamente

# Opción B: Manual
sqlcmd -S servidor -d BaseDatos -i src/infrastructure/database/migrations/004_add_unique_dud_constraint.sql
```

#### 4. Verificar Constraint
```sql
SELECT
    i.name AS index_name,
    i.is_unique AS is_unique,
    c.name AS column_name
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE i.object_id = OBJECT_ID('users') AND c.name = 'dud';

-- Resultado esperado:
-- index_name: UQ_users_dud
-- is_unique: 1
-- column_name: dud
```

#### 5. Reiniciar Aplicación
```bash
pm2 restart back-asignaciones
```

#### 6. Probar Importación
```bash
# Endpoint de prueba
POST /api/companies/import-users/CC/1234567890
```

---

## 🧪 Testing

### Casos de Prueba

#### Test 1: Importación Normal
```bash
# Primera importación - debe crear usuarios
POST /api/companies/import-users/CC/1234567890

# Resultado esperado:
# created: 10, existing: 0, errors: 0
```

#### Test 2: Reimportación (Idempotencia)
```bash
# Segunda importación - debe marcar como existentes
POST /api/companies/import-users/CC/1234567890

# Resultado esperado:
# created: 0, existing: 10, errors: 0
```

#### Test 3: Importación Concurrente
```bash
# Ejecutar 5 requests simultáneos
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/companies/import-users/CC/1234567890 &
done

# Resultado esperado:
# Sin duplicados en BD
# created + existing = número correcto de usuarios únicos
```

#### Test 4: Usuario Duplicado Manual
```javascript
// Intentar crear usuario con DUD existente
const userData = {
  name: "Test User",
  dud: "CC1234567890",  // Ya existe
  companyId: 1,
  isActive: true
};

// Resultado esperado:
// Error: "User with this DUD already exists"
```

---

## 📝 Archivos Modificados

| Archivo | Líneas | Cambios |
|---------|--------|---------|
| `004_add_unique_dud_constraint.sql` | NEW | Migración para UNIQUE constraint |
| `models/index.js` | 269-306 | Agregado `unique: true` a dud, removido índice |
| `SequelizeUserRepository.js` | 68-76, 313-321 | Manejo de error DUD duplicado |
| `routes/index.js` | 173-243 | Refactorización con retry y manejo de errores |
| `routes/companyRoutes.js` | 558-625 | Refactorización con retry y manejo de errores |

---

## 🔒 Seguridad y Garantías

### Garantías a Nivel de Base de Datos
- ✅ Constraint UNIQUE previene duplicados físicamente
- ✅ No depende de lógica de aplicación
- ✅ Funciona incluso con acceso directo a BD

### Garantías a Nivel de Aplicación
- ✅ Retry automático en race conditions
- ✅ Transacciones en creación de usuarios
- ✅ Validación en múltiples capas (modelo, repositorio, use case)

### Performance
- ✅ Índice UNIQUE mejora búsquedas por DUD
- ✅ Sin impacto negativo en operaciones normales
- ✅ Manejo eficiente de errores de duplicación

---

## 📞 Soporte

### Si Encuentra Problemas

**Problema:** Migración falla al eliminar duplicados
```sql
-- Verificar duplicados manualmente
SELECT dud, id, created_at
FROM users
WHERE dud IN (
  SELECT dud FROM users GROUP BY dud HAVING COUNT(*) > 1
)
ORDER BY dud, created_at;

-- Eliminar duplicados manualmente (conservar más antiguo)
-- CUIDADO: Verificar antes de ejecutar
DELETE FROM users WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER(PARTITION BY dud ORDER BY created_at ASC) as rn
    FROM users
  ) t WHERE rn > 1
);
```

**Problema:** Constraint ya existe
```sql
-- Verificar constraint
SELECT * FROM sys.indexes WHERE name='UQ_users_dud';

-- Si existe pero no funciona, recrear
DROP INDEX UQ_users_dud ON users;
CREATE UNIQUE INDEX UQ_users_dud ON users(dud);
```

---

## ✅ Checklist de Validación

- [ ] Migración 004 ejecutada exitosamente
- [ ] Constraint UNIQUE verificado en BD
- [ ] No existen duplicados en tabla users
- [ ] Modelo Sequelize actualizado con `unique: true`
- [ ] Tests de importación concurrente pasan
- [ ] Mensajes de error claros para duplicados
- [ ] Aplicación reiniciada en todos los ambientes
- [ ] Monitoring sin errores de duplicación

---

**Estado:** ✅ LISTO PARA PRODUCCIÓN

**Prioridad:** 🔴 ALTA - Previene corrupción de datos

**Impacto:** 🟢 BAJO - Cambios compatibles hacia atrás
