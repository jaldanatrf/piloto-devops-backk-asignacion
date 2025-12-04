# Documentación del Sistema de Asignaciones

## Índice General

### Sistema Core
- **[AUTO_ASSIGNMENTS.md](./AUTO_ASSIGNMENTS.md)** - Sistema de asignaciones automáticas con RabbitMQ y reglas de negocio
- **[ASSIGNMENT_API.md](./ASSIGNMENT_API.md)** - API REST para gestión de asignaciones (CRUD completo)

### Gestión de Usuarios y Roles
- **[ROLES.md](./ROLES.md)** - Sistema de roles globales, asignación a usuarios y permisos

### Empresas y Configuración
- **[REESTRUCTURACION_MODELO_DATOS.md](./REESTRUCTURACION_MODELO_DATOS.md)** - Modelo de datos y relaciones

### Seguridad
- **[JWT_SECURITY_SERVICE.md](./JWT_SECURITY_SERVICE.md)** - Servicio de autenticación y seguridad JWT
- **[RESPONSE_ENCRYPTION.md](./RESPONSE_ENCRYPTION.md)** - Encriptación de respuestas

### Integraciones
- **[FRONTEND_INTEGRATION_CODE_RULES.md](./FRONTEND_INTEGRATION_CODE_RULES.md)** - Integración frontend para reglas CODE
- **[MIGRATION_CODE_RULES.md](./MIGRATION_CODE_RULES.md)** - Migración de base de datos para reglas CODE

### Infraestructura y Deployment
- **[DEPLOYMENT_DATABASE.md](./DEPLOYMENT_DATABASE.md)** - Guía de despliegue de base de datos
- **[RESILIENCE_IMPLEMENTATION_PLAN.md](./RESILIENCE_IMPLEMENTATION_PLAN.md)** - Plan de implementación de resilencia
- **[SYSTEM_FLOW_DIAGRAMS.md](./SYSTEM_FLOW_DIAGRAMS.md)** - Diagramas de flujo del sistema

### Soluciones y Fixes
- **[SOLUCION_DUPLICACION_USUARIOS.md](./SOLUCION_DUPLICACION_USUARIOS.md)** - Solución a duplicación de usuarios

### API Specification
- **[swagger-external.yaml](./swagger-external.yaml)** - Especificación OpenAPI/Swagger

---

## Guía Rápida

### Para Desarrolladores Frontend
1. Leer [AUTO_ASSIGNMENTS.md](./AUTO_ASSIGNMENTS.md) - Entender el flujo de asignaciones
2. Leer [ASSIGNMENT_API.md](./ASSIGNMENT_API.md) - Endpoints disponibles
3. Leer [FRONTEND_INTEGRATION_CODE_RULES.md](./FRONTEND_INTEGRATION_CODE_RULES.md) - Integración de reglas

### Para Desarrolladores Backend
1. Leer [AUTO_ASSIGNMENTS.md](./AUTO_ASSIGNMENTS.md) - Arquitectura del sistema
2. Leer [ROLES.md](./ROLES.md) - Sistema de permisos
3. Leer [SYSTEM_FLOW_DIAGRAMS.md](./SYSTEM_FLOW_DIAGRAMS.md) - Flujos y arquitectura

### Para DevOps
1. Leer [DEPLOYMENT_DATABASE.md](./DEPLOYMENT_DATABASE.md) - Configuración de BD
2. Leer [MIGRATION_CODE_RULES.md](./MIGRATION_CODE_RULES.md) - Migraciones
3. Leer [RESILIENCE_IMPLEMENTATION_PLAN.md](./RESILIENCE_IMPLEMENTATION_PLAN.md) - Resilencia

---

## Estructura del Proyecto

```
back-asignaciones/
├── docs/                      # Documentación técnica
│   ├── README.md              # Este archivo (índice)
│   ├── AUTO_ASSIGNMENTS.md    # Sistema de asignaciones automáticas
│   ├── ROLES.md               # Sistema de roles
│   └── ...
├── claudedocs/                # Documentación de trabajo temporal
│   └── archive/               # Archivos históricos
└── src/                       # Código fuente
    ├── application/           # Casos de uso y servicios
    ├── domain/                # Entidades y lógica de negocio
    └── infrastructure/        # Adaptadores y framework
```

---

## Documentos Archivados

Los documentos de trabajo temporal de Claude (diagnósticos, correcciones específicas) se encuentran en `claudedocs/archive/` organizados por fecha.

---

## Contribuir a la Documentación

### Principios
1. **Un documento, un propósito**: Evitar duplicación
2. **Mantener actualizado**: Documentar cambios significativos
3. **Ejemplos prácticos**: Incluir ejemplos de uso reales
4. **Enlaces cruzados**: Referenciar documentos relacionados

### Ubicación de Nuevos Documentos
- **Documentación técnica permanente**: `docs/`
- **Documentación de trabajo temporal**: `claudedocs/`
- **Documentación histórica**: `claudedocs/archive/YYYY-MM-DD/`

---

**Última actualización**: 2025-12-03
