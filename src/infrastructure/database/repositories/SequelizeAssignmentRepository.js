const AssignmentRepository = require('../../../domain/repositories/assignmentRepository');
const Assignment = require('../../../domain/entities/assignment');
const { ValidationError, NotFoundError } = require('../../../shared/errors');

class SequelizeAssignmentRepository extends AssignmentRepository {
  /**
   * Obtener la fecha de asignación (assignedAt) para un usuario y rol
   */
  async getAssignedAt(userId, roleId) {
    try {
      const assignment = await this.AssignmentModel.findOne({
        where: {
          userId,
          roleId
        },
        attributes: ['assignedAt']
      });
      return assignment ? assignment.assignedAt : null;
    } catch (error) {
      throw error;
    }
  }
  constructor(sequelizeModels) {
    super();
    this.AssignmentModel = sequelizeModels.Assignment;
    this.UserModel = sequelizeModels.User;
    this.RoleModel = sequelizeModels.Role;
    this.CompanyModel = sequelizeModels.Company;
  }

  // Helper method to convert Sequelize model to Assignment entity
  _toAssignmentEntity(assignmentData) {
    // Sequelize puede usar dataValues o acceso directo
    const data = assignmentData.dataValues || assignmentData;

    const assignment = new Assignment({
      id: data.id,
      userId: data.userId,
      companyId: data.companyId,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      assignedAt: data.assignedAt,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      ProcessId: data.ProcessId,
      Source: data.Source,
      DocumentNumber: data.DocumentNumber,
      InvoiceAmount: data.InvoiceAmount,
      ExternalReference: data.ExternalReference,
      ClaimId: data.ClaimId,
      ConceptApplicationCode: data.ConceptApplicationCode,
      ObjectionCode: data.ObjectionCode,
      Value: data.Value
    });

    // Agregar información adicional si está disponible
    const userData = assignmentData.user?.dataValues || assignmentData.user;
    if (userData) {
      assignment.userInfo = {
        id: userData.id,
        name: userData.name,
        dud: userData.dud || userData.DUD
      };
    }

    // Agregar información de la compañía si está disponible
    const companyData = assignmentData.company?.dataValues || assignmentData.company;
    if (companyData) {
      assignment.companyInfo = {
        id: companyData.id,
        name: companyData.name,
        documentNumber: companyData.documentNumber,
        type: companyData.type
      };
    }

    return assignment;
  }

