const AssignmentProcessService = require('../../../application/services/AssignmentProcessService');

class AssignmentProcessController {
  /**
   * POST /api/assignments/complete
   * Completa una asignación usando ClaimId y DocumentNumber
   */
  async completeByClaimAndDocument(req, res, next) {
    try {
      const { claimId, documentNumber } = req.body;
      
      if (!claimId) {
        return res.status(400).json({ success: false, message: 'claimId is required' });
      }
      
      if (!documentNumber) {
        return res.status(400).json({ success: false, message: 'documentNumber is required' });
      }
      
      const assignment = await AssignmentProcessService.completeAssignmentByClaimAndDocument(claimId, documentNumber);
      
      if (!assignment) {
        return res.status(404).json({ 
          success: false, 
          message: 'Assignment not found for ClaimId and DocumentNumber', 
          data: null 
        });
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Assignment completed successfully', 
        data: assignment 
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AssignmentProcessController();
