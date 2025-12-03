# Frontend Integration Guide - CODE Rules Feature

## Overview

Esta guía describe cómo integrar la nueva funcionalidad de **reglas CODE** en el frontend. Los nuevos tipos de reglas permiten validar reclamaciones basándose en el campo `ObjectionCode` (código de objeción) además de los criterios existentes.

## Nuevos Tipos de Reglas

### Jerarquía de Especificidad (8 Niveles)

El sistema ahora soporta 8 tipos de reglas ordenados por especificidad (de más específica a menos específica):

| Nivel | Tipo | Criterios | Descripción |
|-------|------|-----------|-------------|
| 1 | `CODE-AMOUNT-COMPANY` | Código + Monto + NIT | Más específica - 3 criterios |
| 2 | `COMPANY-CODE` | NIT + Código | 2 criterios |
| 3 | `CODE-AMOUNT` | Código + Monto | 2 criterios |
| 4 | `COMPANY-AMOUNT` | NIT + Monto | 2 criterios (existente) |
| 5 | `COMPANY` | NIT | 1 criterio (existente) |
| 6 | `CODE` | Código | 1 criterio |
| 7 | `AMOUNT` | Monto | 1 criterio (existente) |
| 8 | `CUSTOM` | Ninguno | Menos específica (existente) |

**Importante:** El sistema solo asigna usuarios de la regla más específica que coincida. Si existen múltiples reglas al mismo nivel de especificidad, se combinan todos sus usuarios.

---

## API Changes

### 1. Modelo de Regla Actualizado

```typescript
interface Rule {
  id: number;
  name: string;               // Solo alfanuméricos, espacios, puntos, guiones y guiones bajos
  description: string;
  type: RuleType;
  minimumAmount?: number;     // Requerido para: AMOUNT, COMPANY-AMOUNT, CODE-AMOUNT, CODE-AMOUNT-COMPANY
  maximumAmount?: number;     // Requerido para: AMOUNT, COMPANY-AMOUNT, CODE-AMOUNT, CODE-AMOUNT-COMPANY
  nitAssociatedCompany?: string; // Requerido para: COMPANY, COMPANY-AMOUNT, COMPANY-CODE, CODE-AMOUNT-COMPANY
  code?: string;              // ⭐ NUEVO: Requerido para: CODE, CODE-AMOUNT, COMPANY-CODE, CODE-AMOUNT-COMPANY
  isActive: boolean;
  createdAt: string;
  companyId: number;
}

type RuleType =
  | 'AMOUNT'
  | 'COMPANY'
  | 'COMPANY-AMOUNT'
  | 'CODE'                    // ⭐ NUEVO
  | 'CODE-AMOUNT'             // ⭐ NUEVO
  | 'COMPANY-CODE'            // ⭐ NUEVO
  | 'CODE-AMOUNT-COMPANY'     // ⭐ NUEVO
  | 'CUSTOM';
```

### 2. Endpoints Actualizados

#### POST `/api/companies/:companyId/rules`

Crear nueva regla con soporte para campo `code`.

**Request Body Ejemplo - CODE Rule:**
```json
{
  "name": "Objecion OBJ-001",
  "description": "Regla para código de objeción OBJ-001",
  "type": "CODE",
  "code": "OBJ-001",
  "roleIds": [10, 20]
}
```

**Request Body Ejemplo - CODE-AMOUNT Rule:**
```json
{
  "name": "Codigo OBJ-001 Rango 1M-5M",
  "description": "Código OBJ-001 con montos entre 1M y 5M",
  "type": "CODE-AMOUNT",
  "code": "OBJ-001",
  "minimumAmount": 1000000,
  "maximumAmount": 5000000,
  "roleIds": [10, 20]
}
```

**Request Body Ejemplo - COMPANY-CODE Rule:**
```json
{
  "name": "Empresa 900000514 con Codigo OBJ-001",
  "description": "Empresa específica con código de objeción",
  "type": "COMPANY-CODE",
  "nitAssociatedCompany": "900000514",
  "code": "OBJ-001",
  "roleIds": [10]
}
```

