const AssignmentStatus = require('../../../src/domain/value-objects/AssignmentStatus');

describe('AssignmentStatus', () => {
  it('should validate allowed statuses', () => {
    expect(AssignmentStatus.isValid('pending')).toBe(true);
    expect(AssignmentStatus.isValid('assigned')).toBe(true);
    expect(AssignmentStatus.isValid('active')).toBe(true);
    expect(AssignmentStatus.isValid('completed')).toBe(true);
    expect(AssignmentStatus.isValid('cancelled')).toBe(true);
    expect(AssignmentStatus.isValid('unassigned')).toBe(true);
  });

  it('should not validate unknown status', () => {
    expect(AssignmentStatus.isValid('unknown')).toBe(false);
  });
});
