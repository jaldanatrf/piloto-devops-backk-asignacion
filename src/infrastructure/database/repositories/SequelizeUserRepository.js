const UserRepository = require('../../../domain/repositories/UserRepository');
const User = require('../../../domain/entities/users');
const { ValidationError, NotFoundError } = require('../../../shared/errors');

class SequelizeUserRepository extends UserRepository {
  async findByDUD(dud) {
    const userRecord = await this.UserModel.findOne({
      where: { dud: dud }
    });
    return userRecord ? this._toUserEntity(userRecord.toJSON()) : null;
  }
  constructor(sequelizeModels) {
    super();
    this.UserModel = sequelizeModels.User;
    this.RoleModel = sequelizeModels.Role;
    this.UserRoleModel = sequelizeModels.UserRole;
    this.CompanyModel = sequelizeModels.Company;
    this.AssignmentModel = sequelizeModels.Assignment;
    // Obtener la instancia de Sequelize desde el modelo
    this.sequelize = this.UserModel.sequelize;
  }

  async save(user) {
    const transaction = await this.sequelize.transaction();

    try {
      const userData = {
        name: user.name,
        dud: user.dud,
        companyId: user.companyId,
        isActive: user.isActive
      };

      // Crear el usuario
      const savedUser = await this.UserModel.create(userData, { transaction });

      // Asignar roles si existen
      if (user.roles && user.roles.length > 0) {
        // Validar que los roles existen y pertenecen a la misma compañía
        const validRoles = await this.RoleModel.findAll({
          where: {
            id: user.roles.map(role => typeof role === 'object' ? role.id : role),
            companyId: user.companyId
          },
          transaction
        });

        if (validRoles.length !== user.roles.length) {
          throw new ValidationError('One or more roles do not exist or do not belong to the user company');
        }

        const userRoleData = validRoles.map(role => ({
          userId: savedUser.id,
          roleId: role.id
        }));

        await this.UserRoleModel.bulkCreate(userRoleData, { transaction });
      }

      await transaction.commit();

      // Devolver el usuario creado con su ID
      return this._toUserEntity(savedUser.toJSON());
      
    } catch (error) {
      await transaction.rollback();
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        const constraint = error.errors[0]?.path;
        if (constraint === 'dud') {
          throw new ValidationError('User with this DUD already exists');
        } else if (constraint === 'users_document_unique') {
          throw new ValidationError('User with this document already exists');
        } else if (constraint === 'users_email_unique') {
          throw new ValidationError('User with this email already exists');
        }
        throw new ValidationError('User already exists');
      }
      
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new ValidationError('Company does not exist');
      }
      
