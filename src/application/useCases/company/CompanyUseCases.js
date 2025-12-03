const CreateCompanyUseCase = require('./CreateCompanyUseCase');
const GetCompanyByIdUseCase = require('./GetCompanyByIdUseCase');
const GetCompanyByDocumentNumberUseCase = require('./GetCompanyByDocumentNumberUseCase');
const GetCompanyByDocumentTypeAndNumberUseCase = require('./GetCompanyByDocumentTypeAndNnumberUseCase'); 
const GetAllCompaniesUseCase = require('./GetAllCompaniesUsecase');
const UpdateCompanyUseCase = require('./UpdateCompanyUseCase');
const UpdateCompanyByDocumentUseCase = require('./UpdateCompanyByDocumentUseCase');


module.exports = {
  CreateCompanyUseCase,
  GetCompanyByIdUseCase,
  GetCompanyByDocumentNumberUseCase,
  GetCompanyByDocumentTypeAndNumberUseCase,
  GetAllCompaniesUseCase,
  UpdateCompanyUseCase,
  UpdateCompanyByDocumentUseCase,
};