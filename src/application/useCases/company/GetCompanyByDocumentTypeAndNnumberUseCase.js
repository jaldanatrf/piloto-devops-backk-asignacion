const { ValidationError, NotFoundError, ConflictError } = require('../../../shared/errors');
const Company = require('../../../domain/entities/Company');


class GetCompanyByDocumentTypeAndNumberUseCase {
  constructor(companyRepository) {
    this.companyRepository = companyRepository;
  }
  
  async execute(documentType, documentNumber, includeRules = false) {
    if (!documentType) {
      throw new ValidationError('Document type is required');
    }
    
    if (!documentNumber) {
      throw new ValidationError('Document number is required');
    }
    
    let company;
    if (includeRules) {
      // Primero encontramos la compañía por documento
      const companyBasic = await this.companyRepository.findByDocumentTypeAndNumber(
        documentType.trim().toUpperCase(), 
        documentNumber.trim()
      );
      
      if (!companyBasic) {
        throw new NotFoundError(`Company with document type '${documentType}' and number '${documentNumber}' not found`);
      }
      
      // Luego obtenemos la compañía con reglas usando el ID
      company = await this.companyRepository.findByIdWithRules(companyBasic.id);
    } else {
      company = await this.companyRepository.findByDocumentTypeAndNumber(
        documentType.trim().toUpperCase(), 
        documentNumber.trim()
      );
    }
    
    if (!company) {
      throw new NotFoundError(`Company with document type '${documentType}' and number '${documentNumber}' not found`);
    }
    
    return company;
  }
}

module.exports = GetCompanyByDocumentTypeAndNumberUseCase;