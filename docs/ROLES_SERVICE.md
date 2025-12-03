# Servicio de Roles - Back Asignaciones

Este documento describe el servicio completo de roles implementado en el sistema Back Asignaciones.

## 📋 Índice

- [Arquitectura](#arquitectura)
- [Endpoints Disponibles](#endpoints-disponibles)
- [Casos de Uso](#casos-de-uso)
- [Modelos de Datos](#modelos-de-datos)
- [Validaciones](#validaciones)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Testing](#testing)

## 🏗️ Arquitectura

El servicio de roles sigue una arquitectura hexagonal (Clean Architecture) con las siguientes capas:

```
src/
├── domain/
│   ├── entities/Role.js          # Entidad de dominio
│   └── repositories/RoleRepository.js
├── application/
│   └── useCases/RoleUseCases.js  # Casos de uso de negocio
├── infrastructure/
│   ├── database/
│   │   └── repositories/SequelizeRoleRepository.js
│   └── web/
│       ├── controllers/RoleController.js
│       └── routes/roleRoutes.js
```

### Componentes Principales

1. **Entidad Role**: Contiene la lógica de negocio y validaciones del dominio
2. **Casos de Uso**: Implementan las reglas de negocio específicas
3. **Repositorio**: Abstrae el acceso a datos
4. **Controlador**: Maneja las peticiones HTTP
5. **Rutas**: Define los endpoints disponibles

## 🔗 Endpoints Disponibles

Todos los endpoints de roles están bajo el contexto de una empresa específica.

### Base URL
```
http://localhost:4041/api/companies/{companyId}/roles
```

### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/companies/{companyId}/roles` | Crear un nuevo rol |
| `GET` | `/companies/{companyId}/roles` | Obtener todos los roles de una empresa |
| `GET` | `/companies/{companyId}/roles/active` | Obtener solo roles activos |
| `GET` | `/companies/{companyId}/roles/search` | Buscar roles por nombre |
| `GET` | `/companies/{companyId}/roles/{roleId}` | Obtener rol específico |
| `PUT` | `/companies/{companyId}/roles/{roleId}` | Actualizar rol |
| `DELETE` | `/companies/{companyId}/roles/{roleId}` | Eliminar rol |

## 📝 Casos de Uso

### 1. CreateRoleUseCase
**Propósito**: Crear un nuevo rol en una empresa

**Validaciones**:
- Nombre del rol requerido
- ID de empresa requerido
- Nombre único dentro de la empresa
- Empresa debe existir

**Ejemplo**:
```javascript
const roleData = {
  name: "Administrator",
  description: "Rol con permisos administrativos",
  isActive: true
};
const companyId = 1;
const role = await createRoleUseCase.execute(roleData, companyId);
```

### 2. GetRoleByIdUseCase
**Propósito**: Obtener un rol específico por ID

**Validaciones**:
- ID del rol requerido
- ID de empresa requerido
- Rol debe pertenecer a la empresa

### 3. GetAllRolesUseCase
**Propósito**: Obtener todos los roles de una empresa con filtros opcionales

**Filtros disponibles**:
- `isActive`: Filtrar por estado activo
- `name`: Búsqueda parcial por nombre

### 4. UpdateRoleUseCase
**Propósito**: Actualizar un rol existente

**Validaciones**:
- Rol debe existir
- Si se cambia el nombre, debe ser único en la empresa

### 5. DeleteRoleUseCase
**Propósito**: Eliminar un rol

**Validaciones**:
- Rol debe existir
- TODO: Verificar que no esté en uso por usuarios

## 📊 Modelos de Datos

### Entidad Role

```javascript
{
  id: integer,           // ID único del rol
  name: string,          // Nombre del rol (2-100 caracteres)
  description: string,   // Descripción opcional (máx 500 caracteres)
  companyId: integer,    // ID de la empresa asociada
  isActive: boolean,     // Estado activo del rol
  createdAt: datetime    // Fecha de creación
}
```

### Restricciones de Base de Datos

- **Nombre único**: Por empresa (índice único en `name + company_id`)
- **Foreign Key**: `companyId` referencia a la tabla `companies`
- **Validaciones**: Longitud de campos, caracteres válidos

## ✅ Validaciones

### Validaciones de Dominio (Entidad Role)

1. **Nombre requerido**: No puede estar vacío
2. **Longitud del nombre**: Entre 2 y 100 caracteres
3. **Caracteres válidos**: Solo letras, números, espacios, puntos, guiones y guiones bajos
4. **Descripción**: Máximo 500 caracteres
5. **Company ID**: Requerido

### Validaciones de Negocio (Casos de Uso)

1. **Unicidad**: Nombre único por empresa
2. **Existencia**: La empresa debe existir
3. **Pertenencia**: El rol debe pertenecer a la empresa especificada

## 🚀 Ejemplos de Uso

### Crear un Rol

```bash
curl -X POST http://localhost:4041/api/companies/1/roles \
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
    "companyId": 1,
    "isActive": true,
    "createdAt": "2025-08-19T10:30:00.000Z"
  },
  "message": "Role created successfully"
}
```

### Obtener Todos los Roles

```bash
curl http://localhost:4041/api/companies/1/roles
```

**Respuesta**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Manager",
      "description": "Rol de gestión",
      "companyId": 1,
      "isActive": true,
      "createdAt": "2025-08-19T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### Filtrar Roles Activos

```bash
curl http://localhost:4041/api/companies/1/roles?isActive=true
```

### Buscar Roles

```bash
curl http://localhost:4041/api/companies/1/roles/search?q=Admin&limit=5
```

### Actualizar un Rol

```bash
curl -X PUT http://localhost:4041/api/companies/1/roles/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Senior Manager",
    "description": "Rol de gestión senior con permisos ampliados"
  }'
```

### Eliminar un Rol

```bash
curl -X DELETE http://localhost:4041/api/companies/1/roles/1
```

## 🧪 Testing

### Tests Unitarios

Ubicación: `tests/unit/role/RoleUseCases.test.js`

```bash
npm test -- tests/unit/role/RoleUseCases.test.js
```

### Tests de Integración

Ubicación: `tests/integration/role/role-endpoints.test.js`

```bash
npm test -- tests/integration/role/role-endpoints.test.js
```

### Script de Pruebas Manuales

```bash
node test-role-endpoints.js
```

Este script prueba todos los endpoints con casos de éxito y error.

## 📚 Documentación API

La documentación completa de la API está disponible en Swagger:

```
http://localhost:4041/api-docs
```

### Ejemplos de Respuestas de Error

**Validación (400)**:
```json
{
  "success": false,
  "error": {
    "message": "Role name is required"
  }
}
```

**No encontrado (404)**:
```json
{
  "success": false,
  "error": {
    "message": "Role with ID 999 not found in this company"
  }
}
```

**Conflicto (409)**:
```json
{
  "success": false,
  "error": {
    "message": "Role with name 'Administrator' already exists in this company"
  }
}
```

## 🔄 Próximos Desarrollos

1. **Implementar casos de uso para estadísticas**:
   - `GetRoleUsageStatsUseCase`
   - `CanRoleBeDeletedUseCase`

2. **Roles administrativos**:
   - Endpoint para obtener todos los roles del sistema
   - Permisos y autorización

3. **Integración con usuarios**:
   - Validar que un rol no esté en uso antes de eliminar
   - Asignación de roles a usuarios

4. **Auditoría**:
   - Registro de cambios en roles
   - Historial de modificaciones

## 🛠️ Configuración y Dependencias

### Dependencias Principales

- **Express**: Framework web
- **Sequelize**: ORM para base de datos
- **Swagger**: Documentación de API
- **Jest**: Framework de testing

### Variables de Entorno

```env
NODE_ENV=development
PORT=4041
DB_HOST=localhost
DB_PORT=5432
DB_NAME=back_asignaciones
DB_USER=your_user
DB_PASSWORD=your_password
```

### Estructura de Base de Datos

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  company_id INTEGER NOT NULL REFERENCES companies(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, company_id)
);
```

---

**Nota**: Este servicio es parte del sistema Back Asignaciones y está diseñado para trabajar en conjunto con los servicios de empresas, usuarios y asignaciones.
