const JwtService = require('../../../src/shared/security/JwtService');
const { UnauthorizedError, ValidationError } = require('../../../src/shared/errors');

// Mock del UserRepository para pruebas
class MockUserRepository {
  constructor() {
    this.users = [
      {
        id: 1,
        name: 'Juan Pérez',
        DUD: '12345678-9',
        companyId: 1,
        isActive: true,
        roles: [1, 2]
      },
      {
        id: 2,
        name: 'María González',
        DUD: '98765432-1',
        companyId: 2,
        isActive: false,
        roles: [3]
      }
    ];
  }

  async findByDUD(dud) {
    return this.users.find(user => user.DUD === dud) || null;
  }

  async findById(id) {
    return this.users.find(user => user.id === id) || null;
  }
}

describe('JwtService Security Tests', () => {
  let jwtService;
  let mockUserRepository;

  beforeAll(() => {
    // Configurar variables de entorno para las pruebas
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.API_KEY = 'test-api-key';
  });

  beforeEach(() => {
    mockUserRepository = new MockUserRepository();
    jwtService = new JwtService(mockUserRepository);
  });

  describe('API Key Validation', () => {
    test('should validate correct API key', () => {
      expect(() => {
        jwtService.validateApiKey('test-api-key');
      }).not.toThrow();
    });

    test('should reject invalid API key', () => {
      expect(() => {
        jwtService.validateApiKey('wrong-api-key');
      }).toThrow(UnauthorizedError);
    });

    test('should reject missing API key', () => {
      expect(() => {
        jwtService.validateApiKey(null);
      }).toThrow(UnauthorizedError);
    });
  });

  describe('User Validation by DUD', () => {
    test('should validate existing active user', async () => {
      const user = await jwtService.validateUserByDUD('12345678-9');
      expect(user).toBeDefined();
      expect(user.id).toBe(1);
      expect(user.name).toBe('Juan Pérez');
      expect(user.isActive).toBe(true);
    });

    test('should reject non-existing user', async () => {
      await expect(jwtService.validateUserByDUD('00000000-0'))
        .rejects.toThrow(UnauthorizedError);
    });

    test('should reject inactive user', async () => {
      await expect(jwtService.validateUserByDUD('98765432-1'))
        .rejects.toThrow(UnauthorizedError);
    });

    test('should reject missing DUD', async () => {
      await expect(jwtService.validateUserByDUD(null))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('Full Authentication Process', () => {
    test('should authenticate user successfully', async () => {
      const result = await jwtService.authenticateUser('test-api-key', '12345678-9');

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.id).toBe(1);
      expect(result.user.DUD).toBe('12345678-9');
      expect(result.expiresIn).toBe('24h');
    });

    test('should reject with invalid API key', async () => {
      await expect(jwtService.authenticateUser('wrong-key', '12345678-9'))
        .rejects.toThrow(UnauthorizedError);
    });

    test('should reject with non-existing user', async () => {
      await expect(jwtService.authenticateUser('test-api-key', '00000000-0'))
        .rejects.toThrow(UnauthorizedError);
    });

    test('should reject with inactive user', async () => {
      await expect(jwtService.authenticateUser('test-api-key', '98765432-1'))
        .rejects.toThrow(UnauthorizedError);
    });
  });

  describe('JWT Token Operations', () => {
    test('should generate and verify JWT token', () => {
      const payload = {
        id: 1,
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com',
        roles: [1, 2]
      };

      const token = jwtService.generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwtService.verifyToken(token);
      expect(decoded.id).toBe(1);
      expect(decoded.firstName).toBe('Juan');
      expect(decoded.lastName).toBe('Pérez');
      expect(decoded.email).toBe('juan@example.com');
      expect(decoded.roles).toEqual([1, 2]);
    });

    test('should reject invalid token', () => {
      expect(() => {
        jwtService.verifyToken('invalid-token');
      }).toThrow(UnauthorizedError);
    });

    test('should extract token from authorization header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const authHeader = `Bearer ${token}`;

      const extractedToken = jwtService.extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe(token);
    });

    test('should return null for invalid authorization header', () => {
      expect(jwtService.extractTokenFromHeader('Invalid header')).toBeNull();
      expect(jwtService.extractTokenFromHeader(null)).toBeNull();
    });
  });

  describe('Refresh Token Operations', () => {
    test('should generate and verify refresh token', () => {
      const payload = { id: 1 };
      
      const refreshToken = jwtService.generateRefreshToken(payload);
      expect(refreshToken).toBeDefined();
      
      const decoded = jwtService.verifyRefreshToken(refreshToken);
      expect(decoded.id).toBe(1);
      expect(decoded.type).toBe('refresh');
    });

    test('should reject non-refresh token as refresh token', () => {
      const regularToken = jwtService.generateToken({
        id: 1,
        name: 'Test',
        DUD: '12345678-9',
        companyId: 1,
        roles: []
      });
      
      expect(() => {
        jwtService.verifyRefreshToken(regularToken);
      }).toThrow(UnauthorizedError);
    });
  });
});

console.log('✅ Archivo de pruebas de JWT Security creado exitosamente');
console.log('Para ejecutar las pruebas, usar: npm test tests/unit/security/jwt-security.test.js');
