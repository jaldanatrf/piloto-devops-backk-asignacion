# Guía de Deployment de Base de Datos

Esta guía explica cómo configurar la base de datos en diferentes ambientes (desarrollo, QA, producción).

## 📋 Tabla de Contenidos

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Opción 1: Creación Automática](#opción-1-creación-automática-recomendado)
3. [Opción 2: Deployment Manual](#opción-2-deployment-manual)
4. [Verificación Post-Deployment](#verificación-post-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Resumen del Sistema

El sistema utiliza **tres mecanismos** para gestión de esquemas:

### 1. **Creación Automática de Tablas**
- **Cuándo**: Base de datos completamente nueva (0 tablas)
- **Cómo**: Genera DDL desde modelos Sequelize
- **Ubicación**: `TableGeneratorService.js`

### 2. **Migraciones SQL**
- **Cuándo**: Modificaciones incrementales al esquema
- **Cómo**: Archivos `.sql` versionados
- **Ubicación**: `src/infrastructure/database/migrations/*.sql`

### 3. **Validación de Esquema**
- **Cuándo**: Cada inicio de aplicación
- **Cómo**: Compara modelos vs base de datos real
- **Ubicación**: `SchemaValidatorService.js`

---

## Opción 1: Creación Automática (Recomendado)

### Para Bases de Datos Nuevas

**Ventajas:**
- ✅ Automático - sin intervención manual
- ✅ Siempre sincronizado con modelos de código
- ✅ Ideal para ambientes de desarrollo y QA

**Proceso:**

1. **Crear base de datos vacía en SQL Server:**
   ```sql
   CREATE DATABASE [nombre_base_datos];
   GO
   ```

2. **Configurar variables de entorno:**
   ```bash
   # .env
   DB_HOST=servidor.ejemplo.com
   DB_PORT=1433
   DB_NAME=nombre_base_datos
   DB_USER=usuario
   DB_PASSWORD=contraseña
   ```

3. **Iniciar la aplicación normalmente:**
   ```bash
   npm start
   ```

4. **El sistema automáticamente:**
   - Detecta que faltan tablas
   - Crea todas las tablas requeridas
   - Ejecuta migraciones pendientes
   - Valida el esquema final

**Salida esperada:**
```
╔════════════════════════════════════════════════════════════════╗
║              DATABASE INITIALIZATION SERVICE                   ║
╠════════════════════════════════════════════════════════════════╣

🏗️  Verificando tablas requeridas...

   ⚠️  Base de datos nueva detectada: 8 tabla(s) faltante(s)
   📋 Tablas a crear: companies, roles, rules, users, user_roles, assignments, rule_roles, configurations

   🚀 Creando estructura completa de base de datos...

   ✅ 8 tabla(s) creada(s) exitosamente

─────────────────────────────────────────────────────────────────
📦 Verificando migraciones...

   ✅ No hay migraciones pendientes

─────────────────────────────────────────────────────────────────
🔍 Validando esquema (Modelo vs BD)...

   ✅ 8/8 modelos sincronizados

═════════════════════════════════════════════════════════════════
✅ INICIALIZACIÓN COMPLETA - Todo sincronizado
═════════════════════════════════════════════════════════════════
```

---

## Opción 2: Deployment Manual

### Para Producción o Control Total

**Ventajas:**
- ✅ Control total del proceso
- ✅ Revisión manual de cambios
- ✅ Ideal para producción con políticas estrictas

**Proceso:**

### Paso 1: Generar Archivo SQL

Ejecutar desde el proyecto:

```bash
node scripts/generate-schema.js --output ./deployment/initial_schema.sql
```

Esto genera un archivo SQL completo con todas las tablas.

### Paso 2: Revisar el Archivo Generado

El archivo incluirá:
- Todas las tablas con sus columnas
- Constraints (PK, FK, UNIQUE)
- Índices de performance
- Valores por defecto
- Validaciones IF NOT EXISTS (seguro para re-ejecutar)

### Paso 3: Ejecutar en SQL Server

**Opción A - SQL Server Management Studio (SSMS):**
1. Abrir SSMS
2. Conectar al servidor
3. Archivo → Abrir → `initial_schema.sql`
4. Ejecutar (F5)

**Opción B - Línea de comandos:**
```bash
sqlcmd -S servidor -d nombre_bd -U usuario -P contraseña -i initial_schema.sql
```

**Opción C - Azure Data Studio:**
1. Abrir Azure Data Studio
2. Conectar a la base de datos
3. Cargar y ejecutar `initial_schema.sql`

### Paso 4: Verificar Creación

```sql
-- Listar todas las tablas
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

-- Debe mostrar:
-- assignments
-- companies
-- configurations
-- logs
-- roles
-- rule_roles
-- rules
-- user_roles
-- users
```

### Paso 5: Iniciar Aplicación

```bash
npm start
```

La aplicación detectará las tablas existentes y solo ejecutará migraciones pendientes.

---

## Verificación Post-Deployment

### 1. Verificar Estado con Script

```bash
node scripts/migrate.js status
```

**Salida esperada:**
```
Current migration status:
  Executed: 3
  Pending: 0

All migrations are up to date!
```

### 2. Verificar Manualmente en BD

```sql
-- Verificar tabla de migraciones
SELECT * FROM _migrations ORDER BY executed_at DESC;

-- Verificar conteo de tablas
SELECT COUNT(*) as TotalTablas
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';
-- Debe ser: 9 (8 del modelo + 1 tabla _migrations)

-- Verificar constraints FK
SELECT
    fk.name AS FK_Name,
    OBJECT_NAME(fk.parent_object_id) AS TableName,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ColumnName,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable
FROM sys.foreign_keys AS fk
INNER JOIN sys.foreign_key_columns AS fkc
    ON fk.object_id = fkc.constraint_object_id
ORDER BY TableName;
```

### 3. Verificar Validación de Esquema

Al iniciar la aplicación, revisar logs:

```
🔍 Validating schema (Model vs DB)...

╔════════════════════════════════════════════════════════════════╗
║                    SCHEMA VALIDATION REPORT                    ║
╠════════════════════════════════════════════════════════════════╣
║ ✅ Company: sincronizado
║ ✅ Role: sincronizado
║ ✅ Rule: sincronizado
║ ✅ User: sincronizado
║ ✅ UserRole: sincronizado
║ ✅ Assignment: sincronizado
║ ✅ Configuration: sincronizado
║ ✅ RuleRole: sincronizado
╠════════════════════════════════════════════════════════════════╣
║ 📊 Resumen: 8/8 modelos sincronizados
╚════════════════════════════════════════════════════════════════╝
```

---

## Troubleshooting

### Error: "Todas las tablas faltan pero la creación falla"

**Causa:** Permisos insuficientes en BD

**Solución:**
```sql
-- Verificar permisos del usuario
USE [nombre_base_datos];
GO

-- Otorgar permisos necesarios
GRANT CREATE TABLE TO [usuario];
GRANT ALTER TO [usuario];
GRANT REFERENCES TO [usuario];
GO
```

### Error: "processingTimeMs is not defined"

**Causa:** Bug conocido en línea 477 de `AssignmentQueueService.js`

**Solución temporal:**
```javascript
// Línea 477 - cambiar:
processingTimeMs,
// Por:
processingTimeMs: processingTime,
```

**Solución permanente:** Esperar fix en próximo commit

### Error: "Minimum amount is required for COMPANY-AMOUNT type rules"

**Causa:** Reglas en BD sin valores requeridos

**Solución:**
```sql
-- Opción 1: Agregar valores faltantes
UPDATE rules
SET minimum_amount = 0, maximum_amount = 999999999
WHERE type = 'COMPANY-AMOUNT'
  AND (minimum_amount IS NULL OR maximum_amount IS NULL);

-- Opción 2: Cambiar tipo de regla
UPDATE rules
SET type = 'AMOUNT'
WHERE type = 'COMPANY-AMOUNT'
  AND (minimum_amount IS NULL OR maximum_amount IS NULL);

-- Opción 3: Desactivar reglas problemáticas
UPDATE rules
SET is_active = 0
WHERE type = 'COMPANY-AMOUNT'
  AND (minimum_amount IS NULL OR maximum_amount IS NULL);
```

### Advertencia: "Migraciones modificadas detectadas"

**Causa:** Archivos de migración fueron editados después de ejecutarse

**Impacto:**
- ⚠️ No afecta funcionamiento actual
- ⚠️ Puede causar inconsistencias en nuevos ambientes

**Solución:**
1. **NO** modificar migraciones ya ejecutadas
2. Crear nueva migración para cambios adicionales
3. Para ambientes nuevos, regenerar `initial_schema.sql`

---

## Flujo Recomendado por Ambiente

### 🟢 Desarrollo Local
```bash
1. Crear BD vacía
2. npm start (creación automática)
3. Trabajar normalmente
```

### 🟡 QA/Staging
```bash
1. Crear BD vacía
2. npm start (creación automática)
3. Ejecutar seeds si es necesario
4. Validar migraciones
```

### 🔴 Producción
```bash
1. Crear BD vacía
2. node scripts/generate-schema.js
3. Revisar SQL generado manualmente
4. Ejecutar SQL en horario de mantenimiento
5. Verificar con: node scripts/migrate.js status
6. npm start (solo validación, sin creación)
7. Monitorear logs de inicio
```

---

## Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| **Generar Esquema** | `node scripts/generate-schema.js` | Genera archivo SQL completo |
| **Inicializar BD** | `node scripts/init-database.js` | Crea tablas automáticamente |
| **Estado Migraciones** | `node scripts/migrate.js status` | Muestra migraciones ejecutadas/pendientes |
| **Ejecutar Migraciones** | `node scripts/migrate.js up` | Ejecuta migraciones pendientes |

---

## Estructura de Archivos

```
back-asignaciones/
├── scripts/
│   ├── generate-schema.js       # Generador de SQL
│   ├── init-database.js         # Inicializador automático
│   └── migrate.js               # Gestor de migraciones
│
├── src/infrastructure/database/
│   ├── migrations/              # Migraciones versionadas
│   │   ├── 000_create_migrations_table.sql
│   │   ├── 001_reestructuracion_modelo_datos.sql
│   │   ├── 002_create_configurations_table.sql
│   │   └── 003_add_code_field_to_rules.sql
│   │
│   └── services/
│       ├── DatabaseInitService.js      # Orquestador principal
│       ├── TableGeneratorService.js    # Creación automática
│       ├── MigrationService.js         # Gestor migraciones
│       └── SchemaValidatorService.js   # Validador esquemas
│
└── docs/
    └── DEPLOYMENT_DATABASE.md   # Esta guía
```

---

## Soporte

Para problemas no cubiertos en esta guía:

1. Revisar logs de aplicación en `logs/`
2. Ejecutar validación: `node scripts/migrate.js status`
3. Verificar permisos de usuario en SQL Server
4. Consultar con equipo de DevOps si es ambiente productivo
