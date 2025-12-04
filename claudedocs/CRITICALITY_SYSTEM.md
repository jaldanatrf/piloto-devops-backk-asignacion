# Sistema de Criticidad de Tests

Sistema para organizar, priorizar y ejecutar tests según su impacto en el sistema.

---

## 📊 Niveles de Criticidad

### 🔴 CRÍTICA (`@critical`)
**Funcionalidad esencial del sistema. Fallos bloquean operación.**

**Ejemplos**:
- Conexión a base de datos
- Conexión a RabbitMQ
- Sistema de asignaciones automáticas
- Autenticación y seguridad JWT
- Creación de entidades core (empresas, usuarios)
- Inicialización del servidor

**Criterio**: Sin esto, el sistema no puede operar.

---

### 🟠 ALTA (`@high`)
**Funcionalidad principal del negocio. Impacta operaciones importantes.**

**Ejemplos**:
- Gestión de roles y permisos
- Creación y actualización de reglas de negocio
- Procesamiento de asignaciones
- Validaciones de negocio críticas
- APIs principales (CRUD de entidades core)
- Evaluación de reglas CODE

**Criterio**: Afecta directamente al flujo de negocio principal.

---

### 🟡 MEDIA (`@medium`)
**Funcionalidad secundaria. Importante pero no bloquea operaciones.**

**Ejemplos**:
- Búsqueda y filtros
- Estadísticas y reportes
- Configuraciones de empresa
- Endpoints de consulta avanzados
- Validaciones no críticas
- Manejo de errores específicos

**Criterio**: Mejora la experiencia pero el sistema funciona sin esto.

---

### 🟢 BAJA (`@low`)
**Funcionalidad auxiliar. No afecta operaciones principales.**

**Ejemplos**:
- Formateo de respuestas
- Ordenamiento de resultados
- Paginación
- Endpoints informativos (health, version)
- Features opcionales
- Validaciones de formato

**Criterio**: Nice-to-have, no afecta funcionalidad core.

---

## 🚀 Uso del Sistema

### 1. Importar el Helper
```javascript
const { describeCritical, describeHigh, describeMedium, describeLow } = require('../config/criticality');
```

### 2. Usar en Tests
```javascript
// Test crítico
describeCritical('Database Connection', () => {
  test('should connect to SQL Server', async () => {
    // Test code
  });
});

// Test alta prioridad
describeHigh('Role Management', () => {
  test('should create new roles', async () => {
    // Test code
  });
});

// Test media prioridad
describeMedium('Search Functionality', () => {
  test('should search by name', async () => {
    // Test code
  });
});

// Test baja prioridad
describeLow('Response Formatting', () => {
  test('should format responses', async () => {
    // Test code
  });
});
```

---

## 📦 Comandos NPM

### Ejecutar por Criticidad
```bash
# Solo tests críticos
npm run test:critical

# Solo tests alta prioridad
npm run test:high

# Solo tests media prioridad
npm run test:medium

# Solo tests baja prioridad
npm run test:low

# Críticos + Alta prioridad (lo más importante)
npm run test:priority

# Todos los tests
npm test
```

### Ejemplos de Uso

**En CI/CD - Validación Rápida**:
```bash
# Ejecutar solo tests críticos (2-3 min)
npm run test:critical
```

**Pre-deployment**:
```bash
# Ejecutar críticos + altos (5-10 min)
npm run test:priority
```

**Desarrollo Local**:
```bash
# Ejecutar todos los tests
npm test
```

**Debugging Específico**:
```bash
# Solo tests de un nivel
npm run test:medium
```

---

## 🎯 Estrategia de Implementación

### Fase 1: Tests Existentes
1. Identificar criticidad de cada suite
2. Agregar tags apropiados
3. Verificar que ejecuten correctamente

### Fase 2: Nuevos Tests
1. Determinar criticidad antes de escribir
2. Usar helper apropiado (describeCritical, describeHigh, etc.)
3. Documentar razón de la criticidad

### Fase 3: Integración CI/CD
1. Pipeline rápido: Solo críticos
2. Pipeline completo: Todos
3. Notificaciones por criticidad

---

## 📋 Matriz de Decisión

