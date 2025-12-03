const AssignmentQueueService = require('../../../src/application/services/AssignmentQueueService');
const Assignment = require('../../../src/domain/entities/assignment');
const AssignmentStatus = require('../../../src/domain/value-objects/AssignmentStatus');

describe('AssignmentQueueService', () => {
  let service;
  let mockRepo;
  beforeEach(() => {
    mockRepo = {
      create: jest.fn().mockImplementation(a => Promise.resolve(a)),
      count: jest.fn().mockResolvedValue(0)
    };
    service = new AssignmentQueueService({ assignmentRepository: mockRepo });
    service.businessRuleProcessorUseCases = {
      processClaim: jest.fn().mockResolvedValue({ success: true, users: [], company: { id: 2 } })
    };
    service.channel = { ack: jest.fn() };
    service.determineAssignmentType = jest.fn().mockReturnValue('CLAIM_TEST');
  });

  it('should create pending assignment if no user candidates', async () => {
    const claimData = { ClaimId: '123', ProcessId: '1', Target: 'A', Source: 'B', InvoiceAmount: '100', Value: '50' };
    await service.processMessage({ content: Buffer.from(JSON.stringify(claimData)) });
    expect(mockRepo.create).toHaveBeenCalled();
    const assignment = mockRepo.create.mock.calls[0][0];
    expect(assignment.status).toBe(AssignmentStatus.PENDING);
    expect(assignment.userId).toBeNull();
  });

  it('should create assigned assignment if user found', async () => {
    service.businessRuleProcessorUseCases.processClaim.mockResolvedValue({ success: true, users: [{ id: 1 }], company: { id: 2 } });
    service.selectUserWithLeastAssignments = jest.fn().mockResolvedValue({ id: 1 });
    const claimData = { ClaimId: '123', ProcessId: '1', Target: 'A', Source: 'B', InvoiceAmount: '100', Value: '50' };
    await service.processMessage({ content: Buffer.from(JSON.stringify(claimData)) });
    expect(mockRepo.create).toHaveBeenCalled();
    const assignment = mockRepo.create.mock.calls[0][0];
    expect(assignment.status).toBe(AssignmentStatus.ASSIGNED);
    expect(assignment.userId).toBe(1);
  });
});