**Request Body Ejemplo - CODE-AMOUNT-COMPANY Rule:**
```json
{
  "name": "Regla completa OBJ-001",
  "description": "Código + Monto + Empresa - Máxima especificidad",
  "type": "CODE-AMOUNT-COMPANY",
  "code": "OBJ-001",
  "minimumAmount": 1000000,
  "maximumAmount": 5000000,
  "nitAssociatedCompany": "900000514",
  "roleIds": [10, 20, 30]
}
```

#### PUT `/api/companies/:companyId/rules/:ruleId`

Actualizar regla existente. El campo `code` es opcional para reglas que no lo requieren.

**Response Example:**
```json
{
  "success": true,
  "message": "Rule updated successfully",
  "data": {
    "id": 1,
    "name": "Objecion OBJ-001",
    "description": "Regla para código de objeción OBJ-001",
    "type": "CODE",
    "code": "OBJ-001",
    "isActive": true,
    "companyId": 1,
    "createdAt": "2025-11-14T14:00:00.000Z"
  }
}
```

---

## Frontend Implementation Guide

### 1. Formulario de Creación/Edición de Reglas

#### Campos Dinámicos por Tipo

El formulario debe mostrar campos diferentes según el tipo de regla seleccionado:

```typescript
// Configuración de campos requeridos por tipo
const RULE_TYPE_CONFIG = {
  'AMOUNT': {
    fields: ['minimumAmount', 'maximumAmount'],
    description: 'Valida por rango de montos'
  },
  'COMPANY': {
    fields: ['nitAssociatedCompany'],
    description: 'Valida por empresa fuente (NIT)'
  },
  'COMPANY-AMOUNT': {
    fields: ['nitAssociatedCompany', 'minimumAmount', 'maximumAmount'],
    description: 'Valida por empresa y rango de montos'
  },
  'CODE': {
    fields: ['code'],
    description: 'Valida por código de objeción'
  },
  'CODE-AMOUNT': {
    fields: ['code', 'minimumAmount', 'maximumAmount'],
    description: 'Valida por código y rango de montos'
  },
  'COMPANY-CODE': {
    fields: ['nitAssociatedCompany', 'code'],
    description: 'Valida por empresa y código de objeción'
  },
  'CODE-AMOUNT-COMPANY': {
    fields: ['code', 'minimumAmount', 'maximumAmount', 'nitAssociatedCompany'],
    description: 'Máxima especificidad - Valida por código, monto y empresa'
  },
  'CUSTOM': {
    fields: [],
    description: 'Regla personalizada sin validaciones automáticas'
  }
};
```

#### Ejemplo de Componente React

