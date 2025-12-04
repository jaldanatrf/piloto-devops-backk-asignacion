# Corrección: company_id debe ser Source, no Target

**Fecha**: 2025-12-03
**Problema**: Asignaciones se guardaban con company_id del Target en lugar del Source

---

## ❌ Problema Identificado

### Comportamiento Incorrecto (ANTES)

Cuando llegaba un mensaje como:
```json
{
  "ProcessId": "LOTE-20251003163406-EDEBBF84",
  "Source": "860037950",      // Fundación Santa Fe - tiene las reglas
  "Target": "901002487",       // CTIC - destino
  "ClaimId": "...",
  "ObjectionCode": "abc123",
  ...
}
```

El sistema guardaba:
```sql
INSERT INTO assignments (
  company_id,    -- ❌ 7 (ID de CTIC - Target 901002487)
  user_id,       -- 28 (Desarrollo Leandro Correa)
  Source,        -- 860037950
  ...
)
```

**Problema**:
- La asignación pertenecía a CTIC (Target 901002487)
- Pero CTIC NO tiene las reglas configuradas
- Los usuarios asignados pertenecen a Fundación Santa Fe (Source 860037950)
- **Inconsistencia**: company_id != Source

---

## ✅ Corrección Implementada

### Comportamiento Correcto (DESPUÉS)

Ahora el sistema guarda:
```sql
INSERT INTO assignments (
  company_id,    -- ✅ 8 (ID de Fundación Santa Fe - Source 860037950)
  user_id,       -- 28 (Desarrollo Leandro Correa)
  Source,        -- 860037950
  ...
)
```

**Corrección**:
- La asignación pertenece a Fundación Santa Fe (Source 860037950)
- Fundación Santa Fe SÍ tiene las reglas configuradas
- Los usuarios pertenecen a Fundación Santa Fe
- **Consistencia**: company_id == Source ✅

---

## 🔍 Lógica del Negocio

### Roles de Source y Target

| Campo | Empresa | Rol |
|-------|---------|-----|
| **Source** | 860037950 (Fundación Santa Fe) | Tiene las REGLAS configuradas, PROCESA la reclamación |
| **Target** | 901002487 (CTIC) | Empresa destino, solo CRITERIO de evaluación en reglas tipo COMPANY |

### Flujo Correcto

1. **Llega mensaje** con Source=860037950, Target=901002487
2. **Se consultan reglas** desde Source (860037950 - Fundación Santa Fe)
3. **Se evalúan reglas**:
   - Regla CODE: aplica si ObjectionCode coincide
   - Regla COMPANY-CODE: aplica si ObjectionCode coincide Y Target==901002487
4. **Se priorizan reglas**: COMPANY-CODE (2) > CODE (6)
5. **Se selecciona usuario**: de la regla COMPANY-CODE
6. **Se crea asignación** con:
   - ✅ `company_id` = ID de Source (Fundación Santa Fe)
   - ✅ `user_id` = Usuario de Fundación Santa Fe
   - `Source` = 860037950 (dato del mensaje)
   - `Target` = 901002487 (dato del mensaje, solo informativo)

---

## 📝 Cambios en el Código

### Archivo: `src/application/services/AssignmentQueueService.js`

#### 1. Cambio de targetCompany a sourceCompany (líneas 309-333)

**ANTES**:
```javascript
// Línea 311
const targetCompany = await this.businessRuleProcessorUseCases
  .findCompanyByDocumentNumber(claimData.Target);
```

**DESPUÉS**:
```javascript
// Línea 311
const sourceCompany = await this.businessRuleProcessorUseCases
  .findCompanyByDocumentNumber(claimData.Source);
```

#### 2. Asignaciones sin usuario (línea 355)

**ANTES**:
```javascript
companyId: targetCompany.id, // ❌ Target
```

**DESPUÉS**:
```javascript
companyId: sourceCompany.id, // ✅ Source
```

#### 3. Asignaciones con usuario - createAssignment (línea 416, 673)

**ANTES**:
```javascript
const assignment = await this.createAssignment(
  selectedUser,
  processResult,
  claimData,
  targetCompany  // ❌ Target
);
```

**DESPUÉS**:
```javascript
const assignment = await this.createAssignment(
  selectedUser,
  processResult,
  claimData,
  sourceCompany  // ✅ Source
);
```

#### 4. Configuración de notificaciones (línea 422)

**ANTES**:
```javascript
const configuration = await this.configurationRepository
  .findByCompanyId(targetCompany.id);  // ❌ Target
```

