const { ValidationError, NotFoundError, ConflictError } = require('../../../shared/errors');
const Company = require('../../../domain/entities/Company');


class GetAllCompaniesUseCase {
  constructor(companyRepository) {
    this.companyRepository = companyRepository;
  }
  
  async execute(filters = {}, includeRules = false) {
    if (includeRules) {
      return await this.companyRepository.findAllWithRules(filters);
    }
    return await this.companyRepository.findAll(filters);
  }
}

module.exports = GetAllCompaniesUseCase;