```typescript
import React, { useState, useEffect } from 'react';

interface RuleFormProps {
  initialRule?: Rule;
  onSubmit: (rule: Partial<Rule>) => Promise<void>;
}

export const RuleForm: React.FC<RuleFormProps> = ({ initialRule, onSubmit }) => {
  const [type, setType] = useState<RuleType>(initialRule?.type || 'AMOUNT');
  const [formData, setFormData] = useState({
    name: initialRule?.name || '',
    description: initialRule?.description || '',
    type: type,
    minimumAmount: initialRule?.minimumAmount || '',
    maximumAmount: initialRule?.maximumAmount || '',
    nitAssociatedCompany: initialRule?.nitAssociatedCompany || '',
    code: initialRule?.code || '',  // ⭐ NUEVO CAMPO
    roleIds: initialRule?.roleIds || []
  });

  const config = RULE_TYPE_CONFIG[type];
  const requiresCode = config.fields.includes('code');
  const requiresAmount = config.fields.includes('minimumAmount');
  const requiresNIT = config.fields.includes('nitAssociatedCompany');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar que el código esté presente si es requerido
    if (requiresCode && !formData.code?.trim()) {
      alert('El código de objeción es requerido para este tipo de regla');
      return;
    }

    // Construir objeto solo con campos relevantes
    const ruleData: Partial<Rule> = {
      name: formData.name,
      description: formData.description,
      type: formData.type
    };

    if (requiresCode) ruleData.code = formData.code;
    if (requiresAmount) {
      ruleData.minimumAmount = parseFloat(formData.minimumAmount);
      ruleData.maximumAmount = parseFloat(formData.maximumAmount);
    }
    if (requiresNIT) ruleData.nitAssociatedCompany = formData.nitAssociatedCompany;

    await onSubmit(ruleData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Tipo de Regla */}
      <div>
        <label>Tipo de Regla</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as RuleType)}
        >
          <option value="AMOUNT">AMOUNT - Por monto</option>
          <option value="COMPANY">COMPANY - Por empresa</option>
          <option value="COMPANY-AMOUNT">COMPANY-AMOUNT - Por empresa y monto</option>
          <option value="CODE">CODE - Por código de objeción</option>
          <option value="CODE-AMOUNT">CODE-AMOUNT - Por código y monto</option>
          <option value="COMPANY-CODE">COMPANY-CODE - Por empresa y código</option>
          <option value="CODE-AMOUNT-COMPANY">CODE-AMOUNT-COMPANY - Máxima especificidad</option>
          <option value="CUSTOM">CUSTOM - Personalizada</option>
        </select>
        <small>{config.description}</small>
      </div>

      {/* Nombre */}
      <div>
        <label>Nombre *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          pattern="^[a-zA-Z0-9\s._-]+$"
          title="Solo alfanuméricos, espacios, puntos, guiones y guiones bajos"
          required
        />
      </div>

      {/* Descripción */}
      <div>
        <label>Descripción *</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
        />
      </div>

      {/* ⭐ NUEVO: Campo Código (condicional) */}
      {requiresCode && (
        <div className="highlight-new">
          <label>Código de Objeción *</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({...formData, code: e.target.value})}
            maxLength={100}
            placeholder="ej: OBJ-001"
            required
          />
          <small>⚠️ Case-sensitive: "OBJ-001" ≠ "obj-001"</small>
        </div>
      )}

      {/* NIT (condicional) */}
      {requiresNIT && (
        <div>
          <label>NIT Empresa Asociada *</label>
          <input
            type="text"
            value={formData.nitAssociatedCompany}
            onChange={(e) => setFormData({...formData, nitAssociatedCompany: e.target.value})}
            maxLength={20}
            placeholder="ej: 900123456-7"
            required
          />
        </div>
      )}

      {/* Montos (condicional) */}
      {requiresAmount && (
        <>
          <div>
            <label>Monto Mínimo *</label>
            <input
              type="number"
              value={formData.minimumAmount}
              onChange={(e) => setFormData({...formData, minimumAmount: e.target.value})}
              min="0"
              step="0.01"
              required
            />
          </div>
          <div>
            <label>Monto Máximo *</label>
            <input
              type="number"
              value={formData.maximumAmount}
              onChange={(e) => setFormData({...formData, maximumAmount: e.target.value})}
              min="0"
              step="0.01"
              required
            />
          </div>
        </>
      )}

      <button type="submit">Guardar Regla</button>
    </form>
  );
};
```

### 2. Tabla de Reglas - Mostrar Campo CODE

