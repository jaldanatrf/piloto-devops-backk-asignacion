const { ValidationError, NotFoundError, ConflictError } = require('../../../shared/errors');
const Company = require('../../../domain/entities/Company');



class GetCompanyByIdUseCase {
  constructor(companyRepository) {
    this.companyRepository = companyRepository;
  }
  
  async execute(companyId, includeRules = false) {
    if (!companyId) {
      throw new ValidationError('Company ID is required');
    }
    
    let company;
    if (includeRules) {
      company = await this.companyRepository.findByIdWithRules(companyId);
    } else {
      company = await this.companyRepository.findById(companyId);
    }
    
    if (!company) {
      throw new NotFoundError(`Company with ID ${companyId} not found`);
    }
    
    return company;
  }
}

module.exports = GetCompanyByIdUseCase;