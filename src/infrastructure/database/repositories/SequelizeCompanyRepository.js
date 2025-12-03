const CompanyRepository = require('../../../domain/repositories/CompanyRepository');
const Company = require('../../../domain/entities/Company');
const { ValidationError, NotFoundError } = require('../../../shared/errors');

class SequelizeCompanyRepository extends CompanyRepository {
  constructor(sequelizeModels) {
    super();
    this.CompanyModel = sequelizeModels.Company;
    this.RuleModel = sequelizeModels.Rule;
  }

  async save(company) {
    try {
      const companyData = {
        name: company.name,
        description: company.description,
        documentNumber: company.documentNumber,
        documentType: company.documentType,
        type: company.type,
        isActive: company.isActive
      };

      const savedCompany = await this.CompanyModel.create(companyData);
      
      return new Company(
        savedCompany.id,
        savedCompany.name,
        savedCompany.description,
        savedCompany.documentNumber,
        savedCompany.documentType,
        savedCompany.type,
        savedCompany.isActive,
        savedCompany.createdAt
      );
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0].path;
        if (field === 'name') {
          throw new ValidationError(`Company with name '${company.name}' already exists`);
        } else if (field === 'document_number') {
          throw new ValidationError(`Company with document number '${company.documentNumber}' already exists`);
        }
      }
      throw error;
    }
  }

  async findById(id) {
    try {
      const companyData = await this.CompanyModel.findByPk(id);
      
      if (!companyData) {
        return null;
      }

      return new Company(
        companyData.id,
        companyData.name,
        companyData.description,
        companyData.documentNumber,
        companyData.documentType,
        companyData.type,
        companyData.isActive,
        companyData.createdAt
      );
    } catch (error) {
      throw error;
    }
  }

  async findByIdWithRules(id) {
    try {
      const companyData = await this.CompanyModel.findByPk(id, {
        include: [
          {
            model: this.RuleModel,
            as: 'rules',
            required: false
          }
        ]
      });

      if (!companyData) {
        return null;
      }

      const rules = companyData.rules ? companyData.rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        type: rule.type,
        isActive: rule.isActive,
        minimumAmount: rule.minimumAmount,
        maximumAmount: rule.maximumAmount,
        nitAssociatedCompany: rule.nitAssociatedCompany
      })) : [];

      const company = new Company(
        companyData.id,
        companyData.name,
        companyData.description,
        companyData.documentNumber,
        companyData.documentType,
        companyData.type,
        companyData.isActive,
        companyData.createdAt,
        rules
      );

      return company;
    } catch (error) {
      throw error;
    }
  }

  async findByName(name) {
    try {
      const companyData = await this.CompanyModel.findOne({
        where: { name: name }
      });
      
      if (!companyData) {
        return null;
      }

      return new Company(
        companyData.id,
        companyData.name,
        companyData.description,
        companyData.documentNumber,
        companyData.documentType,
        companyData.type,
        companyData.isActive,
        companyData.createdAt
      );
    } catch (error) {
      throw error;
    }
  }

  async findByDocumentNumber(documentNumber) {
    try {
      const companyData = await this.CompanyModel.findOne({
        where: { documentNumber: documentNumber }
      });
      
      if (!companyData) {
        return null;
      }

      return new Company(
        companyData.id,
        companyData.name,
        companyData.description,
        companyData.documentNumber,
        companyData.documentType,
        companyData.type,
        companyData.isActive,
        companyData.createdAt
      );
    } catch (error) {
      throw error;
    }
  }

  async findByDocumentTypeAndNumber(documentType, documentNumber) {
    try {
      const companyData = await this.CompanyModel.findOne({
        where: { 
          documentType: documentType.toUpperCase(),
          documentNumber: documentNumber 
        }
      });
      
      if (!companyData) {
        return null;
      }

      return new Company(
        companyData.id,
        companyData.name,
        companyData.description,
        companyData.documentNumber,
        companyData.documentType,
        companyData.type,
        companyData.isActive,
        companyData.createdAt
      );
    } catch (error) {
      throw error;
    }
  }

  async findAll(filters = {}) {
    try {
      const whereClause = {};
      
      // Aplicar filtros
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }
      
      if (filters.name) {
        whereClause.name = {
          [this.CompanyModel.sequelize.Sequelize.Op.LIKE]: `%${filters.name}%`
        };
      }

      if (filters.documentType) {
        whereClause.documentType = filters.documentType;
      }

      if (filters.type) {
        whereClause.type = filters.type;
      }

      const companiesData = await this.CompanyModel.findAll({
        where: whereClause,
        order: [['name', 'ASC']]
      });

      return companiesData.map(companyData => 
        new Company(
          companyData.id,
          companyData.name,
          companyData.description,
          companyData.documentNumber,
          companyData.documentType,
          companyData.type,
          companyData.isActive,
          companyData.createdAt
        )
      );
    } catch (error) {
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      const [updatedRowsCount] = await this.CompanyModel.update(updateData, {
        where: { id: id }
      });

      if (updatedRowsCount === 0) {
        throw new NotFoundError(`Company with ID ${id} not found`);
      }

      // Obtener la compañía actualizada
      return await this.findById(id);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0].path;
        if (field === 'name') {
          throw new ValidationError(`Company with name '${updateData.name}' already exists`);
        } else if (field === 'document_number') {
          throw new ValidationError(`Company with document number '${updateData.documentNumber}' already exists`);
        }
      }
      throw error;
    }
  }

  async findAllWithRules(filters = {}) {
    try {
      const whereClause = {};
      
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }
      
      if (filters.type) {
        whereClause.type = filters.type;
      }
      
      if (filters.documentType) {
        whereClause.documentType = filters.documentType;
      }

      const companiesData = await this.CompanyModel.findAll({
        where: whereClause,
        include: [
          {
            model: this.RuleModel,
            as: 'rules',
            required: false
          }
        ],
        order: [['name', 'ASC']]
      });

      return companiesData.map(companyData => {
        const rules = companyData.rules ? companyData.rules.map(rule => ({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          type: rule.type,
          isActive: rule.isActive,
          minimumAmount: rule.minimumAmount,
          maximumAmount: rule.maximumAmount,
          nitAssociatedCompany: rule.nitAssociatedCompany
        })) : [];

        return new Company(
          companyData.id,
          companyData.name,
          companyData.description,
          companyData.documentNumber,
          companyData.documentType,
          companyData.type,
          companyData.isActive,
          companyData.createdAt,
          rules
        );
      });
    } catch (error) {
      throw error;
    }
  }

  async delete(id) {
    try {
      const deletedRowsCount = await this.CompanyModel.destroy({
        where: { id: id }
      });

      if (deletedRowsCount === 0) {
        throw new NotFoundError(`Company with ID ${id} not found`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SequelizeCompanyRepository;
