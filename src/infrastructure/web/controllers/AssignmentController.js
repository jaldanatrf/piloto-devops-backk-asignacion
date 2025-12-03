const {
  CreateAssignmentUseCase,
  GetAssignmentUseCase,
  UpdateAssignmentUseCase,
  DeleteAssignmentUseCase,
  ListAssignmentsUseCase
} = require('../../../application/useCases/assignment/AssignmentUseCases');

class AssignmentController {
  /**
   * POST /api/assignments/company/:companyId/reassignment
   * Reasigna asignaciones por processId y userId
   */
  async bulkReassign(req, res, next) {
    try {
      const { companyId } = req.params;
      const { userTCP, userId, assignments } = req.body;
      if (!userTCP || !userId || !Array.isArray(assignments) || assignments.length === 0) {
        return res.status(400).json({ success: false, message: 'Body debe incluir userTCP, userId y assignments.' });
      }
      const models = require('../../database/models/models');
      let updated = [];
      for (const item of assignments) {
        if (!item.assigmentId) continue;
        // Buscar la asignación por id y companyId
        const found = await models.Assignment.findOne({
          where: {
            id: item.assigmentId,
            companyId: parseInt(companyId)
          }
        });
        if (found) {
          const previousStatus = found.status;
          const previousUserId = found.userId;

          // Actualizar el usuario asignado
          found.userId = userId;

          // Lógica de transición de estados:
          // - Si está en 'pending' → cambiar a 'assigned'
          // - Si está en 'assigned' → mantener 'assigned'
          // - Otros estados se mantienen sin cambios
          if (found.status === 'pending') {
            found.status = 'assigned';
          }

          await found.save();

          updated.push({
            assignmentId: found.id,
            userId: found.userId,
            previousUserId: previousUserId,
            previousStatus: previousStatus,
            newStatus: found.status,
            statusChanged: previousStatus !== found.status
          });
        }
      }
      // Guardar log de trazabilidad
      const { logToDatabase } = require('../../../shared/logger/logToDatabase');
      await logToDatabase({
        level: 'info',
        message: `Reasignación de asignaciones por usuario TCP`,
        meta: { userTCP, userId, assignments: updated, companyId },
        user: userTCP,
        service: 'AssignmentReassign'
      });

      // Notificar al orquestador sobre las reasignaciones
      try {
        const OrchestratorIntegration = require('../../external/OrchestratorIntegration');
        const SequelizeConfigurationRepository = require('../../database/repositories/SequelizeConfigurationRepository');
        const configurationRepo = new SequelizeConfigurationRepository(models);

        // Obtener la configuración de la empresa
        const configuration = await configurationRepo.findByCompanyId(parseInt(companyId));

        if (configuration) {
          // Obtener información completa de la compañía para resolver variables
          const company = await models.Company.findByPk(parseInt(companyId), {
            attributes: ['id', 'name', 'documentNumber', 'documentType', 'type']
          });

          if (company) {
            // Preparar las asignaciones para el orquestador con los datos correctos de la base de datos
            const orchestratorAssignments = [];
            let firstAssignmentData = null; // Guardar primer assignment para resolver variables

            for (const item of updated) {
              try {
                // Obtener la información completa de la asignación
                const assignment = await models.Assignment.findByPk(item.assignmentId, {
                  attributes: ['id', 'ClaimId', 'DocumentNumber', 'userId', 'ProcessId', 'Source', 'ObjectionCode', 'Value']
                });

                if (!assignment) continue;

                // Guardar el primer assignment para usar en resolución de variables
                if (!firstAssignmentData) {
                  firstAssignmentData = assignment;
                }

                // Obtener el DUD del usuario de la tabla de usuarios
                const user = await models.User.findByPk(userId, {
                  attributes: ['dud']
                });

                if (!user) continue;

                // Añadir a las asignaciones para el orquestador con los datos correctos
                orchestratorAssignments.push({
                  claimId: assignment.ClaimId ? assignment.ClaimId.toString() : assignment.id.toString(),
                  documentNumber: assignment.DocumentNumber || `CLAIM-${assignment.id}`,
                  NewAssignedUserId: user.dud || userId.toString()
                });
              } catch (dbError) {
                // Continuar con la siguiente asignación
              }
            }

            // Enviar las reasignaciones al orquestador
            if (orchestratorAssignments.length > 0) {
              // Preparar datos para resolver variables en el endpoint
              // Usamos el primer assignment como referencia para variables que lo requieran
              const data = {
                company: {
                  id: company.id,
                  name: company.name,
                  documentNumber: company.documentNumber,
                  documentType: company.documentType,
                  type: company.type
                },
                assignment: firstAssignmentData ? {
                  id: firstAssignmentData.id,
                  processId: firstAssignmentData.ProcessId,
                  claimId: firstAssignmentData.ClaimId,
                  documentNumber: firstAssignmentData.DocumentNumber,
                  source: firstAssignmentData.Source,
                  objectionCode: firstAssignmentData.ObjectionCode,
                  value: firstAssignmentData.Value
                } : {},
                assignments: orchestratorAssignments
              };

              await OrchestratorIntegration.assignMultipleDisputes(configuration, orchestratorAssignments, data);

              // Log de éxito en la notificación
              await logToDatabase({
                level: 'info',
                message: 'Notificación exitosa de reasignaciones al orquestador',
                meta: { assignmentsCount: orchestratorAssignments.length },
                user: userTCP,
                service: 'OrquestratorNotification'
              });
            }
          }
        }
      } catch (orchestratorError) {
        // Logear el error con el orquestador pero no interrumpir el flujo principal
        await logToDatabase({
          level: 'error',
          message: 'Error al notificar reasignaciones al orquestador',
          meta: { error: orchestratorError.message, stack: orchestratorError.stack },
          user: userTCP,
          service: 'OrquestratorNotification'
        });
      }
      
      res.json({ success: true, updated });
    } catch (error) {
      // Loguear el error en la base de datos
      try {
        const { logToDatabase } = require('../../../shared/logger/logToDatabase');
        const { userTCP, userId } = req.body || {};
        await logToDatabase({
          level: 'error',
          message: 'Error en bulkReassign',
          meta: { error: error.message, stack: error.stack, body: req.body },
          user: userTCP || 'unknown',
          service: 'AssignmentReassign'
        });
      } catch (logError) {
        // Si falla el log, solo continuar con el next
      }
      next(error);
    }
  }
  constructor(assignmentUseCases) {
    this.assignmentUseCases = assignmentUseCases;
  }

