const AssignmentRepository = require('../../../src/domain/repositories/assignmentRepository');

describe('AssignmentRepository interface', () => {
  let repo;
  beforeEach(() => {
    repo = new AssignmentRepository();
  });

  it('should throw error for findById', async () => {
    await expect(repo.findById(1)).rejects.toThrow('Método findById debe ser implementado');
  });
  it('should throw error for findAll', async () => {
    await expect(repo.findAll()).rejects.toThrow('Método findAll debe ser implementado');
  });
  it('should throw error for count', async () => {
    await expect(repo.count()).rejects.toThrow('Método count debe ser implementado');
  });
  it('should throw error for create', async () => {
    await expect(repo.create({})).rejects.toThrow('Método create debe ser implementado');
  });
  it('should throw error for save', async () => {
    await expect(repo.save({})).rejects.toThrow('Método save debe ser implementado');
  });
  it('should throw error for update', async () => {
    await expect(repo.update(1, {})).rejects.toThrow('Método update debe ser implementado');
  });
  it('should throw error for delete', async () => {
    await expect(repo.delete(1)).rejects.toThrow('Método delete debe ser implementado');
  });
  it('should throw error for findByUser', async () => {
    await expect(repo.findByUser(1)).rejects.toThrow('Método findByUser debe ser implementado');
  });
  it('should throw error for findByRole', async () => {
    await expect(repo.findByRole(1)).rejects.toThrow('Método findByRole debe ser implementado');
  });
  it('should throw error for findByCompany', async () => {
    await expect(repo.findByCompany(1)).rejects.toThrow('Método findByCompany debe ser implementado');
  });
  it('should throw error for findOverlappingAssignments', async () => {
    await expect(repo.findOverlappingAssignments(1, new Date(), new Date())).rejects.toThrow('Método findOverlappingAssignments debe ser implementado');
  });
  it('should throw error for getStats', async () => {
    await expect(repo.getStats()).rejects.toThrow('Método getStats debe ser implementado');
  });
  it('should throw error for search', async () => {
    await expect(repo.search('test')).rejects.toThrow('Método search debe ser implementado');
  });
  it('should throw error for exists', async () => {
    await expect(repo.exists(1)).rejects.toThrow('Método exists debe ser implementado');
  });
});
