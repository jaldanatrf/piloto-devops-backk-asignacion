const User = require('../../../domain/entities/users');
const UserRole = require('../../../domain/entities/UserRole');
const { ValidationError, NotFoundError } = require('../../../shared/errors');
const { logToDatabase } = require('../../../shared/logger/logToDatabase');

class UserUseCases {
  constructor(userRepository, companyRepository, userRoleRepository, roleRepository) {
    this.userRepository = userRepository;
    this.companyRepository = companyRepository;
    this.userRoleRepository = userRoleRepository;
    this.roleRepository = roleRepository;
  }

  async createUser(userData) {
    try {
      // Validar que la compañía existe
      if (userData.companyId) {
        const company = await this.companyRepository.findById(userData.companyId);
        if (!company) {
          throw new ValidationError('Company does not exist');
        }
      }

      // Validar que los roles existan si se proporcionan
      if (userData.roles && userData.roles.length > 0) {
        for (const roleId of userData.roles) {
          const role = await this.roleRepository.findById(roleId);
          if (!role) {
            throw new ValidationError(`Role with ID ${roleId} does not exist`);
          }
        }
      }

      // Verificar que no existe un usuario con el mismo DUD
      if (userData.dud || userData.DUD) {
        const dudValue = String(userData.dud || userData.DUD).toUpperCase();
        const existingUser = await this.userRepository.findByDUD(dudValue);
        if (existingUser) {
          throw new ValidationError('User with this DUD already exists');
        }
      }

      // Construir el usuario
      const user = new User({
        id: null, // id será asignado por la base de datos
        name: userData.name,
        DUD: (userData.dud || userData.DUD) ? String(userData.dud || userData.DUD).toUpperCase() : undefined,
        companyId: userData.companyId,
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        roles: userData.roles || []
      });

      // Validar la entidad
      user.validate();

      // Guardar el usuario en el repositorio
      const savedUser = await this.userRepository.save(user);

      // Si se proporcionaron roles, crear las relaciones
      if (userData.roles && userData.roles.length > 0) {
        const userRoles = userData.roles.map(roleId => 
          new UserRole(null, savedUser.id, roleId)
        );

        // Insertar las relaciones en bulk
        await this.userRoleRepository.bulkCreate(userRoles);
      }

  await logToDatabase({ level: 'info', message: 'Usuario creado', meta: { userId: savedUser.id, userData }, service: 'UserUseCases' });
      return await this.getUserById(savedUser.id);
    } catch (error) {
  await logToDatabase({ level: 'error', message: 'Error creando usuario', meta: { error: error.message, userData }, service: 'UserUseCases' });
    }
  }

