# Servicio de Seguridad JWT con API Key

Este documento describe el servicio de seguridad JWT implementado con validación de API Key y verificación de usuario por DUD.

## Características

- ✅ Validación de API Key obligatoria
- ✅ Autenticación de usuario por DUD (Document Unique ID)  
- ✅ Verificación de usuario activo en base de datos
- ✅ Generación de tokens JWT y refresh tokens
- ✅ Middleware de autenticación y autorización
- ✅ Manejo de errores y logging
- ✅ Endpoints RESTful para autenticación

## Configuración

### Variables de Entorno

Agregar las siguientes variables a tu archivo `.env`:

```env
# JWT Configuration
JWT_SECRET=your-super-secure-secret-key-here
JWT_EXPIRES_IN=24h

# API Key Configuration  
API_KEY=your-api-key-here
```

### Base de datos

El servicio requiere que la tabla `users` tenga los siguientes campos:
- `id`: Primary key
- `name`: Nombre del usuario
- `DUD`: Document Unique ID (único)
- `companyId`: ID de la empresa
- `isActive`: Boolean indicando si el usuario está activo
- Relación con tabla `roles` a través de `user_roles`

## Endpoints

### 1. Login - Autenticación de Usuario

**POST** `/api/auth/login`

**Headers:**
```
x-api-key: your-api-key
Content-Type: application/json
```

**Body:**
```json
{
  "dud": "12345678-9"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h",
    "user": {
      "id": 1,
      "name": "Juan Pérez",
      "DUD": "12345678-9",
      "companyId": 1,
      "isActive": true,
      "rolesCount": 2
    }
  }
}
```

### 2. Refresh Token - Renovar Token

**POST** `/api/auth/refresh`

**Headers:**
```
x-api-key: your-api-key
Content-Type: application/json
```

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 3. Validate Token - Validar Token Actual

**GET** `/api/auth/validate`

**Headers:**
```
x-api-key: your-api-key
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Get Profile - Obtener Perfil de Usuario

**GET** `/api/auth/profile`

**Headers:**
```
x-api-key: your-api-key
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Middleware de Autenticación

### Uso Básico

```javascript
const { createFullAuthMiddleware } = require('./middleware/auth');

// En tu router
router.get('/protected-route', 
  createFullAuthMiddleware(jwtService), 
  (req, res) => {
    // req.user contiene la información del usuario autenticado
    res.json({ user: req.user });
  }
);
```

### Middleware Disponibles

1. **createApiKeyMiddleware(jwtService)** - Solo valida API Key
2. **createAuthMiddleware(jwtService)** - Solo valida JWT Token  
3. **createFullAuthMiddleware(jwtService)** - Valida API Key + JWT Token
4. **requireCompany(companyId)** - Requiere que el usuario pertenezca a una empresa específica
5. **requireRoles([roleIds])** - Requiere que el usuario tenga uno de los roles especificados

### Ejemplo de Uso Avanzado

```javascript
const { 
  createFullAuthMiddleware, 
  requireCompany, 
  requireRoles 
} = require('./middleware/auth');

// Ruta que requiere autenticación completa, empresa específica y roles
router.get('/admin/company/:companyId/reports',
  createFullAuthMiddleware(jwtService),
  requireCompany(1), // Solo usuarios de la empresa 1
  requireRoles([1, 2]), // Solo roles de admin (1) o manager (2)
  (req, res) => {
    res.json({ message: 'Acceso autorizado a reportes administrativos' });
  }
);
```

## Estructura del Token JWT

El token JWT contiene la siguiente información:

```json
{
  "id": 1,
  "name": "Juan Pérez", 
  "DUD": "12345678-9",
  "companyId": 1,
  "roles": [1, 2],
  "iat": 1640995200,
  "exp": 1641081600,
  "iss": "back-asignaciones",
  "aud": "back-asignaciones-client"
}
```

## Códigos de Error

