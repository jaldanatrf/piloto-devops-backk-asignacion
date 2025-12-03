const Assignment = require('../../../domain/entities/assignment');
const AssignmentStatus = require('../../../domain/value-objects/AssignmentStatus');
const { ValidationError, ConflictError } = require('../../../shared/errors');

class createAssignmentUseCase {
  constructor(assignmentRepository, userRepository, roleRepository, companyRepository, validationService) {
    this.assignmentRepository = assignmentRepository;
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.companyRepository = companyRepository;
    this.validationService = validationService;
  }

  async execute(assignmentData) {
    try {
      // 1. Validar datos de entrada
      await this.validateInput(assignmentData);

      // 2. Validar que las entidades relacionadas existen
      await this.validateRelatedEntities(assignmentData);

      // 3. Validar reglas de negocio
      await this.validateBusinessRules(assignmentData);

      // 4. Crear la entidad de dominio
      const assignment = this.createAssignmentEntity(assignmentData);

      // 5. Persistir en el repositorio
      const savedAssignment = await this.assignmentRepository.create(assignment);

      return savedAssignment;
    } catch (error) {
      throw error;
    }
  }

  async validateInput(data) {
    const requiredFields = ['userId', 'companyId', 'startDate'];
    const missingFields = requiredFields.filter(field => !data[field]);

    if (missingFields.length > 0) {
      throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validar tipos de datos
    if (!Number.isInteger(data.userId) || data.userId <= 0) {
      throw new ValidationError('userId must be a positive integer');
    }

    if (!Number.isInteger(data.roleId) || data.roleId <= 0) {
      throw new ValidationError('roleId must be a positive integer');
    }

    if (!Number.isInteger(data.companyId) || data.companyId <= 0) {
      throw new ValidationError('companyId must be a positive integer');
    }

    // Validar fechas
    const startDate = new Date(data.startDate);
    if (isNaN(startDate.getTime())) {
      throw new ValidationError('startDate must be a valid date');
    }

    if (data.endDate) {
      const endDate = new Date(data.endDate);
      if (isNaN(endDate.getTime())) {
        throw new ValidationError('endDate must be a valid date');
      }

      if (endDate <= startDate) {
        throw new ValidationError('endDate must be after startDate');
      }
    }

    // Validar status si se proporciona
    if (data.status && !AssignmentStatus.isValid(data.status)) {
      throw new ValidationError(`Invalid status. Valid values: ${AssignmentStatus.getAllValues().join(', ')}`);
    }
  }

  async validateRelatedEntities(data) {
    // Verificar que el usuario existe y está activo
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw new ValidationError('User not found');
    }
    if (!user.isActive) {
      throw new ValidationError('User is not active');
    }

    // Verificar que el rol existe y está activo
    const role = await this.roleRepository.findById(data.roleId);
    if (!role) {
      throw new ValidationError('Role not found');
    }
    if (!role.isActive) {
      throw new ValidationError('Role is not active');
    }

    // Verificar que la compañía existe y está activa
    const company = await this.companyRepository.findById(data.companyId);
    if (!company) {
      throw new ValidationError('Company not found');
    }
    if (!company.isActive) {
      throw new ValidationError('Company is not active');
    }

    // Verificar que el usuario pertenece a la compañía
    if (user.companyId !== data.companyId) {
      throw new ValidationError('User does not belong to the specified company');
    }

    // Verificar que el rol pertenece a la compañía
    if (role.companyId !== data.companyId) {
      throw new ValidationError('Role does not belong to the specified company');
    }
  }

  createAssignmentEntity(data) {
    return new Assignment({
      userId: data.userId,
      roleId: data.roleId,
      companyId: data.companyId,
      status: data.status || AssignmentStatus.PENDING,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      assignedAt: new Date()
    });
  }
}

module.exports = createAssignmentUseCase;