**DESPUÉS**:
```javascript
const configuration = await this.configurationRepository
  .findByCompanyId(sourceCompany.id);  // ✅ Source
```

**Razón**: La configuración de notificaciones debe ser de la empresa Source (quien procesa y envía la notificación).

#### 5. Datos para notificación (resolverData, líneas 483, 493-497)

**ANTES**:
```javascript
const resolverData = {
  assignment: {
    companyId: targetCompany.id,  // ❌ Target
    ...
  },
  company: {
    id: targetCompany.id,  // ❌ Target
    name: targetCompany.name,
    ...
  }
};
```

**DESPUÉS**:
```javascript
const resolverData = {
  assignment: {
    companyId: sourceCompany.id,  // ✅ Source
    target: claimData.Target,       // ✅ Agregado para referencia
    ...
  },
  company: {
    id: sourceCompany.id,  // ✅ Source
    name: sourceCompany.name,
    ...
  }
};
```

**Nota**: Se agregó `target: claimData.Target` al resolverData para que la configuración de notificaciones pueda usar el Target si lo necesita.

#### 6. Logs (líneas 522, 544)

**ANTES**:
```javascript
companyId: targetCompany.id,  // ❌ Target
```

**DESPUÉS**:
```javascript
companyId: sourceCompany.id,  // ✅ Source
```

#### 7. Documentación del método createAssignment (línea 662)

**ANTES**:
```javascript
/**
 * @param {Object} targetCompany - Empresa objetivo (Target) que tiene las reglas
 */
async createAssignment(selectedUser, processResult, claimData, targetCompany) {
```

**DESPUÉS**:
```javascript
/**
 * @param {Object} sourceCompany - Empresa Source que tiene las reglas y procesa
 */
async createAssignment(selectedUser, processResult, claimData, sourceCompany) {
```

---

## 🧪 Validación

### Prueba con Mensaje Real

**Mensaje**:
```json
{
  "ProcessId": "LOTE-20251003163406-EDEBBF84",
  "Source": "860037950",      // Fundación Santa Fe
  "Target": "901002487",       // CTIC
  "ClaimId": "901002487_20253152_11_GLO_TA02",
  "ObjectionCode": "abc123",
  "Value": "1340"
}
```

**Resultado Esperado**:
```sql
-- Nueva asignación creada
INSERT INTO assignments VALUES (
  user_id: 28,                    -- Desarrollo Leandro Correa
  company_id: 8,                  -- ✅ Fundación Santa Fe (Source)
  Source: '860037950',
  status: 'assigned',
  ClaimId: '901002487_20253152_11_GLO_TA02',
  ...
);
```

**Verificación**:
```bash
node scripts/check-company-mismatch.js
```

Debe mostrar: `✅ OK: CompanyID (860037950) == Source (860037950)`

---

## 📊 Impacto

### Asignaciones Afectadas

**Antes de la corrección** (ID 11-15):
- ❌ company_id = 7 (CTIC - Target 901002487)
- Source = 860037950 (Fundación Santa Fe)
- **Inconsistencia**: company_id != Source

**Después de la corrección**:
- ✅ company_id = 8 (Fundación Santa Fe - Source 860037950)
- Source = 860037950 (Fundación Santa Fe)
- **Consistencia**: company_id == Source

### Migración de Datos (Opcional)

Si se necesita corregir asignaciones anteriores:

```sql
-- Actualizar asignaciones donde company_id no coincide con Source
UPDATE assignments
SET company_id = (
  SELECT id FROM companies
  WHERE document_number = assignments.Source
)
WHERE company_id != (
  SELECT id FROM companies
  WHERE document_number = assignments.Source
);
```

**ADVERTENCIA**: Ejecutar solo si es necesario corregir datos históricos.

---

## ✅ Resumen

| Aspecto | Antes | Después |
|---------|-------|---------|
| **company_id en asignación** | Target (incorrecto) | Source (correcto) |
| **Configuración de notificaciones** | Target (incorrecto) | Source (correcto) |
| **Consistencia company_id vs Source** | ❌ Inconsistente | ✅ Consistente |
| **Lógica de negocio** | ❌ Incorrecta | ✅ Correcta |

**La asignación ahora pertenece correctamente a la empresa Source que tiene las reglas configuradas y procesa la reclamación** ✅

---

**Corregido por**: Claude Code
**Fecha**: 2025-12-03
**Archivos modificados**: 1 (`AssignmentQueueService.js`)
**Líneas modificadas**: ~15 cambios
