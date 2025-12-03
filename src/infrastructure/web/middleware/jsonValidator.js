const { logger } = require('../../../shared/logger');

// Middleware para manejar errores de JSON de manera más amigable
const jsonErrorHandler = (error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    logger.error('JSON Parse Error:', {
      method: req.method,
      url: req.url,
      error: error.message,
      headers: {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length']
      }
    });
    
    // Extraer información útil del error
    const positionMatch = error.message.match(/position (\d+)/);
    const lineMatch = error.message.match(/line (\d+)/);
    const columnMatch = error.message.match(/column (\d+)/);
    
    return res.status(400).json({
      success: false,
      error: {
        message: 'JSON inválido en el cuerpo de la petición',
        type: 'JSON_PARSE_ERROR',
        details: {
          originalError: error.message,
          position: positionMatch ? positionMatch[1] : 'unknown',
          line: lineMatch ? lineMatch[1] : 'unknown',
          column: columnMatch ? columnMatch[1] : 'unknown',
          tip: 'Verifica que el JSON esté bien formado: comillas, comas y llaves correctas'
        }
      }
    });
  }
  
  next(error);
};

module.exports = jsonErrorHandler;
