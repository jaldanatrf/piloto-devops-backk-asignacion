# Sistema de Roles - Documentación Completa

## Índice
- [Arquitectura Actual](#arquitectura-actual)
- [API Endpoints](#api-endpoints)
- [Casos de Uso](#casos-de-uso)
- [Validaciones](#validaciones)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Arquitectura Actual

### Diseño: Roles Globales (Recomendado)

El sistema implementa **roles globales** que pueden ser asignados a usuarios de cualquier empresa.

```
┌─────────────┐    1:N     ┌─────────────┐
│   Company   │◄──────────►│    User     │
│             │            │             │
└─────────────┘            └─────────────┘
                                  │
                                  │ N:M
                                  ▼
                           ┌─────────────┐
                           │  UserRole   │ (tabla intermedia)
                           │             │
                           └─────────────┘
                                  │
                                  │ N:M
                                  ▼
                           ┌─────────────┐
                           │    Role     │ (global)
                           │             │
                           └─────────────┘
```

### Relaciones

1. **Usuario ↔ Empresa** (1:N)
   - Un usuario pertenece a UNA empresa
   - Campo: `user.companyId`

2. **Usuario ↔ Roles** (N:M)
   - Un usuario puede tener MUCHOS roles
   - Tabla intermedia: `UserRole`
   - Los roles se asignan a usuarios individuales

3. **Roles Globales**
   - Los roles NO tienen `companyId`
   - Un mismo rol puede ser asignado a usuarios de diferentes empresas
   - Permite reutilización y consistencia

---

## API Endpoints

### Gestión de Roles Globales (RECOMENDADO)

**Base URL**: `/api/roles`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/roles` | Obtener todos los roles globales |
| POST | `/api/roles` | Crear un nuevo rol global |
| GET | `/api/roles/:roleId` | Obtener un rol específico |
| PUT | `/api/roles/:roleId` | Actualizar un rol |
| DELETE | `/api/roles/:roleId` | Eliminar un rol |
| GET | `/api/roles/active` | Obtener solo roles activos |
| GET | `/api/roles/search?q=term` | Buscar roles por nombre |

### Gestión de Asignación de Roles a Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users/:userId/roles` | Obtener roles de un usuario |
| POST | `/api/users/:userId/roles` | Asignar un rol a un usuario |
| PUT | `/api/users/:userId/roles` | Reemplazar todos los roles |
| DELETE | `/api/users/:userId/roles/:roleId` | Quitar un rol |
| GET | `/api/users/:userId/available-roles` | Roles disponibles para asignar |
| POST | `/api/users/:userId/roles/multiple` | Asignar múltiples roles |
| GET | `/api/roles/:roleId/users` | Usuarios con un rol específico |

### Gestión por Empresa (DEPRECATED)

**Nota**: Estas rutas se mantienen solo por compatibilidad. Se recomienda migrar a las rutas globales.

```
GET/POST   /api/companies/:companyId/roles
GET/PUT/DELETE   /api/companies/:companyId/roles/:roleId
```

---

## Casos de Uso

### 1. Crear Roles Globales

```bash
POST /api/roles
{
  "name": "Administrator",
  "description": "Administrador del sistema",
  "isActive": true
}
```

**Validaciones**:
- Nombre requerido (2-100 caracteres)
- Solo letras, números, espacios, puntos, guiones
- Descripción máximo 500 caracteres

### 2. Asignar Roles a Usuarios

```bash
# Asignar un rol
POST /api/users/1/roles
{
  "roleId": 1
}

# Asignar múltiples roles
POST /api/users/1/roles/multiple
{
  "roleIds": [1, 2, 3]
}
```

### 3. Consultar Roles de Usuario

```bash
# Ver todos los roles de un usuario
GET /api/users/1/roles

# Verificar si un usuario tiene un rol específico
GET /api/users/1/roles/1

# Ver usuarios que tienen un rol específico
GET /api/roles/1/users

# Filtrar por empresa
GET /api/roles/1/users?companyId=1
```

---

## Validaciones

### Validaciones de Dominio

1. **Nombre requerido**: No puede estar vacío
2. **Longitud del nombre**: Entre 2 y 100 caracteres
3. **Caracteres válidos**: Solo letras, números, espacios, puntos, guiones y guiones bajos
4. **Descripción**: Máximo 500 caracteres

### Validaciones de Negocio

1. **Unicidad**: Nombre único por empresa (en modelo por empresa)
2. **Existencia**: Validar que el rol exista antes de asignar
3. **Usuarios activos**: Solo asignar roles a usuarios activos

---

## Ejemplos de Uso

### Crear un Rol

```bash
curl -X POST http://localhost:4041/api/roles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Manager",
    "description": "Rol de gestión con permisos intermedios",
    "isActive": true
  }'
```

**Respuesta exitosa**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Manager",
    "description": "Rol de gestión con permisos intermedios",
    "isActive": true,
    "createdAt": "2025-08-19T10:30:00.000Z"
  },
  "message": "Role created successfully"
}
```

### Asignar Rol a Usuario

```bash
curl -X POST http://localhost:4041/api/users/1/roles \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": 1
  }'
```

### Buscar Roles

```bash
curl http://localhost:4041/api/roles/search?q=Admin&limit=5
```

---

## Ventajas del Diseño de Roles Globales

1. **Simplicidad**: Los roles son entidades simples sin dependencias complejas
2. **Reutilización**: Un mismo rol puede ser usado por múltiples empresas
3. **Escalabilidad**: Fácil agregar nuevos roles sin impacto en empresas existentes
4. **Flexibilidad**: Los usuarios pueden tener roles de diferentes categorías
5. **Consistencia**: El mismo rol significa lo mismo en todas las empresas

---

## Modelo de Datos

```javascript
{
  id: integer,           // ID único del rol
  name: string,          // Nombre del rol (2-100 caracteres)
  description: string,   // Descripción opcional (máx 500 caracteres)
  isActive: boolean,     // Estado activo del rol
  createdAt: datetime    // Fecha de creación
}
```

### Restricciones de Base de Datos

- **Nombre único**: Índice único en `name`
- **Validaciones**: Longitud de campos, caracteres válidos

---

## Migración desde Diseño por Empresa

Si tienes datos con el diseño anterior (roles con `companyId`):

1. **Crear roles globales** equivalentes
2. **Migrar asignaciones** de usuarios a los nuevos roles globales
3. **Deprecar gradualmente** las rutas por empresa
4. **Eliminar** la dependencia de `companyId` en roles

---

## Testing

### Tests Unitarios
```bash
npm test -- tests/unit/role/RoleUseCases.test.js
```

### Tests de Integración
```bash
npm test -- tests/integration/role/role-endpoints.test.js
```

---

## Documentación API

La documentación completa de la API está disponible en Swagger:
```
http://localhost:4041/api-docs
```

---

**Nota**: Este servicio es parte del sistema Back Asignaciones y está diseñado para trabajar en conjunto con los servicios de empresas, usuarios y asignaciones.
