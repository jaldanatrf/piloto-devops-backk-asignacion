const UserUseCases = require('../../../application/useCases/users/UserUseCases');
const { ValidationError, NotFoundError } = require('../../../shared/errors');
const { logger } = require('../../../shared/logger');

class UserController {
  async getUsersByCompanyDocumentNumber(req, res, next) {
    try {
      const { documentNumber } = req.params;
      
      // Parámetros de paginación y filtros específicos
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      const dud = req.query.dud || '';
      const name = req.query.name || '';
      const documentType = req.query.documentType || '';
      const isActive = req.query.isActive;
      const roleIds = req.query.roleIds || '';
      const sortBy = req.query.sortBy || 'firstName';
      const sortOrder = req.query.sortOrder || 'asc';
      

      logger.info('getUsersByCompanyDocumentNumber called with params:', {
        documentNumber,
        limit,
        offset,
        dud,
        name,
        documentType,
        isActive,
        roleIds,
        sortBy,
        sortOrder
      });
      
      if (!documentNumber) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company document number is required', 
          data: null 
        });
      }
      
      // Validar parámetros
      if (limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit cannot exceed 100',
          data: null
        });
      }
      
      const validSortFields = ['firstName', 'createdAt', 'documentNumber', 'isActive'];
      const validSortOrders = ['asc', 'desc'];
      const validDocumentTypes = ['CC', 'CE', 'PP', 'TI', 'RC'];
      
      if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({
          success: false,
          message: `Invalid sortBy field. Valid options: ${validSortFields.join(', ')}`,
          data: null
        });
      }
      
      if (!validSortOrders.includes(sortOrder)) {
        return res.status(400).json({
          success: false,
          message: `Invalid sortOrder. Valid options: ${validSortOrders.join(', ')}`,
          data: null
        });
      }
      
      if (documentType && !validDocumentTypes.includes(documentType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid documentType. Valid options: ${validDocumentTypes.join(', ')}`,
          data: null
        });
      }

      // Validar roleIds si se proporciona
      let roleIdsArray = [];
      if (roleIds && roleIds.trim()) {
        roleIdsArray = roleIds.split(',').map(id => parseInt(id.trim()));
        if (roleIdsArray.some(id => isNaN(id) || id <= 0)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid roleIds. Must be comma-separated positive integers (e.g., "1,2,3")',
            data: null
          });
        }
      }
      
      // Buscar la compañía solo por número de documento
      const company = await this.userUseCases.companyRepository.CompanyModel.findOne({
        where: {
          documentNumber
        }
      });
      
      if (!company) {
        return res.status(404).json({ 
          success: false, 
          message: 'Company not found', 
          data: null 
        });
      }
      
      // Construir objeto de filtros para pasar a la capa de datos
      const filters = {};
      if (dud.trim()) filters.dud = dud;
      if (name.trim()) filters.name = name;
      if (documentType.trim()) filters.documentType = documentType;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (roleIdsArray.length > 0) filters.roleIds = roleIdsArray;


      // Buscar usuarios por companyId con filtros aplicados en BD
      let filteredUsers = await this.userUseCases.getUsersByCompany(company.id, filters);

      console.log('Filtered users from database:', {
        count: filteredUsers ? filteredUsers.length : 0,
        filters: filters,
        sampleUser: filteredUsers && filteredUsers[0] ? {
          id: filteredUsers[0].id,
          name: filteredUsers[0].name,
          dud: filteredUsers[0].dud,
          roles: filteredUsers[0].roles
        } : null
      });

      if (!filteredUsers || filteredUsers.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No users found',
          data: [],
          total: 0,
          totalFiltered: 0,
          currentPage: Math.floor(offset / limit) + 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        });
      }

      // Total ya filtrado desde la BD
      const totalFiltered = filteredUsers.length;
      
      // Aplicar ordenamiento
      filteredUsers.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        // Manejar campos especiales
        if (sortBy === 'firstName') {
          aValue = a.name || a.firstName || '';
          bValue = b.name || b.firstName || '';
        } else if (sortBy === 'documentNumber') {
          aValue = a.DUD || a.documentNumber || a.dud || '';
          bValue = b.DUD || b.documentNumber || b.dud || '';
        }
        
        // Manejar valores nulos/undefined
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';
        
        // Convertir a string para comparación consistente
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return sortOrder === 'desc' ? comparison * -1 : comparison;
      });
      
      // Aplicar paginación
      const paginatedUsers = filteredUsers.slice(offset, offset + limit);
      
      // Calcular metadatos de paginación
      const currentPage = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(totalFiltered / limit);
      const hasNextPage = offset + limit < totalFiltered;
      const hasPreviousPage = offset > 0;
      
      // Enriquecer roles y filtrar asignaciones por estado
      const enrichedUsers = await Promise.all(paginatedUsers.map(async user => {
        // Debug: Log user object from repository

        // Crear objeto plano con todas las propiedades del usuario
        const userObject = {
          id: user.id,
          name: user.name,
          dud: user.dud,
          companyId: user.companyId,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          roles: user.roles || [],
          assignments: user.assignments || []
        };


        // Filtrar asignaciones por estado 'pending' o 'assigned'
        if (userObject.assignments && Array.isArray(userObject.assignments)) {
          userObject.assignments = userObject.assignments.filter(a => a.status === 'pending' || a.status === 'assigned');
        }

        // Enriquecer roles con información completa
        if (userObject.roles && Array.isArray(userObject.roles) && userObject.roles.length > 0) {
          const roleObjects = await Promise.all(userObject.roles.map(async r => {
            const roleId = typeof r === 'object' && r.id ? r.id : r;
            const role = await this.userUseCases.roleRepository.findById(roleId);
            return role ? { id: role.id, name: role.name, description: role.description } : { id: roleId };
          }));
          userObject.roles = roleObjects;
        }

        return userObject;
      }));


      const responseData = {
        success: true,
        data: enrichedUsers,
        total: totalFiltered,
        totalFiltered: totalFiltered,
        currentPage: currentPage,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage
      };


      return res.status(200).json(responseData);
    } catch (error) {
      logger.error('Error in getUsersByCompanyDocumentNumber:', {
        error: error.message,
        stack: error.stack,
        params: req.params,
        query: req.query
      });
      next(error);
    }
  }
  constructor(userUseCases, userRoleUseCases) {
    this.userUseCases = userUseCases;
    this.userRoleUseCases = userRoleUseCases;
  }

  async createUser(req, res, next) {
    try {
      logger.info('Creating user with data:', JSON.stringify(req.body));
      // Permitir tanto 'DUD' como 'dud' en el body
      const name = req.body.name;
      const dud = req.body.dud || req.body.DUD;
      const companyId = req.body.companyId;
      const isActive = req.body.isActive;
      const roles = req.body.roles;

      // Validar campos requeridos
      if (!name || !dud || !companyId) {
        logger.warn('Missing required fields for user creation');
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, dud, companyId',
          data: null
        });
      }

      // Preparar datos del usuario
      const userData = {
        name,
        dud,
        companyId: parseInt(companyId),
        isActive: isActive !== undefined ? isActive : true,
        roles: roles && Array.isArray(roles) ? roles.map(id => parseInt(id)).filter(id => !isNaN(id)) : []
      };

      logger.info('Processed user data:', JSON.stringify(userData, null, 2));

      // Crear el usuario con roles
      const newUser = await this.userUseCases.createUser(userData);
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      });
    } catch (error) {
      logger.error('Error creating user:', error);
      // Responder con error HTTP adecuado
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          message: error.message,
          data: null
        });
      }
      if (error instanceof NotFoundError) {
        return res.status(404).json({
          success: false,
          message: error.message,
          data: null
        });
      }
      // Error inesperado
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message,
        data: null
      });
    }
  }

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        logger.warn('Invalid user ID provided:', id);
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required',
          data: null
        });
      }

      const user = await this.userUseCases.getUserById(parseInt(id));
      
      logger.info('User found:', { id: user.id, email: user.email });

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      next(error);
    }
  }

  async getUserByDUD(req, res, next) {
    try {
      const { DUD } = req.params;
      logger.info('Getting user by DUD:', { DUD });

      if (!DUD) {
        logger.warn('Missing DUD parameter');
        return res.status(400).json({
          success: false,
          message: 'DUD is required',
          data: null
        });
      }

      const user = await this.userUseCases.getUserByDUD(DUD);
      logger.info('User found by DUD:', { id: user.id, DUD });

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      logger.error('Error getting user by DUD:', error);
      next(error);
    }
  }
  

  async getUserByCompanyAndDocument(req, res, next) {
    try {
      const { companyId, documentType, documentNumber } = req.params;
      logger.info('Getting user by company and document:', { companyId, documentType, documentNumber });

      if (!companyId || !documentType || !documentNumber) {
        logger.warn('Missing required parameters');
        return res.status(400).json({
          success: false,
          message: 'Company ID, document type and document number are required',
          data: null
        });
      }

      const user = await this.userUseCases.getUserByCompanyAndDocument(
        parseInt(companyId), 
        documentType, 
        documentNumber
      );
      
      logger.info('User found by company and document:', { 
        id: user.id, 
        companyId, 
        document: `${documentType} ${documentNumber}` 
      });

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      logger.error('Error getting user by company and document:', error);
      next(error);
    }
  }

  async getUserByEmail(req, res, next) {
    try {
      const { email } = req.params;
      logger.info('Getting user by email:', email);

      if (!email) {
        logger.warn('Email parameter is required');
        return res.status(400).json({
          success: false,
          message: 'Email is required',
          data: null
        });
      }

      const user = await this.userUseCases.getUserByEmail(email);
      
      logger.info('User found by email:', { id: user.id, email: user.email });

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      logger.error('Error getting user by email:', error);
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const filters = {};
      
      // Aplicar filtros desde query parameters
      if (req.query.isActive !== undefined) {
        filters.isActive = req.query.isActive === 'true';
      }
      
      if (req.query.firstName) {
        filters.firstName = req.query.firstName;
      }
      
      if (req.query.lastName) {
        filters.lastName = req.query.lastName;
      }
      
      if (req.query.email) {
        filters.email = req.query.email;
      }
      
      if (req.query.documentType) {
        filters.documentType = req.query.documentType;
      }
      
      if (req.query.documentNumber) {
        filters.documentNumber = req.query.documentNumber;
      }
      
      if (req.query.companyId) {
        filters.companyId = parseInt(req.query.companyId);
      }

      logger.info('Getting all users with filters:', JSON.stringify(filters, null, 2));

      const users = await this.userUseCases.getAllUsers(filters);
      
      logger.info('Found users:', users.length);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        count: users.length
      });
    } catch (error) {
      logger.error('Error getting all users:', error);
      next(error);
    }
  }

  async searchUsersByName(req, res, next) {
    try {
      const { name } = req.query;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;

      logger.info('Searching users by name:', { name, limit });

      if (!name) {
        logger.warn('Name parameter is required for search');
        return res.status(400).json({
          success: false,
          message: 'Name parameter is required',
          data: null
        });
      }

      const users = await this.userUseCases.searchUsersByName(name, limit);
      
      logger.info('Users found by name search:', users.length);

      res.status(200).json({
        success: true,
        message: 'Users search completed successfully',
        data: users,
        count: users.length
      });
    } catch (error) {
      logger.error('Error searching users by name:', error);
      next(error);
    }
  }

  async searchUsersByDocument(req, res, next) {
    try {
      const { documentType, documentNumber } = req.query;

      logger.info('Searching users by document:', { documentType, documentNumber });

      if (!documentType && !documentNumber) {
        logger.warn('At least document type or number is required');
        return res.status(400).json({
          success: false,
          message: 'At least document type or document number is required',
          data: null
        });
      }

      const users = await this.userUseCases.searchUsersByDocument(documentType, documentNumber);
      
      logger.info('Users found by document search:', users.length);

      res.status(200).json({
        success: true,
        message: 'Users search completed successfully',
        data: users,
        count: users.length
      });
    } catch (error) {
      logger.error('Error searching users by document:', error);
      next(error);
    }
  }

  async getUsersByCompany(req, res, next) {
    try {
      const { companyId } = req.params;
      logger.info('Getting users by company:', companyId);

      if (!companyId || isNaN(parseInt(companyId))) {
        logger.warn('Valid company ID is required');
        return res.status(400).json({
          success: false,
          message: 'Valid company ID is required',
          data: null
        });
      }

      const users = await this.userUseCases.getUsersByCompany(parseInt(companyId));
      
      logger.info('Users found for company:', users.length);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        count: users.length
      });
    } catch (error) {
      logger.error('Error getting users by company:', error);
      next(error);
    }
  }

  async getUsersByRole(req, res, next) {
    try {
      const { roleId } = req.params;
      logger.info('Getting users by role:', roleId);

      if (!roleId || isNaN(parseInt(roleId))) {
        logger.warn('Valid role ID is required');
        return res.status(400).json({
          success: false,
          message: 'Valid role ID is required',
          data: null
        });
      }

      const users = await this.userUseCases.getUsersByRole(parseInt(roleId));
      
      logger.info('Users found for role:', users.length);

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        count: users.length
      });
    } catch (error) {
      logger.error('Error getting users by role:', error);
      next(error);
    }
  }

  async getActiveUsers(req, res, next) {
    try {
      logger.info('Getting active users');

      const users = await this.userUseCases.getActiveUsers();
      
      logger.info('Active users found:', users.length);

      res.status(200).json({
        success: true,
        message: 'Active users retrieved successfully',
        data: users,
        count: users.length
      });
    } catch (error) {
      logger.error('Error getting active users:', error);
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      logger.info('Updating user:', { id, updateData: JSON.stringify(updateData, null, 2) });

      if (!id || isNaN(parseInt(id))) {
        logger.warn('Valid user ID is required');
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required',
          data: null
        });
      }

      // Convertir companyId a entero si está presente
      if (updateData.companyId) {
        updateData.companyId = parseInt(updateData.companyId);
      }

      const updatedUser = await this.userUseCases.updateUser(parseInt(id), updateData);
      
      logger.info('User updated successfully:', { id: updatedUser.id });

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      next(error);
    }
  }

  async updateUserDocument(req, res, next) {
      try {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) {
          logger.warn('Invalid user ID provided:', id);
          return res.status(400).json({
            success: false,
            message: 'Valid user ID is required',
            data: null
          });
        }

        const user = await this.userUseCases.getUserById(parseInt(id));
        logger.info('User found:', { id: user.id, email: user.email });
        res.status(200).json({
          success: true,
          message: 'User retrieved successfully',
          data: user
        });
      } catch (error) {
        logger.error('Error getting user by ID:', error);
        next(error);
      }
    try {
      const { id } = req.params;
      const { email } = req.body;

      logger.info('Updating user email:', { id, email });

      if (!id || isNaN(parseInt(id))) {
        logger.warn('Valid user ID is required');
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required',
          data: null
        });
      }

      if (!email) {
        logger.warn('Email is required');
        return res.status(400).json({
          success: false,
          message: 'Email is required',
          data: null
        });
      }

      const updatedUser = await this.userUseCases.updateUserEmail(parseInt(id), email);
      
      logger.info('User email updated successfully:', { id: updatedUser.id });

      res.status(200).json({
        success: true,
        message: 'User email updated successfully',
        data: updatedUser
      });
    } catch (error) {
      logger.error('Error updating user email:', error);
      next(error);
    }
  }

  async toggleUserStatus(req, res, next) {
    try {
      const { id } = req.params;

      logger.info('Toggling user status:', id);

      if (!id || isNaN(parseInt(id))) {
        logger.warn('Valid user ID is required');
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required',
          data: null
        });
      }

      const updatedUser = await this.userUseCases.toggleUserStatus(parseInt(id));
      
      logger.info('User status toggled successfully:', { id: updatedUser.id, isActive: updatedUser.isActive });

      res.status(200).json({
        success: true,
        message: 'User status updated successfully',
        data: updatedUser
      });
    } catch (error) {
      logger.error('Error toggling user status:', error);
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      logger.info('Deleting user:', id);

      if (!id || isNaN(parseInt(id))) {
        logger.warn('Valid user ID is required');
        return res.status(400).json({
          success: false,
          message: 'Valid user ID is required',
          data: null
        });
      }

      await this.userUseCases.deleteUser(parseInt(id));
      
      logger.info('User deleted successfully:', id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: null
      });
    } catch (error) {
      logger.error('Error deleting user:', error);
      next(error);
    }
  }

  // Métodos de compatibilidad con la estructura anterior
  async create(req, res, next) {
    return this.createUser(req, res, next);
  }

  async getById(req, res, next) {
    return this.getUserById(req, res, next);
  }

  async getByEmail(req, res, next) {
    return this.getUserByEmail(req, res, next);
  }

  async getAll(req, res, next) {
    return this.getAllUsers(req, res, next);
  }

  async update(req, res, next) {
    return this.updateUser(req, res, next);
  }

  async delete(req, res, next) {
    return this.deleteUser(req, res, next);
  }

  async search(req, res, next) {
    return this.searchUsersByName(req, res, next);
  }

  async getActive(req, res, next) {
    return this.getActiveUsers(req, res, next);
  }

  async getByRole(req, res, next) {
    return this.getUsersByRole(req, res, next);
  }

  async getByCompany(req, res, next) {
    return this.getUsersByCompany(req, res, next);
  }
}

module.exports = UserController;