| Código | Descripción |
|--------|-------------|
| `VALIDATION_ERROR` | Error de validación de entrada |
| `UNAUTHORIZED` | Credenciales inválidas o token expirado |
| `INVALID_API_KEY` | API Key inválida o faltante |
| `INSUFFICIENT_ROLES` | Usuario no tiene los roles requeridos |
| `FORBIDDEN` | Usuario no tiene permisos para el recurso |
| `INTERNAL_ERROR` | Error interno del servidor |

## Ejemplo de Uso en Cliente

### JavaScript/Node.js

```javascript
const axios = require('axios');

class AuthClient {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.token = null;
    this.refreshToken = null;
  }

  async login(dud) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/auth/login`, 
        { dud },
        {
          headers: {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        this.token = response.data.data.token;
        this.refreshToken = response.data.data.refreshToken;
        return response.data.data.user;
      }
    } catch (error) {
      throw new Error(`Login failed: ${error.response?.data?.error}`);
    }
  }

  async makeAuthenticatedRequest(endpoint, method = 'GET', data = null) {
    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'x-api-key': this.apiKey,
        'Authorization': `Bearer ${this.token}`
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expirado, intentar refrescar
        await this.refreshTokens();
        // Reintentar la petición original
        config.headers['Authorization'] = `Bearer ${this.token}`;
        const retryResponse = await axios(config);
        return retryResponse.data;
      }
      throw error;
    }
  }

  async refreshTokens() {
    const response = await axios.post(`${this.baseUrl}/api/auth/refresh`,
      { refreshToken: this.refreshToken },
      {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      this.token = response.data.data.token;
      this.refreshToken = response.data.data.refreshToken;
    }
  }
}

// Uso
const authClient = new AuthClient('http://localhost:3000', 'your-api-key');
const user = await authClient.login('12345678-9');
const profile = await authClient.makeAuthenticatedRequest('/api/auth/profile');
```

### cURL Examples

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"dud": "12345678-9"}'

# Usar token en petición autenticada
curl -X GET http://localhost:3000/api/auth/profile \
  -H "x-api-key: your-api-key" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Refrescar token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

## Seguridad

### Mejores Prácticas

1. **API Key**: Mantén tu API key segura y no la expongas en el código cliente
2. **JWT Secret**: Usa una clave secreta fuerte y única para JWT
3. **HTTPS**: Siempre usa HTTPS en producción
4. **Token Expiration**: Configura tiempos de expiración apropiados
5. **Refresh Tokens**: Usa refresh tokens para renovar acceso sin re-autenticar
6. **Rate Limiting**: Implementa límites de velocidad en endpoints de autenticación
7. **Logging**: Registra todos los intentos de autenticación para auditoría

### Configuración Recomendada para Producción

```env
JWT_SECRET=super-long-random-secret-key-at-least-32-characters
JWT_EXPIRES_IN=15m
API_KEY=secure-random-api-key-here
NODE_ENV=production
```

## Testing

Ejecutar las pruebas del servicio:

```bash
# Pruebas unitarias del servicio JWT
npm test tests/unit/security/jwt-security.test.js

# Pruebas de integración de endpoints
npm test tests/integration/auth/
```

## Troubleshooting

### Problemas Comunes

1. **"API key is required"**: Asegúrate de enviar el header `x-api-key`
2. **"User not found"**: Verifica que el DUD existe en la tabla users
3. **"User is not active"**: El usuario existe pero `isActive = false`
4. **"Invalid token"**: El token JWT es inválido o está mal formado
5. **"Token has expired"**: Usa el refresh token para obtener uno nuevo

### Debug Mode

Habilitar logs detallados:

```env
NODE_ENV=development
LOG_LEVEL=debug
```

## Changelog

### v1.0.0
- ✅ Implementación inicial del servicio JWT con API Key
- ✅ Autenticación por DUD y validación de usuario activo
- ✅ Middleware de autenticación y autorización
- ✅ Endpoints RESTful completos
- ✅ Documentación y ejemplos de uso
- ✅ Pruebas unitarias
