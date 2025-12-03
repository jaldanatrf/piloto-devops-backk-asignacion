# Arquitectura de Roles - Sistema de Asignaciones

## Diseño Corregido

El sistema de roles ha sido refactorizado para seguir un diseño más coherente y escalable.

### Relaciones Principales

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

### 1. Usuario ↔ Empresa
- **Relación**: Un usuario pertenece a UNA empresa
- **Campo**: `user.companyId`
- **Lógica**: Los usuarios están "atados" a empresas específicas

### 2. Usuario ↔ Roles
- **Relación**: Un usuario puede tener MUCHOS roles (N:M)
- **Tabla intermedia**: `UserRole`
- **Lógica**: Los roles se asignan a usuarios individuales, no a empresas

### 3. Roles Globales
- **Diseño**: Los roles son entidades globales
- **Sin companyId**: Los roles NO están atados a empresas específicas
- **Flexibilidad**: Un mismo rol puede ser asignado a usuarios de diferentes empresas

## APIs Disponibles

### 1. Gestión de Roles Globales (RECOMENDADO)

```
GET    /api/roles                    # Obtener todos los roles globales
POST   /api/roles                    # Crear un nuevo rol global
GET    /api/roles/:roleId             # Obtener un rol específico
PUT    /api/roles/:roleId             # Actualizar un rol
DELETE /api/roles/:roleId             # Eliminar un rol
GET    /api/roles/active              # Obtener solo roles activos
GET    /api/roles/search?q=term       # Buscar roles por nombre
```

### 2. Gestión de Asignación de Roles a Usuarios

```
GET    /api/users/:userId/roles                    # Obtener roles de un usuario
POST   /api/users/:userId/roles                    # Asignar un rol a un usuario
PUT    /api/users/:userId/roles                    # Reemplazar todos los roles de un usuario
DELETE /api/users/:userId/roles/:roleId            # Quitar un rol de un usuario
GET    /api/users/:userId/available-roles          # Obtener roles disponibles para asignar
POST   /api/users/:userId/roles/multiple           # Asignar múltiples roles
GET    /api/users/:userId/roles/:roleId             # Verificar si usuario tiene rol
GET    /api/roles/:roleId/users                    # Obtener usuarios con un rol específico
```

### 3. Gestión de Roles por Empresa (DEPRECATED)

```
# ESTAS RUTAS SE MANTIENEN SOLO POR COMPATIBILIDAD
# SE RECOMIENDA MIGRAR A LAS RUTAS GLOBALES

GET    /api/companies/:companyId/roles             # Obtener roles de una empresa
POST   /api/companies/:companyId/roles             # Crear rol para una empresa
GET    /api/companies/:companyId/roles/:roleId     # Obtener rol específico de empresa
PUT    /api/companies/:companyId/roles/:roleId     # Actualizar rol de empresa
DELETE /api/companies/:companyId/roles/:roleId     # Eliminar rol de empresa
```

## Casos de Uso Típicos

### Caso 1: Crear Roles Globales
```bash
# Crear roles que pueden ser usados por cualquier empresa
POST /api/roles
{
  "name": "Administrator",
  "description": "Administrador del sistema",
  "isActive": true
}

POST /api/roles
{
  "name": "Editor",
  "description": "Editor de contenido",
  "isActive": true
}
```

### Caso 2: Asignar Roles a Usuarios
```bash
# Usuario 1 (de Empresa A) recibe rol de Administrator
POST /api/users/1/roles
{
  "roleId": 1
}

# Usuario 2 (de Empresa B) también puede recibir rol de Administrator
POST /api/users/2/roles
{
  "roleId": 1
}

# Usuario 1 puede tener múltiples roles
POST /api/users/1/roles
{
  "roleId": 2
}
```

### Caso 3: Consultar Roles de Usuario
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

## Ventajas del Nuevo Diseño

### 1. **Simplicidad**
- Los roles son entidades simples sin dependencias complejas
- Más fácil de entender y mantener

### 2. **Reutilización**
- Un mismo rol (ej: "Administrator") puede ser usado por múltiples empresas
- No hay duplicación de roles similares

### 3. **Escalabilidad**
- Fácil agregar nuevos roles sin impacto en empresas existentes
- Gestión centralizada de roles

### 4. **Flexibilidad**
- Los usuarios pueden tener roles de diferentes "categorías"
- Fácil implementar permisos granulares

### 5. **Consistencia**
- El mismo rol significa lo mismo en todas las empresas
- Menos confusión sobre qué hace cada rol

## Migración

Si ya tienes datos con el diseño anterior (roles con companyId), puedes:

1. **Crear roles globales** equivalentes
2. **Migrar asignaciones** de usuarios a los nuevos roles globales
3. **Deprecar gradualmente** las rutas por empresa
4. **Eliminar** la dependencia de companyId en roles

## Controladores

### RoleController (DEPRECATED)
- Mantiene compatibilidad con diseño anterior
- Rutas: `/api/companies/:companyId/roles/*`

### GlobalRoleController (RECOMENDADO)
- Nuevo diseño sin dependencia de empresa
- Rutas: `/api/roles/*`

### UserRoleController (NUEVO)
- Gestiona asignación de roles a usuarios
- Rutas: `/api/users/:userId/roles/*` y `/api/roles/:roleId/users`

## Próximos Pasos

1. **Implementar casos de uso** para UserRoleController
2. **Crear tests** para los nuevos endpoints
3. **Migrar datos existentes** (si los hay)
4. **Actualizar documentación** del frontend
5. **Deprecar** rutas antiguas gradualmente