| Si el test valida... | Criticidad |
|---------------------|------------|
| Conexión a servicios externos (BD, Queue) | 🔴 CRÍTICA |
| Autenticación/Seguridad | 🔴 CRÍTICA |
| Flujo principal de negocio | 🔴 CRÍTICA o 🟠 ALTA |
| CRUD de entidades core | 🟠 ALTA |
| Validaciones de negocio | 🟠 ALTA |
| Búsquedas y filtros | 🟡 MEDIA |
| Estadísticas y reportes | 🟡 MEDIA |
| Formateo y presentación | 🟢 BAJA |
| Features opcionales | 🟢 BAJA |

---

## 🔍 Guía de Clasificación

### ¿Es CRÍTICO?
- [ ] ¿El sistema puede iniciar sin esto?
- [ ] ¿Los usuarios pueden operar sin esto?
- [ ] ¿Es un servicio externo esencial?

Si **alguna respuesta es NO**, es CRÍTICO.

### ¿Es ALTA?
- [ ] ¿Es parte del flujo de negocio principal?
- [ ] ¿Los usuarios lo usan frecuentemente?
- [ ] ¿Su fallo impacta operaciones importantes?

Si **2 o más respuestas son SÍ**, es ALTA.

### ¿Es MEDIA?
- [ ] ¿Mejora la experiencia del usuario?
- [ ] ¿Es una funcionalidad secundaria?
- [ ] ¿El sistema funciona sin esto pero peor?

Si **2 o más respuestas son SÍ**, es MEDIA.

### ¿Es BAJA?
- [ ] ¿Es principalmente cosmético?
- [ ] ¿Es opcional o auxiliar?
- [ ] ¿Su fallo no afecta operaciones?

Si **todas las respuestas son SÍ**, es BAJA.

---

## 📊 Reporte de Criticidad

Para ver distribución de tests por criticidad:

```bash
npm test -- --verbose | grep -E "@critical|@high|@medium|@low"
```

---

## 🎓 Mejores Prácticas

1. **Sea Consistente**: Usa la misma criticidad para tests similares
2. **Documente**: Agregue comentarios explicando por qué eligió esa criticidad
3. **Revise Regularmente**: La criticidad puede cambiar con el tiempo
4. **No Abuse de CRÍTICO**: Reserve para lo verdaderamente esencial
5. **Balance**: Distribuya tests razonablemente entre niveles

### Distribución Ideal
- 🔴 CRÍTICA: 10-15% de tests
- 🟠 ALTA: 30-40% de tests
- 🟡 MEDIA: 30-40% de tests
- 🟢 BAJA: 15-25% de tests

---

## 📁 Archivos del Sistema

```
tests/
├── config/
│   └── criticality.js          # Helpers y configuración
├── examples/
│   └── criticality-example.test.js  # Ejemplos de uso
└── helpers/
    └── authHelper.js           # Autenticación para tests
```

---

## 🔄 Mantenimiento

### Revisión Trimestral
1. Revisar distribución de criticidad
2. Ajustar tests según cambios en negocio
3. Actualizar documentación

### Al Agregar Features
1. Determinar criticidad de nuevos tests
2. Mantener balance en distribución
3. Documentar decisión

---

## ❓ FAQ

**¿Puedo tener múltiples criticidades en un archivo?**
Sí, cada describe puede tener su propia criticidad.

**¿Qué pasa si no uso tags de criticidad?**
Los tests se ejecutan normalmente con `npm test`.

**¿Cómo ejecuto tests sin criticidad específica?**
`npm test` ejecuta TODOS los tests, con y sin tags.

**¿Puedo cambiar la criticidad de un test?**
Sí, simplemente cambia el helper (ej: de describeLow a describeHigh).

**¿Los tags afectan el rendimiento?**
No, son solo etiquetas para filtrar.

---

## 📞 Soporte

Para preguntas sobre criticidad de tests específicos, consulte:
- `claudedocs/TEST_EXECUTION_REPORT.md` - Estado actual
- `claudedocs/TEST_QUICK_REFERENCE.md` - Guía rápida
- `tests/examples/criticality-example.test.js` - Ejemplos

---

**Última actualización**: 2025-12-04
**Versión**: 1.0.0
