const { ValidationError, NotFoundError } = require('../../../shared/errors');

/**
 * AutoAssignmentController - Controlador para asignaciones automáticas
 */
class AutoAssignmentController {
  constructor(autoAssignmentUseCases) {
    this.autoAssignmentUseCases = autoAssignmentUseCases;
  }

  /**
   * Inicializar el servicio de cola automática
   */
  async initializeService(req, res) {
    try {
      const result = await this.autoAssignmentUseCases.initializeQueueService();

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.status,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to initialize assignment queue service',
        error: {
          name: error.name,
          message: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Detener el servicio de cola automática
   */
  async stopService(req, res) {
    try {
      const result = await this.autoAssignmentUseCases.stopQueueService();

      res.status(200).json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to stop assignment queue service',
        error: {
          name: error.name,
          message: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtener el estado del servicio de cola
   */
  async getServiceStatus(req, res) {
    try {
      const result = await this.autoAssignmentUseCases.getQueueServiceStatus();

      res.status(200).json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get service status',
        error: {
          name: error.name,
          message: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Procesar una reclamación manualmente
   */
  async processClaimManually(req, res) {
    try {
      const claimData = req.body;

      // Validar datos básicos
      if (!claimData || typeof claimData !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Invalid claim data provided',
          error: {
            name: 'ValidationError',
            message: 'Request body must contain valid claim data'
          },
          timestamp: new Date().toISOString()
        });
      }

      const result = await this.autoAssignmentUseCases.processClaimManually(claimData);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      const statusCode = error instanceof ValidationError ? 400 : 
                        error instanceof NotFoundError ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: 'Failed to process claim manually',
        error: {
          name: error.name,
          message: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtener estadísticas de asignaciones automáticas
   */
  async getAssignmentStats(req, res) {
    try {
      const {
        startDate,
        endDate,
        userId,
        status,
        type
      } = req.query;

      // Construir filtros
      const filters = {};
      
      if (startDate) {
        filters.startDate = new Date(startDate);
      }
      
      if (endDate) {
        filters.endDate = new Date(endDate);
      }
      
      if (userId) {
        filters.userId = parseInt(userId);
      }
      
      if (status) {
        filters.status = status;
      }
      
      if (type) {
        filters.type = type;
      }

      const result = await this.autoAssignmentUseCases.getAutoAssignmentStats(filters);

      res.status(200).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get assignment statistics',
        error: {
          name: error.name,
          message: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Enviar mensaje de prueba a la cola
   */
  async sendTestMessage(req, res) {
    try {
      let testClaimData = req.body;

      // Si no se proporciona data, usar datos de ejemplo
      if (!testClaimData || Object.keys(testClaimData).length === 0) {
        testClaimData = {
          ProcessId: 9999,
          Target: "9000054312",
          Source: "800000999",
          DocumentNumber: `TEST_${Date.now()}`,
          InvoiceAmount: 150000,
          ExternalReference: `TEST_REF_${Date.now()}`,
          ClaimId: `TEST_CLAIM_${Date.now()}`,
          ConceptApplicationCode: "TEST",
          ObjectionCode: "T001",
          Value: 150000
        };
      }

      const result = await this.autoAssignmentUseCases.sendTestMessage(testClaimData);

      res.status(200).json({
        ...result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to send test message',
        error: {
          name: error.name,
          message: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Obtener ejemplo de estructura de mensaje para la cola
   */
  async getMessageExample(req, res) {
    try {
      const exampleMessage = {
        ProcessId: 1234,
        Target: "9000054312",
        Source: "800000513",
        DocumentNumber: "FC98654",
        InvoiceAmount: 200000,
        ExternalReference: "100048",
        ClaimId: "1111154",
        ConceptApplicationCode: "GLO",
        ObjectionCode: "FF4412",
        Value: 200000
      };

      const documentation = {
        requiredFields: [
          {
            field: "ProcessId",
            type: "number",
            description: "Identificador único del proceso"
          },
          {
            field: "Target",
            type: "string",
            description: "NIT o documento de la empresa objetivo"
          },
          {
            field: "Source",
            type: "string",
            description: "NIT o documento de la empresa fuente"
          },
          {
            field: "DocumentNumber",
            type: "string",
            description: "Número del documento asociado"
          },
          {
            field: "InvoiceAmount",
            type: "number",
            description: "Monto de la factura (debe ser positivo)"
          },
          {
            field: "ExternalReference",
            type: "string",
            description: "Referencia externa del proceso"
          },
          {
            field: "ClaimId",
            type: "string",
            description: "Identificador único de la reclamación"
          },
          {
            field: "ConceptApplicationCode",
            type: "string",
            description: "Código de concepto de aplicación"
          },
          {
            field: "ObjectionCode",
            type: "string",
            description: "Código de objeción"
          },
          {
            field: "Value",
            type: "number",
            description: "Valor de la reclamación (debe ser positivo)"
          }
        ],
        optionalFields: [
          {
            field: "AdditionalInfo",
            type: "object",
            description: "Información adicional sobre la reclamación"
          }
        ]
      };

      res.status(200).json({
        success: true,
        data: {
          example: exampleMessage,
          documentation: documentation,
          queueName: process.env.ASSIGNMENT_QUEUE ? "configured" : "not configured",
          usage: {
            description: "Envía este tipo de mensaje a la cola RabbitMQ para procesamiento automático",
            endpoint: "/api/auto-assignments/test-message",
            method: "POST"
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get message example',
        error: {
          name: error.name,
          message: error.message
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = AutoAssignmentController;
