const {
  CreateCompanyUseCase,
  GetCompanyByIdUseCase,
  GetCompanyByDocumentNumberUseCase,
  GetCompanyByDocumentTypeAndNumberUseCase,
  GetAllCompaniesUseCase,
  UpdateCompanyUseCase,
  UpdateCompanyByDocumentUseCase,
  DeleteCompanyUseCase
} = require('../../../application/useCases/company/CompanyUseCases');

class CompanyController {
  constructor(companyUseCases) {
    this.companyUseCases = companyUseCases;
    
    if (!companyUseCases?.getCompanyByDocumentTypeAndNumber) {
      console.error('❌ getCompanyByDocumentTypeAndNumber is missing from companyUseCases');
    }
  }

  async create(req, res, next) {
    try {
      const company = await this.companyUseCases.createCompany.execute(req.body);
      
      res.status(201).json({
        success: true,
        data: company,
        message: 'Company created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const { includeRules } = req.query;
      
      const company = await this.companyUseCases.getCompanyById.execute(parseInt(id), includeRules === 'true');
      
      res.json({
        success: true,
        data: company
      });
    } catch (error) {
      next(error);
    }
  }

  async getByDocumentNumber(req, res, next) {
    try {
      const { documentNumber } = req.params;
      
      const company = await this.companyUseCases.getCompanyByDocumentNumber.execute(documentNumber);
      
      res.json({
        success: true,
        data: company
      });
    } catch (error) {
      next(error);
    }
  }

  async getByDocumentTypeAndNumber(req, res, next) {
    try {
      const { documentType, documentNumber } = req.params;
      const { includeRules } = req.query;
      
      // Diagnóstico temporal
      console.log('getByDocumentTypeAndNumber called with:', { documentType, documentNumber, includeRules });
      console.log('Available use cases:', Object.keys(this.companyUseCases || {}));
      
      if (!this.companyUseCases?.getCompanyByDocumentTypeAndNumber) {
        throw new Error('getCompanyByDocumentTypeAndNumber use case is not available');
      }
      
      const company = await this.companyUseCases.getCompanyByDocumentTypeAndNumber.execute(
        documentType, 
        documentNumber, 
        includeRules === 'true'
      );
      
      res.json({
        success: true,
        data: company
      });
    } catch (error) {
      console.error('Error in getByDocumentTypeAndNumber:', error);
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const { includeRules } = req.query;
      const filters = {
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        name: req.query.name,
        type: req.query.type
      };
      
      const companies = await this.companyUseCases.getAllCompanies.execute(filters, includeRules === 'true');
      
      res.json({
        success: true,
        data: companies,
        count: companies.length,
        includesRules: includeRules === 'true'
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      
      const company = await this.companyUseCases.updateCompany.execute(parseInt(id), req.body);
      
      res.json({
        success: true,
        data: company,
        message: 'Company updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateByDocument(req, res, next) {
    try {
      const { documentType, documentNumber } = req.params;
      
      const company = await this.companyUseCases.updateCompanyByDocument.execute(documentType, documentNumber, req.body);
      
      res.json({
        success: true,
        data: company,
        message: 'Company updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      await this.companyUseCases.deleteCompany.execute(parseInt(id));
      
      res.json({
        success: true,
        message: 'Company deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Método para obtener solo compañías activas
  async getActive(req, res, next) {
    try {
      const { includeRules } = req.query;
      
      const companies = await this.companyUseCases.getAllCompanies.execute({ isActive: true }, includeRules === 'true');
      
      res.json({
        success: true,
        data: companies,
        count: companies.length,
        includesRules: includeRules === 'true'
      });
    } catch (error) {
      next(error);
    }
  }

  // Método específico para obtener compañía con reglas
  async getWithRules(req, res, next) {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      const company = await this.companyUseCases.getCompanyById.execute(parseInt(id), true);
      let rules = Array.isArray(company.rules) ? company.rules : [];
      const total = rules.length;
      rules = rules.slice(offset, offset + limit);
      return res.status(200).json({
        success: true,
        message: 'Rules retrieved successfully',
        data: rules,
        count: rules.length,
        total,
        limit,
        offset
      });
    } catch (error) {
      next(error);
    }
  }

  // Método específico para obtener compañía con reglas por tipo y número de documento
  async getByDocumentTypeAndNumberWithRules(req, res, next) {
    try {
      const { documentType, documentNumber } = req.params;

      const company = await this.companyUseCases.getCompanyByDocumentTypeAndNumber.execute(
        documentType, 
        documentNumber, 
        true // Siempre incluir reglas en este endpoint
      );
      
      res.json({
        success: true,
        data: company,
        includesRules: true
      });
    } catch (error) {
      console.error('Error in getByDocumentTypeAndNumberWithRules:', error);
      next(error);
    }
  }
}

module.exports = CompanyController;
