# Diagnóstico de Asignaciones en Base de Datos

**Fecha**: 2025-12-03
**Problema reportado**: "Estoy enviando mensajes a la cola, pero no está insertando el registro en BD con el usuario que quedó con la asignación"

---

## ✅ Resultado del Diagnóstico

**El sistema está funcionando CORRECTAMENTE** ✅

Las asignaciones SÍ se están guardando en la base de datos con los usuarios asignados correctamente.

---

## 📊 Evidencia

### Total de Asignaciones
- **Total en BD**: 15 asignaciones
- **Creadas hoy**: 11 asignaciones
- **Estado Assigned**: 8 asignaciones
- **Estado Pending**: 7 asignaciones

### Últimas Asignaciones (ID 11-15) - ✅ FUNCIONANDO CORRECTAMENTE

| ID | Usuario Asignado | Estado | ClaimId | Source | Fecha |
|----|------------------|--------|---------|--------|-------|
| 15 | Desarrollo Leandro Correa (ID:28) | assigned | 901002487_20253152_11_GLO_TA02 | 860037950 | 10:22:35 |
| 14 | Desarrollo Leandro Correa (ID:28) | assigned | 901002487_20253152_11_GLO_TA02 | 860037950 | 10:22:18 |
| 13 | Desarrollo Leandro Correa (ID:28) | assigned | 901002487_20253152_11_GLO_TA02 | 860037950 | 10:20:34 |
| 12 | Desarrollo Leandro Correa (ID:28) | assigned | 901002487_20253152_11_GLO_TA02 | 860037950 | 10:17:59 |
| 11 | Daniela QA Benitez (ID:32) | assigned | 901002487_20253152_11_GLO_TA02 | 860037950 | 10:12:09 |

**Observación**: Todas estas asignaciones tienen:
- ✅ Usuario asignado correctamente (ID no es NULL)
- ✅ Source correcto (860037950 - Fundación Santa Fe que tiene las reglas)
- ✅ Estado "assigned"
- ✅ Información completa del claim (ClaimId, ProcessId, DocumentNumber, etc.)

### Asignaciones Anteriores (ID 6-10) - ⚠️ DATOS INCORRECTOS (ANTES DE LA CORRECCIÓN)

| ID | Usuario Asignado | Estado | Source | Fecha |
|----|------------------|--------|--------|-------|
| 10 | NULL | pending | 901002487 | 10:09:58 |
| 9 | NULL | pending | 901002487 | 10:08:58 |
| 8 | NULL | pending | 901002487 | 08:42:09 |
| 7 | NULL | pending | 901002487 | 08:40:43 |
| 6 | NULL | pending | 901002487 | 08:38:51 |

**Observación**: Estas asignaciones tienen:
- ❌ Source incorrecto (901002487 - CTIC que NO tiene reglas configuradas)
- ❌ Usuario NULL porque no se encontraron reglas
- ⚠️ Estas son de ANTES de corregir los datos en la BD

---

## 🔍 Análisis del Flujo

### 1. Mensaje llega a la cola ✅
```
Queue: ASSIGNMENT_QUEUE
Message: {
  "ProcessId": "LOTE-20251003163406-EDEBBF84",
  "Source": "860037950",  // Empresa con reglas
  "Target": "901002487",   // Empresa destino
  "ClaimId": "901002487_20253152_11_GLO_TA02",
  ...
}
```

### 2. AssignmentQueueService.processMessage() ✅
- Parsea el mensaje
- Valida estructura
- Llama a `businessRuleProcessorUseCases.processClaim()`

### 3. BusinessRuleProcessorUseCases.processClaim() ✅
- Consulta reglas desde Source (860037950)
- Encuentra 2 reglas: CODE y COMPANY-CODE
- Evalúa ambas reglas
- Prioriza COMPANY-CODE (especificidad 2 > CODE especificidad 6)
- Retorna usuario: Desarrollo Leandro Correa

### 4. Selección de Usuario ✅
```javascript
const selectedUser = await this.selectUserWithLeastAssignments(candidateUsers);
// Resultado: Desarrollo Leandro Correa (ID: 28)
```

### 5. Creación de Asignación ✅
```javascript
const assignment = await this.createAssignment(
  selectedUser,
  processResult,
  claimData,
  targetCompany
);
// assignmentRepository.create() se ejecuta correctamente
// Inserta en BD con userId=28, companyId=7, status='assigned'
```

