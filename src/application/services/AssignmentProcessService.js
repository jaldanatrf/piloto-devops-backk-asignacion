const models = require('../../infrastructure/database/models/models');

class AssignmentProcessService {
  /**
   * Completa una asignación usando ClaimId y DocumentNumber
   * @param {string} claimId
   * @param {string} documentNumber
   * @returns {Promise<object>} La asignación actualizada o null
   */
  async completeAssignmentByClaimAndDocument(claimId, documentNumber) {
    if (!claimId) throw new Error('claimId is required');
    if (!documentNumber) throw new Error('documentNumber is required');
    
    const assignment = await models.Assignment.findOne({ 
      where: { 
        ClaimId: claimId,
        DocumentNumber: documentNumber
      } 
    });
    
    if (!assignment) return null;
    
    assignment.status = 'completed';
    assignment.endDate = new Date();
    await assignment.save();
    
    return assignment;
  }
}

module.exports = new AssignmentProcessService();
