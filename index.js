const Server = require('./src/infrastructure/web/server');
const { logger } = require('./src/shared/logger');
const fs = require('fs');
const https = require('https');

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  logger.error('Unhandled Rejection', { reason: reason?.message || reason, promise: promise?.toString() });
  // No salir inmediatamente, solo loggear
});

// Función principal para inicializar el servidor
async function startServer() {
  try {
    // Crear una instancia del servidor
    const server = new Server();
    
    // Iniciar el servidor
    await server.start();
    
    // Si hay configuración para HTTPS, configurar el servidor seguro
    if (process.env.cert && process.env.PORT_HTTPS) {
      try {
        const options = {
          key: fs.readFileSync(`./cert/${process.env.cert}_key.pem`),
          cert: fs.readFileSync(`./cert/${process.env.cert}.pem`)
        };
        
        const securePort = process.env.PORT_HTTPS;
        https.createServer(options, server.app).listen(securePort, () => {
          console.log(`🔒 Servidor HTTPS corriendo en puerto ${securePort}`);
          console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
          console.log(`📜 Certificado: ${process.env.cert}`);
        });
      } catch (certError) {
        logger.warn('No se pudo configurar HTTPS:', certError.message);
        console.log('⚠️  Continuando solo con HTTP...');
      }
    }
    
    // Configurar el manejo de cierre graceful
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await server.shutdown();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await server.shutdown();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();