      throw error;
    }
  }

  async findById(id) {
    try {
      const userData = await this.UserModel.findByPk(id, {
        include: [
          {
            model: this.RoleModel,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'name', 'companyId']
          }
        ]
      });
      
      if (!userData) {
        return null;
      }

      return this._toUserEntity(userData.toJSON());
    } catch (error) {
      throw error;
    }
  }

  async findByDocument(documentType, documentNumber) {
    try {
      const userData = await this.UserModel.findOne({
        where: { 
          documentType: documentType,
          documentNumber: documentNumber 
        },
        include: [
          {
            model: this.RoleModel,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'name', 'companyId']
          }
        ]
      });
      
      if (!userData) {
        return null;
      }

      return this._toUserEntity(userData.toJSON());
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      const userData = await this.UserModel.findOne({
        where: { email: email },
        include: [
          {
            model: this.RoleModel,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'name', 'companyId']
          }
        ]
      });
      
      if (!userData) {
        return null;
      }

      return this._toUserEntity(userData.toJSON());
    } catch (error) {
      throw error;
    }
  }

  async findAll(filters = {}) {
    try {
      const whereClause = {};
      
      // Aplicar filtros
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }
      
      if (filters.firstName) {
        whereClause.firstName = {
          [this.sequelize.Sequelize.Op.like]: `%${filters.firstName}%`
        };
      }

      if (filters.lastName) {
        whereClause.lastName = {
          [this.sequelize.Sequelize.Op.like]: `%${filters.lastName}%`
        };
      }

      if (filters.email) {
        whereClause.email = {
          [this.sequelize.Sequelize.Op.like]: `%${filters.email}%`
        };
      }

      if (filters.documentType) {
        whereClause.documentType = filters.documentType;
      }

      if (filters.documentNumber) {
        whereClause.documentNumber = {
          [this.sequelize.Sequelize.Op.like]: `%${filters.documentNumber}%`
        };
      }

      if (filters.companyId) {
        whereClause.companyId = filters.companyId;
      }

      const usersData = await this.UserModel.findAll({
        where: whereClause,
        include: [
          {
            model: this.RoleModel,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'name', 'companyId']
          }
        ],
  order: [['name', 'ASC']]
      });

      return usersData.map(userData => this._toUserEntity(userData.toJSON()));
    } catch (error) {
      throw error;
    }
  }

  async searchByName(name, limit = 10) {
    try {
      const searchTerm = name.toLowerCase().trim();
      const usersData = await this.UserModel.findAll({
        where: {
          [this.sequelize.Sequelize.Op.or]: [
            this.sequelize.literal(`LOWER(CONCAT("firstName", ' ', "lastName")) LIKE '%${searchTerm}%'`),
            {
              firstName: {
                [this.sequelize.Sequelize.Op.like]: `%${searchTerm}%`
              }
            },
            {
              lastName: {
                [this.sequelize.Sequelize.Op.like]: `%${searchTerm}%`
              }
            }
          ]
        },
        include: [
          {
            model: this.RoleModel,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'name', 'companyId']
          }
        ],
        limit: limit,
  order: [['name', 'ASC']]
      });

      return usersData.map(userData => this._toUserEntity(userData.toJSON()));
    } catch (error) {
      throw error;
    }
  }

  async update(id, updateData) {
    const transaction = await this.sequelize.transaction();
    
    try {
      // Separar datos del usuario de los roles
      const { roles, ...userData } = updateData;
      
      // Si se están actualizando firstName o lastName, actualizar también name
      if (userData.firstName || userData.lastName) {
        // Obtener los datos actuales del usuario para completar name
        const currentUser = await this.UserModel.findByPk(id, { transaction });
        if (!currentUser) {
          throw new NotFoundError(`User with ID ${id} not found`);
        }
        
        const firstName = userData.firstName || currentUser.firstName;
        const lastName = userData.lastName || currentUser.lastName;
        userData.name = `${firstName} ${lastName}`;
      }
      
      // Actualizar datos básicos del usuario
      const [updatedRowsCount] = await this.UserModel.update(userData, {
        where: { id: id },
        transaction
      });

      if (updatedRowsCount === 0) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

      // Actualizar roles si se proporcionaron
      if (roles !== undefined) {
        // Eliminar roles actuales
        await this.UserRoleModel.destroy({
          where: { userId: id },
          transaction
        });

        // Agregar nuevos roles
        if (roles && roles.length > 0) {
          const userRoleData = roles.map(role => ({
            userId: id,
            roleId: typeof role === 'object' ? role.id : role
          }));
          
          await this.UserRoleModel.bulkCreate(userRoleData, { transaction });
        }
      }

      await transaction.commit();
      
      // Obtener el usuario actualizado
      return await this.findById(id);
    } catch (error) {
      await transaction.rollback();
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        const constraint = error.errors[0]?.path;
        if (constraint === 'dud') {
          throw new ValidationError('User with this DUD already exists');
        } else if (constraint === 'users_document_unique') {
          throw new ValidationError('User with this document already exists');
        } else if (constraint === 'users_email_unique') {
          throw new ValidationError('User with this email already exists');
        }
        throw new ValidationError('User already exists');
      }
      
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new ValidationError('Company does not exist');
      }
      
      throw error;
    }
  }

  async delete(id) {
    const transaction = await this.sequelize.transaction();
    
    try {
      // Verificar si el usuario tiene asignaciones activas
      const activeAssignments = await this.AssignmentModel.count({
        where: { 
          userId: id,
          estado: 'PENDIENTE'
        }
      });

      if (activeAssignments > 0) {
        throw new ValidationError('Cannot delete user with active assignments');
      }

      // Eliminar relaciones con roles
      await this.UserRoleModel.destroy({
        where: { userId: id },
        transaction
      });

      // Eliminar el usuario
      const deletedRowsCount = await this.UserModel.destroy({
        where: { id: id },
        transaction
      });

      if (deletedRowsCount === 0) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findByRole(roleId) {
    try {
      const usersData = await this.UserModel.findAll({
        include: [
          {
            model: this.RoleModel,
            as: 'roles',
            where: { id: roleId },
            through: { attributes: [] },
            attributes: ['id', 'name', 'companyId']
          }
        ],
  order: [['name', 'ASC']]
      });

      return usersData.map(userData => this._toUserEntity(userData.toJSON()));
    } catch (error) {
      throw error;
    }
  }

  async findByCompany(companyId, filters = {}) {
    try {
      const whereClause = { companyId: companyId };
      const { Op } = this.sequelize.Sequelize;
      const andConditions = [];

      // Filtro por DUD (documento único)
      if (filters.dud && filters.dud.trim()) {
        whereClause.dud = {
          [Op.like]: `%${filters.dud.trim()}%`
        };
      } else {
        // Excluir usuarios sin DUD solo si no hay filtro por DUD
        whereClause.dud = { [Op.ne]: null };
      }

      // Filtro por nombre
      if (filters.name && filters.name.trim()) {
        whereClause.name = {
          [Op.like]: `%${filters.name.trim()}%`
        };
      }

      // Filtro por tipo de documento
      if (filters.documentType && filters.documentType.trim()) {
        andConditions.push(
          this.sequelize.where(
            this.sequelize.fn('UPPER', this.sequelize.fn('SUBSTRING', this.sequelize.col('dud'), 1, 2)),
            filters.documentType.toUpperCase()
          )
        );
      }

      // Filtro por estado activo
      if (filters.isActive !== undefined) {
        whereClause.isActive = filters.isActive;
      }

      // Agregar condiciones AND si existen
      if (andConditions.length > 0) {
        whereClause[Op.and] = andConditions;
      }

      // Configurar include para roles
      const includeRoles = {
        model: this.RoleModel,
        as: 'roles',
        through: { attributes: [] },
        attributes: ['id', 'name', 'companyId']
      };

      // Filtro por roles específicos
      if (filters.roleIds && Array.isArray(filters.roleIds) && filters.roleIds.length > 0) {
        includeRoles.where = { id: { [Op.in]: filters.roleIds } };
        includeRoles.required = true; // INNER JOIN para filtrar usuarios que NO tienen estos roles
      }

      const usersData = await this.UserModel.findAll({
        where: whereClause,
        include: [includeRoles],
        order: [['name', 'ASC']],
        distinct: true // Evitar duplicados cuando hay múltiples roles
      });

      return usersData.map(userData => this._toUserEntity(userData.toJSON()));
    } catch (error) {
      throw error;
    }
  }

  async findByCompanyAndDocument(companyId, documentType, documentNumber) {
    try {
      const userData = await this.UserModel.findOne({
        where: { 
          companyId: companyId,
          documentType: documentType,
          documentNumber: documentNumber 
        },
        include: [
          {
            model: this.RoleModel,
            as: 'roles',
            through: { attributes: [] },
            attributes: ['id', 'name', 'companyId']
          }
        ]
      });
      
      if (!userData) {
        return null;
      }

      return this._toUserEntity(userData.toJSON());
    } catch (error) {
      throw error;
    }
  }

  async findActive() {
    return await this.findAll({ isActive: true });
  }

  async exists(id) {
    try {
      const count = await this.UserModel.count({
        where: { id: id }
      });
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  async existsByDocument(documentType, documentNumber, excludeId = null) {
    try {
      const whereClause = {
        documentType: documentType,
        documentNumber: documentNumber
      };

      if (excludeId) {
        whereClause.id = {
          [this.sequelize.Sequelize.Op.ne]: excludeId
        };
      }

      const count = await this.UserModel.count({
        where: whereClause
      });
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  async existsByEmail(email, excludeId = null) {
    try {
      const whereClause = { email: email };

      if (excludeId) {
        whereClause.id = {
          [this.sequelize.Sequelize.Op.ne]: excludeId
        };
      }

      const count = await this.UserModel.count({
        where: whereClause
      });
      return count > 0;
    } catch (error) {
      throw error;
    }
  }

  _toUserEntity(userData) {
    // Debug: Check what's in userData

    const userEntity = new User({
      id: userData.id,
      name: userData.name,
      dud: userData.dud,
      companyId: userData.companyId,
      isActive: userData.isActive,
      roles: userData.roles ? userData.roles.map(role => role.id) : [],
      createdAt: userData.createdAt || userData.created_at,
      updatedAt: userData.updatedAt || userData.updated_at
    });


    return userEntity;
  }
}

module.exports = SequelizeUserRepository;
