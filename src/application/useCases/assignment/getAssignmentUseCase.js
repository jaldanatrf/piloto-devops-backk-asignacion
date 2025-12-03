const { ValidationError, NotFoundError } = require('../../../shared/errors');

class GetAssignmentUseCase {
  constructor(assignmentRepository) {
    this.assignmentRepository = assignmentRepository;
  }

  async execute(assignmentId) {
    if (!assignmentId || !Number.isInteger(assignmentId) || assignmentId <= 0) {
      throw new ValidationError('Valid assignment ID is required');
    }

    const assignment = await this.assignmentRepository.findById(assignmentId);
    
    if (!assignment) {
      throw new NotFoundError(`Assignment with ID ${assignmentId} not found`);
    }

    return assignment;
  }
}

module.exports = GetAssignmentUseCase;
