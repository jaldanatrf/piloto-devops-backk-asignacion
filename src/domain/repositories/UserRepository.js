const { UserModel } = require('../../infrastructure/database/models'); 
const logger = require('../../shared/logger'); 

// Repository interface (Port) for User entity
class UserRepository {
  async findById(id) {
    throw new Error('Method findById must be implemented');
  }
  
  async findAll(filters = {}) {
    throw new Error('Method findAll must be implemented');
  }
  
  async save(user) {
    try {
      logger.info('Saving user with data:', { user });
      const savedUser = await UserModel.create({
        name: user.name,
        DUD: user.DUD,
        companyId: user.companyId,
        isActive: user.isActive
      });
      return savedUser;
    } catch (error) {
      logger.error(`Error saving user: ${error.message}`, { error });
      throw new Error(`Error saving user: ${error.message}`);
    }
  }
  
  async update(id, user) {
    throw new Error('Method update must be implemented');
  }
  
  async delete(id) {
    throw new Error('Method delete must be implemented');
  }
  
  async findByDUD(DUD) {
    throw new Error('Method findByDUD must be implemented');
  }
  
  async findByRole(role) {
    throw new Error('Method findByRole must be implemented');
  }
  
  async findActive() {
    throw new Error('Method findActive must be implemented');
  }
}

module.exports = UserRepository;
