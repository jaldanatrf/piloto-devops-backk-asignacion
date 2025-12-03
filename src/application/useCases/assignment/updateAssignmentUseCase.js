const Assignment = require('../../../domain/entities/assignment');
const AssignmentStatus = require('../../../domain/value-objects/AssignmentStatus');
const { ValidationError, NotFoundError, ConflictError } = require('../../../shared/errors');

class UpdateAssignmentUseCase {
  constructor(assignmentRepository, userRepository, roleRepository, companyRepository) {
    this.assignmentRepository = assignmentRepository;
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
    this.companyRepository = companyRepository;
  }

  async execute(assignmentId, updateData) {
    try {
      // 1. Validar que el ID de asignación es válido
      if (!assignmentId || !Number.isInteger(assignmentId) || assignmentId <= 0) {
        throw new ValidationError('Valid assignment ID is required');
      }

      // 2. Verificar que la asignación existe
      const existingAssignment = await this.assignmentRepository.findById(assignmentId);
      if (!existingAssignment) {
        throw new NotFoundError(`Assignment with ID ${assignmentId} not found`);
      }

      // 3. Validar datos de actualización
      await this.validateUpdateData(updateData, existingAssignment);

      // 4. Validar reglas de negocio para la actualización
      await this.validateUpdateBusinessRules(assignmentId, updateData, existingAssignment);

      // 5. Crear entidad actualizada
      const updatedAssignment = this.createUpdatedAssignment(existingAssignment, updateData);

      // 6. Persistir cambios
      const savedAssignment = await this.assignmentRepository.update(assignmentId, updatedAssignment);

      return savedAssignment;
    } catch (error) {
      throw error;
    }
  }

  async validateUpdateData(data, existingAssignment) {
    // Validar tipos de datos si se proporcionan
    if (data.userId !== undefined) {
      if (!Number.isInteger(data.userId) || data.userId <= 0) {
        throw new ValidationError('userId must be a positive integer');
      }
    }

    if (data.roleId !== undefined) {
      if (!Number.isInteger(data.roleId) || data.roleId <= 0) {
        throw new ValidationError('roleId must be a positive integer');
      }
    }

    if (data.companyId !== undefined) {
      if (!Number.isInteger(data.companyId) || data.companyId <= 0) {
        throw new ValidationError('companyId must be a positive integer');
      }
    }

    // Validar fechas
    if (data.startDate !== undefined) {
      const startDate = new Date(data.startDate);
      if (isNaN(startDate.getTime())) {
        throw new ValidationError('startDate must be a valid date');
      }

      // Verificar con endDate existente o nueva
      const endDate = data.endDate !== undefined ? new Date(data.endDate) : existingAssignment.endDate;
      if (endDate && endDate <= startDate) {
        throw new ValidationError('endDate must be after startDate');
      }
    }

    if (data.endDate !== undefined && data.endDate !== null) {
      const endDate = new Date(data.endDate);
      if (isNaN(endDate.getTime())) {
        throw new ValidationError('endDate must be a valid date');
      }

      // Verificar con startDate existente o nueva
      const startDate = data.startDate !== undefined ? new Date(data.startDate) : existingAssignment.startDate;
      if (endDate <= startDate) {
        throw new ValidationError('endDate must be after startDate');
      }
    }

    // Validar status
    if (data.status && !AssignmentStatus.isValid(data.status)) {
      throw new ValidationError(`Invalid status. Valid values: ${AssignmentStatus.getAllValues().join(', ')}`);
    }

    // Validar entidades relacionadas si se proporcionan nuevos IDs
    if (data.userId && data.userId !== existingAssignment.userId) {
      const user = await this.userRepository.findById(data.userId);
      if (!user) {
        throw new ValidationError('User not found');
      }
      if (!user.isActive) {
        throw new ValidationError('User is not active');
      }
    }

    if (data.roleId && data.roleId !== existingAssignment.roleId) {
      const role = await this.roleRepository.findById(data.roleId);
      if (!role) {
        throw new ValidationError('Role not found');
      }
      if (!role.isActive) {
        throw new ValidationError('Role is not active');
      }
    }

    if (data.companyId && data.companyId !== existingAssignment.companyId) {
      const company = await this.companyRepository.findById(data.companyId);
      if (!company) {
        throw new ValidationError('Company not found');
      }
      if (!company.isActive) {
        throw new ValidationError('Company is not active');
      }
    }
  }

  async validateUpdateBusinessRules(assignmentId, data, existingAssignment) {
    // Verificar coherencia entre usuario, rol y compañía
    const finalUserId = data.userId !== undefined ? data.userId : existingAssignment.userId;
    const finalRoleId = data.roleId !== undefined ? data.roleId : existingAssignment.roleId;
    const finalCompanyId = data.companyId !== undefined ? data.companyId : existingAssignment.companyId;

    if (data.userId || data.companyId) {
      const user = await this.userRepository.findById(finalUserId);
      if (user.companyId !== finalCompanyId) {
        throw new ValidationError('User does not belong to the specified company');
      }
    }

    if (data.roleId || data.companyId) {
      const role = await this.roleRepository.findById(finalRoleId);
      if (role.companyId !== finalCompanyId) {
        throw new ValidationError('Role does not belong to the specified company');
      }
    }


    // Verificar solapamiento de fechas si se cambian las fechas o el usuario
    if (data.startDate || data.endDate || data.userId) {
      const finalStartDate = data.startDate !== undefined ? new Date(data.startDate) : existingAssignment.startDate;
      const finalEndDate = data.endDate !== undefined ? 
        (data.endDate ? new Date(data.endDate) : null) : existingAssignment.endDate;

      const overlappingAssignments = await this.assignmentRepository.findOverlappingAssignments(
        finalUserId,
        finalStartDate,
        finalEndDate
      );

      // Filtrar la asignación actual
      const otherOverlapping = overlappingAssignments.filter(assignment => assignment.id !== assignmentId);
      
      if (otherOverlapping.length > 0) {
        throw new ConflictError('Assignment dates overlap with existing assignments');
      }
    }
  }

  createUpdatedAssignment(existingAssignment, updateData) {
    // Crear una copia de la asignación existente con los datos actualizados
    const updatedData = {
      id: existingAssignment.id,
      userId: updateData.userId !== undefined ? updateData.userId : existingAssignment.userId,
      roleId: updateData.roleId !== undefined ? updateData.roleId : existingAssignment.roleId,
      companyId: updateData.companyId !== undefined ? updateData.companyId : existingAssignment.companyId,
      status: updateData.status !== undefined ? updateData.status : existingAssignment.status,
      startDate: updateData.startDate !== undefined ? new Date(updateData.startDate) : existingAssignment.startDate,
      endDate: updateData.endDate !== undefined ? 
        (updateData.endDate ? new Date(updateData.endDate) : null) : existingAssignment.endDate,
      assignedAt: existingAssignment.assignedAt,
      createdAt: existingAssignment.createdAt,
      updatedAt: new Date()
    };

    return new Assignment(updatedData);
  }
}

module.exports = UpdateAssignmentUseCase;
