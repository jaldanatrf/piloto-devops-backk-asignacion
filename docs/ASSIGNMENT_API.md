# Assignment CRUD API Documentation

Este documento describe las APIs disponibles para el manejo de asignaciones (assignments) en el sistema.

## Base URL
```
/api/assignments
```

## Endpoints Disponibles

### 1. Crear Asignación
**POST** `/`

Crea una nueva asignación de usuario a rol.

**Body:**
```json
{
  "userId": 1,
  "roleId": 2,
  "companyId": 1,
  "startDate": "2025-08-21T00:00:00.000Z",
  "endDate": "2025-12-31T23:59:59.999Z",
  "status": "pending"
}
```

**Campos obligatorios:**
- `userId`: ID del usuario
- `roleId`: ID del rol
- `companyId`: ID de la compañía
- `startDate`: Fecha de inicio

**Campos opcionales:**
- `endDate`: Fecha de fin (null = sin fecha de fin)
- `status`: Estado inicial (por defecto: "pending")

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "roleId": 2,
    "companyId": 1,
    "status": "pending",
    "startDate": "2025-08-21T00:00:00.000Z",
    "endDate": "2025-12-31T23:59:59.999Z",
    "assignedAt": "2025-08-20T10:30:00.000Z",
    "createdAt": "2025-08-20T10:30:00.000Z",
    "updatedAt": "2025-08-20T10:30:00.000Z"
  },
  "message": "Assignment created successfully"
}
```

### 2. Obtener Todas las Asignaciones
**GET** `/`

Lista todas las asignaciones con filtros opcionales y paginación.

**Query Parameters:**
- `status`: Filtrar por estado
- `userId`: Filtrar por usuario
- `roleId`: Filtrar por rol
- `companyId`: Filtrar por compañía
- `startDateFrom`: Filtrar por fecha de inicio desde
- `startDateTo`: Filtrar por fecha de inicio hasta
- `assignedAfter`: Filtrar asignaciones creadas después de esta fecha
- `assignedBefore`: Filtrar asignaciones creadas antes de esta fecha
- `overdue`: Mostrar solo asignaciones vencidas (true/false)
- `active`: Mostrar solo asignaciones activas (true/false)
- `includeStats`: Incluir estadísticas en la respuesta (true/false)
- `page`: Número de página (por defecto: 1)
- `limit`: Cantidad por página (por defecto: 10, máximo: 100)
- `sortBy`: Campo para ordenar (id, userId, roleId, status, startDate, assignedAt, createdAt)
- `sortOrder`: Orden (ASC/DESC, por defecto: DESC)

**Ejemplo:**
```
GET /api/assignments?status=active&companyId=1&page=1&limit=20&sortBy=startDate&sortOrder=ASC
```

### 3. Obtener Asignación por ID
**GET** `/:id`

Obtiene una asignación específica por su ID.

**Parámetros:**
- `id`: ID de la asignación

### 4. Actualizar Asignación
**PUT** `/:id`

Actualiza una asignación existente.

**Body:** (Todos los campos son opcionales)
```json
{
  "userId": 2,
  "roleId": 3,
  "companyId": 1,
  "status": "active",
  "startDate": "2025-08-22T00:00:00.000Z",
  "endDate": "2025-12-31T23:59:59.999Z"
}
```

### 5. Eliminar Asignación
**DELETE** `/:id`

Elimina una asignación.

**Query Parameters:**
- `softDelete`: Si se hace eliminación suave (por defecto: true)
- `force`: Forzar eliminación de asignaciones completadas (true/false)
- `confirmActiveDelete`: Confirmar eliminación de asignaciones activas (true/false)
- `checkDependencies`: Verificar dependencias antes de eliminar (true/false)

### 6. Buscar Asignaciones
**GET** `/search`

Busca asignaciones por término de búsqueda.

**Query Parameters:**
- `q`: Término de búsqueda (obligatorio)
- `limit`: Límite de resultados (por defecto: 10)

### 7. Obtener Estadísticas
**GET** `/stats`

Obtiene estadísticas de asignaciones.

**Query Parameters:**
- `userId`: Filtrar estadísticas por usuario
- `roleId`: Filtrar estadísticas por rol
- `companyId`: Filtrar estadísticas por compañía

### 8. Asignaciones por Usuario
**GET** `/user/:userId`

Obtiene todas las asignaciones de un usuario específico.

### 9. Asignaciones por Rol
**GET** `/role/:ruleId`

Obtiene todas las asignaciones de un rol específico.

### 10. Asignaciones por Compañía
**GET** `/company/:companyId`

Obtiene todas las asignaciones de una compañía específica.

### 11. Activar Asignación
**PATCH** `/:id/activate`

Cambia el estado de una asignación a "active".

### 12. Completar Asignación
**PATCH** `/:id/complete`

Cambia el estado de una asignación a "completed".

### 13. Cancelar Asignación
**PATCH** `/:id/cancel`

Cambia el estado de una asignación a "cancelled".

## Estados Disponibles

- `pending`: Pendiente de activación
- `active`: Activa
- `completed`: Completada
- `cancelled`: Cancelada
- `unassigned`: Sin asignar

## Validaciones y Reglas de Negocio

### Validaciones de Entrada:
1. **userId, roleId, companyId**: Deben ser enteros positivos
2. **startDate**: Debe ser una fecha válida
3. **endDate**: Debe ser una fecha válida posterior a startDate
4. **status**: Debe ser uno de los estados válidos

### Reglas de Negocio:
1. **Entidades relacionadas deben existir y estar activas**
2. **Usuario debe pertenecer a la compañía especificada**
3. **Rol debe pertenecer a la compañía especificada**
4. **No puede haber dos asignaciones activas del mismo usuario al mismo rol**
5. **No puede haber solapamiento de fechas para asignaciones del mismo usuario**
6. **La fecha de inicio no puede ser en el pasado**

### Reglas de Eliminación:
1. **Por defecto se hace eliminación suave (cambio a "cancelled")**
2. **Asignaciones completadas requieren confirmación para eliminar**
3. **Asignaciones activas requieren confirmación para eliminar**

## Códigos de Error

- **400**: Error de validación
- **404**: Asignación no encontrada
- **409**: Conflicto (reglas de negocio)
- **500**: Error interno del servidor

## Ejemplos de Respuestas de Error

```json
{
  "success": false,
  "error": {
    "message": "User already has an active assignment for this role",
    "statusCode": 409
  }
}
```

```json
{
  "success": false,
  "error": {
    "message": "Missing required fields: userId, roleId",
    "statusCode": 400
  }
}
```
