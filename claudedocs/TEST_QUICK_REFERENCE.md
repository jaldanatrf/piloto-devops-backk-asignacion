# Guía Rápida de Tests - Estado y Acciones

## 🚨 Estado Actual: 68% Tests Pasando (165/243)

**PROBLEMAS RESUELTOS**:
- ✅ Puerto dinámico implementado correctamente (server.js:69)
- ✅ Helper de autenticación JWT creado (tests/helpers/authHelper.js)

**SIGUIENTE PASO**: Agregar headers de autenticación a todos los requests de tests de integración

---

## ⚡ Solución Rápida - Ejecutar Tests Ahora

### 1. Detener Servidor en Puerto 4041
```bash
# Windows
netstat -ano | findstr :4041
taskkill /PID <PID_NUMBER> /F

# Luego ejecutar tests
npm test
```

### 2. Ejecutar Solo Tests Unitarios (Sin BD/RabbitMQ)
```bash
# Tests que NO requieren infraestructura
npm test -- tests/unit/businessRules/
npm test -- tests/unit/company/Company.test.js
npm test -- tests/unit/user/User.test.js
npm test -- tests/unit/role/Role.test.js
npm test -- tests/unit/resilience/
```

---

## 🔴 TESTS CRÍTICOS - Estado

### ❌ 1. Conexión a Base de Datos
**Test**: `tests/unit/assigment/assignmentRepository.test.js`
**Estado**: 0/6 pasando (0%)
**Problema**: Intenta conectar a `localhost:1433` que no existe
**Solución**: Usar mocks en lugar de BD real

### ❌ 2. Conexión a RabbitMQ
**Test**: `tests/unit/assigment/assignmentQueueService.methods.test.js`
**Estado**: 5/8 pasando (63%)
**Problema**: Timeout conectando a RabbitMQ
**Solución**: Configurar `ASSIGNMENT_QUEUE` o usar mocks

### ❌ 3. Creación de Reglas
**Test**: `tests/unit/rule/RuleUseCases.test.js`
**Estado**: 4/13 pasando (31%)
**Problema**: `companyRepository` mock no retorna empresa
**Solución**: Arreglar mock para retornar `{ id: 1, name: 'Test' }`

### ❌ 4. Creación de Roles
**Test**: `tests/integration/role/role-endpoints.test.js`
**Estado**: 0/21 pasando (0%)
**Problema**: ✅ Puerto dinámico funciona + ❌ sin autenticación (401 Unauthorized)
**Solución**: Agregar auth token a los requests de test

### ⚠️ 5. Flujo Mensajería → Asignación
**Test**: `tests/unit/assigment/assignmentQueueService.test.js`
**Estado**: 2/2 pasando (100%) ✅
**Nota**: Lógica funciona, pero infraestructura falla

---

## 🟠 TESTS ALTA PRIORIDAD - Estado

### ✅ 1. Entidades de Dominio
- `Company.test.js`: 18/18 ✅
- `User.test.js`: 13/13 ✅
- `Role.test.js`: 9/9 ✅

### ✅ 2. Reglas CODE
- `CodeRuleEvaluation.test.js`: 18/18 ✅
- `RulePrioritization.test.js`: 19/19 ✅
- `RuleEntity.code.test.js`: 25/25 ✅

### ❌ 3. Casos de Uso de Empresas
**Test**: `tests/unit/company/CompanyUseCases.test.js`
**Estado**: 0/10 pasando (0%)
**Problema**: Mock de repositorio incorrecto

### ❌ 4. Seguridad JWT
**Test**: `tests/unit/security/jwt-security.test.js`
**Estado**: 0/7 pasando (0%)
**Problema**: Servicio JWT no inicializado

---

## 🎯 Tests por Categoría

| Criticidad | Total | Pasando | Fallando | % |
|------------|-------|---------|----------|---|
| 🔴 **Críticos** | 53 | 20 | 33 | 38% |
| 🟠 **Altos** | 93 | 75 | 18 | 81% |
| 🟡 **Medios** | 41 | 26 | 15 | 63% |
| 🟢 **Bajos** | 56 | 44 | 12 | 79% |

---

## 📋 Plan de Acción Priorizado

### ✅ Hoy (2 horas)
1. **Detener servidor puerto 4041**
2. **Arreglar 3 mocks más críticos**:
   - `RuleUseCases.test.js` → companyRepository.findById()
   - `CompanyUseCases.test.js` → companyRepository.findByName()
   - `jwt-security.test.js` → Inicializar JWTSecurityService

### ⚡ Esta Semana (1 día)
1. **Configurar `.env.test`** con:
   ```
   DB_HOST=localhost
   DB_NAME=test_db
   ASSIGNMENT_QUEUE=amqp://localhost
   ```
2. **Separar tests unitarios de integración**
3. **Agregar helper de autenticación** para tests de integración

### 🚀 Próxima Semana (2 días)
1. **Crear suite de tests E2E real**
2. **Configurar Docker Compose** para BD y RabbitMQ de test
3. **Agregar coverage gates** al CI/CD

---

## 🔧 Comandos Útiles

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con coverage
npm test:coverage

# Ver reporte de coverage en navegador
npm run coverage:open

# Ejecutar solo tests unitarios (rápido)
npm test -- tests/unit/

# Ejecutar solo tests de un módulo
npm test -- tests/unit/businessRules/

# Ejecutar en modo watch (desarrollo)
npm test:watch

# Tests manuales E2E
npm run test:auto-assignments
npm run test:manual:company
npm run test:manual:roles
```

---

## 📊 Métricas Objetivo

| Métrica | Actual | Objetivo | Gap |
|---------|--------|----------|-----|
| Tests críticos pasando | 38% | 95% | -57% |
| Tests totales pasando | 68% | 90% | -22% |
| Coverage total | ? | 80% | ? |
| Tests E2E funcionando | 0% | 100% | -100% |

---

## ⚠️ Bloqueadores Actuales

1. ✅ ~~**Puerto 4041 ocupado**~~ - RESUELTO con puerto dinámico
2. 🔴 **Sin autenticación en tests** - BLOQUEA 21+ tests de API (401 Unauthorized)
3. 🔴 **Mocks incorrectos** - BLOQUEA 35 tests unitarios
4. 🟠 **BD no configurada** - BLOQUEA 6 tests de repositorio

---

## 📞 Contacto para Tests

- **Reporte completo**: `claudedocs/TEST_EXECUTION_REPORT.md`
- **Fecha**: 2025-12-03
- **Tests totales**: 243 (26 suites)
- **Tiempo ejecución**: 31 segundos
