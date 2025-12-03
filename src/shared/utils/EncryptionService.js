const crypto = require('crypto');

/**
 * Servicio de encriptación/desencriptación reversible para credenciales de API
 * Usa AES-256-GCM para encriptación segura y reversible
 * También soporta descifrado de formato CryptoJS legacy
 */
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.cryptoJsAlgorithm = 'aes-256-cbc';

    // Obtener clave de encriptación desde variable de entorno
    if (process.env.ENCRYPTION_KEY) {
      // Validar que sea un string hexadecimal de 64 caracteres (32 bytes)
      if (!/^[0-9a-f]{64}$/i.test(process.env.ENCRYPTION_KEY)) {
        throw new Error(
          'ENCRYPTION_KEY must be a 64-character hexadecimal string (32 bytes). ' +
          'Generate one using: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        );
      }
      // Convertir hex string a Buffer de 32 bytes
      this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    } else {
      // Clave por defecto SOLO para desarrollo (NO usar en producción)
      this.encryptionKey = crypto.createHash('sha256')
        .update('default-encryption-key-change-in-production')
        .digest();
    }

    // Verificar que la clave tiene exactamente 32 bytes
    if (this.encryptionKey.length !== 32) {
      throw new Error(`Encryption key must be exactly 32 bytes, got ${this.encryptionKey.length}`);
    }
  }

  /**
   * Encripta un texto plano
   * @param {string} text - Texto a encriptar
   * @returns {string} - Texto encriptado en formato: iv:encrypted:authTag
   */
  encrypt(text) {
    if (!text) {
      return null;
    }

    try {
      // Generar IV (Initialization Vector) aleatorio
      const iv = crypto.randomBytes(16);

      // Crear cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encriptar
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Obtener auth tag (para verificar integridad)
      const authTag = cipher.getAuthTag();

      // Retornar: iv:encrypted:authTag (todo en hex)
      return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  /**
   * Desencripta un texto encriptado
   * @param {string} encryptedText - Texto encriptado en formato: iv:encrypted:authTag
   * @returns {string} - Texto plano desencriptado
   */
  decrypt(encryptedText) {
    if (!encryptedText) {
      return null;
    }

    try {
      // Separar iv:encrypted:authTag
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const authTag = Buffer.from(parts[2], 'hex');

      // Crear decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Desencriptar
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }

  /**
   * Verifica si un texto está encriptado (formato válido)
   * @param {string} text - Texto a verificar
   * @returns {boolean}
   */
  isEncrypted(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    // Verificar formato AES-256-GCM: iv:encrypted:authTag (3 partes separadas por :)
    const parts = text.split(':');
    if (parts.length === 3 && parts.every(part => /^[0-9a-f]+$/i.test(part))) {
      return true;
    }

    // Verificar formato CryptoJS: Base64 que comienza con "U2FsdGVk" (= "Salted__")
    if (this.isCryptoJsFormat(text)) {
      return true;
    }

    return false;
  }

  /**
   * Verifica si el texto está en formato CryptoJS (Base64 con prefijo "Salted__")
   * @param {string} text - Texto a verificar
   * @returns {boolean}
   */
  isCryptoJsFormat(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }

    try {
      // CryptoJS usa Base64 y comienza con "Salted__" cuando se decodifica
      const decoded = Buffer.from(text, 'base64');
      return decoded.slice(0, 8).toString('utf8') === 'Salted__';
    } catch {
      return false;
    }
  }

  /**
   * Descifra texto encriptado con CryptoJS (formato OpenSSL)
   * @param {string} encryptedText - Texto encriptado en Base64 con formato CryptoJS
   * @param {string} passphrase - Passphrase usada para encriptar
   * @returns {string} - Texto descifrado
   */
  decryptCryptoJs(encryptedText, passphrase) {
    if (!encryptedText || !passphrase) {
      return null;
    }

    try {
      // Decodificar Base64
      const encryptedBuffer = Buffer.from(encryptedText, 'base64');

      // Verificar prefijo "Salted__"
      const prefix = encryptedBuffer.slice(0, 8).toString('utf8');
      if (prefix !== 'Salted__') {
        throw new Error('Invalid CryptoJS format: missing Salted__ prefix');
      }

      // Extraer salt (8 bytes después del prefijo)
      const salt = encryptedBuffer.slice(8, 16);

      // Extraer datos encriptados
      const ciphertext = encryptedBuffer.slice(16);

      // Derivar clave e IV usando EVP_BytesToKey (compatible con OpenSSL/CryptoJS)
      const { key, iv } = this.evpBytesToKey(passphrase, salt, 32, 16);

      // Descifrar con AES-256-CBC
      const decipher = crypto.createDecipheriv(this.cryptoJsAlgorithm, key, iv);
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error('CryptoJS decryption failed');
    }
  }

  /**
   * Implementación de EVP_BytesToKey (derivación de clave compatible con OpenSSL/CryptoJS)
   * @param {string} password - Contraseña
   * @param {Buffer} salt - Salt de 8 bytes
   * @param {number} keyLen - Longitud de clave en bytes
   * @param {number} ivLen - Longitud de IV en bytes
   * @returns {{key: Buffer, iv: Buffer}}
   */
  evpBytesToKey(password, salt, keyLen, ivLen) {
    const totalLen = keyLen + ivLen;
    const passwordBuffer = Buffer.from(password, 'utf8');

    let derivedBytes = Buffer.alloc(0);
    let block = Buffer.alloc(0);

    while (derivedBytes.length < totalLen) {
      // MD5(previous_block + password + salt)
      const hash = crypto.createHash('md5');
      hash.update(block);
      hash.update(passwordBuffer);
      hash.update(salt);
      block = hash.digest();
      derivedBytes = Buffer.concat([derivedBytes, block]);
    }

    return {
      key: derivedBytes.slice(0, keyLen),
      iv: derivedBytes.slice(keyLen, keyLen + ivLen)
    };
  }

  /**
   * Intenta descifrar un texto, detectando automáticamente el formato
   * @param {string} encryptedText - Texto encriptado
   * @param {string} cryptoJsPassphrase - Passphrase para CryptoJS (opcional)
   * @returns {string} - Texto descifrado
   */
  decryptAuto(encryptedText, cryptoJsPassphrase = null) {
    if (!encryptedText) {
      return null;
    }

    // Intentar formato AES-256-GCM primero
    const parts = encryptedText.split(':');
    if (parts.length === 3 && parts.every(part => /^[0-9a-f]+$/i.test(part))) {
      return this.decrypt(encryptedText);
    }

    // Intentar formato CryptoJS
    if (this.isCryptoJsFormat(encryptedText)) {
      if (!cryptoJsPassphrase) {
        // Intentar con passphrases comunes del proyecto
        const passphrases = [
          process.env.JWT_SECRET,
          process.env.API_KEY,
          process.env.ENCRYPTION_KEY,
          'secret',
          'password'
        ].filter(Boolean);

        for (const passphrase of passphrases) {
          try {
            return this.decryptCryptoJs(encryptedText, passphrase);
          } catch {
            // Continuar con siguiente passphrase
          }
        }
        throw new Error('Could not decrypt CryptoJS format: no valid passphrase found');
      }
      return this.decryptCryptoJs(encryptedText, cryptoJsPassphrase);
    }

    throw new Error('Unknown encryption format');
  }
}

module.exports = new EncryptionService();
