# 🚀 Instrucciones para Deployment en Nuevos Ambientes

## ✅ Problema Resuelto

**Confirmado**: El sistema **NO tenía creación automática de tablas**.

**Solución implementada**: Sistema completo de generación y creación automática de esquemas.

---

## 📦 Opción 1: Creación Automática (RECOMENDADO)

### Para desarrollo, QA, staging

```bash
# 1. Crear base de datos vacía en SQL Server
# 2. Configurar .env con credenciales
# 3. Iniciar aplicación
npm start
```

**El sistema automáticamente:**
- ✅ Detecta tablas faltantes
- ✅ Crea todas las tablas requeridas
- ✅ Ejecuta migraciones pendientes
- ✅ Valida sincronización

---

## 📝 Opción 2: Deployment Manual

### Para producción o control total

#### Paso 1: Generar esquema SQL

```bash
npm run db:schema
# O con ruta personalizada:
npm run db:schema:output ./deployment/schema.sql
```

#### Paso 2: Limpiar BD existente (si aplica)

**⚠️ ADVERTENCIA:** Esto eliminará todos los datos

```bash
# Ejecutar en SQL Server Management Studio:
# C:\Users\jaldana\Documents\sites\back-asignaciones\scripts\cleanup-and-regenerate.sql
```

#### Paso 3: Ejecutar esquema generado

El archivo `SCHEMA_FINAL.sql` ya fue generado y corregido. Puedes ejecutarlo:

**Opción A - SSMS:**
1. Abrir SQL Server Management Studio
2. Cargar archivo `SCHEMA_FINAL.sql`
3. Ejecutar (F5)

**Opción B - Línea de comandos:**
```bash
sqlcmd -S servidor -d nombre_bd -U usuario -P password -i SCHEMA_FINAL.sql
```

#### Paso 4: Verificar

```bash
npm run migrate:status
```

Debe mostrar:
```
Current migration status:
  Executed: 3
  Pending: 0

All migrations are up to date!
```

---

## 🔧 Errores Corregidos

### Error 1: Sintaxis incorrecta FK
**Antes:**
```sql
CONSTRAINT FK_name FOREIGN KEY (col) REFERENCES table(id) ON DELETE ACTION ON UPDATE ACTION
```

**Después:**
```sql
ALTER TABLE table_name
ADD CONSTRAINT FK_name
FOREIGN KEY (col) REFERENCES ref_table(id);
```

### Error 2: Columnas duplicadas
**Antes:** `company_id INT NOT NULL, company_id INT NULL`

**Después:** Se detectan y eliminan columnas duplicadas automáticamente

### Error 3: FK duplicadas
**Antes:** Se intentaba crear la misma FK múltiples veces

**Después:** Se filtran FK con el mismo nombre

### Error 4: NOW no válido
**Antes:** `DEFAULT NOW`

**Después:** `DEFAULT GETDATE()`

---

## 📊 Verificación Post-Deployment

### Verificar tablas creadas

```sql
SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
```

**Debe mostrar (9 tablas):**
- _migrations
- assignments
- companies
- configurations
- roles
- rule_roles
- rules
- user_roles
- users

### Verificar FK creadas

```sql
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

---

## 🆕 Comandos NPM Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run db:init` | Inicializa BD nueva automáticamente |
| `npm run db:schema` | Genera `initial_schema.sql` |
| `npm run db:schema:output <path>` | Genera SQL en ruta específica |
| `npm run migrate:status` | Muestra estado de migraciones |
| `npm run migrate` | Ejecuta migraciones pendientes |

---

## 📁 Archivos Importantes

### Scripts
- `scripts/init-database.js` - Inicialización automática
- `scripts/generate-schema.js` - Generador de SQL
- `scripts/cleanup-and-regenerate.sql` - Limpieza de BD

### SQL Generados
- `SCHEMA_FINAL.sql` - ✅ **Esquema corregido y listo para usar**
- `fixed_schema_v2.sql` - Versión anterior (no usar)

### Servicios
- `TableGeneratorService.js` - Generador de DDL
- `DatabaseInitService.js` - Orquestador de inicialización
- `MigrationService.js` - Gestor de migraciones

---

## 🎯 Próximos Pasos

### Para tu BD actual (con tablas parciales):

1. **Opción A - Limpiar y regenerar:**
   ```bash
   # 1. Ejecutar cleanup-and-regenerate.sql en SSMS
   # 2. Ejecutar SCHEMA_FINAL.sql
   # 3. npm start
   ```

2. **Opción B - Usar inicialización automática:**
   ```bash
   # El sistema detectará tablas faltantes y las creará
   npm start
   ```

### Para nuevos ambientes:

```bash
# Simplemente iniciar la aplicación
npm start
```

---

## 🐛 Troubleshooting

### Error: "tabla ya existe"
El script es idempotente - es seguro ejecutarlo múltiples veces.

### Error: "FK ya existe"
El script verifica existencia antes de crear.

### Advertencia: "Migraciones modificadas"
Normal si archivos de migración fueron editados. No afecta funcionamiento.

---

## ✅ Checklist Final

- [ ] Base de datos creada
- [ ] Archivo `.env` configurado
- [ ] `SCHEMA_FINAL.sql` ejecutado O `npm start` corrido
- [ ] `npm run migrate:status` muestra "All migrations are up to date"
- [ ] 9 tablas existentes en BD
- [ ] Foreign Keys creadas correctamente
- [ ] Aplicación inicia sin errores

---

## 📞 Soporte

Para más detalles, consultar:
- `docs/DEPLOYMENT_DATABASE.md` - Guía completa de deployment
- Logs de aplicación en `logs/`
- Estado de migraciones: `npm run migrate:status`
