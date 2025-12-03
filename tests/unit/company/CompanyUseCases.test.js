const {
  CreateCompanyUseCase,
  GetCompanyByIdUseCase,
  GetCompanyByDocumentNumberUseCase,
  GetAllCompaniesUseCase,
  UpdateCompanyUseCase,
  DeleteCompanyUseCase,
  GetCompanyStatsUseCase
} = require('../src/application/useCases/CompanyUseCases');

const { ValidationError, NotFoundError, ConflictError } = require('../src/shared/errors');

// Mock del repositorio
const mockCompanyRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findByIdWithRules: jest.fn(),
  findByName: jest.fn(),
  findByDocumentNumber: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getStats: jest.fn()
};

const mockRuleRepository = {
  findByCompany: jest.fn()
};

describe('Company Use Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CreateCompanyUseCase', () => {
    let createCompanyUseCase;

    beforeEach(() => {
      createCompanyUseCase = new CreateCompanyUseCase(mockCompanyRepository);
    });

    test('should create company successfully', async () => {
      const companyData = {
        name: 'Tech Solutions Ltd',
        description: 'Technology solutions company',
        documentNumber: '12345-ABC',
        isActive: true
      };
      const savedCompany = { id: 1, ...companyData };

      mockCompanyRepository.findByName.mockResolvedValue(null);
      mockCompanyRepository.findByDocumentNumber.mockResolvedValue(null);
      mockCompanyRepository.save.mockResolvedValue(savedCompany);

      const result = await createCompanyUseCase.execute(companyData);

      expect(mockCompanyRepository.findByName).toHaveBeenCalledWith('Tech Solutions Ltd');
      expect(mockCompanyRepository.findByDocumentNumber).toHaveBeenCalledWith('12345-ABC');
      expect(mockCompanyRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedCompany);
    });

    test('should throw ValidationError for missing company name', async () => {
      const companyData = {
        description: 'Test description',
        documentNumber: '12345-ABC'
      };

      await expect(createCompanyUseCase.execute(companyData))
        .rejects.toThrow(ValidationError);
      await expect(createCompanyUseCase.execute(companyData))
        .rejects.toThrow('Company name is required');
    });

    test('should throw ValidationError for missing document number', async () => {
      const companyData = {
        name: 'Tech Solutions Ltd',
        description: 'Test description'
      };

      await expect(createCompanyUseCase.execute(companyData))
        .rejects.toThrow(ValidationError);
      await expect(createCompanyUseCase.execute(companyData))
        .rejects.toThrow('Company document number is required');
    });

    test('should throw ConflictError for duplicate company name', async () => {
      const companyData = {
        name: 'Tech Solutions Ltd',
        documentNumber: '12345-ABC'
      };
      const existingCompany = { id: 1, name: 'Tech Solutions Ltd' };

      mockCompanyRepository.findByName.mockResolvedValue(existingCompany);
      mockCompanyRepository.findByDocumentNumber.mockResolvedValue(null);

      await expect(createCompanyUseCase.execute(companyData))
        .rejects.toThrow(ConflictError);
      await expect(createCompanyUseCase.execute(companyData))
        .rejects.toThrow("Company with name 'Tech Solutions Ltd' already exists");
    });

    test('should throw ConflictError for duplicate document number', async () => {
      const companyData = {
        name: 'Tech Solutions Ltd',
        documentNumber: '12345-ABC'
      };
      const existingCompany = { id: 1, documentNumber: '12345-ABC' };

      mockCompanyRepository.findByName.mockResolvedValue(null);
      mockCompanyRepository.findByDocumentNumber.mockResolvedValue(existingCompany);

      await expect(createCompanyUseCase.execute(companyData))
        .rejects.toThrow(ConflictError);
      await expect(createCompanyUseCase.execute(companyData))
        .rejects.toThrow("Company with document number '12345-ABC' already exists");
    });
  });

  describe('GetCompanyByIdUseCase', () => {
    let getCompanyByIdUseCase;

    beforeEach(() => {
      getCompanyByIdUseCase = new GetCompanyByIdUseCase(mockCompanyRepository);
    });

    test('should get company by ID successfully', async () => {
      const companyId = 1;
      const company = { id: companyId, name: 'Tech Solutions Ltd' };

      mockCompanyRepository.findById.mockResolvedValue(company);

      const result = await getCompanyByIdUseCase.execute(companyId);

      expect(mockCompanyRepository.findById).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(company);
    });

    test('should get company with rules when requested', async () => {
      const companyId = 1;
      const company = { 
        id: companyId, 
        name: 'Tech Solutions Ltd',
        rules: [{ id: 1, name: 'Test Rule' }]
      };

      mockCompanyRepository.findByIdWithRules.mockResolvedValue(company);

      const result = await getCompanyByIdUseCase.execute(companyId, true);

      expect(mockCompanyRepository.findByIdWithRules).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(company);
    });

    test('should throw ValidationError for missing company ID', async () => {
      await expect(getCompanyByIdUseCase.execute(null))
        .rejects.toThrow(ValidationError);
      await expect(getCompanyByIdUseCase.execute(null))
        .rejects.toThrow('Company ID is required');
    });

    test('should throw NotFoundError when company not found', async () => {
      const companyId = 999;

      mockCompanyRepository.findById.mockResolvedValue(null);

      await expect(getCompanyByIdUseCase.execute(companyId))
        .rejects.toThrow(NotFoundError);
      await expect(getCompanyByIdUseCase.execute(companyId))
        .rejects.toThrow(`Company with ID ${companyId} not found`);
    });
  });

  describe('GetCompanyByDocumentNumberUseCase', () => {
    let getCompanyByDocumentNumberUseCase;

    beforeEach(() => {
      getCompanyByDocumentNumberUseCase = new GetCompanyByDocumentNumberUseCase(mockCompanyRepository);
    });

    test('should get company by document number successfully', async () => {
      const documentNumber = '12345-ABC';
      const company = { id: 1, name: 'Tech Solutions Ltd', documentNumber };

      mockCompanyRepository.findByDocumentNumber.mockResolvedValue(company);

      const result = await getCompanyByDocumentNumberUseCase.execute(documentNumber);

      expect(mockCompanyRepository.findByDocumentNumber).toHaveBeenCalledWith(documentNumber);
      expect(result).toEqual(company);
    });

    test('should throw ValidationError for missing document number', async () => {
      await expect(getCompanyByDocumentNumberUseCase.execute(null))
        .rejects.toThrow(ValidationError);
      await expect(getCompanyByDocumentNumberUseCase.execute(null))
        .rejects.toThrow('Document number is required');
    });

    test('should throw NotFoundError when company not found', async () => {
      const documentNumber = '99999-XYZ';

      mockCompanyRepository.findByDocumentNumber.mockResolvedValue(null);

      await expect(getCompanyByDocumentNumberUseCase.execute(documentNumber))
        .rejects.toThrow(NotFoundError);
      await expect(getCompanyByDocumentNumberUseCase.execute(documentNumber))
        .rejects.toThrow(`Company with document number ${documentNumber} not found`);
    });
  });

  describe('GetAllCompaniesUseCase', () => {
    let getAllCompaniesUseCase;

    beforeEach(() => {
      getAllCompaniesUseCase = new GetAllCompaniesUseCase(mockCompanyRepository);
    });

    test('should get all companies successfully', async () => {
      const companies = [
        { id: 1, name: 'Tech Solutions Ltd' },
        { id: 2, name: 'Business Corp' }
      ];

      mockCompanyRepository.findAll.mockResolvedValue(companies);

      const result = await getAllCompaniesUseCase.execute();

      expect(mockCompanyRepository.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(companies);
    });

    test('should get companies with filters', async () => {
      const filters = { isActive: true };
      const companies = [{ id: 1, name: 'Tech Solutions Ltd', isActive: true }];

      mockCompanyRepository.findAll.mockResolvedValue(companies);

      const result = await getAllCompaniesUseCase.execute(filters);

      expect(mockCompanyRepository.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(companies);
    });
  });

  describe('UpdateCompanyUseCase', () => {
    let updateCompanyUseCase;

    beforeEach(() => {
      updateCompanyUseCase = new UpdateCompanyUseCase(mockCompanyRepository);
    });

    test('should update company successfully', async () => {
      const companyId = 1;
      const updateData = { description: 'Updated description' };
      const existingCompany = { id: companyId, name: 'Tech Solutions Ltd' };
      const updatedCompany = { ...existingCompany, ...updateData };

      mockCompanyRepository.findById.mockResolvedValue(existingCompany);
      mockCompanyRepository.update.mockResolvedValue(updatedCompany);

      const result = await updateCompanyUseCase.execute(companyId, updateData);

      expect(mockCompanyRepository.findById).toHaveBeenCalledWith(companyId);
      expect(mockCompanyRepository.update).toHaveBeenCalledWith(companyId, updateData);
      expect(result).toEqual(updatedCompany);
    });

    test('should update company name without conflict', async () => {
      const companyId = 1;
      const updateData = { name: 'Updated Tech Solutions Ltd' };
      const existingCompany = { id: companyId, name: 'Tech Solutions Ltd' };
      const updatedCompany = { ...existingCompany, ...updateData };

      mockCompanyRepository.findById.mockResolvedValue(existingCompany);
      mockCompanyRepository.findByName.mockResolvedValue(null);
      mockCompanyRepository.update.mockResolvedValue(updatedCompany);

      const result = await updateCompanyUseCase.execute(companyId, updateData);

      expect(mockCompanyRepository.findByName).toHaveBeenCalledWith('Updated Tech Solutions Ltd');
      expect(result).toEqual(updatedCompany);
    });

    test('should throw ValidationError for missing company ID', async () => {
      const updateData = { description: 'Updated' };

      await expect(updateCompanyUseCase.execute(null, updateData))
        .rejects.toThrow(ValidationError);
      await expect(updateCompanyUseCase.execute(null, updateData))
        .rejects.toThrow('Company ID is required');
    });

    test('should throw NotFoundError when company not found', async () => {
      const companyId = 999;
      const updateData = { description: 'Updated' };

      mockCompanyRepository.findById.mockResolvedValue(null);

      await expect(updateCompanyUseCase.execute(companyId, updateData))
        .rejects.toThrow(NotFoundError);
      await expect(updateCompanyUseCase.execute(companyId, updateData))
        .rejects.toThrow(`Company with ID ${companyId} not found`);
    });
  });

  describe('DeleteCompanyUseCase', () => {
    let deleteCompanyUseCase;

    beforeEach(() => {
      deleteCompanyUseCase = new DeleteCompanyUseCase(mockCompanyRepository, mockRuleRepository);
    });

    test('should delete company successfully', async () => {
      const companyId = 1;
      const existingCompany = { id: companyId, name: 'Tech Solutions Ltd' };

      mockCompanyRepository.findById.mockResolvedValue(existingCompany);
      mockCompanyRepository.delete.mockResolvedValue(true);

      const result = await deleteCompanyUseCase.execute(companyId);

      expect(mockCompanyRepository.findById).toHaveBeenCalledWith(companyId);
      expect(mockCompanyRepository.delete).toHaveBeenCalledWith(companyId);
      expect(result).toBe(true);
    });

    test('should throw ValidationError for missing company ID', async () => {
      await expect(deleteCompanyUseCase.execute(null))
        .rejects.toThrow(ValidationError);
      await expect(deleteCompanyUseCase.execute(null))
        .rejects.toThrow('Company ID is required');
    });

    test('should throw NotFoundError when company not found', async () => {
      const companyId = 999;

      mockCompanyRepository.findById.mockResolvedValue(null);

      await expect(deleteCompanyUseCase.execute(companyId))
        .rejects.toThrow(NotFoundError);
      await expect(deleteCompanyUseCase.execute(companyId))
        .rejects.toThrow(`Company with ID ${companyId} not found`);
    });
  });

  describe('GetCompanyStatsUseCase', () => {
    let getCompanyStatsUseCase;

    beforeEach(() => {
      getCompanyStatsUseCase = new GetCompanyStatsUseCase(mockCompanyRepository);
    });

    test('should get company stats successfully', async () => {
      const companyId = 1;
      const company = { id: 1, name: 'Test Company' };
      const stats = {
        totalRules: 5,
        activeRules: 3,
        inactiveRules: 2,
        totalUsers: 10,
        activeUsers: 8
      };

      mockCompanyRepository.findById.mockResolvedValue(company);
      mockCompanyRepository.getStats.mockResolvedValue(stats);

      const result = await getCompanyStatsUseCase.execute(companyId);

      expect(mockCompanyRepository.findById).toHaveBeenCalledWith(companyId);
      expect(mockCompanyRepository.getStats).toHaveBeenCalledWith(companyId);
      expect(result).toEqual(stats);
    });

    test('should throw ValidationError for missing company ID', async () => {
      await expect(getCompanyStatsUseCase.execute(null))
        .rejects.toThrow(ValidationError);
      await expect(getCompanyStatsUseCase.execute(null))
        .rejects.toThrow('Company ID is required');
    });
  });
});
