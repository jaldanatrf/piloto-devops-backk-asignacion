const { ValidationError, NotFoundError, ConflictError } = require('../../../shared/errors');

class DeleteAssignmentUseCase {
  constructor(assignmentRepository) {
    this.assignmentRepository = assignmentRepository;
  }

  async execute(assignmentId, options = {}) {
    try {
      // 1. Validar ID de asignación
      if (!assignmentId || !Number.isInteger(assignmentId) || assignmentId <= 0) {
        throw new ValidationError('Valid assignment ID is required');
      }

      // 2. Verificar que la asignación existe
      const existingAssignment = await this.assignmentRepository.findById(assignmentId);
      if (!existingAssignment) {
        throw new NotFoundError(`Assignment with ID ${assignmentId} not found`);
      }

      // 3. Validar reglas de negocio para eliminación
      await this.validateDeletionRules(existingAssignment, options);

      // 4. Realizar eliminación (soft delete o hard delete según opciones)
      if (options.softDelete !== false) {
        // Soft delete: marcar como cancelada
        const updatedAssignment = await this.assignmentRepository.update(assignmentId, {
          status: 'cancelled',
          updatedAt: new Date()
        });
        
        return {
          deleted: true,
          softDelete: true,
          assignment: updatedAssignment
        };
      } else {
        // Hard delete: eliminar completamente
        await this.assignmentRepository.delete(assignmentId);
        
        return {
          deleted: true,
          softDelete: false,
          assignment: existingAssignment
        };
      }
    } catch (error) {
      throw error;
    }
  }

  async validateDeletionRules(assignment, options) {
    // Regla: No se puede eliminar una asignación completada a menos que se fuerce
    if (assignment.status === 'completed' && !options.force) {
      throw new ConflictError(
        'Cannot delete a completed assignment. Use force option if necessary.'
      );
    }

    // Regla: Advertir si la asignación está activa
    if (assignment.status === 'active' && !options.confirmActiveDelete) {
      throw new ConflictError(
        'Assignment is currently active. Set confirmActiveDelete option to proceed.'
      );
    }

    // Regla: Verificar dependencias si es necesario
    if (options.checkDependencies) {
      // Aquí se pueden agregar verificaciones adicionales
      // Por ejemplo, verificar si hay registros relacionados
      const hasDependencies = await this.checkAssignmentDependencies(assignment.id);
      
      if (hasDependencies && !options.force) {
        throw new ConflictError(
          'Assignment has related records. Use force option to proceed.'
        );
      }
    }
  }

  async checkAssignmentDependencies(assignmentId) {
    // Implementar lógica para verificar dependencias
    // Por ejemplo, verificar si hay registros de tiempo, reportes, etc.
    // Por ahora retornamos false
    return false;
  }
}

module.exports = DeleteAssignmentUseCase;
