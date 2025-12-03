const { ValidationError } = require('../../../shared/errors');

class GetAllAssignmentsUseCase {
  constructor(assignmentRepository) {
    this.assignmentRepository = assignmentRepository;
  }

  async execute(filters = {}, pagination = {}) {
    // Validar filtros
    const validatedFilters = this.validateFilters(filters);
    
    // Validar paginación
    const validatedPagination = this.validatePagination(pagination);
    
    // Obtener asignaciones
    const assignments = await this.assignmentRepository.findAll(validatedFilters, validatedPagination);
    
    // Obtener el total para paginación
    const total = await this.assignmentRepository.count(validatedFilters);
    
    return {
      assignments,
      pagination: {
        ...validatedPagination,
        total,
        totalPages: Math.ceil(total / validatedPagination.limit)
      }
    };
  }

  validateFilters(filters) {
    const validatedFilters = {};

    if (filters.status) {
      validatedFilters.status = filters.status;
    }

    if (filters.userId) {
      if (!Number.isInteger(filters.userId) || filters.userId <= 0) {
        throw new ValidationError('userId must be a positive integer');
      }
      validatedFilters.userId = filters.userId;
    }

    if (filters.roleId) {
      if (!Number.isInteger(filters.roleId) || filters.roleId <= 0) {
        throw new ValidationError('roleId must be a positive integer');
      }
      validatedFilters.roleId = filters.roleId;
    }

    if (filters.companyId) {
      if (!Number.isInteger(filters.companyId) || filters.companyId <= 0) {
        throw new ValidationError('companyId must be a positive integer');
      }
      validatedFilters.companyId = filters.companyId;
    }

    if (filters.startDateAfter) {
      const date = new Date(filters.startDateAfter);
      if (isNaN(date.getTime())) {
        throw new ValidationError('startDateAfter must be a valid date');
      }
      validatedFilters.startDateAfter = date;
    }

    if (filters.startDateBefore) {
      const date = new Date(filters.startDateBefore);
      if (isNaN(date.getTime())) {
        throw new ValidationError('startDateBefore must be a valid date');
      }
      validatedFilters.startDateBefore = date;
    }

    if (filters.assignedAfter) {
      const date = new Date(filters.assignedAfter);
      if (isNaN(date.getTime())) {
        throw new ValidationError('assignedAfter must be a valid date');
      }
      validatedFilters.assignedAfter = date;
    }

    if (filters.assignedBefore) {
      const date = new Date(filters.assignedBefore);
      if (isNaN(date.getTime())) {
        throw new ValidationError('assignedBefore must be a valid date');
      }
      validatedFilters.assignedBefore = date;
    }

    return validatedFilters;
  }

  validatePagination(pagination) {
    const validatedPagination = {
      page: 1,
      limit: 10
    };

    if (pagination.page) {
      if (!Number.isInteger(pagination.page) || pagination.page < 1) {
        throw new ValidationError('page must be a positive integer');
      }
      validatedPagination.page = pagination.page;
    }

    if (pagination.limit) {
      if (!Number.isInteger(pagination.limit) || pagination.limit < 1 || pagination.limit > 100) {
        throw new ValidationError('limit must be a positive integer between 1 and 100');
      }
      validatedPagination.limit = pagination.limit;
    }

    validatedPagination.offset = (validatedPagination.page - 1) * validatedPagination.limit;

    return validatedPagination;
  }
}

module.exports = GetAllAssignmentsUseCase;
