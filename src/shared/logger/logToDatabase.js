const { logger } = require('../../shared/logger');

/**
 * Guarda un log en la base de datos usando el modelo Log.
 * @param {Object} params - { level, message, meta, user, service }
 * @param {Object} databaseService - Instancia del servicio de base de datos (opcional, usa global si no se pasa)
 */
async function logToDatabase({ level, message, meta = null, user = null, service = 'AppService' }, databaseService = null) {
  try {
    const dbService = databaseService || global.databaseService;
    if (!dbService || !dbService.models || !dbService.models.Log) {
      logger.warn('No se pudo guardar el log en la base de datos: instancia de Log no disponible');
      return;
    }
    await dbService.models.Log.create({
      level,
      message,
      meta: meta ? JSON.stringify(meta) : null,
      timestamp: new Date(),
      user,
      service
    });
  } catch (err) {
    logger.warn('Error guardando log en la base de datos:', err);
  }
}

module.exports = { logToDatabase };
