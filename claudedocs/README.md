# Claude Docs - Documentación de Trabajo

Este directorio contiene documentación temporal generada durante el trabajo con Claude Code.

## Propósito

- **Documentación temporal**: Diagnósticos, análisis y correcciones específicas
- **Archivos de trabajo**: Resultados de sesiones de debugging y optimización
- **Historial de cambios**: Registro de decisiones y correcciones importantes

## Estructura

```
claudedocs/
├── README.md           # Este archivo
└── archive/            # Archivos históricos organizados por fecha
    └── 2025-12-03/     # Ejemplo: sesión del 3 de diciembre 2025
        ├── RESUMEN_TRABAJO_COMPLETADO.md
        ├── CORRECCION_PRIORIZACION_REGLAS.md
        ├── DIAGNOSTICO_ASIGNACIONES.md
        └── ...
```

## Archivos Archivados

### 2025-12-03
- **RESUMEN_TRABAJO_COMPLETADO.md** - Resumen de limpieza de logs y corrección Source/Target
- **CORRECCION_PRIORIZACION_REGLAS.md** - Corrección de priorización de reglas de negocio
- **DIAGNOSTICO_ASIGNACIONES.md** - Diagnóstico de asignaciones en base de datos
- **VALIDACION_FINAL_EXITOSA.md** - Validación final del sistema
- **RESULTADO_VALIDACION_REGLAS.md** - Resultados de validación de reglas
- **LIMPIEZA_LOGS_STARTUP.md** - Documentación de limpieza de logs de inicio
- **CORRECCION_COMPANY_ID.md** - Corrección de lógica Source/Target en companyId

## Cuándo Archivar

Archiva documentos cuando:
1. El problema está resuelto y documentado en `docs/`
2. La sesión de trabajo está completa
3. La información es histórica y no necesita acceso frecuente

## Cuándo Mantener en Raíz

Mantén documentos en la raíz de `claudedocs/` cuando:
1. Estás trabajando activamente en el problema
2. Necesitas referencia rápida durante desarrollo
3. El documento está en progreso

## Relación con docs/

- **docs/**: Documentación técnica permanente del sistema
- **claudedocs/**: Documentación temporal de trabajo y debugging
- **claudedocs/archive/**: Historial de sesiones pasadas

---

**Nota**: Esta estructura ayuda a mantener limpia la documentación principal mientras preserva el historial de decisiones técnicas importantes.