  // POST /assignments - Crear nueva asignación
  async create(req, res, next) {
    try {
      const assignment = await this.assignmentUseCases.createAssignment.execute(req.body);

      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Assignment created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /assignments/:id - Obtener asignación por ID
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const { includeDetails } = req.query;

      const assignment = await this.assignmentUseCases.getAssignment.execute(
        parseInt(id),
        includeDetails === 'true'
      );

      if (!assignment) {
        return res.status(204).send();
      }
      res.json({
        success: true,
        data: assignment
      });
    } catch (error) {
      next(error);
    }
  }


  // GET /assignments - Listar asignaciones con filtros
  async getAll(req, res, next) {
    try {
      const filters = {
        userId: req.query.userId ? parseInt(req.query.userId) : undefined,
        roleId: req.query.roleId ? parseInt(req.query.roleId) : undefined,
        companyId: req.query.companyId ? parseInt(req.query.companyId) : undefined,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 10
      };

      const options = {
        includeDetails: req.query.includeDetails === 'true',
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'desc'
      };

      const result = await this.assignmentUseCases.listAssignments.execute(filters, pagination, options);

      if (!result.data || result.data.length === 0) {
        return res.status(204).send();
      }
      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.pagination.page,
          limit: result.pagination.limit,
          total: result.count,
          totalPages: Math.ceil(result.count / result.pagination.limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /assignments/:id - Actualizar asignación
  async update(req, res, next) {
    try {
      const { id } = req.params;

      const assignment = await this.assignmentUseCases.updateAssignment.execute(
        parseInt(id),
        req.body
      );
      if (!result.assignments || result.assignments.length === 0) {
        return res.status(204).send();
      }
      res.json({
        success: true,
        data: result.assignments,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }
  // DELETE /assignments/:id - Eliminar asignación
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const { force } = req.query;

      await this.assignmentUseCases.deleteAssignment.execute(
        parseInt(id),
        force === 'true'
      );

      res.json({
        success: true,
        message: 'Assignment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /assignments/:id/activate - Activar asignación
  async activate(req, res, next) {
    try {
      const { id } = req.params;

      const assignment = await this.assignmentUseCases.updateAssignment.execute(
        parseInt(id),
        { status: 'active' }
      );

      res.json({
        success: true,
        data: assignment,
        message: 'Assignment activated successfully'
      });
    } catch (error) {
      next(error);
    }
  }


  // POST /assignments/:id/complete - Completar asignación
  async complete(req, res, next) {
    try {
      const { id } = req.params;

      const assignment = await this.assignmentUseCases.updateAssignment.execute(
        parseInt(id),
        { status: 'completed', endDate: new Date() }
      );

      res.json({
        success: true,
        data: assignment,
        message: 'Assignment completed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /assignments/:id/cancel - Cancelar asignación
  async cancel(req, res, next) {
    try {
      const { id } = req.params;

      const assignment = await this.assignmentUseCases.updateAssignment.execute(
        parseInt(id),
        { status: 'cancelled' }
      );

      res.json({
        success: true,
        data: assignment,
        message: 'Assignment cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /assignments/user/:userId - Obtener asignaciones de un usuario
  async getByUser(req, res, next) {
    try {
      const { userId } = req.params;
      const { status, includeDetails } = req.query;

      const filters = {
        userId: parseInt(userId),
        status: status
      };

      const options = {
        includeDetails: includeDetails === 'true',
        sortBy: 'startDate',
        sortOrder: 'desc'
      };

      const result = await this.assignmentUseCases.listAssignments.execute(
        filters,
        { page: 1, limit: 100 },
        options
      );

      if (!result.data || result.data.length === 0) {
        return res.status(204).send();
      }
      res.json({
        success: true,
        data: result.data,
        count: result.count
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /assignments/company/:documentNumber - Obtener asignaciones con filtros avanzados
  async getByCompany(req, res, next) {
    try {

      const { documentNumber } = req.params;
      
      // Parámetros de paginación y filtros específicos
      const limit = req.query.limit ? parseInt(req.query.limit) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      const userInfoDud = req.query['dud'] || '';
      const status = req.query.status || '';
      const userInfoName = req.query['userName'] || '';
      const ClaimId = req.query.ClaimId || req.query.claimId || '';
      const ObjectionCode = req.query.ObjectionCode || req.query.objectionCode || '';
      const DocumentNumber = req.query.DocumentNumber || req.query.documentNumber || '';
      const dateFrom = req.query.dateFrom || '';
      const dateTo = req.query.dateTo || '';
      const userId = req.query.userId;
      const sortBy = req.query.sortBy || 'fechaAsignacionGlosa';
      const sortOrder = req.query.sortOrder || 'desc';
      const includeDetails = req.query.includeDetails;
      const includeCompleted = req.query.includeCompleted === 'true';

      // Nota: Los estados válidos en BD son: 'pending', 'assigned', 'active', 'completed', 'cancelled'

      if (!documentNumber || documentNumber === 'undefined') {
        return res.status(400).json({
          success: false,
          message: 'El número de documento de la compañía es requerido',
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
      
      const validSortFields = ['fechaAsignacionGlosa', 'dud', 'status', 'createdAt'];
      const validSortOrders = ['asc', 'desc'];
      const validStatuses = ['pending', 'assigned', 'active', 'completed', 'cancelled'];
      
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
      
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Valid options: ${validStatuses.join(', ')}`,
          data: null
        });
      }
      
      // Validar formato de fechas
      if (dateFrom && !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
        return res.status(400).json({
          success: false,
          message: 'dateFrom must be in YYYY-MM-DD format',
          data: null
        });
      }
      
      if (dateTo && !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
        return res.status(400).json({
          success: false,
          message: 'dateTo must be in YYYY-MM-DD format',
          data: null
        });
      }

      const SequelizeCompanyRepository = require('../../database/repositories/SequelizeCompanyRepository');
      const models = require('../../database/models/models');
      const companyRepo = new SequelizeCompanyRepository(models);

      // Buscar la compañía por número de documento
      const company = await companyRepo.findByDocumentNumber(documentNumber);
      if (!company || !company.id) {
        return res.status(404).json({
          success: false,
          message: 'Compañía no encontrada',
          data: null
        });
      }

      // Construir filtros específicos
      const filters = {
        companyId: company.id
      };

      // Filtro específico por estado
      // Por defecto, se excluyen asignaciones con estado 'completed'
      // Para incluirlas, usar query param: includeCompleted=true
      // Para filtrar por estado específico, usar query param: status=completed
      if (status) {
        filters.status = status;
      } else if (!includeCompleted) {
        filters.statusNotEqual = 'completed';
      }

      // Filtro específico por usuario
      if (userId) {
        filters.userId = parseInt(userId);
      }

      // Filtro específico por DUD del usuario
      if (userInfoDud.trim()) {
        filters.userInfoDud = userInfoDud.trim();
      }

      // Filtro específico por nombre del usuario
      if (userInfoName.trim()) {
        filters.userInfoName = userInfoName.trim();
      }

      // Filtro específico por ClaimId
      if (ClaimId.trim()) {
        filters.ClaimId = ClaimId.trim();
      }

      // Filtro específico por ObjectionCode
      if (ObjectionCode.trim()) {
        filters.ObjectionCode = ObjectionCode.trim();
      }

      // Filtro específico por DocumentNumber
      if (DocumentNumber.trim()) {
        filters.DocumentNumber = DocumentNumber.trim();
      }

      // Filtros de fecha
      if (dateFrom) {
        filters.dateFrom = dateFrom;
      }

      if (dateTo) {
        filters.dateTo = dateTo;
      }

      // Configurar paginación
      const pagination = {
        offset: offset,
        limit: limit,
        page: Math.floor(offset / limit) + 1
      };

      const options = {
        includeDetails: includeDetails === 'true',
        sortBy: sortBy,
        sortOrder: sortOrder
      };

      let result;
      try {
        result = await this.assignmentUseCases.listAssignments.execute(filters, pagination, options);
      } catch (error) {
        if (error.name === 'ValidationError' || error.message?.includes('Company ID must be a positive integer')) {
          return res.status(400).json({
            success: false,
            message: error.message,
            data: null
          });
        }
        throw error;
      }
      
      if (!result.data || result.data.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          total: 0,
          totalFiltered: 0,
          currentPage: pagination.page,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        });
      }

      // El total filtrado viene del count con los filtros aplicados
      const totalFiltered = result.count || result.data.length;

      // Calcular metadatos de paginación
      const currentPage = pagination.page;
      const totalPages = Math.ceil(totalFiltered / limit);
      const hasNextPage = offset + limit < totalFiltered;
      const hasPreviousPage = offset > 0;

      res.json({
        success: true,
        data: result.data,
        total: totalFiltered,
        currentPage: currentPage,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage
      });
    } catch (error) {
      console.error('Error in getByCompany:', {
        error: error.message,
        stack: error.stack,
        params: req.params,
        query: req.query
      });
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: error.message,
          data: null
        });
      }
      next(error);
    }
  }

  // GET /assignments/search - Buscar asignaciones
  async search(req, res, next) {
    try {
      const { q, status, companyId } = req.query;
      if (!q || q.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }
      const filters = {
        search: q.trim(),
        status: status,
        companyId: companyId ? parseInt(companyId) : undefined
      };
      const options = {
        includeDetails: true,
        sortBy: 'startDate',
        sortOrder: 'desc'
      };
      const result = await this.assignmentUseCases.listAssignments.execute(
        filters,
        { page: 1, limit: 50 },
        options
      );
      if (!result.data || result.data.length === 0) {
        return res.status(204).send();
      }
      res.json({
        success: true,
        data: result.data,
        count: result.count,
        query: q
      });
    } catch (error) {
      next(error);
    }
  }
  async getActive(req, res, next) {
    try {
      const { companyId, userId, includeDetails } = req.query;
      const filters = {
        status: 'active',
        companyId: companyId ? parseInt(companyId) : undefined,
        userId: userId ? parseInt(userId) : undefined
      };
      const options = {
        includeDetails: includeDetails === 'true',
        sortBy: 'startDate',
        sortOrder: 'desc'
      };
      const result = await this.assignmentUseCases.listAssignments.execute(
        filters,
        { page: 1, limit: 50 },
        options
      );
      if (!result.data || result.data.length === 0) {
        return res.status(204).send();
      }
      res.json({
        success: true,
        data: result.data,
        count: result.count
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /assignments/company/:documentNumber
   * Consulta asignaciones por número de documento de compañía
   */
  async getAssignmentsByCompanyDocument(req, res) {
    const SequelizeCompanyRepository = require('../../infrastructure/database/repositories/SequelizeCompanyRepository');
    const SequelizeAssignmentRepository = require('../../infrastructure/database/repositories/SequelizeAssignmentRepository');
    const sequelizeModels = require('../../infrastructure/database/models');
    const companyRepo = new SequelizeCompanyRepository(sequelizeModels);
    const assignmentRepo = new SequelizeAssignmentRepository(sequelizeModels);
    try {
      const { documentNumber } = req.params;
      // Buscar la compañía por número de documento
      const company = await companyRepo.findByDocumentNumber(documentNumber);
      if (!company || !company.id) {
        return res.status(404).json({ error: 'Compañía no encontrada' });
      }
      // Consultar asignaciones por id de compañía
      const assignments = await assignmentRepo.findByCompany(company.id);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: 'Error consultando asignaciones por compañía', details: error.message });
    }
  }
}

module.exports = AssignmentController;