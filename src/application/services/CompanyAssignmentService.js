// Servicio para consultar asignaciones por compañía
const AssignmentRepository = require('../../domain/repositories/AssignmentRepository');
const CompanyRepository = require('../../domain/repositories/CompanyRepository');
const UserRepository = require('../../domain/repositories/UserRepository');
const ClaimRepository = require('../../domain/repositories/ClaimRepository');

class CompanyAssignmentService {
  /**
   * Consulta asignaciones por número de documento de compañía
   * @param {string} companyDocumentNumber
   * @returns {Promise<Array>} Array de asignaciones con los campos requeridos
   */
  static async getAssignmentsByCompanyDocument(companyDocumentNumber) {
    // Buscar la compañía por número de documento
    const company = await CompanyRepository.findByDocumentNumber(companyDocumentNumber);
    if (!company || !company.id) return [];

    // Buscar asignaciones por id de compañía
    const assignments = await AssignmentRepository.findByCompanyId(company.id);
    const results = [];

    for (const assignment of assignments) {
      // Obtener usuario asignado
      const user = await UserRepository.findById(assignment.userId);
      // Obtener claim asociado
      const claim = await ClaimRepository.findById(assignment.claimId);

      results.push({
        assignmentStatus: assignment.status,
        assignmentDate: assignment.assignmentDate,
        processId: assignment.processId,
        documentNumber: assignment.documentNumber,
        invoiceAmount: assignment.invoiceAmount,
        externalReference: assignment.externalReference,
        claimId: assignment.claimId,
        objectionCode: assignment.objectionCode,
        value: assignment.value,
        userDud: user ? user.dud : null,
        userName: user ? user.name : null,
      });
    }
    return results;
  }
}

module.exports = CompanyAssignmentService;
