const { logger } = require('../../shared/logger');
const { logToDatabase } = require('../../shared/logger/logToDatabase');

/**
 * AutoAssignmentBootstrap - Configuración de inicialización para asignaciones automáticas
 * Maneja el arranque y configuración del servicio de cola RabbitMQ
 */
class AutoAssignmentBootstrap {
  constructor(autoAssignmentUseCases, databaseService = null) {
    this.autoAssignmentUseCases = autoAssignmentUseCases;
    this.databaseService = databaseService;
    this.isAutoStartEnabled = process.env.AUTO_START_QUEUE === 'true';
    this.retryDelay = 10000; // 10 segundos
    this.maxRetries = 3;
  }

  /**
   * Inicializar el servicio de asignaciones automáticas si está habilitado
   */
  async initialize() {
    if (!this.isAutoStartEnabled) {
      return;
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await this.autoAssignmentUseCases.initializeQueueService();
        return;

      } catch (error) {
        logger.error(`❌ Failed to start assignment queue service (attempt ${attempt}/${this.maxRetries}):`, error);
        await logToDatabase({
          level: 'error',
          message: `Failed to start assignment queue service (attempt ${attempt}/${this.maxRetries})`,
          meta: { error: error.message, stack: error.stack, attempt, maxRetries: this.maxRetries },
          service: 'AutoAssignmentBootstrap'
        }, this.databaseService);

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay);
        } else {
          logger.error('💥 Max retry attempts reached. Assignment queue service not started.');
          await logToDatabase({
            level: 'error',
            message: 'Max retry attempts reached. Assignment queue service not started.',
            meta: { maxRetries: this.maxRetries, totalAttempts: attempt },
            service: 'AutoAssignmentBootstrap'
          }, this.databaseService);
        }
      }
    }
  }

  /**
   * Configurar manejadores de cierre graceful
   */
  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      try {
        await this.autoAssignmentUseCases.stopQueueService();
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during graceful shutdown:', error);
        await logToDatabase({
          level: 'error',
          message: 'Error during graceful shutdown',
          meta: { signal, error: error.message, stack: error.stack },
          service: 'AutoAssignmentBootstrap'
        }, this.databaseService);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('💥 Uncaught Exception:', error);
      logToDatabase({
        level: 'error',
        message: 'Uncaught Exception',
        meta: { error: error.message, stack: error.stack },
        service: 'AutoAssignmentBootstrap'
      }, this.databaseService).finally(() => {
        gracefulShutdown('UNCAUGHT_EXCEPTION');
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      logToDatabase({
        level: 'error',
        message: 'Unhandled Rejection',
        meta: { reason: reason?.message || reason, stack: reason?.stack, promise: promise.toString() },
        service: 'AutoAssignmentBootstrap'
      }, this.databaseService).finally(() => {
        gracefulShutdown('UNHANDLED_REJECTION');
      });
    });
  }

  /**
   * Verificar configuración del entorno
   */
  validateEnvironment() {
    const requiredEnvVars = ['ASSIGNMENT_QUEUE'];
    const missingVars = [];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      logger.warn('⚠️ Missing environment variables for assignment queue:', missingVars);
      logToDatabase({
        level: 'warn',
        message: 'Missing environment variables for assignment queue',
        meta: { missingVariables: missingVars },
        service: 'AutoAssignmentBootstrap'
      }, this.databaseService);
      return false;
    }

    return true;
  }

  /**
   * Obtener estado de configuración
   */
  getConfigurationStatus() {
    return {
      autoStartEnabled: this.isAutoStartEnabled,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      environmentConfigured: this.validateEnvironment(),
      queueUrl: process.env.ASSIGNMENT_QUEUE ? 'configured' : 'not configured',
      nodeEnv: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Mostrar información de configuración
   */
  logConfigurationInfo() {
    const config = this.getConfigurationStatus();

    if (!config.environmentConfigured) {
      logger.warn('⚠️ Environment not properly configured');
      logToDatabase({
        level: 'warn',
        message: 'Environment not properly configured',
        meta: config,
        service: 'AutoAssignmentBootstrap'
      }, this.databaseService);
    }
  }
}

module.exports = AutoAssignmentBootstrap;
