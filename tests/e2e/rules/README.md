# Tests de Funcionalidad de Reglas

Esta carpeta contiene todas las pruebas end-to-end específicas para la funcionalidad de reglas del sistema.

## 📁 Archivos

### `test-rules-manual.js`
- **Propósito**: Prueba completa del CRUD de reglas + nuevos tipos
- **Incluye**: CREATE, READ, UPDATE, DELETE + validaciones
- **Limpieza**: No automática (deja datos para inspección manual)
- **Uso**: Para desarrollo y debugging manual

### `test-new-rule-types.js`
- **Propósito**: Prueba específica de los nuevos tipos de reglas
- **Incluye**: AMOUNT, COMPANY, COMPANY-AMOUNT + validaciones
- **Limpieza**: Automática completa (recomendado para CI/CD)
- **Uso**: Para validación automática de nuevos tipos

### `test-rule-functionality.js`
- **Propósito**: Prueba básica de funcionalidad con empresas existentes
- **Incluye**: Creación de reglas nuevos tipos
- **Limpieza**: No automática
- **Uso**: Para pruebas rápidas con datos existentes

## 🚀 Ejecución

```bash
# CRUD completo + nuevos tipos (desarrollo)
node tests/e2e/rules/test-rules-manual.js

# Nuevos tipos con limpieza (automatizado)
node tests/e2e/rules/test-new-rule-types.js

# Prueba rápida con datos existentes
node tests/e2e/rules/test-rule-functionality.js
```

## 🆕 Nuevos Tipos de Reglas (2025-08-15)

### Tipos Implementados:
- **AMOUNT**: Requiere `minimumAmount` y `maximumAmount`
- **COMPANY**: Requiere `nitAssociatedCompany`
- **COMPANY-AMOUNT**: Requiere ambos campos

### Validaciones:
- Campos obligatorios según el tipo de regla
- Compatibilidad con tipos legacy (BUSINESS, SECURITY, etc.)
- Validación automática en creación y actualización

## 🧹 Limpieza de Datos

- **`test-new-rule-types.js`**: Limpieza automática completa
- **`test-rules-manual.js`**: Sin limpieza (para inspección)
- **`test-rule-functionality.js`**: Sin limpieza (usa datos existentes)

Recomendamos usar `test-new-rule-types.js` para pruebas automatizadas y `test-rules-manual.js` para desarrollo y debugging.
