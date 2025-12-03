# Corrección de Priorización de Reglas

## 📋 Problema Identificado

El usuario reportó que al enviar un mensaje por cola, el sistema aplicaba la regla **CODE** en lugar de **COMPANY-CODE**, pese a que ambas reglas coincidían con el mensaje.

### Mensaje de Prueba
```json
{
  "ProcessId": "LOTE-20251003163406-EDEBBF84",
  "Source": "901002487",
  "Target": "860037950",
  "DocumentNumber": "901002487_20253152",
  "InvoiceAmount": "0",
  "ExternalReference": "11",
  "ClaimId": "901002487_20253152_11_GLO_TA02",
  "ConceptApplicationCode": "GLO",
  "ObjectionCode": "abc123",
  "Value": "1340"
}
```

### Reglas Esperadas
- **COMPANY-CODE**: NIT 860037950 + código abc123 → Prioridad 2 (más específica)
- **CODE**: código abc123 → Prioridad 6 (menos específica)

**Resultado esperado**: Solo usuarios de COMPANY-CODE deben ser notificados.

---

## 🔧 Correcciones Realizadas

### 1. **Corrección Fundamental: Source vs Target**

**Problema**: El código asumía que `Target` tenía las reglas configuradas.

**Realidad**: `Source` es la empresa que TIENE las reglas configuradas.

#### Cambios en BusinessRuleProcessorUseCases.js

**ANTES:**
```javascript
// 2. Buscar empresa objetivo (Target) - Esta es la empresa que tiene las reglas configuradas
const targetCompany = await this.findCompanyByDocumentNumber(claim.target);

// 3. Obtener reglas activas de la empresa OBJETIVO (Target)
const companyRules = await this.ruleRepository.findByCompany(targetCompany.id);
```

**DESPUÉS:**
```javascript
// 2. Buscar empresa que tiene las reglas (Source) - Esta es la empresa que tiene las reglas configuradas
const sourceCompany = await this.findCompanyByDocumentNumber(claim.source);

// 3. Obtener reglas activas de la empresa SOURCE (quien tiene las reglas)
const companyRules = await this.ruleRepository.findByCompany(sourceCompany.id);
```

### 2. **Corrección de Evaluación de Reglas**

Las reglas tipo COMPANY ahora evalúan contra `Target` (el destino), no contra `Source`.

#### Cambios en evaluateRule()

**ANTES:**
```javascript
case 'COMPANY':
  applies = claim.matchesSourceCompany(rule.nitAssociatedCompany);
  reason = `Empresa fuente (source) ${claim.source} coincide...`;
  break;

case 'COMPANY-CODE':
  const companyMatchesCC = claim.matchesSourceCompany(rule.nitAssociatedCompany);
  const codeMatchesCC = claim.matchesObjectionCode(rule.code);
  applies = companyMatchesCC && codeMatchesCC;
  break;
```

**DESPUÉS:**
```javascript
case 'COMPANY':
  applies = claim.matchesTargetCompany(rule.nitAssociatedCompany);
  reason = `Empresa destino (target) ${claim.target} coincide...`;
  break;

case 'COMPANY-CODE':
  const companyMatchesCC = claim.matchesTargetCompany(rule.nitAssociatedCompany);
  const codeMatchesCC = claim.matchesObjectionCode(rule.code);
  applies = companyMatchesCC && codeMatchesCC;
  break;
```

### 3. **Actualización de Comentarios en Claim.js**

**ANTES:**
```javascript
this.target = data.Target; // NIT de la empresa objetivo (quien procesa/tiene reglas)
this.source = data.Source; // NIT de la empresa fuente (quien se configura en asignación)
```

**DESPUÉS:**
```javascript
this.target = data.Target; // NIT de la empresa destino/objetivo de la reclamación
this.source = data.Source; // NIT de la empresa que TIENE las reglas configuradas
```

### 4. **Logs Mejorados para Debugging**

Se agregaron logs detallados para facilitar el debugging:

```javascript
console.log(`\n📋 Resultado del procesamiento de reclamación:`);
console.log(`   📊 Empresa con reglas (Source): ${sourceCompany.name} (${sourceCompany.documentNumber})`);
console.log(`   📊 Empresa destino (Target): ${claim.target}`);
console.log(`   📝 Claim ID: ${claim.claimId || 'N/A'}`);
console.log(`   📝 ObjectionCode: ${claim.objectionCode || 'N/A'}`);
console.log(`   🔍 Reglas evaluadas: ${activeRules.length} | Aplicadas: ${appliedRules.length}`);

if (appliedRules.length > 0) {
  console.log(`   ✅ Reglas que aplicaron (ANTES de priorización):`);
  appliedRules.forEach(rule => {
    console.log(`      - ${rule.rule.name} (${rule.rule.type}) - NIT: ${rule.rule.nitAssociatedCompany || 'N/A'} - Code: ${rule.rule.code || 'N/A'}`);
  });
}

// Log de priorización
console.log(`\n   🔄 Priorización de reglas:`);
console.log(`      Total reglas aplicadas: ${appliedRules.length}`);
console.log(`      Nivel de especificidad más alto: ${highestSpecificity}`);
console.log(`      Reglas más específicas (${mostSpecificRules.length}):`);
mostSpecificRules.forEach(r => {
  console.log(`         - ${r.rule.name} (${r.specificityName}) - Especificidad: ${r.specificity}`);
});
```

