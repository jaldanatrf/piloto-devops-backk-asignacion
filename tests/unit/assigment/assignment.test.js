const Assignment = require('../../../src/domain/entities/assignment');
const AssignmentStatus = require('../../../src/domain/value-objects/AssignmentStatus');

describe('Assignment Entity', () => {
  it('should create assignment with valid data', () => {
    const assignment = new Assignment({
      userId: 1,
      companyId: 2,
      status: AssignmentStatus.PENDING,
      startDate: new Date(),
      assignedAt: new Date(),
    });
    expect(assignment.userId).toBe(1);
    expect(assignment.companyId).toBe(2);
    expect(assignment.status).toBe(AssignmentStatus.PENDING);
  });

  it('should allow userId to be null for pending assignment', () => {
    const assignment = new Assignment({
      userId: null,
      companyId: 2,
      status: AssignmentStatus.PENDING,
      startDate: new Date(),
      assignedAt: new Date(),
    });
    expect(assignment.userId).toBeNull();
    expect(assignment.status).toBe(AssignmentStatus.PENDING);
  });

  it('should throw error for invalid companyId', () => {
    expect(() => {
      new Assignment({
        userId: 1,
        companyId: null,
        status: AssignmentStatus.PENDING,
        startDate: new Date(),
        assignedAt: new Date(),
      });
    }).toThrow('Company ID is required');
  });

  it('should throw error for invalid startDate', () => {
    expect(() => {
      new Assignment({
        userId: 1,
        companyId: 2,
        status: AssignmentStatus.PENDING,
        startDate: 'invalid-date',
        assignedAt: new Date(),
      });
    }).toThrow('Start date must be a valid date');
  });

  it('should throw error for invalid status', () => {
    expect(() => {
      new Assignment({
        userId: 1,
        companyId: 2,
        status: 'invalid-status',
        startDate: new Date(),
        assignedAt: new Date(),
      });
    }).toThrow();
  });

  it('should assign user and set status to ACTIVE', () => {
    const assignment = new Assignment({
      userId: null,
      companyId: 2,
      status: AssignmentStatus.PENDING,
      startDate: new Date(),
      assignedAt: new Date(),
    });
    assignment.assign(5);
    expect(assignment.userId).toBe(5);
    expect(assignment.status).toBe(AssignmentStatus.ACTIVE);
    expect(assignment.isActive()).toBe(true);
  });

  it('should activate assignment', () => {
    const assignment = new Assignment({
      userId: 1,
      companyId: 2,
      status: AssignmentStatus.PENDING,
      startDate: new Date(),
      assignedAt: new Date(),
    });
    assignment.activate();
    expect(assignment.status).toBe(AssignmentStatus.ACTIVE);
    expect(assignment.isActive()).toBe(true);
  });

  it('should complete assignment', () => {
    const assignment = new Assignment({
      userId: 1,
      companyId: 2,
      status: AssignmentStatus.ACTIVE,
      startDate: new Date(),
      assignedAt: new Date(),
    });
    assignment.complete();
    expect(assignment.status).toBe(AssignmentStatus.COMPLETED);
    expect(assignment.isCompleted()).toBe(true);
  });

  it('should cancel assignment', () => {
    const assignment = new Assignment({
      userId: 1,
      companyId: 2,
      status: AssignmentStatus.ACTIVE,
      startDate: new Date(),
      assignedAt: new Date(),
    });
    assignment.cancel();
    expect(assignment.status).toBe(AssignmentStatus.CANCELLED);
    expect(assignment.isCancelled()).toBe(true);
  });

  it('should unassign assignment', () => {
    const assignment = new Assignment({
      userId: 1,
      companyId: 2,
      status: AssignmentStatus.ACTIVE,
      startDate: new Date(),
      assignedAt: new Date(),
    });
    assignment.unassign();
    expect(assignment.status).toBe(AssignmentStatus.UNASSIGNED);
  });

  it('should update dates', () => {
    const start = new Date('2025-08-25');
    const end = new Date('2025-08-30');
    const assignment = new Assignment({
      userId: 1,
      companyId: 2,
      status: AssignmentStatus.PENDING,
      startDate: start,
      endDate: end,
      assignedAt: new Date(),
    });
    const newStart = new Date('2025-09-01');
    const newEnd = new Date('2025-09-10');
    assignment.updateDates(newStart, newEnd);
    expect(assignment.startDate).toEqual(newStart);
    expect(assignment.endDate).toEqual(newEnd);
  });

  it('should detect overdue assignment', () => {
    const start = new Date('2025-08-01');
    const end = new Date('2025-08-10');
    const assignment = new Assignment({
      userId: 1,
      companyId: 2,
      status: AssignmentStatus.PENDING,
      startDate: start,
      endDate: end,
      assignedAt: new Date(),
    });
    expect(assignment.isOverdue()).toBe(true);
  });

  it('should calculate duration in days', () => {
    const start = new Date('2025-08-01');
    const end = new Date('2025-08-11');
    const assignment = new Assignment({
      userId: 1,
      companyId: 2,
      status: AssignmentStatus.PENDING,
      startDate: start,
      endDate: end,
      assignedAt: new Date(),
    });
    expect(assignment.getDuration()).toBe(10);
  });

  it('should throw error if endDate is before startDate', () => {
    const start = new Date('2025-08-10');
    const end = new Date('2025-08-01');
    expect(() => {
      new Assignment({
        userId: 1,
        companyId: 2,
        status: AssignmentStatus.PENDING,
        startDate: start,
        endDate: end,
        assignedAt: new Date(),
      });
    }).toThrow('End date must be after start date');
  });

  it('should throw error if updateDates called with invalid startDate', () => {
    const assignment = new Assignment({
      userId: 1,
      companyId: 2,
      status: AssignmentStatus.PENDING,
      startDate: new Date(),
      assignedAt: new Date(),
    });
    expect(() => assignment.updateDates('invalid-date')).toThrow('Start date is required and must be a valid date');
  });

  it('should throw error if updateDates called with invalid endDate', () => {
    const start = new Date('2025-08-01');
    const assignment = new Assignment({
      userId: 1,
      companyId: 2,
      status: AssignmentStatus.PENDING,
      startDate: start,
      assignedAt: new Date(),
    });
    expect(() => assignment.updateDates(start, 'invalid-date')).toThrow('End date must be a valid date after start date');
  });

  it('should throw error if updateDates called with endDate before startDate', () => {
    const start = new Date('2025-08-10');
    const end = new Date('2025-08-01');
    const assignment = new Assignment({
      userId: 1,
      companyId: 2,
      status: AssignmentStatus.PENDING,
      startDate: start,
      assignedAt: new Date(),
    });
    expect(() => assignment.updateDates(start, end)).toThrow('End date must be a valid date after start date');
  });

  it('should return false for isOverdue if no endDate', () => {
    const assignment = new Assignment({
      userId: 1,
      companyId: 2,
      status: AssignmentStatus.PENDING,
      startDate: new Date(),
      assignedAt: new Date(),
    });
    expect(assignment.isOverdue()).toBe(false);
  });

  it('should return null for getDuration if no endDate', () => {
    const assignment = new Assignment({
      userId: 1,
      companyId: 2,
      status: AssignmentStatus.PENDING,
      startDate: new Date(),
      assignedAt: new Date(),
    });
    expect(assignment.getDuration()).toBeNull();
  });
});
