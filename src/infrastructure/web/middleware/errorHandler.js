const { logger } = require('../../../shared/logger');
const { AppError } = require('../../../shared/errors');

const errorHandler = (error, req, res, next) => {
  let statusCode = 500;
  let message = 'Error interno del servidor';
  
  // Manejar errores de JSON parsing
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    statusCode = 400;
    message = 'JSON inválido en el cuerpo de la petición';
    
    logger.error(`JSON Syntax Error:`, {
      error: error.message,
      method: req.method,
      url: req.url,
      rawBody: error.body || 'No body available',
      headers: req.headers
    });
    
    return res.status(statusCode).json({
      success: false,
      error: {
        message: `${message}: ${error.message}`,
        type: 'JSON_PARSE_ERROR'
      }
    });
  }
  
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  
  logger.error(`Error ${statusCode}: ${message}`, {
    error: error.stack,
    method: req.method,
    url: req.url,
    body: req.body
  });
  
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

module.exports = errorHandler;
