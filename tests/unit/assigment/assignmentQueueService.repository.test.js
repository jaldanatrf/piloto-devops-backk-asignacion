const AssignmentQueueService = require('../../../src/application/services/AssignmentQueueService');
const AssignmentRepository = require('../../../src/domain/repositories/assignmentRepository');

describe('AssignmentQueueService integration with AssignmentRepository', () => {
  let service, repo;

  beforeEach(() => {
    repo = new AssignmentRepository();
    service = new AssignmentQueueService(repo);
  });

  it('should throw error when calling service.createAssignment', async () => {
    await expect(service.createAssignment({})).rejects.toThrow();
  });

  it('should throw error when calling service.saveAssignment', async () => {
    await expect(service.saveAssignment({})).rejects.toThrow();
  });

  it('should throw error when calling service.updateAssignment', async () => {
    await expect(service.updateAssignment(1, {})).rejects.toThrow();
  });

  it('should throw error when calling service.deleteAssignment', async () => {
    await expect(service.deleteAssignment(1)).rejects.toThrow();
  });

  it('should throw error when calling service.findAssignmentById', async () => {
    await expect(service.findAssignmentById(1)).rejects.toThrow();
  });

  it('should throw error when calling service.findAssignmentsByUser', async () => {
    await expect(service.findAssignmentsByUser(1)).rejects.toThrow();
  });

  it('should throw error when calling service.findAssignmentsByRole', async () => {
    await expect(service.findAssignmentsByRole(1)).rejects.toThrow();
  });

  it('should throw error when calling service.findAssignmentsByCompany', async () => {
    await expect(service.findAssignmentsByCompany(1)).rejects.toThrow();
  });

  it('should throw error when calling service.findOverlappingAssignments', async () => {
    await expect(service.findOverlappingAssignments(1, new Date(), new Date())).rejects.toThrow();
  });

  it('should throw error when calling service.getAssignmentStats', async () => {
    await expect(service.getAssignmentStats()).rejects.toThrow();
  });

  it('should throw error when calling service.searchAssignments', async () => {
    await expect(service.searchAssignments('test')).rejects.toThrow();
  });

  it('should throw error when calling service.assignmentExists', async () => {
    await expect(service.assignmentExists(1)).rejects.toThrow();
  });
});
