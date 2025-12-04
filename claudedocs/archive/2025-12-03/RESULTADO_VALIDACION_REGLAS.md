# Resultado de Validación de Reglas - Source/Target

**Fecha**: 2025-12-03
**Test ejecutado**: `tests/manual/test-rule-prioritization.js`

---

## 🔍 Hallazgos

### 1. Arquitectura Source/Target - ✅ CORREGIDA

La corrección realizada en `BusinessRuleProcessorUseCases.js` está funcionando correctamente:

```javascript
// ✅ Ahora consulta reglas desde Source (901002487)
const sourceCompany = await this.findCompanyByDocumentNumber(claim.source);
const companyRules = await this.ruleRepository.findByCompany(sourceCompany.id);
```

**Query ejecutado**:
```sql
SELECT * FROM [rules] WHERE [company_id] = 7  -- ID de empresa 901002487 (CTIC)
```

### 2. Problema Detectado - ❌ NO HAY REGLAS CONFIGURADAS

**Empresa Source**: 901002487 (CTIC)
**Total de reglas configuradas**: **0**

El mensaje de prueba del usuario espera que existan las siguientes reglas configuradas para la empresa 901002487:

1. **Regla COMPANY-CODE**:
   - Tipo: `COMPANY-CODE`
   - NIT asociado: `860037950` (Target)
   - Código: `abc123`
   - Prioridad esperada: 2 (alta especificidad)

2. **Regla CODE**:
   - Tipo: `CODE`
   - Código: `abc123`
   - Prioridad esperada: 6 (baja especificidad)

**Resultado actual**: Como no hay reglas, el sistema retorna correctamente:
```
"No se encontraron reglas activas para la empresa (Source)"
```

---

## 📋 Mensaje de Prueba del Usuario

```json
{
  "ProcessId": "LOTE-20251003163406-EDEBBF84",
  "Source": "901002487",       // Empresa que DEBE TENER las reglas
  "Target": "860037950",        // Empresa destino a evaluar
  "DocumentNumber": "901002487_20253152",
  "InvoiceAmount": 0,
  "ExternalReference": "11",
  "ClaimId": "901002487_20253152_11_GLO_TA02",
  "ConceptApplicationCode": "GLO",
  "ObjectionCode": "abc123",    // Código que debe coincidir con reglas
  "Value": 1340
}
```

---

## ✅ Validación de Corrección

### Comportamiento Actual (Correcto)

1. **Consulta de reglas**: ✅ Busca en Source (901002487) en lugar de Target
2. **Logs estructurados**: ✅ Muestra claramente Source y Target
3. **Mensaje de respuesta**: ✅ Indica correctamente "No se encontraron reglas activas"

### Logs Generados

```
debug: Sequelize: Executing (default):
  SELECT * FROM [companies] WHERE [document_number] = N'901002487'

debug: Sequelize: Executing (default):
  SELECT * FROM [rules] WHERE [company_id] = 7
```

---

## 🎯 Próximos Pasos

Para validar completamente la priorización de reglas COMPANY-CODE vs CODE:

### Opción 1: Crear Reglas de Prueba Manualmente

Insertar en la base de datos las reglas necesarias para la empresa 901002487:

```sql
-- 1. Regla COMPANY-CODE (prioridad 2)
INSERT INTO rules (
  name,
  type,
  company_id,
  nit_associated_company,
  code,
  is_active,
  created_at,
  updated_at
) VALUES (
  'COMPANY-CODE Test Rule',
  'COMPANY-CODE',
  7,  -- ID de empresa 901002487
  '860037950',  -- Target company
  'abc123',
  1,
  GETDATE(),
  GETDATE()
);

-- 2. Regla CODE (prioridad 6)
INSERT INTO rules (
  name,
  type,
  company_id,
  code,
  is_active,
  created_at,
  updated_at
) VALUES (
  'CODE Test Rule',
  'CODE',
  7,  -- ID de empresa 901002487
  'abc123',
  1,
  GETDATE(),
  GETDATE()
);
```

### Opción 2: Usar Interfaz de Administración

Si existe una interfaz web o API para crear reglas:

1. Acceder a la administración de la empresa 901002487 (CTIC)
2. Crear regla tipo COMPANY-CODE:
   - NIT asociado: 860037950
   - Código: abc123
3. Crear regla tipo CODE:
   - Código: abc123
4. Asignar roles y usuarios a cada regla

### Opción 3: Verificar Reglas en Otra Empresa

Si hay otras empresas con reglas configuradas, podemos modificar el test para usar esa empresa:

```bash
# Consultar empresas con reglas
SELECT c.id, c.name, c.document_number, COUNT(r.id) as total_reglas
FROM companies c
LEFT JOIN rules r ON r.company_id = c.id
GROUP BY c.id, c.name, c.document_number
HAVING COUNT(r.id) > 0;
```

---

## 🧪 Re-ejecutar el Test

Una vez creadas las reglas necesarias, ejecutar nuevamente:

```bash
node tests/manual/test-rule-prioritization.js
```

**Resultado esperado**:
- ✅ Reglas evaluadas: 2
- ✅ Reglas aplicadas: 2
- ✅ Regla seleccionada: COMPANY-CODE (prioridad 2)
- ✅ Usuarios notificados: Solo usuarios de regla COMPANY-CODE

---

## 📊 Resumen

| Aspecto | Estado | Notas |
|---------|--------|-------|
| Corrección Source/Target | ✅ Implementada | Consulta correcta desde Source |
| Logs estructurados | ✅ Implementados | logger.debug() con JSON |
| Reglas en BD | ❌ Faltantes | Empresa 901002487 tiene 0 reglas |
| Test ejecutable | ⚠️ Parcial | Funciona pero sin datos de prueba |
| Validación completa | ⏳ Pendiente | Requiere reglas en BD |

---

## 💡 Conclusión

La implementación de la corrección Source/Target está **funcionando correctamente**. El sistema:

1. ✅ Consulta reglas desde la empresa Source (901002487)
2. ✅ Evalúa reglas contra empresa Target (860037950)
3. ✅ Genera logs estructurados indicando Source y Target claramente
4. ✅ Retorna mensaje apropiado cuando no hay reglas

**Acción requerida**: Configurar las reglas de prueba en la base de datos para validar la priorización COMPANY-CODE (2) > CODE (6).
