const Company = require('../../../domain/entities/Company');
const { ValidationError, NotFoundError, ConflictError } = require('../../../shared/errors');
const { logToDatabase } = require('../../../shared/logger/logToDatabase');

class CreateCompanyUseCase {
  constructor(companyRepository) {
    this.companyRepository = companyRepository;
  }
  
  async execute(companyData) {
    try {
      // Validaciones de entrada
      if (!companyData.name) {
        throw new ValidationError('Company name is required');
      }
      if (!companyData.documentNumber) {
        throw new ValidationError('Company document number is required');
      }
      if (!companyData.documentType) {
        throw new ValidationError('Company document type is required');
      }
      if (!companyData.type) {
        throw new ValidationError('Company type is required');
      }
      // Verificar que el nombre de la compañía no exista
      const existingCompanyByName = await this.companyRepository.findByName(companyData.name.trim());
      if (existingCompanyByName) {
        throw new ConflictError(`Company with name '${companyData.name}' already exists`);
      }
      // Verificar que la combinación tipo + número de documento no exista
      const existingCompanyByDoc = await this.companyRepository.findByDocumentTypeAndNumber(
        companyData.documentType.trim().toUpperCase(), 
        companyData.documentNumber.trim()
      );
      if (existingCompanyByDoc) {
        throw new ConflictError(`Company with document type '${companyData.documentType}' and number '${companyData.documentNumber}' already exists`);
      }
      // Crear la entidad
      const company = new Company(
        null, // ID será generado por el repositorio
        companyData.name.trim(),
        companyData.description?.trim() || null,
        companyData.documentNumber.trim(),
        companyData.documentType.trim(),
        companyData.type.toUpperCase(),
        companyData.isActive !== undefined ? companyData.isActive : true,
        new Date()
      );
      // Guardar usando el repositorio
      const savedCompany = await this.companyRepository.save(company);
      await logToDatabase({ level: 'info', message: 'Compañía creada', meta: { companyId: savedCompany.id, companyData }, service: 'CompanyUseCase' });
      return savedCompany;
    } catch (error) {
      await logToDatabase({ level: 'error', message: 'Error creando compañía', meta: { error: error.message, companyData }, service: 'CompanyUseCase' });
      throw error;
    }
  }
}
module.exports = CreateCompanyUseCase;