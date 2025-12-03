const AssignmentQueueService = require('../../../src/application/services/AssignmentQueueService');
const AssignmentStatus = require('../../../src/domain/value-objects/AssignmentStatus');

describe('AssignmentQueueService - methods', () => {
  let service;
  let mockRepo;
  beforeEach(() => {
    mockRepo = {
      create: jest.fn().mockImplementation(a => Promise.resolve(a)),
      count: jest.fn().mockResolvedValue(0)
    };
    service = new AssignmentQueueService({}, mockRepo, {});
    service.channel = { close: jest.fn(), sendToQueue: jest.fn().mockReturnValue(true) };
    service.connection = { close: jest.fn() };
    service.isConnected = true;
    service.queueName = 'test_queue';
  });

  it('should stop service and close connections', async () => {
    await service.stop();
    expect(service.channel.close).toHaveBeenCalled();
    expect(service.connection.close).toHaveBeenCalled();
    expect(service.isConnected).toBe(false);
  });

  it('should get status info', () => {
    const status = service.getStatus();
    expect(status.isConnected).toBe(true);
    expect(status.queueName).toBe('test_queue');
    expect(status.connectionStatus).toBe('active');
    expect(status.channelStatus).toBe('active');
  });

  it('should send test message to queue', async () => {
    await service.sendTestMessage({ foo: 'bar' });
    expect(service.channel.sendToQueue).toHaveBeenCalled();
  });

  it('should throw error if not connected when sending test message', async () => {
    service.isConnected = false;
    await expect(service.sendTestMessage({ foo: 'bar' })).rejects.toThrow('Not connected to RabbitMQ');
  });

  it('should determine assignment type by ConceptApplicationCode', () => {
    const type = service.determineAssignmentType({ ConceptApplicationCode: 'X' });
    expect(type).toBe('CLAIM_X');
  });

  it('should determine assignment type by ObjectionCode', () => {
    const type = service.determineAssignmentType({ ObjectionCode: 'Y' });
    expect(type).toBe('OBJECTION_Y');
  });

  it('should determine assignment type default', () => {
    const type = service.determineAssignmentType({});
    expect(type).toBe('CLAIM_PROCESSING');
  });
});
