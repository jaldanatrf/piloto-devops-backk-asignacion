# 🔄 Reestructuración del Modelo de Datos

## 📊 Resumen de Cambios

Este documento describe los cambios realizados en la estructura del modelo de datos del sistema de asignaciones para implementar las nuevas relaciones y funcionalidades requeridas.

## 🔧 Cambios Implementados

### 1. Nueva Relación Rule-Role (Muchos a Muchos)

#### ✅ Tabla Intermedia `rule_roles`
- **Campos:**
  - `id` (PK, auto-increment)
  - `rule_id` (FK a rules)
  - `role_id` (FK a roles)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)
- **Constraints:**
  - FK constraint a `rules.id` con CASCADE DELETE
  - FK constraint a `roles.id` con CASCADE DELETE
  - Unique constraint en (rule_id, role_id)

#### ✅ Entidad de Dominio
- `src/domain/entities/RuleRole.js`
- Validaciones de integridad
- Métodos de acceso básicos

#### ✅ Repositorio
- `src/domain/repositories/RuleRoleRepository.js` (Puerto)
- `src/infrastructure/database/repositories/SequelizeRuleRoleRepository.js` (Implementación)
- Métodos CRUD completos y operaciones bulk

### 2. Modificación Relación User-Company

#### ✅ Eliminación de FK Constraint
- Campo `company_id` en tabla `users` ahora es nullable
- Se eliminó la constraint de FK entre `users.company_id` y `companies.id`
- El campo mantiene valor informativo sin restricciones de integridad referencial

#### ✅ Actualización de Asociaciones Sequelize
- Removidas asociaciones FK automáticas entre User y Company
- Relación ahora es solo informativa

### 3. Servicio de Creación de Reglas Actualizado

#### ✅ CreateRuleUseCase Mejorado
- Acepta `roleIds` en el payload
- Valida existencia y pertenencia de roles a la compañía
- Crea automáticamente relaciones en `rule_roles`
- Manejo de transacciones para consistencia

#### ✅ Nuevas Validaciones
- Verificación de que roles existen
- Verificación de que roles pertenecen a la misma compañía
- Verificación de que roles están activos
- Validación de integridad de datos

## 📁 Archivos Modificados

### Nuevos Archivos
```
src/domain/entities/RuleRole.js
src/domain/repositories/RuleRoleRepository.js
src/infrastructure/database/repositories/SequelizeRuleRoleRepository.js
src/infrastructure/database/migrations/reestructuracion_modelo_datos.sql
```

### Archivos Modificados
```
src/infrastructure/database/models/index.js
src/infrastructure/database/repositories/index.js
src/infrastructure/factories/DatabaseFactory.js
src/application/useCases/rules/RuleUseCase.js
src/infrastructure/web/server.js
src/infrastructure/web/routes/ruleRoutes.js
```

## 🚀 Uso de la Nueva API

### Crear Regla con Roles Asociados

```json
POST /api/companies/1/rules

{
  "name": "Regla de Montos Especiales",
  "description": "Validación de montos para roles específicos",
  "type": "AMOUNT",
  "minimumAmount": 1000.00,
  "maximumAmount": 50000.00,
  "roleIds": [1, 2, 3],
  "isActive": true
}
```

### Respuesta
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Regla de Montos Especiales",
    "description": "Validación de montos para roles específicos",
    "type": "AMOUNT",
    "companyId": 1,
    "minimumAmount": 1000.00,
    "maximumAmount": 50000.00,
    "isActive": true,
    "createdAt": "2025-08-21T..."
  },
  "message": "Rule created successfully"
}
```

## 📋 Migración de Base de Datos

### Script SQL
Ejecutar: `src/infrastructure/database/migrations/reestructuracion_modelo_datos.sql`

### Pasos de Migración
1. ✅ Eliminar FK constraint `users.company_id` → `companies.id`
2. ✅ Crear tabla `rule_roles`
3. ✅ Hacer nullable el campo `company_id` en `users`
4. ✅ Crear trigger para `updated_at` en `rule_roles`

## ⚠️ Consideraciones Importantes

### Compatibilidad hacia atrás
- La API mantiene compatibilidad con payloads sin `roleIds`
- Reglas existentes no se ven afectadas
- Campo `roleIds` es opcional en la creación

### Integridad de Datos
- Se mantiene integridad referencial en `rule_roles`
- Validaciones a nivel de aplicación para `users.company_id`
- Transacciones para operaciones complejas

### Performance
- Índices optimizados en tabla `rule_roles`
- Consultas eficientes para relaciones N:M
- Carga lazy de asociaciones cuando sea necesario

## 🧪 Testing

### Casos de Prueba Requeridos
1. ✅ Crear regla sin `roleIds` (comportamiento actual)
2. ✅ Crear regla con `roleIds` válidos
3. ✅ Validar error con `roleIds` de diferente compañía
4. ✅ Validar error con `roleIds` inactivos
5. ✅ Validar error con `roleIds` inexistentes

### Scripts de Prueba
Los tests existentes en `tests/unit/rule/` y `tests/integration/rule/` deben actualizarse para incluir los nuevos escenarios.

## 📞 Soporte

Para dudas o problemas con la migración, revisar:
- Logs de aplicación en `logs/combined.log`
- Estado de base de datos con endpoint `/health`
- Documentación API en `/api-docs`
