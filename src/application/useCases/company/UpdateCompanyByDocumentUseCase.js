class UpdateCompanyByDocumentUseCase {
  constructor(companyRepository) {
    this.companyRepository = companyRepository;
  }
  
  async execute(documentType, documentNumber, updateData) {
    if (!documentType) {
      throw new ValidationError('Document type is required');
    }
    
    if (!documentNumber) {
      throw new ValidationError('Document number is required');
    }
    
    // Verificar que la compañía existe
    const existingCompany = await this.companyRepository.findByDocumentTypeAndNumber(
      documentType.trim().toUpperCase(), 
      documentNumber.trim()
    );
    
    if (!existingCompany) {
      throw new NotFoundError(`Company with document type '${documentType}' and number '${documentNumber}' not found`);
    }
    
    // Si se está actualizando el nombre, verificar que no exista otra compañía con ese nombre
    if (updateData.name && updateData.name.trim() !== existingCompany.name) {
      const companyWithSameName = await this.companyRepository.findByName(updateData.name.trim());
      if (companyWithSameName && companyWithSameName.id !== existingCompany.id) {
        throw new ConflictError(`Company with name '${updateData.name}' already exists`);
      }
    }

    // Si se está actualizando el documento, verificar que no exista otra compañía con ese documento
    if ((updateData.documentType && updateData.documentType.trim().toUpperCase() !== existingCompany.documentType) ||
        (updateData.documentNumber && updateData.documentNumber.trim() !== existingCompany.documentNumber)) {
      
      const newDocumentType = updateData.documentType ? updateData.documentType.trim().toUpperCase() : existingCompany.documentType;
      const newDocumentNumber = updateData.documentNumber ? updateData.documentNumber.trim() : existingCompany.documentNumber;
      
      const companyWithSameDoc = await this.companyRepository.findByDocumentTypeAndNumber(
        newDocumentType, 
        newDocumentNumber
      );
      
      if (companyWithSameDoc && companyWithSameDoc.id !== existingCompany.id) {
        throw new ConflictError(`Company with document type '${newDocumentType}' and number '${newDocumentNumber}' already exists`);
      }
    }
    
    // Actualizar usando el repositorio
    const updatedCompany = await this.companyRepository.update(existingCompany.id, updateData);
    
    return updatedCompany;
  }
}

module.exports = UpdateCompanyByDocumentUseCase;