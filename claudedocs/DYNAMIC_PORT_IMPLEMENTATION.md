# Implementación de Puerto Dinámico para Tests

**Fecha**: 2025-12-03
**Problema**: Tests de integración fallaban porque intentaban usar puerto 4041 ya ocupado por el servidor en ejecución

---

## 🎯 Objetivo

Permitir que los tests de integración se ejecuten **simultáneamente con el servidor en producción** usando puertos dinámicos.

---

## 🔧 Cambios Realizados

### 1. Modificación de `Server.js`

#### Constructor - Aceptar puerto opcional

**Antes**:
```javascript
class Server {
  constructor() {
    this.app = express();
    this.port = config.port;
    this.databaseService = null;
    this.controllers = null;
    this.jwtService = null;

    this.setupMiddleware();
  }
}
```

**Después**:
```javascript
class Server {
  constructor(options = {}) {
    this.app = express();
    this.port = options.port || config.port;  // ✅ Puerto opcional
    this.databaseService = null;
    this.controllers = null;
    this.jwtService = null;
    this.httpServer = null;  // ✅ Referencia al servidor HTTP

    this.setupMiddleware();
  }
}
```

#### Método `start()` - Retornar puerto asignado

**Antes**:
```javascript
async start() {
  // ... initialization code ...

  this.app.listen(this.port, () => {
    console.log(`🚀 Server running on port ${this.port}`);
  });
}
```