  async create(assignment) {
    try {
      const assignmentData = {
        userId: assignment.userId,
        companyId: assignment.companyId,
        status: assignment.status,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        assignedAt: assignment.assignedAt,
        // Nuevos campos
        ProcessId: assignment.ProcessId,
        Source: assignment.Source,
        DocumentNumber: assignment.DocumentNumber,
        InvoiceAmount: assignment.InvoiceAmount,
        ExternalReference: assignment.ExternalReference,
        ClaimId: assignment.ClaimId,
        ConceptApplicationCode: assignment.ConceptApplicationCode,
        ObjectionCode: assignment.ObjectionCode,
        Value: assignment.Value
      };

      const savedAssignment = await this.AssignmentModel.create(assignmentData);
      return this._toAssignmentEntity(savedAssignment);
    } catch (error) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        const field = error.fields[0];
        if (field === 'user_id') {
          throw new ValidationError(`User with ID ${assignment.userId} does not exist`);
        } else if (field === 'role_id') {
          throw new ValidationError(`Role with ID ${assignment.roleId} does not exist`);
        } else if (field === 'company_id') {
          throw new ValidationError(`Company with ID ${assignment.companyId} does not exist`);
        }
      }
      throw error;
    }
  }

  async save(assignment) {
    // Alias para create por compatibilidad
    return await this.create(assignment);
  }

  async findById(id) {
    try {
      const assignmentData = await this.AssignmentModel.findByPk(id, {
        include: [
          {
            model: this.UserModel,
            as: 'user',
            attributes: ['id', 'name', 'dud']
          },
          {
            model: this.CompanyModel,
            as: 'company',
            attributes: ['id', 'name', 'documentNumber', 'type']
          }
        ]
      });
      
      if (!assignmentData) {
        return null;
      }

      return this._toAssignmentEntity(assignmentData);
    } catch (error) {
      throw error;
    }
  }

  async findAll(filters = {}, pagination = {}) {
    try {
      const whereClause = {};
      const includeClause = [
        {
          model: this.UserModel,
          as: 'user',
          attributes: ['id', 'name', 'dud']
        }
      ];
      
      // Aplicar filtros
      if (filters.status) {
        whereClause.status = filters.status;
      }

      // Filtro para excluir un status específico
      if (filters.statusNotEqual) {
        const Op = this.AssignmentModel.sequelize.Sequelize.Op;
        whereClause.status = {
          [Op.ne]: filters.statusNotEqual
        };
      }
      
      if (filters.userId) {
        whereClause.userId = filters.userId;
      }

      if (filters.roleId) {
        whereClause.roleId = filters.roleId;
      }

      if (filters.companyId) {
        whereClause.companyId = filters.companyId;
      }

      if (filters.startDateAfter) {
        whereClause.startDate = {
          [this.AssignmentModel.sequelize.Sequelize.Op.gte]: filters.startDateAfter
        };
      }

      if (filters.startDateBefore) {
        whereClause.startDate = {
          ...whereClause.startDate,
          [this.AssignmentModel.sequelize.Sequelize.Op.lte]: filters.startDateBefore
        };
      }

      if (filters.assignedAfter) {
        whereClause.assignedAt = {
          [this.AssignmentModel.sequelize.Sequelize.Op.gte]: filters.assignedAfter
        };
      }

      if (filters.assignedBefore) {
        whereClause.assignedAt = {
          ...whereClause.assignedAt,
          [this.AssignmentModel.sequelize.Sequelize.Op.lte]: filters.assignedBefore
        };
      }

      // Filtros adicionales para ClaimId (búsqueda parcial con LIKE)
      if (filters.ClaimId) {
        const Op = this.AssignmentModel.sequelize.Sequelize.Op;
        whereClause.ClaimId = {
          [Op.like]: `%${filters.ClaimId}%`
        };
      }

      // Filtro para ObjectionCode (código de objeción - búsqueda parcial con LIKE)
      if (filters.ObjectionCode) {
        const Op = this.AssignmentModel.sequelize.Sequelize.Op;
        whereClause.ObjectionCode = {
          [Op.like]: `%${filters.ObjectionCode}%`
        };
      }

      // Filtros de fecha alternativo (dateFrom/dateTo)
      if (filters.dateFrom || filters.dateTo) {
        const Op = this.AssignmentModel.sequelize.Sequelize.Op;
        if (filters.dateFrom && filters.dateTo) {
          whereClause.createdAt = {
            [Op.between]: [new Date(filters.dateFrom), new Date(filters.dateTo + ' 23:59:59')]
          };
        } else if (filters.dateFrom) {
          whereClause.createdAt = {
            [Op.gte]: new Date(filters.dateFrom)
          };
        } else if (filters.dateTo) {
          whereClause.createdAt = {
            [Op.lte]: new Date(filters.dateTo + ' 23:59:59')
          };
        }
      }

      // Filtro por DocumentNumber
      if (filters.DocumentNumber) {
        whereClause.DocumentNumber = filters.DocumentNumber;
      }

      // Filtros por información del usuario (DUD y nombre)
      if (filters.userInfoDud || filters.userInfoName) {
        const userWhere = {};
        const Op = this.AssignmentModel.sequelize.Sequelize.Op;
        if (filters.userInfoDud) {
          userWhere.dud = {
            [Op.like]: `%${filters.userInfoDud}%`
          };
        }
        if (filters.userInfoName) {
          userWhere.name = {
            [Op.like]: `%${filters.userInfoName}%`
          };
        }
        
        // Actualizar el include del usuario con filtros
        const userIncludeIndex = includeClause.findIndex(inc => inc.as === 'user');
        if (userIncludeIndex !== -1) {
          includeClause[userIncludeIndex].where = userWhere;
          includeClause[userIncludeIndex].required = true; // INNER JOIN para aplicar filtros
        }
      }

      // Configurar ordenamiento
      let orderClause = [['assignedAt', 'DESC']]; // Por defecto
      if (pagination.sortBy && pagination.sortOrder) {
        if (pagination.sortBy === 'fechaAsignacionGlosa') {
          orderClause = [['assignedAt', pagination.sortOrder]];
        } else if (pagination.sortBy === 'dud') {
          orderClause = [[{ model: this.UserModel, as: 'user' }, 'dud', pagination.sortOrder]];
        } else {
          orderClause = [[pagination.sortBy, pagination.sortOrder]];
        }
      }

      const queryOptions = {
        where: whereClause,
        include: includeClause,
        order: orderClause,
        attributes: [
          'id', 'userId', 'companyId', 'status', 'startDate', 'endDate', 'assignedAt', 'createdAt', 'updatedAt',
          'ProcessId', 'Source', 'DocumentNumber', 'InvoiceAmount', 'ExternalReference', 'ClaimId', 'ConceptApplicationCode', 'ObjectionCode', 'Value'
        ]
      };

      // Aplicar paginación si se proporciona
      if (pagination.limit) {
        queryOptions.limit = pagination.limit;
      }
      if (pagination.offset) {
        queryOptions.offset = pagination.offset;
      }

      const assignmentsData = await this.AssignmentModel.findAll(queryOptions);

      return assignmentsData.map(assignmentData => this._toAssignmentEntity(assignmentData));
    } catch (error) {
      throw error;
    }
  }

  async count(filters = {}) {
    try {
      const whereClause = {};
      
      // Aplicar los mismos filtros que en findAll
      if (filters.status) {
        whereClause.status = filters.status;
      }

      // Filtro para excluir un status específico
      if (filters.statusNotEqual) {
        const Op = this.AssignmentModel.sequelize.Sequelize.Op;
        whereClause.status = {
          [Op.ne]: filters.statusNotEqual
        };
      }
      
      if (filters.userId) {
        whereClause.userId = filters.userId;
      }

      if (filters.roleId) {
        whereClause.roleId = filters.roleId;
      }

      if (filters.companyId) {
        whereClause.companyId = filters.companyId;
      }

      if (filters.startDateAfter) {
        whereClause.startDate = {
          [this.AssignmentModel.sequelize.Sequelize.Op.gte]: filters.startDateAfter
        };
      }

      if (filters.startDateBefore) {
        whereClause.startDate = {
          ...whereClause.startDate,
          [this.AssignmentModel.sequelize.Sequelize.Op.lte]: filters.startDateBefore
        };
      }

      if (filters.assignedAfter) {
        whereClause.assignedAt = {
          [this.AssignmentModel.sequelize.Sequelize.Op.gte]: filters.assignedAfter
        };
      }

      if (filters.assignedBefore) {
        whereClause.assignedAt = {
          ...whereClause.assignedAt,
          [this.AssignmentModel.sequelize.Sequelize.Op.lte]: filters.assignedBefore
        };
      }

      // Filtros adicionales para ClaimId (búsqueda parcial con LIKE)
      if (filters.ClaimId) {
        const Op = this.AssignmentModel.sequelize.Sequelize.Op;
        whereClause.ClaimId = {
          [Op.like]: `%${filters.ClaimId}%`
        };
      }

      // Filtro para ObjectionCode (código de objeción - búsqueda parcial con LIKE)
      if (filters.ObjectionCode) {
        const Op = this.AssignmentModel.sequelize.Sequelize.Op;
        whereClause.ObjectionCode = {
          [Op.like]: `%${filters.ObjectionCode}%`
        };
      }

      // Filtros de fecha alternativo (dateFrom/dateTo)
      if (filters.dateFrom || filters.dateTo) {
        const Op = this.AssignmentModel.sequelize.Sequelize.Op;
        if (filters.dateFrom && filters.dateTo) {
          whereClause.createdAt = {
            [Op.between]: [new Date(filters.dateFrom), new Date(filters.dateTo + ' 23:59:59')]
          };
        } else if (filters.dateFrom) {
          whereClause.createdAt = {
            [Op.gte]: new Date(filters.dateFrom)
          };
        } else if (filters.dateTo) {
          whereClause.createdAt = {
            [Op.lte]: new Date(filters.dateTo + ' 23:59:59')
          };
        }
      }

      // Filtro por DocumentNumber
      if (filters.DocumentNumber) {
        whereClause.DocumentNumber = filters.DocumentNumber;
      }

      // Para filtros por información del usuario, necesitamos hacer un conteo con JOIN
      if (filters.userInfoDud || filters.userInfoName) {
        const includeClause = [{
          model: this.UserModel,
          as: 'user',
          attributes: []
        }];

        const userWhere = {};
        const Op = this.AssignmentModel.sequelize.Sequelize.Op;
        if (filters.userInfoDud) {
          userWhere.dud = {
            [Op.like]: `%${filters.userInfoDud}%`
          };
        }
        if (filters.userInfoName) {
          userWhere.name = {
            [Op.like]: `%${filters.userInfoName}%`
          };
        }
        
        includeClause[0].where = userWhere;
        includeClause[0].required = true;

        return await this.AssignmentModel.count({ 
          where: whereClause,
          include: includeClause,
          distinct: true
        });
      }

      return await this.AssignmentModel.count({
        where: whereClause
      });
    } catch (error) {
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      // Preparar datos para actualización
      const dataToUpdate = {};
      
      if (updateData.userId !== undefined) dataToUpdate.userId = updateData.userId;
      if (updateData.roleId !== undefined) dataToUpdate.roleId = updateData.roleId;
      if (updateData.companyId !== undefined) dataToUpdate.companyId = updateData.companyId;
      if (updateData.status !== undefined) dataToUpdate.status = updateData.status;
      if (updateData.startDate !== undefined) dataToUpdate.startDate = updateData.startDate;
      if (updateData.endDate !== undefined) dataToUpdate.endDate = updateData.endDate;
      if (updateData.assignedAt !== undefined) dataToUpdate.assignedAt = updateData.assignedAt;
      
      // Siempre actualizar updatedAt
      dataToUpdate.updatedAt = new Date();

      const [updatedRowsCount] = await this.AssignmentModel.update(dataToUpdate, {
        where: { id: id }
      });

      if (updatedRowsCount === 0) {
        throw new NotFoundError(`Assignment with ID ${id} not found`);
      }

      // Obtener la asignación actualizada
      return await this.findById(id);
    } catch (error) {
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        const field = error.fields[0];
        if (field === 'user_id') {
          throw new ValidationError(`User with ID ${updateData.userId} does not exist`);
        } else if (field === 'role_id') {
          throw new ValidationError(`Role with ID ${updateData.roleId} does not exist`);
        } else if (field === 'company_id') {
          throw new ValidationError(`Company with ID ${updateData.companyId} does not exist`);
        }
      }
      throw error;
    }
  }

  async delete(id) {
    try {
      const deletedRowsCount = await this.AssignmentModel.destroy({
        where: { id: id }
      });

      if (deletedRowsCount === 0) {
        throw new NotFoundError(`Assignment with ID ${id} not found`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  async findByUser(userId, filters = {}) {
    const newFilters = { ...filters, userId: userId };
    return await this.findAll(newFilters);
  }

  async findByRole(roleId, filters = {}) {
    const newFilters = { ...filters, roleId: roleId };
    return await this.findAll(newFilters);
  }

  async findByCompany(companyId, filters = {}) {
    const newFilters = { ...filters, companyId: companyId };
    return await this.findAll(newFilters);
  }

  

  async findOverlappingAssignments(userId, startDate, endDate) {
    try {
      const whereClause = {
        userId: userId,
        status: ['pending', 'active']
      };

      // Si no hay endDate, solo verificar que no empiecen en la misma fecha
      if (!endDate) {
        whereClause.startDate = startDate;
      } else {
        // Verificar solapamiento de fechas
        whereClause[this.AssignmentModel.sequelize.Sequelize.Op.or] = [
          // La asignación existente empieza durante nuestro período
          {
            startDate: {
              [this.AssignmentModel.sequelize.Sequelize.Op.between]: [startDate, endDate]
            }
          },
          // La asignación existente termina durante nuestro período
          {
            endDate: {
              [this.AssignmentModel.sequelize.Sequelize.Op.between]: [startDate, endDate]
            }
          },
          // La asignación existente engloba completamente nuestro período
          {
            [this.AssignmentModel.sequelize.Sequelize.Op.and]: [
              {
                startDate: {
                  [this.AssignmentModel.sequelize.Sequelize.Op.lte]: startDate
                }
              },
              {
                [this.AssignmentModel.sequelize.Sequelize.Op.or]: [
                  {
                    endDate: {
                      [this.AssignmentModel.sequelize.Sequelize.Op.gte]: endDate
                    }
                  },
                  {
                    endDate: null
                  }
                ]
              }
            ]
          }
        ];
      }

      const assignmentsData = await this.AssignmentModel.findAll({
        where: whereClause,
        include: [
          {
            model: this.UserModel,
            as: 'user',
            attributes: ['id', 'name', 'dud']
          }
        ]
      });

      return assignmentsData.map(assignmentData => this._toAssignmentEntity(assignmentData));
    } catch (error) {
      throw error;
    }
  }

  async getStats(filters = {}) {
    try {
      const whereClause = {};
      
      if (filters.userId) {
        whereClause.userId = filters.userId;
      }
      if (filters.roleId) {
        whereClause.roleId = filters.roleId;
      }
      if (filters.companyId) {
        whereClause.companyId = filters.companyId;
      }

      const [
        totalCount,
        pendingCount,
        activeCount,
        completedCount,
        cancelledCount
      ] = await Promise.all([
        this.AssignmentModel.count({ where: whereClause }),
        this.AssignmentModel.count({ where: { ...whereClause, status: 'pending' } }),
        this.AssignmentModel.count({ where: { ...whereClause, status: 'active' } }),
        this.AssignmentModel.count({ where: { ...whereClause, status: 'completed' } }),
        this.AssignmentModel.count({ where: { ...whereClause, status: 'cancelled' } })
      ]);

      return {
        total: totalCount,
        byStatus: {
          pending: pendingCount,
          active: activeCount,
          completed: completedCount,
          cancelled: cancelledCount
        },
        percentages: {
          pending: totalCount > 0 ? (pendingCount / totalCount * 100).toFixed(2) : 0,
          active: totalCount > 0 ? (activeCount / totalCount * 100).toFixed(2) : 0,
          completed: totalCount > 0 ? (completedCount / totalCount * 100).toFixed(2) : 0,
          cancelled: totalCount > 0 ? (cancelledCount / totalCount * 100).toFixed(2) : 0
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async search(searchTerm, limit = 10) {
    try {
      const assignmentsData = await this.AssignmentModel.findAll({
        include: [
          {
            model: this.UserModel,
            as: 'user',
            attributes: ['id', 'name', 'dud'],
            where: {
              [this.AssignmentModel.sequelize.Sequelize.Op.or]: [
                {
                  name: {
                    [this.AssignmentModel.sequelize.Sequelize.Op.LIKE]: `%${searchTerm}%`
                  }
                },
                {
                  dud: {
                    [this.AssignmentModel.sequelize.Sequelize.Op.LIKE]: `%${searchTerm}%`
                  }
                }
              ]
            }
          },
          {
            model: this.RoleModel,
            as: 'role',
            attributes: ['id', 'name', 'description', 'companyId']
          },
          {
            model: this.CompanyModel,
            as: 'company',
            attributes: ['id', 'name', 'documentNumber', 'type']
          }
        ],
        limit: limit,
        order: [['assignedAt', 'DESC']]
      });

      return assignmentsData.map(assignmentData => this._toAssignmentEntity(assignmentData));
    } catch (error) {
      throw error;
    }
  }

  async exists(id) {
    try {
      const count = await this.AssignmentModel.count({
        where: { id: id }
      });
      return count > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SequelizeAssignmentRepository;