### 6. Guardado en BD ✅
```javascript
// SequelizeAssignmentRepository.create() línea 102
const savedAssignment = await this.AssignmentModel.create(assignmentData);
// ✅ INSERT exitoso en tabla assignments
```

---

## 📈 Timeline de Corrección

1. **Antes de las 10:12 am**:
   - Source estaba en 901002487 (incorrecto)
   - No se encontraban reglas
   - userId quedaba en NULL

2. **10:12 am - Se corrigió Source a 860037950**:
   - Sistema encuentra reglas correctamente
   - Asigna usuario Daniela QA Benitez (ID:11)

3. **10:17 - 10:22 am**:
   - Múltiples mensajes procesados correctamente
   - Usuario Desarrollo Leandro Correa asignado (ID:12-15)
   - Priorización funcionando (COMPANY-CODE > CODE)

---

## 🎯 Conclusión

### El Sistema está Funcionando Correctamente ✅

**Evidencia**:
1. ✅ **Mensajes se reciben de la cola** - 11 asignaciones creadas hoy
2. ✅ **Reglas se evalúan correctamente** - Source=860037950 encuentra 2 reglas
3. ✅ **Priorización funciona** - COMPANY-CODE (prioridad 2) gana sobre CODE (prioridad 6)
4. ✅ **Usuario se asigna** - Desarrollo Leandro Correa (ID:28) en últimas 4 asignaciones
5. ✅ **Guardado en BD funciona** - assignmentRepository.create() inserta correctamente
6. ✅ **Datos completos** - ClaimId, ProcessId, Source, DocumentNumber, todos guardados

### Asignaciones con userId NULL son Normales

Hay 7 asignaciones con `userId NULL` y `status=pending`, que ocurren cuando:
1. No se encuentran reglas activas para la empresa Source
2. No hay usuarios que cumplan con los criterios de las reglas
3. Todas las reglas están inactivas

**Esto es comportamiento esperado y correcto del sistema**. Las asignaciones se guardan con `userId=NULL` para tracking, pero no se notifica a nadie.

---

## 🔧 Script de Verificación

Se creó el script `scripts/check-assignments.js` para verificar asignaciones en BD:

```bash
node scripts/check-assignments.js
```

**Output**:
- Total de asignaciones
- Últimas 10 asignaciones con detalles
- Estadísticas por estado
- Asignaciones creadas hoy
- Asignaciones sin usuario (si las hay)

---

## 💡 Recomendaciones

### Para Verificar que Todo Funciona:

1. **Enviar mensaje de prueba a la cola**:
   ```json
   {
     "ProcessId": "TEST-" + Date.now(),
     "Source": "860037950",  // Empresa con reglas
     "Target": "901002487",
     "DocumentNumber": "TEST_DOC",
     "InvoiceAmount": "1000",
     "ClaimId": "TEST_CLAIM",
     "ObjectionCode": "abc123",
     "Value": "1000",
     "ExternalReference": "TEST"
   }
   ```

2. **Verificar en BD**:
   ```bash
   node scripts/check-assignments.js
   ```

3. **Debe aparecer**:
   - Nueva asignación con usuario asignado (Desarrollo Leandro Correa o Daniela QA Benitez)
   - Estado: "assigned"
   - Todos los campos del mensaje guardados

### Para Monitorear Problemas:

1. **Logs del servicio de cola** en la tabla `logs`:
   ```sql
   SELECT * FROM logs
   WHERE service = 'AssignmentQueueService'
   AND level IN ('error', 'warn')
   ORDER BY timestamp DESC;
   ```

2. **Asignaciones pendientes sin usuario**:
   ```sql
   SELECT * FROM assignments
   WHERE user_id IS NULL
   AND status = 'pending'
   ORDER BY created_at DESC;
   ```

---

## 📝 Estado Final

| Componente | Estado | Notas |
|------------|--------|-------|
| Cola RabbitMQ | ✅ Funcionando | Mensajes se reciben correctamente |
| BusinessRuleProcessor | ✅ Funcionando | Evaluación y priorización correctas |
| AssignmentRepository | ✅ Funcionando | Guardado en BD exitoso |
| Asignación de Usuarios | ✅ Funcionando | Usuario se selecciona correctamente |
| Datos en BD | ✅ Correctos | Últimas 5 asignaciones con userId válido |

**Sistema validado y operativo** ✅

---

**Diagnóstico realizado por**: Claude Code
**Fecha**: 2025-12-03
**Método**: Análisis de código + Verificación directa en BD + Script de diagnóstico