```typescript
interface RuleTableProps {
  rules: Rule[];
}

export const RuleTable: React.FC<RuleTableProps> = ({ rules }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Tipo</th>
          <th>Código</th>  {/* ⭐ NUEVA COLUMNA */}
          <th>NIT</th>
          <th>Monto Min</th>
          <th>Monto Max</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {rules.map(rule => (
          <tr key={rule.id}>
            <td>{rule.name}</td>
            <td>
              <span className={`badge badge-${rule.type}`}>
                {rule.type}
              </span>
            </td>
            <td>
              {rule.code ? (
                <code className="code-value">{rule.code}</code>
              ) : (
                <span className="text-muted">-</span>
              )}
            </td>
            <td>{rule.nitAssociatedCompany || '-'}</td>
            <td>{rule.minimumAmount ? `$${rule.minimumAmount.toLocaleString()}` : '-'}</td>
            <td>{rule.maximumAmount ? `$${rule.maximumAmount.toLocaleString()}` : '-'}</td>
            <td>
              <span className={`badge ${rule.isActive ? 'badge-success' : 'badge-secondary'}`}>
                {rule.isActive ? 'Activa' : 'Inactiva'}
              </span>
            </td>
            <td>
              <button onClick={() => handleEdit(rule)}>Editar</button>
              <button onClick={() => handleDelete(rule.id)}>Eliminar</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

### 3. Indicador Visual de Especificidad

```typescript
export const SpecificityBadge: React.FC<{ type: RuleType }> = ({ type }) => {
  const specificityLevels = {
    'CODE-AMOUNT-COMPANY': { level: 1, color: 'danger', label: 'Máxima' },
    'COMPANY-CODE': { level: 2, color: 'warning', label: 'Alta' },
    'CODE-AMOUNT': { level: 3, color: 'warning', label: 'Alta' },
    'COMPANY-AMOUNT': { level: 4, color: 'info', label: 'Media' },
    'COMPANY': { level: 5, color: 'info', label: 'Media' },
    'CODE': { level: 6, color: 'secondary', label: 'Baja' },
    'AMOUNT': { level: 7, color: 'secondary', label: 'Baja' },
    'CUSTOM': { level: 8, color: 'light', label: 'Mínima' }
  };

  const info = specificityLevels[type];

  return (
    <span className={`badge badge-${info.color}`} title={`Nivel ${info.level} de 8`}>
      Especificidad: {info.label} (Nivel {info.level})
    </span>
  );
};
```

---

## Validations

### Frontend Validations

```typescript
// Validación de duplicados antes de enviar
async function validateRuleBeforeSubmit(ruleData: Partial<Rule>, companyId: number): Promise<boolean> {
  const existingRules = await fetchRules(companyId);

  // Para reglas CODE
  if (ruleData.type === 'CODE') {
    const duplicate = existingRules.find(
      r => r.type === 'CODE' && r.code === ruleData.code
    );
    if (duplicate) {
      alert(`Ya existe una regla CODE con el código "${ruleData.code}"`);
      return false;
    }
  }

  // Para reglas CODE-AMOUNT
  if (ruleData.type === 'CODE-AMOUNT') {
    const overlapping = existingRules.find(
      r => r.type === 'CODE-AMOUNT' &&
           r.code === ruleData.code &&
           rangesOverlap(
             r.minimumAmount, r.maximumAmount,
             ruleData.minimumAmount, ruleData.maximumAmount
           )
    );
    if (overlapping) {
      alert(`Ya existe una regla CODE-AMOUNT con el código "${ruleData.code}" y rangos solapados`);
      return false;
    }
  }

  // Similar para COMPANY-CODE y CODE-AMOUNT-COMPANY...

  return true;
}

