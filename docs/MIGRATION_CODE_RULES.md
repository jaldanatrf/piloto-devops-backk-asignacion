# Migración - Reglas con Campo Code

## Descripción

Esta migración agrega soporte para nuevos tipos de reglas basadas en el campo `ObjectionCode` del mensaje de cola. Permite configurar reglas más específicas combinando código de objeción con montos y NITs.

## Cambios en Base de Datos

### Campo Agregado
- **Tabla**: `rules`
- **Campo**: `code` VARCHAR(100) NULL
- **Descripción**: Almacena el código de objeción que se evaluará contra el campo `ObjectionCode` del mensaje

### Índices Creados
1. `IX_rules_code` - Búsquedas por código
2. `IX_rules_company_code` - Búsquedas por empresa y código (validación de duplicados)
3. `IX_rules_company_type` - Búsquedas por empresa y tipo (optimización de queries)

## Nuevos Tipos de Reglas

### Jerarquía de Especificidad (1 = más específica)

| Nivel | Tipo | Criterios | Campos Requeridos |
|-------|------|-----------|-------------------|
| 1 | `CODE-AMOUNT-COMPANY` | Code + Monto + NIT | `code`, `minimumAmount`, `maximumAmount`, `nitAssociatedCompany` |
| 2 | `COMPANY-CODE` | NIT + Code | `nitAssociatedCompany`, `code` |
| 3 | `CODE-AMOUNT` | Code + Monto | `code`, `minimumAmount`, `maximumAmount` |
| 4 | `COMPANY-AMOUNT` *(existente)* | NIT + Monto | `nitAssociatedCompany`, `minimumAmount`, `maximumAmount` |
| 5 | `COMPANY` *(existente)* | Solo NIT | `nitAssociatedCompany` |
| 6 | `CODE` | Solo Code | `code` |
| 7 | `AMOUNT` *(existente)* | Solo Monto | `minimumAmount`, `maximumAmount` |
| 8 | `CUSTOM` *(existente)* | Sin criterios | - |

### Evaluación del Campo Code
- **Coincidencia exacta**: Case-sensitive, sin normalización
- **Null handling**: Un claim con `objectionCode: null` no coincide con ninguna regla CODE
- **Formato**: Sin restricciones, acepta cualquier string hasta 100 caracteres

### Ejemplos de Evaluación

```javascript
// Regla configurada
{ type: 'CODE', code: 'OBJ-001' }

// Claims
{ objectionCode: 'OBJ-001' }    // ✓ Aplica
{ objectionCode: 'obj-001' }    // ✗ No aplica (case-sensitive)
{ objectionCode: 'OBJ-001-A' }  // ✗ No aplica (coincidencia exacta)
{ objectionCode: null }         // ✗ No aplica
```

## Ejecución de la Migración

### Opción 1: Script Node.js (Recomendado)

```bash
# Desarrollo local
npm run migrate:code-rules

# Con variables de entorno específicas
env-cmd -f .env.dev node scripts/run-code-migration.js
env-cmd -f .env.pre node scripts/run-code-migration.js
```

### Opción 2: SQL Directo

```bash
# Ejecutar archivo SQL directamente en SQL Server
# Ubicación: src/infrastructure/database/migrations/add_code_field_to_rules.sql
```

### Validación Post-Migración

El script automáticamente valida:
- ✅ Campo `code` creado correctamente
- ✅ Índices creados
- ✅ Estructura final de tabla `rules`

Salida esperada:
```
✅ Campo code verificado:
   - Tipo: varchar
   - Longitud: 100
   - Nullable: YES

✅ Índices creados:
   - IX_rules_code: code
   - IX_rules_company_code: company_id, code
   - IX_rules_company_type: company_id, type
```

## Retrocompatibilidad

### ✅ Reglas Existentes
- Las reglas `AMOUNT`, `COMPANY`, `COMPANY-AMOUNT`, `CUSTOM` continúan funcionando sin cambios
- No requieren migración de datos
- El campo `code` será NULL para reglas existentes

### ✅ Mensajes de Cola
- Mensajes sin `ObjectionCode` siguen procesándose correctamente
- Las reglas CODE-* simplemente no aplicarán para estos mensajes
- Las reglas existentes evaluarán normalmente

### ✅ APIs
- Endpoints existentes son completamente retrocompatibles
- El campo `code` es opcional en creación/actualización
- Respuestas incluyen `code: null` para reglas sin código

## Validaciones de Negocio