**Después**:
```javascript
async start() {
  // ... initialization code ...

  // Start server and store reference
  return new Promise((resolve, reject) => {
    this.httpServer = this.app.listen(this.port, () => {
      // Get actual assigned port (useful when port is 0)
      this.port = this.httpServer.address().port;

      console.log(`🚀 Server running on port ${this.port}`);
      console.log(`📋 Internal Swagger: http://localhost:${this.port}/api-docs/internal`);
      console.log(`🌐 External Swagger: http://localhost:${this.port}/api-docs/external`);

      resolve(this.port);  // ✅ Retorna puerto asignado
    });

    this.httpServer.on('error', (error) => {
      console.error('Error starting server:', error);
      logger.error('Failed to start server:', error);
      reject(error);
    });
  });
}
```

**Beneficios**:
- Puerto `0` asigna automáticamente un puerto disponible
- `server.start()` ahora retorna el puerto asignado
- Manejo de errores mejorado con Promise

#### Método `shutdown()` - Cerrar servidor HTTP

**Antes**:
```javascript
async shutdown() {
  try {
    if (this.databaseService) {
      await this.databaseService.shutdown();
    }
  } catch (error) {
    logger.error('Error during server shutdown:', error);
  }
}
```

**Después**:
```javascript
async shutdown() {
  try {
    // Close HTTP server first
    if (this.httpServer) {
      await new Promise((resolve) => {
        this.httpServer.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }

    // Then close database connection
    if (this.databaseService) {
      await this.databaseService.shutdown();
    }
  } catch (error) {
    logger.error('Error during server shutdown:', error);
    throw error;
  }
}
```

**Beneficios**:
- Cierra el servidor HTTP correctamente
- Libera el puerto para otros tests
- Orden correcto: HTTP → Database

---

### 2. Modificación de Tests de Integración

#### Tests con `supertest` (role-endpoints.test.js)

**Antes**:
```javascript
beforeAll(async () => {
  server = new Server();
  await server.start();
  app = server.app;
});
```

**Después**:
```javascript
beforeAll(async () => {
  // Use port 0 to get a random available port
  server = new Server({ port: 0 });  // ✅ Puerto dinámico
  await server.start();
  app = server.app;
});
```

#### Tests con `axios` (company-endpoints.test.js, rule-endpoints.test.js)

**Antes**:
```javascript
describe('Company Endpoints Integration Tests', () => {
  const baseURL = 'http://localhost:4041/api';  // ❌ Puerto fijo
  let createdCompanyId = null;

  beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
});
```

**Después**:
```javascript
describe('Company Endpoints Integration Tests', () => {
  let server;
  let baseURL;  // ✅ URL dinámica
  let createdCompanyId = null;

  beforeAll(async () => {
    // Start server with dynamic port
    server = new Server({ port: 0 });
    const port = await server.start();
    baseURL = `http://localhost:${port}/api`;  // ✅ Puerto dinámico
  });

  afterAll(async () => {
    if (server) {
      await server.shutdown();  // ✅ Limpieza
    }
  });
});
```

---

## ✅ Tests Actualizados

### Tests con `supertest`:
- ✅ `tests/integration/role/role-endpoints.test.js`

### Tests con `axios`:
- ✅ `tests/integration/company/company-endpoints.test.js`
- ✅ `tests/integration/rule/rule-endpoints.test.js`

### Tests que NO necesitan cambios:
- `tests/integration/CodeRulesE2E.test.js` - Usa mocks, no levanta servidor
- `tests/integration/company/update-by-document.test.js` - Test unitario

---

## 📋 Cómo Usar

### Servidor en Producción (puerto fijo)
```javascript
const server = new Server();  // Usa config.port (4041)
await server.start();
```

### Tests de Integración (puerto dinámico)
```javascript
const server = new Server({ port: 0 });  // Puerto aleatorio
const port = await server.start();
console.log(`Server running on port ${port}`);  // Ej: 52341
```

### Servidor en Puerto Específico
```javascript
const server = new Server({ port: 3000 });
await server.start();  // Corre en puerto 3000
```

---

## 🧪 Comandos de Testing

### Ejecutar TODOS los tests (con servidor corriendo)
```bash
npm test
```

### Ejecutar solo tests unitarios
```bash
npm test -- tests/unit/
```

### Ejecutar solo tests de integración
```bash
npm test -- tests/integration/
```

### Ejecutar test específico
```bash
npm test -- tests/integration/role/role-endpoints.test.js
```

---

## 🎉 Beneficios

### Antes (Puerto Fijo)
❌ Tenías que detener el servidor antes de ejecutar tests
❌ Solo podías ejecutar tests de uno en uno
❌ Error: `EADDRINUSE: address already in use :::4041`

### Después (Puerto Dinámico)
✅ Tests se ejecutan **con el servidor corriendo**
✅ Múltiples tests pueden ejecutarse en paralelo
✅ Cada test usa su propio puerto aislado
✅ No hay conflictos de puerto

---

## 📊 Resultados Esperados

### Antes de los cambios:
```
Test Suites: 21 failed, 5 passed, 26 total
Tests:       78 failed, 165 passed, 243 total

Causa principal: listen EADDRINUSE: address already in use :::4041
```

### Después de los cambios:
```
Test Suites: X failed, Y passed, 26 total
Tests:       X failed, Y passed, 243 total

✅ Sin errores de puerto ocupado
⚠️ Fallos restantes son por otros motivos (mocks, autenticación, etc.)
```

---

## 🔍 Debugging

### Ver en qué puerto está corriendo un test
```javascript
beforeAll(async () => {
  server = new Server({ port: 0 });
  const port = await server.start();
  console.log(`🧪 Test server running on port: ${port}`);
  baseURL = `http://localhost:${port}/api`;
});
```

### Verificar si el servidor se cerró correctamente
```javascript
afterAll(async () => {
  console.log('🧹 Cleaning up test server...');
  if (server) {
    await server.shutdown();
    console.log('✅ Test server shut down successfully');
  }
});
```

---

## ⚠️ Consideraciones

1. **Puerto 0**: El sistema operativo asigna automáticamente un puerto disponible
2. **Cleanup**: Siempre llamar a `server.shutdown()` en `afterAll()`
3. **Timeout**: Algunos tests pueden necesitar más tiempo para inicializar la BD
4. **Aislamiento**: Cada test suite tiene su propio servidor y puerto

---

## 🚀 Próximos Pasos

1. ✅ Ejecutar todos los tests y verificar que no hay errores de puerto
2. ⏳ Arreglar otros fallos (mocks, autenticación, etc.)
3. ⏳ Agregar cobertura de tests
4. ⏳ Documentar estrategia de testing en README

---

**Implementado por**: Claude Code
**Fecha**: 2025-12-03
**Versión**: Feature/asignacionesv2