function rangesOverlap(min1: number, max1: number, min2: number, max2: number): boolean {
  return !(max1 < min2 || max2 < min1);
}
```

### Backend Error Handling

El backend retorna errores específicos que el frontend debe manejar:

```typescript
try {
  await createRule(ruleData);
} catch (error) {
  if (error.response?.status === 409) {
    // Conflicto - Regla duplicada o solapamiento
    const message = error.response.data.error.message;

    if (message.includes('duplicate')) {
      showError('Ya existe una regla con ese código. Por favor usa un código diferente.');
    } else if (message.includes('overlapping')) {
      showError('Los rangos de montos se solapan con una regla existente para este código.');
    }
  } else if (error.response?.status === 400) {
    // Validación - Campos requeridos
    showError('Verifica que todos los campos requeridos estén completos.');
  } else {
    showError('Error al crear la regla. Intenta nuevamente.');
  }
}
```

---

## Case Sensitivity Warning

⚠️ **IMPORTANTE**: El campo `code` es **case-sensitive**:

- `OBJ-001` ≠ `obj-001`
- `OBJ-001` ≠ `Obj-001`
- No se realiza normalización ni trim automático

**Recomendación UI:**
- Mostrar advertencia clara en el formulario
- Considerar convertir a mayúsculas automáticamente si es apropiado para el negocio
- Mostrar el código exactamente como será almacenado

```typescript
// Ejemplo de conversión automática (opcional)
const handleCodeChange = (value: string) => {
  setFormData({
    ...formData,
    code: value.toUpperCase() // Convertir a mayúsculas automáticamente
  });
};
```

---

## Testing Checklist

### Pruebas Funcionales Frontend

- [ ] Crear regla CODE con código válido
- [ ] Crear regla CODE-AMOUNT con código y rangos válidos
- [ ] Crear regla COMPANY-CODE con NIT y código válidos
- [ ] Crear regla CODE-AMOUNT-COMPANY con todos los campos
- [ ] Validar que campos requeridos se muestren según tipo
- [ ] Intentar crear regla CODE duplicada (debe fallar)
- [ ] Intentar crear regla CODE-AMOUNT con rangos solapados (debe fallar)
- [ ] Editar regla existente y cambiar código
- [ ] Verificar case-sensitivity del código ("OBJ-001" vs "obj-001")
- [ ] Visualizar correctamente el código en la tabla de reglas
- [ ] Filtrar/buscar reglas por código
- [ ] Exportar/importar reglas incluyendo el campo código

### Pruebas de Integración

- [ ] Verificar que asignaciones usen la regla más específica
- [ ] Verificar que múltiples reglas al mismo nivel se combinen
- [ ] Validar priorización correcta entre los 8 niveles

---

## Swagger/OpenAPI Documentation

La documentación de la API está actualizada en:
- **Swagger UI**: `http://localhost:4041/api-docs`
- **Schema actualizado** con campo `code` y nuevos tipos de reglas
- **Ejemplos de request/response** para cada tipo CODE

---

## Migration Notes

### Para Empresas Existentes

- El campo `code` es **NULL** por defecto para reglas existentes
- Las reglas existentes (AMOUNT, COMPANY, COMPANY-AMOUNT, CUSTOM) siguen funcionando sin cambios
- No se requiere migración de datos para reglas existentes

### Despliegue

1. **Backend**: Ejecutar migración SQL antes del despliegue
```bash
npm run migrate:code-rules
```

2. **Frontend**: Desplegar nueva versión con soporte para campo `code`

3. **Validación**: Verificar que reglas existentes sigan funcionando

---

## Support & Troubleshooting

### Errores Comunes

**Error**: "Rule name contains invalid characters"
- **Solución**: Usar solo caracteres alfanuméricos, espacios, puntos, guiones y guiones bajos en el nombre

**Error**: "Code is required for CODE type rules"
- **Solución**: Asegurarse de enviar el campo `code` para tipos CODE, CODE-AMOUNT, COMPANY-CODE, CODE-AMOUNT-COMPANY

**Error**: "Duplicate CODE rule found"
- **Solución**: Ya existe una regla con ese código. Usar un código diferente o actualizar la regla existente

**Error**: "Overlapping CODE-AMOUNT range"
- **Solución**: Los rangos de montos se solapan con una regla existente que tiene el mismo código

---

## Contact

Para preguntas o issues relacionados con esta integración:
- **Email**: support@back-asignaciones.com
- **Documentación**: `/docs/FRONTEND_INTEGRATION_CODE_RULES.md`
- **API Docs**: `http://localhost:4041/api-docs`