---

## 📊 Arquitectura Actualizada

### Flujo Correcto

```
┌─────────────────────────────────────────────────────────┐
│  Mensaje de Cola                                        │
│  {                                                      │
│    Source: "901002487"  ← Empresa con reglas          │
│    Target: "860037950"  ← Empresa destino             │
│    ObjectionCode: "abc123"                             │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  1. Buscar reglas en Source (901002487)                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  2. Evaluar reglas                                      │
│                                                         │
│  Regla COMPANY-CODE:                                   │
│    ✓ NIT: 860037950 == Target ✅                      │
│    ✓ Code: abc123 == ObjectionCode ✅                 │
│    → Aplica (Prioridad 2)                             │
│                                                         │
│  Regla CODE:                                           │
│    ✓ Code: abc123 == ObjectionCode ✅                 │
│    → Aplica (Prioridad 6)                             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  3. Priorizar reglas (menor número = más específica)   │
│                                                         │
│  Especificidad 2: COMPANY-CODE ✅ (SELECCIONADA)      │
│  Especificidad 6: CODE (DESCARTADA)                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  4. Obtener usuarios SOLO de COMPANY-CODE              │
└─────────────────────────────────────────────────────────┘
```

### Jerarquía de Especificidad (Confirmada)

```
1. CODE-AMOUNT-COMPANY    (3 criterios: código + monto + NIT)
2. COMPANY-CODE           (2 criterios: NIT + código)      ← MÁS ESPECÍFICA para tu caso
3. CODE-AMOUNT            (2 criterios: código + monto)
4. COMPANY-AMOUNT         (2 criterios: NIT + monto)
5. COMPANY                (1 criterio: NIT)
6. CODE                   (1 criterio: código)             ← MENOS ESPECÍFICA
7. AMOUNT                 (1 criterio: monto)
8. CUSTOM                 (0 criterios: aplicación general)
```

---

## 🧪 Script de Prueba

Se creó un script de prueba completo en:
```
tests/manual/test-rule-prioritization.js
```

### Uso:
```bash
node tests/manual/test-rule-prioritization.js
```

### Validaciones del Script:
1. ✅ Se buscan reglas en empresa Source (901002487)
2. ✅ Regla COMPANY-CODE aplica correctamente contra Target (860037950)
3. ✅ Regla CODE aplica correctamente
4. ✅ Priorización selecciona solo COMPANY-CODE
5. ✅ Usuarios notificados pertenecen solo a COMPANY-CODE

---

## 📝 Resumen de Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `BusinessRuleProcessorUseCases.js` | - Buscar reglas en Source en lugar de Target<br>- Evaluar reglas COMPANY contra Target<br>- Logs mejorados de priorización |
| `Claim.js` | - Actualizar comentarios Source/Target<br>- Marcar matchesSourceCompany como deprecated<br>- Actualizar documentación de matchesTargetCompany |
| `test-rule-prioritization.js` | - Script completo de prueba<br>- Validación de priorización |

---

## ✅ Resultado Esperado

Con estas correcciones, cuando envíes el mensaje:

```json
{
  "Source": "901002487",
  "Target": "860037950",
  "ObjectionCode": "abc123"
}
```

El sistema debe:
1. ✅ Buscar reglas en la empresa **901002487** (Source)
2. ✅ Evaluar COMPANY-CODE contra **860037950** (Target)
3. ✅ Aplicar ambas reglas (CODE y COMPANY-CODE)
4. ✅ **Seleccionar SOLO usuarios de COMPANY-CODE** (prioridad 2)
5. ✅ Mostrar logs claros de la priorización

---

## 🚀 Próximos Pasos

1. **Ejecutar script de prueba**:
   ```bash
   node tests/manual/test-rule-prioritization.js
   ```

2. **Verificar logs** al procesar un mensaje real por cola

3. **Confirmar** que solo usuarios de COMPANY-CODE son notificados

4. **Remover logs de debug** una vez validado (si es necesario)

---

**Fecha de corrección**: 2025-12-03
**Versión**: Feature/asignacionesv2
