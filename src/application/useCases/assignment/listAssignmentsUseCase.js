const { ValidationError } = require('../../../shared/errors');

class ListAssignmentsUseCase {
  constructor(assignmentRepository) {
    this.assignmentRepository = assignmentRepository;
  }

  async execute(filters = {}, pagination = {}, options = {}) {
    try {
      // 1. Validar y normalizar filtros
      const normalizedFilters = this.validateAndNormalizeFilters(filters);

      // 2. Validar paginación y opciones
      const normalizedPagination = this.validatePagination({...pagination, ...options});

      // 3. Obtener asignaciones
      const assignments = await this.assignmentRepository.findAll(normalizedFilters, normalizedPagination);
      // Obtener el total de registros (sin paginación)
      const totalCount = await this.assignmentRepository.count(normalizedFilters);

      // 4. Obtener estadísticas si se solicitan
      let stats = null;
      if (filters.includeStats) {
        stats = await this.assignmentRepository.getStats(normalizedFilters);
      }

      return {
        data: assignments,
        pagination: normalizedPagination,
        filters: normalizedFilters,
        count: totalCount,
        stats
      };
    } catch (error) {
      throw error;
    }
  }

  validateAndNormalizeFilters(filters) {
    const normalized = {};

    // Filtro por status
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        normalized.status = filters.status;
      } else {
        normalized.status = [filters.status];
      }
    }

    // Filtro para excluir un status específico
    if (filters.statusNotEqual) {
      normalized.statusNotEqual = filters.statusNotEqual;
    }

    // Filtro por usuario
    if (filters.userId) {
      if (!Number.isInteger(parseInt(filters.userId)) || parseInt(filters.userId) <= 0) {
        throw new ValidationError('userId must be a positive integer');
      }
      normalized.userId = parseInt(filters.userId);
    }

    // Filtro por rol
    if (filters.roleId) {
      if (!Number.isInteger(parseInt(filters.roleId)) || parseInt(filters.roleId) <= 0) {
        throw new ValidationError('roleId must be a positive integer');
      }
      normalized.roleId = parseInt(filters.roleId);
    }

    // Filtro por compañía
    if (filters.companyId) {
      if (!Number.isInteger(parseInt(filters.companyId)) || parseInt(filters.companyId) <= 0) {
        throw new ValidationError('companyId must be a positive integer');
      }
      normalized.companyId = parseInt(filters.companyId);
    }

    // Filtros de fecha
    if (filters.startDateFrom) {
      const date = new Date(filters.startDateFrom);
      if (isNaN(date.getTime())) {
        throw new ValidationError('startDateFrom must be a valid date');
      }
      normalized.startDateFrom = date;
    }

    if (filters.startDateTo) {
      const date = new Date(filters.startDateTo);
      if (isNaN(date.getTime())) {
        throw new ValidationError('startDateTo must be a valid date');
      }
      normalized.startDateTo = date;
    }

    if (filters.assignedAfter) {
      const date = new Date(filters.assignedAfter);
      if (isNaN(date.getTime())) {
        throw new ValidationError('assignedAfter must be a valid date');
      }
      normalized.assignedAfter = date;
    }

    if (filters.assignedBefore) {
      const date = new Date(filters.assignedBefore);
      if (isNaN(date.getTime())) {
        throw new ValidationError('assignedBefore must be a valid date');
      }
      normalized.assignedBefore = date;
    }

    // Filtro para asignaciones vencidas
    if (filters.overdue === 'true' || filters.overdue === true) {
      normalized.overdue = true;
    }

    // Filtro para asignaciones activas
    if (filters.active === 'true' || filters.active === true) {
      normalized.active = true;
    }

    // Filtro por ClaimId
    if (filters.ClaimId) {
      normalized.ClaimId = filters.ClaimId.toString().trim();
    }

    // Filtro por DUD del usuario
    if (filters.userInfoDud) {
      normalized.userInfoDud = filters.userInfoDud.toString().trim();
    }

    // Filtro por nombre del usuario
    if (filters.userInfoName) {
      normalized.userInfoName = filters.userInfoName.toString().trim();
    }

    // Filtro por código de objeción
    if (filters.ObjectionCode) {
      normalized.ObjectionCode = filters.ObjectionCode.toString().trim();
    }

    // Filtro por DocumentNumber
    if (filters.DocumentNumber) {
      normalized.DocumentNumber = filters.DocumentNumber.toString().trim();
    }

    // Filtros de fecha alternativo (dateFrom/dateTo)
    if (filters.dateFrom) {
      const date = new Date(filters.dateFrom);
      if (isNaN(date.getTime())) {
        throw new ValidationError('dateFrom must be a valid date');
      }
      normalized.dateFrom = date;
    }

    if (filters.dateTo) {
      const date = new Date(filters.dateTo);
      if (isNaN(date.getTime())) {
        throw new ValidationError('dateTo must be a valid date');
      }
      normalized.dateTo = date;
    }

    return normalized;
  }

  validatePagination(pagination) {
    const normalized = {
      page: 1,
      limit: 10,
      offset: 0
    };

    if (pagination.page) {
      const page = parseInt(pagination.page);
      if (!Number.isInteger(page) || page < 1) {
        throw new ValidationError('page must be a positive integer');
      }
      normalized.page = page;
    }

    if (pagination.limit) {
      const limit = parseInt(pagination.limit);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new ValidationError('limit must be between 1 and 100');
      }
      normalized.limit = limit;
    }

    normalized.offset = (normalized.page - 1) * normalized.limit;

    // Ordenamiento
    if (pagination.sortBy) {
      const allowedSortFields = ['id', 'userId', 'roleId', 'status', 'startDate', 'assignedAt', 'createdAt', 'fechaAsignacionGlosa', 'dud'];
      if (!allowedSortFields.includes(pagination.sortBy)) {
        throw new ValidationError(`sortBy must be one of: ${allowedSortFields.join(', ')}`);
      }
      normalized.sortBy = pagination.sortBy;
    } else {
      normalized.sortBy = 'createdAt';
    }

    if (pagination.sortOrder) {
      if (!['ASC', 'DESC', 'asc', 'desc'].includes(pagination.sortOrder)) {
        throw new ValidationError('sortOrder must be ASC, DESC, asc, or desc');
      }
      normalized.sortOrder = pagination.sortOrder.toUpperCase();
    } else {
      normalized.sortOrder = 'DESC';
    }

    // Incluir detalles
    if (pagination.includeDetails === true || pagination.includeDetails === 'true') {
      normalized.includeDetails = true;
    }

    return normalized;
  }
}

module.exports = ListAssignmentsUseCase;
