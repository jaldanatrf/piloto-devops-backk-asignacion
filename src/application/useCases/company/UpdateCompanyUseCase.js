class UpdateCompanyUseCase {
  constructor(companyRepository) {
    this.companyRepository = companyRepository;
  }
  
  async execute(companyId, updateData) {
    try {
      if (!companyId) {
        throw new ValidationError('Company ID is required');
      }
      // Verificar que la compañía existe
      const existingCompany = await this.companyRepository.findById(companyId);
      if (!existingCompany) {
        throw new NotFoundError(`Company with ID ${companyId} not found`);
      }
      // Si se está actualizando el nombre, verificar que no exista otra compañía con ese nombre
      if (updateData.name && updateData.name.trim() !== existingCompany.name) {
        const companyWithSameName = await this.companyRepository.findByName(updateData.name.trim());
        if (companyWithSameName && companyWithSameName.id !== companyId) {
          throw new ConflictError(`Company with name '${updateData.name}' already exists`);
        }
      }
      // Si se está actualizando el documento, verificar que no exista otra compañía con ese documento
      if (updateData.documentNumber && updateData.documentNumber.trim() !== existingCompany.documentNumber) {
        const companyWithSameDoc = await this.companyRepository.findByDocumentNumber(updateData.documentNumber.trim());
        if (companyWithSameDoc && companyWithSameDoc.id !== companyId) {
          throw new ConflictError(`Company with document number '${updateData.documentNumber}' already exists`);
        }
      }
      // Actualizar usando el repositorio
      const updatedCompany = await this.companyRepository.update(companyId, updateData);
      await logToDatabase({ level: 'info', message: 'Compañía actualizada', meta: { companyId, updateData }, service: 'CompanyUseCase' });
      return updatedCompany;
    } catch (error) {
      await logToDatabase({ level: 'error', message: 'Error actualizando compañía', meta: { error: error.message, companyId, updateData }, service: 'CompanyUseCase' });
      throw error;
    }
  }
}

module.exports = UpdateCompanyUseCase;