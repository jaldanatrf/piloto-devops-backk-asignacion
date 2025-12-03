class AssignmentStatus {
  static PENDING = 'pending';
  static ACTIVE = 'active';
  static COMPLETED = 'completed';
  static CANCELLED = 'cancelled';
  static UNASSIGNED = 'unassigned';
  static ASSIGNED = 'assigned';

  static getAllValues() {
    return [
      AssignmentStatus.PENDING,
      AssignmentStatus.ACTIVE,
      AssignmentStatus.COMPLETED,
      AssignmentStatus.CANCELLED,
      AssignmentStatus.UNASSIGNED
    ];
  }

  static isValid(status) {
    return [
      AssignmentStatus.PENDING,
      AssignmentStatus.ASSIGNED,
      AssignmentStatus.ACTIVE,
      AssignmentStatus.COMPLETED,
      AssignmentStatus.CANCELLED,
      AssignmentStatus.UNASSIGNED
    ].includes(status);
  }

  static getValidationMessage() {
    return `Status must be one of: ${AssignmentStatus.getAllValues().join(', ')}`;
  }
}

module.exports = AssignmentStatus;
