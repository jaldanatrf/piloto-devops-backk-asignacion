const { ValidationError, NotFoundError } = require('../../../shared/errors');

/**
 * BusinessRuleController - Controlador para procesar reglas empresariales
 */
class BusinessRuleController {
  constructor(businessRuleProcessorUseCases) {
    this.businessRuleProcessorUseCases = businessRuleProcessorUseCases;
  }

  /**
   * Procesar una reclamación y determinar usuarios a notificar
   */
  async processClaim(req, res, next) {
    try {
      const claimData = req.body;

      // Validar que se proporcionaron los datos mínimos
      if (!claimData || Object.keys(claimData).length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Claim data is required',
            details: 'Request body cannot be empty'
          }
        });
      }

      // Procesar la reclamación
      const result = await this.businessRuleProcessorUseCases.processClaim(claimData);

      // Determinar código de respuesta
      const statusCode = result.success ? 
        (result.users.length > 0 ? 200 : 204) : 404;

      res.status(statusCode).json({
        success: result.success,
        message: result.message,
        data: {
          claim: result.claim,
          company: result.company,
          users: result.users,
          appliedRules: result.appliedRules,
          summary: {
            totalUsersToNotify: result.users ? result.users.length : 0,
            totalRulesEvaluated: result.totalRulesEvaluated || 0,
            totalRulesApplied: result.totalRulesApplied || 0
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Probar una regla específica contra una reclamación
   */
  async testRule(req, res, next) {
    try {
      const { ruleId } = req.params;
      const claimData = req.body;

      if (!ruleId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Rule ID is required',
            details: 'Please provide a valid rule ID in the URL parameters'
          }
        });
      }

      if (!claimData || Object.keys(claimData).length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Claim data is required',
            details: 'Request body cannot be empty'
          }
        });
      }

      const result = await this.businessRuleProcessorUseCases.testRuleAgainstClaim(
        parseInt(ruleId), 
        claimData
      );

      res.status(200).json({
        success: true,
        message: `Rule test completed - ${result.applies ? 'APPLIES' : 'DOES NOT APPLY'}`,
        data: result
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estadísticas de reglas por empresa
   */
  async getCompanyRuleStats(req, res, next) {
    try {
      const { companyId } = req.params;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Company ID is required',
            details: 'Please provide a valid company ID in the URL parameters'
          }
        });
      }

      const stats = await this.businessRuleProcessorUseCases.getCompanyRuleStats(
        parseInt(companyId)
      );

      res.status(200).json({
        success: true,
        message: 'Company rule statistics retrieved successfully',
        data: {
          companyId: parseInt(companyId),
          statistics: stats
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Buscar empresa por número de documento
   */
  async findCompanyByDocument(req, res, next) {
    try {
      const { documentNumber } = req.params;

      if (!documentNumber) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Document number is required',
            details: 'Please provide a document number in the URL parameters'
          }
        });
      }

      const company = await this.businessRuleProcessorUseCases.findCompanyByDocumentNumber(documentNumber);

      if (!company) {
        return res.status(404).json({
          success: false,
          message: `No company found with document number: ${documentNumber}`,
          data: null
        });
      }

      res.status(200).json({
        success: true,
        message: 'Company found successfully',
        data: company
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint de prueba para validar el servicio con datos de ejemplo
   */
  async testWithSampleData(req, res, next) {
    try {
      const sampleClaim = {
        "ProcessId": 1234,
        "Target": "9000054312",
        "Source": "800000513", 
        "DocumentNumber": "FC98654",
        "InvoiceAmount": 200000,
        "ExternalReference": "100048",
        "ClaimId": "1111154",
        "ConceptApplicationCode": "GLO",
        "ObjectionCode": "FF4412",
        "Value": 200000
      };

      const result = await this.businessRuleProcessorUseCases.processClaim(sampleClaim);

      res.status(200).json({
        success: true,
        message: 'Sample claim processing completed',
        data: {
          sampleData: sampleClaim,
          result: result
        }
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = BusinessRuleController;
