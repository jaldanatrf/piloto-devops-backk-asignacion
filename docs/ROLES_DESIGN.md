# Documentación: Sistema de Roles por Empresa

## Resumen del Diseño

El sistema implementa un modelo de **roles por empresa** (company-scoped roles), donde cada rol pertenece a una empresa específica y solo puede ser asignado a usuarios de esa misma empresa.

## Modelo de Datos

### Entidades Principales

```
Company (1) ──────── (N) Role
   │                    │
   │                    │
   │                    │
   └──────── (N) User ──┘ (N:M via UserRole)
```

### Relaciones

1. **Company → Role** (1:N)
   - Una empresa puede tener múltiples roles
   - Un rol pertenece a una sola empresa
   - Campo: `role.companyId`

2. **Company → User** (1:N)
   - Una empresa puede tener múltiples usuarios
   - Un usuario pertenece a una sola empresa
   - Campo: `user.companyId`

3. **User ↔ Role** (N:M)
   - Un usuario puede tener múltiples roles
   - Un rol puede ser asignado a múltiples usuarios
   - Tabla intermedia: `UserRole`
   - **Restricción**: Solo se pueden asignar roles de la misma empresa del usuario

## Lógica de Negocio

### Reglas de Validación

1. **Creación de Roles**:
   - El nombre del rol debe ser único **dentro de la empresa**
   - Diferentes empresas pueden tener roles con el mismo nombre
   - Un rol siempre debe tener un `companyId`

2. **Asignación de Roles a Usuarios**:
   - Solo se pueden asignar roles de la misma empresa del usuario
   - `user.companyId` debe ser igual a `role.companyId`

3. **Consultas de Roles**:
   - Siempre se consultan en el contexto de una empresa específica
   - Los roles de una empresa no son visibles para otras empresas

### Ejemplos de Uso

```javascript
// ✅ Correcto: Crear rol para empresa específica
POST /api/companies/1/roles
{
  "name": "Administrator",
  "description": "Admin role for Company 1"
}

// ✅ Correcto: Obtener roles de empresa específica
GET /api/companies/1/roles

// ✅ Correcto: Empresas diferentes pueden tener roles con el mismo nombre
// Empresa 1:
POST /api/companies/1/roles { "name": "Manager" }
// Empresa 2:
POST /api/companies/2/roles { "name": "Manager" }

// ❌ Incorrecto: Asignar rol de empresa A a usuario de empresa B
// User con companyId=1, Role con companyId=2 → Error
```

## Estructura de URLs

### Endpoints de Roles

Todos los endpoints de roles requieren el `companyId` en la URL para mantener el contexto:

```
POST   /api/companies/{companyId}/roles              - Crear rol
GET    /api/companies/{companyId}/roles              - Listar roles
GET    /api/companies/{companyId}/roles/active       - Roles activos
GET    /api/companies/{companyId}/roles/available    - Roles disponibles para asignar
GET    /api/companies/{companyId}/roles/search       - Buscar roles
GET    /api/companies/{companyId}/roles/{roleId}     - Obtener rol específico
PUT    /api/companies/{companyId}/roles/{roleId}     - Actualizar rol
DELETE /api/companies/{companyId}/roles/{roleId}     - Eliminar rol
```

### ¿Por qué no URLs como `/api/roles/{roleId}`?

1. **Contexto de Empresa**: Los roles siempre operan en el contexto de una empresa
2. **Seguridad**: Evita acceso accidental a roles de otras empresas
3. **Claridad**: La URL refleja la relación de pertenencia
4. **Consistencia**: Mantiene el patrón de recursos anidados

## Casos de Uso Comunes

### 1. Configurar Roles para una Nueva Empresa

```javascript
// 1. Crear empresa
POST /api/companies
{
  "name": "ACME Corp",
  "documentNumber": "900123456",
  "type": "PAYER"
}
// Response: { "id": 5, ... }

// 2. Crear roles para la empresa
POST /api/companies/5/roles
{
  "name": "Administrator",
  "description": "Full system access for ACME Corp"
}

POST /api/companies/5/roles
{
  "name": "Accountant",
  "description": "Financial operations for ACME Corp"
}
```

### 2. Listar Roles Disponibles para Asignar

```javascript
// Obtener todos los roles activos de la empresa para mostrar en UI
GET /api/companies/5/roles/active

// O usar el endpoint específico para asignación
GET /api/companies/5/roles/available?userId=123
```

### 3. Buscar Roles por Nombre

```javascript
// Buscar roles que contengan "admin" en empresa 5
GET /api/companies/5/roles/search?q=admin&limit=5
```

## Ventajas del Diseño Actual

1. **Aislamiento**: Roles de diferentes empresas están completamente aislados
2. **Flexibilidad**: Cada empresa puede definir sus propios roles sin conflictos
3. **Escalabilidad**: El sistema puede manejar múltiples empresas independientemente
4. **Seguridad**: No hay riesgo de asignaciones cruzadas entre empresas
5. **Claridad**: Las URLs reflejan la estructura de datos y relaciones

## Consideraciones Futuras

### Posibles Mejoras

1. **Templates de Roles**: Crear plantillas de roles comunes que las empresas puedan adoptar
2. **Jerarquía de Roles**: Implementar roles padre-hijo dentro de una empresa
3. **Permisos Granulares**: Asociar permisos específicos a cada rol
4. **Roles Temporales**: Implementar roles con fecha de expiración

### Métricas y Estadísticas

- Número de roles por empresa
- Roles más utilizados por empresa
- Usuarios sin roles asignados
- Roles inactivos que podrían eliminarse

## Conclusión

El diseño de roles por empresa proporciona un modelo robusto y escalable que mantiene la separación de responsabilidades y evita conflictos entre diferentes organizaciones. Las URLs reflejan correctamente esta estructura y facilitan tanto el desarrollo como el uso de la API.
