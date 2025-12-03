const { ValidationError, NotFoundError, ConflictError } = require('../../../shared/errors');
const Company = require('../../../domain/entities/Company');


class GetCompanyByDocumentNumberUseCase {
  constructor(companyRepository) {
    this.companyRepository = companyRepository;
  }
  
  async execute(documentNumber) {
    if (!documentNumber) {
      throw new ValidationError('Document number is required');
    }
    
    const company = await this.companyRepository.findByDocumentNumber(documentNumber.trim());
    
    if (!company) {
      throw new NotFoundError(`Company with document number ${documentNumber} not found`);
    }
    
    return company;
  }
}
module.exports = GetCompanyByDocumentNumberUseCase;