  async getUserById(id) {
    try {
      if (!id) {
        throw new ValidationError('User ID is required');
      }

      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

      // Obtener los roles del usuario si tiene userRoleRepository
      if (this.userRoleRepository) {
        try {
          const userRoles = await this.userRoleRepository.findByUserId(id);
          user.roles = userRoles.map(ur => ({
            id: ur.roleId,
            assignedAt: ur.assignedAt
          }));
        } catch (error) {
          // Si hay error obteniendo roles, continuar sin roles
          console.warn(`Warning: Could not fetch roles for user ${id}:`, error.message);
          user.roles = [];
        }
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUserByDocument(documentType, documentNumber) {
    try {
      if (!documentType || !documentNumber) {
        throw new ValidationError('Document type and number are required');
      }

      const user = await this.userRepository.findByDocument(documentType, documentNumber);
      if (!user) {
        throw new NotFoundError(`User with document ${documentType} ${documentNumber} not found`);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUserByCompanyAndDocument(companyId, documentType, documentNumber) {
    try {
      if (!companyId) {
        throw new ValidationError('Company ID is required');
      }
      
      if (!documentType || !documentNumber) {
        throw new ValidationError('Document type and number are required');
      }

      const user = await this.userRepository.findByCompanyAndDocument(companyId, documentType, documentNumber);
      if (!user) {
        throw new NotFoundError(`User with document ${documentType} ${documentNumber} not found in company ${companyId}`);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      if (!email) {
        throw new ValidationError('Email is required');
      }

      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundError(`User with email ${email} not found`);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers(filters = {}) {
    try {
      return await this.userRepository.findAll(filters);
    } catch (error) {
      throw error;
    }
  }

  async searchUsersByName(name, limit = 10) {
    try {
      if (!name || name.trim().length === 0) {
        throw new ValidationError('Search name is required');
      }

      return await this.userRepository.searchByName(name, limit);
    } catch (error) {
      throw error;
    }
  }

  async searchUsersByDocument(documentType, documentNumber) {
    try {
      const filters = {};
      
      if (documentType) {
        filters.documentType = documentType;
      }
      
      if (documentNumber) {
        filters.documentNumber = documentNumber;
      }

      if (!documentType && !documentNumber) {
        throw new ValidationError('At least document type or document number is required');
      }

      return await this.userRepository.findAll(filters);
    } catch (error) {
      throw error;
    }
  }

  async getUsersByCompany(companyId, filters = {}) {
    try {
      if (!companyId) {
        throw new ValidationError('Company ID is required');
      }

      // Verificar que la compañía existe
      const company = await this.companyRepository.findById(companyId);
      if (!company) {
        throw new NotFoundError('Company does not exist');
      }

      return await this.userRepository.findByCompany(companyId, filters);
    } catch (error) {
      throw error;
    }
  }

  async getUsersByRole(roleId) {
    try {
      if (!roleId) {
        throw new ValidationError('Role ID is required');
      }

      return await this.userRepository.findByRole(roleId);
    } catch (error) {
      throw error;
    }
  }

  async getActiveUsers() {
    try {
      return await this.userRepository.findActive();
    } catch (error) {
      throw error;
    }
  }

  async updateUser(id, updateData) {
    try {
      if (!id) {
        throw new ValidationError('User ID is required');
      }

      // Verificar que el usuario existe
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

      // Validar que la compañía existe si se está actualizando
      if (updateData.companyId && updateData.companyId !== existingUser.companyId) {
        const company = await this.companyRepository.findById(updateData.companyId);
        if (!company) {
          throw new ValidationError(`Company with ID ${updateData.companyId} not found`);
        }
      }

      // Verificar unicidad del documento si se está actualizando
      if (updateData.documentType || updateData.documentNumber) {
        const documentType = updateData.documentType || existingUser.documentType;
        const documentNumber = updateData.documentNumber || existingUser.documentNumber;
        
        const existsByDocument = await this.userRepository.existsByDocument(documentType, documentNumber, id);
        if (existsByDocument) {
          throw new ValidationError('User with this document already exists');
        }
      }

      // Verificar unicidad del email si se está actualizando
      if (updateData.email && updateData.email !== existingUser.email) {
        const existsByEmail = await this.userRepository.existsByEmail(updateData.email, id);
        if (existsByEmail) {
          throw new ValidationError('User with this email already exists');
        }
      }

      // Para updates parciales, no validamos la entidad completa
      // Solo validamos reglas de negocio específicas de los campos que se actualizan

      // Actualizar en el repositorio
      const updated = await this.userRepository.update(id, updateData);
      await logToDatabase({ level: 'info', message: 'Usuario actualizado', meta: { userId: id, updateData }, service: 'UserUseCases' });
      return updated;

    } catch (error) {
      await logToDatabase({ level: 'error', message: 'Error actualizando usuario', meta: { error: error.message, id, updateData }, service: 'UserUseCases' });
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      if (!id) {
        throw new ValidationError('User ID is required');
      }

      // Verificar que el usuario existe
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

  const deleted = await this.userRepository.delete(id);
  await logToDatabase({ level: 'info', message: 'Usuario eliminado', meta: { userId: id }, service: 'UserUseCases' });
  return deleted;
    } catch (error) {
  await logToDatabase({ level: 'error', message: 'Error eliminando usuario', meta: { error: error.message, id }, service: 'UserUseCases' });
  throw error;
    }
  }

  async updateUserDocument(id, documentType, documentNumber) {
    try {
      if (!id) {
        throw new ValidationError('User ID is required');
      }

      if (!documentType || !documentNumber) {
        throw new ValidationError('Document type and number are required');
      }

      // Verificar que el usuario existe
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

      // Verificar que no existe otro usuario con el mismo documento
      const existsByDocument = await this.userRepository.existsByDocument(documentType, documentNumber, id);
      if (existsByDocument) {
        throw new ValidationError('User with this document already exists');
      }

      // Actualizar usando el método de la entidad
      existingUser.updateDocument(documentType, documentNumber);

      // Actualizar en el repositorio
      return await this.userRepository.update(id, {
        documentType: documentType,
        documentNumber: documentNumber
      });
    } catch (error) {
      throw error;
    }
  }

  async updateUserEmail(id, email) {
    try {
      if (!id) {
        throw new ValidationError('User ID is required');
      }

      if (!email) {
        throw new ValidationError('Email is required');
      }

      // Verificar que el usuario existe
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

      // Verificar que no existe otro usuario con el mismo email
      const existsByEmail = await this.userRepository.existsByEmail(email, id);
      if (existsByEmail) {
        throw new ValidationError('User with this email already exists');
      }

      // Actualizar usando el método de la entidad
      existingUser.updateEmail(email);

      // Actualizar en el repositorio
      return await this.userRepository.update(id, { email: email });
    } catch (error) {
      throw error;
    }
  }

  async toggleUserStatus(id) {
    try {
      if (!id) {
        throw new ValidationError('User ID is required');
      }

      // Verificar que el usuario existe
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

      // Cambiar el estado
      const newStatus = !existingUser.isActive;

      // Actualizar en el repositorio
      return await this.userRepository.update(id, { isActive: newStatus });
    } catch (error) {
      throw error;
    }
  }

  async validateUserExists(id) {
    try {
      return await this.userRepository.exists(id);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserUseCases;