### CODE
- **Validación**: No duplicados de `code` en la misma empresa
- **Error**: `"A CODE rule with code 'XXX' already exists for this company"`

### CODE-AMOUNT
- **Validación**: No solapamiento de rangos con mismo `code` en la misma empresa
- **Error**: `"CODE-AMOUNT rule overlaps with existing rule 'RuleName' for code 'XXX' in range [min-max]"`

### COMPANY-CODE
- **Validación**: No duplicados de `nitAssociatedCompany` + `code` en la misma empresa
- **Error**: `"A COMPANY-CODE rule with NIT 'XXX' and code 'YYY' already exists"`

### CODE-AMOUNT-COMPANY
- **Validación**: No solapamiento de rangos con mismo `code` y `nitAssociatedCompany`
- **Error**: `"CODE-AMOUNT-COMPANY rule overlaps with existing rule 'RuleName' for code 'XXX' and NIT 'YYY' in range [min-max]"`

## Lógica de Priorización

### Regla de Aplicación
**Solo se aplican usuarios de la regla MÁS ESPECÍFICA que coincida**

### Ejemplo de Escenario

Reglas configuradas:
```javascript
1. CODE-AMOUNT-COMPANY: code='OBJ-001', amount=[1M-5M], NIT='800000513' → 5 usuarios
2. COMPANY-CODE: NIT='800000513', code='OBJ-001' → 3 usuarios
3. CODE-AMOUNT: code='OBJ-001', amount=[1M-5M] → 8 usuarios
4. CODE: code='OBJ-001' → 10 usuarios
```

Mensaje recibido:
```json
{
  "ObjectionCode": "OBJ-001",
  "InvoiceAmount": "2500000",
  "Source": "800000513"
}
```

**Resultado**: Solo se notifican los **5 usuarios** de la regla `CODE-AMOUNT-COMPANY` (nivel 1, más específica).

Las demás reglas se ignoran completamente, incluso si tienen más usuarios.

## Estructura del Mensaje de Cola

Campo nuevo utilizado:
```json
{
  "Target": "900123456",           // NIT empresa con reglas
  "Source": "800000513",           // NIT evaluado contra reglas
  "ObjectionCode": "OBJ-001",      // 🆕 Campo evaluado por reglas CODE
  "InvoiceAmount": "2500000",
  "ClaimId": "CLAIM-123",
  ...
}
```

## Testing

### Ejecutar Suite Completa
```bash
npm run test:auto-assignments
```

### Verificar Configuración
```bash
npm run check:auto-assignment-setup
```

### Tests Específicos de Code Rules
```bash
# Una vez implementados los tests
npm test -- --grep "Code Rule"
```

## Rollback

Si necesitas revertir la migración:

```sql
-- 1. Eliminar índices
DROP INDEX IF EXISTS IX_rules_code ON rules;
DROP INDEX IF EXISTS IX_rules_company_code ON rules;
DROP INDEX IF EXISTS IX_rules_company_type ON rules;

-- 2. Eliminar columna code
ALTER TABLE rules DROP COLUMN code;

-- 3. Revertir enum de type en modelo Sequelize
-- Editar: src/infrastructure/database/models/index.js
-- Remover: 'CODE', 'CODE-AMOUNT', 'COMPANY-CODE', 'CODE-AMOUNT-COMPANY'
```

⚠️ **Precaución**: Solo ejecutar rollback si NO hay reglas CODE-* en producción.

## Próximos Pasos

Después de ejecutar la migración:

1. ✅ **FASE 2**: Actualizar entidad de dominio `Rule.js`
2. ✅ **FASE 3**: Implementar validaciones de negocio
3. ✅ **FASE 4**: Extender procesador de reglas
4. ✅ **FASE 5**: Actualizar sistema de priorización
5. ✅ **FASE 6**: Actualizar casos de uso
6. ✅ **FASE 7**: Crear suite de tests
7. ✅ **FASE 8**: Actualizar documentación de APIs

## Soporte

Para más información, consultar:
- `docs/AUTO_ASSIGNMENT_SERVICE.md` - Documentación completa del servicio
- `README-AUTO-ASSIGNMENTS.md` - Guía de inicio rápido
- `scripts/run-code-migration.js` - Código de migración
- `src/infrastructure/database/migrations/add_code_field_to_rules.sql` - Script SQL

---

**Fecha de migración**: 2025-11-14
**Versión**: 2.0 - Soporte para reglas con ObjectionCode
