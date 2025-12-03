# Debugging de errores JSON - Creación de Reglas

## Error observado
```
SyntaxError: Expected ',' or '}' after property value in JSON at position 231 (line 8 column 3)
```

## Ejemplos de JSON válidos para crear reglas

### 1. Regla tipo AMOUNT
```json
{
  "name": "Payment Amount Rule",
  "description": "Validation rule for payment amounts between specific limits",
  "type": "AMOUNT",
  "minimumAmount": 1000.50,
  "maximumAmount": 25000.75,
  "isActive": true
}
```

### 2. Regla tipo COMPANY
```json
{
  "name": "Company Validation Rule",
  "description": "Rule for validating associated companies",
  "type": "COMPANY",
  "nitAssociatedCompany": "800456789",
  "isActive": true
}
```

### 3. Regla tipo COMPANY-AMOUNT
```json
{
  "name": "Company-Amount Validation Rule",
  "description": "Rule for validating company and amounts",
  "type": "COMPANY-AMOUNT",
  "minimumAmount": 5000.00,
  "maximumAmount": 100000.00,
  "nitAssociatedCompany": "900987654",
  "isActive": true
}
```

### 4. Regla tipo LEGACY (BUSINESS, SECURITY, etc.)
```json
{
  "name": "Legacy Security Rule",
  "description": "Traditional security rule",
  "type": "SECURITY",
  "isActive": true
}
```

## Errores comunes de JSON

1. **Comas faltantes**: Entre propiedades debe haber comas
   ```json
   // ❌ Incorrecto
   {
     "name": "Test"
     "type": "AMOUNT"
   }
   
   // ✅ Correcto
   {
     "name": "Test",
     "type": "AMOUNT"
   }
   ```

2. **Comas extras**: No debe haber coma después de la última propiedad
   ```json
   // ❌ Incorrecto
   {
     "name": "Test",
     "type": "AMOUNT",
   }
   
   // ✅ Correcto
   {
     "name": "Test",
     "type": "AMOUNT"
   }
   ```

3. **Comillas**: Todas las claves y valores string deben estar entre comillas dobles
   ```json
   // ❌ Incorrecto
   {
     name: 'Test',
     type: 'AMOUNT'
   }
   
   // ✅ Correcto
   {
     "name": "Test",
     "type": "AMOUNT"
   }
   ```

4. **Números**: Los números no necesitan comillas
   ```json
   // ❌ Incorrecto
   {
     "minimumAmount": "1000.50"
   }
   
   // ✅ Correcto
   {
     "minimumAmount": 1000.50
   }
   ```

## Endpoints de debugging disponibles

- `GET /api/debug/rule-example` - Obtiene ejemplos de JSON válidos
- `POST /api/debug/json-test` - Prueba parsing de JSON

## Validación de tipos de regla

- **AMOUNT**: Requiere `minimumAmount` y `maximumAmount`
- **COMPANY**: Requiere `nitAssociatedCompany`
- **COMPANY-AMOUNT**: Requiere `minimumAmount`, `maximumAmount` y `nitAssociatedCompany`
- **LEGACY** (BUSINESS, SECURITY, etc.): Solo requiere campos básicos
