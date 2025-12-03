const { UpdateCompanyByDocumentUseCase } = require('../../../src/application/useCases/CompanyUseCases');

describe('UpdateCompanyByDocumentUseCase', () => {
  let mockCompanyRepository;
  let updateCompanyByDocumentUseCase;

  beforeEach(() => {
    mockCompanyRepository = {
      findByDocumentTypeAndNumber: jest.fn(),
      findByName: jest.fn(),
      update: jest.fn()
    };
    updateCompanyByDocumentUseCase = new UpdateCompanyByDocumentUseCase(mockCompanyRepository);
  });

  test('debe actualizar una compañía por tipo y número de documento exitosamente', async () => {
    // Arrange
    const documentType = 'NIT';
    const documentNumber = '900123456';
    const updateData = { name: 'Nueva Empresa S.A.S.' };
    
    const existingCompany = {
      id: 1,
      name: 'Empresa Antigua',
      documentType: 'NIT',
      documentNumber: '900123456'
    };

    const updatedCompany = {
      id: 1,
      name: 'Nueva Empresa S.A.S.',
      documentType: 'NIT',
      documentNumber: '900123456'
    };

    mockCompanyRepository.findByDocumentTypeAndNumber.mockResolvedValue(existingCompany);
    mockCompanyRepository.findByName.mockResolvedValue(null);
    mockCompanyRepository.update.mockResolvedValue(updatedCompany);

    // Act
    const result = await updateCompanyByDocumentUseCase.execute(documentType, documentNumber, updateData);

    // Assert
    expect(result).toEqual(updatedCompany);
    expect(mockCompanyRepository.findByDocumentTypeAndNumber).toHaveBeenCalledWith('NIT', '900123456');
    expect(mockCompanyRepository.findByName).toHaveBeenCalledWith('Nueva Empresa S.A.S.');
    expect(mockCompanyRepository.update).toHaveBeenCalledWith(1, updateData);
  });

  test('debe lanzar error si la compañía no existe', async () => {
    // Arrange
    const documentType = 'NIT';
    const documentNumber = '900123456';
    const updateData = { name: 'Nueva Empresa S.A.S.' };

    mockCompanyRepository.findByDocumentTypeAndNumber.mockResolvedValue(null);

    // Act & Assert
    await expect(updateCompanyByDocumentUseCase.execute(documentType, documentNumber, updateData))
      .rejects.toThrow('Company with document type \'NIT\' and number \'900123456\' not found');
  });

  test('debe lanzar error si el tipo de documento es requerido', async () => {
    // Arrange
    const documentType = '';
    const documentNumber = '900123456';
    const updateData = { name: 'Nueva Empresa S.A.S.' };

    // Act & Assert
    await expect(updateCompanyByDocumentUseCase.execute(documentType, documentNumber, updateData))
      .rejects.toThrow('Document type is required');
  });

  test('debe lanzar error si el número de documento es requerido', async () => {
    // Arrange
    const documentType = 'NIT';
    const documentNumber = '';
    const updateData = { name: 'Nueva Empresa S.A.S.' };

    // Act & Assert
    await expect(updateCompanyByDocumentUseCase.execute(documentType, documentNumber, updateData))
      .rejects.toThrow('Document number is required');
  });

  console.log('✅ Test de actualización por documento creado exitosamente');
});
