const AssignmentStatus = require('../value-objects/AssignmentStatus');

class Assignment {
  constructor(data = {}) {
    // Soporte para constructor con objeto o parámetros individuales
    if (typeof data === 'object' && !Array.isArray(data)) {
      this.id = data.id || null;
      this.userId = data.userId;
      this.companyId = data.companyId;
      this.status = data.status || AssignmentStatus.PENDING;
      this.startDate = data.startDate;
      this.endDate = data.endDate || null;
      this.assignedAt = data.assignedAt || new Date();
      this.createdAt = data.createdAt || new Date();
      this.updatedAt = data.updatedAt || new Date();
      // Nuevos campos para poblar desde el mensaje
      this.ProcessId = data.ProcessId || null;
      this.Source = data.Source || null;
      this.DocumentNumber = data.DocumentNumber || null;
      this.InvoiceAmount = data.InvoiceAmount || null;
      this.ExternalReference = data.ExternalReference || null;
      this.ClaimId = data.ClaimId || null;
      this.ConceptApplicationCode = data.ConceptApplicationCode || null;
      this.ObjectionCode = data.ObjectionCode || null;
      this.Value = data.Value || null;
    } else {
      // Constructor legacy para compatibilidad
      this.id = arguments[0] || null;
      this.userId = arguments[1];
      // this.roleId = arguments[2]; // Eliminado: no se usa en assignments
      this.status = arguments[3] || AssignmentStatus.PENDING;
      this.assignedAt = arguments[4] || new Date();
      this.endDate = arguments[5] || null;
      this.notes = arguments[6] || null;
      this.companyId = arguments[7];
      this.startDate = arguments[8] || new Date();
      this.createdAt = new Date();
      this.updatedAt = new Date();
    }

    this.validate();
  }

  validate() {
    if (this.userId !== undefined && this.userId !== null) {
      if (!Number.isInteger(this.userId) || this.userId <= 0) {
        throw new Error('User ID must be a positive integer');
      }
    }


    if (!this.companyId) {
      throw new Error('Company ID is required');
    }

    if (!Number.isInteger(this.companyId) || this.companyId <= 0) {
      throw new Error('Company ID must be a positive integer');
    }

    if (!this.startDate) {
      throw new Error('Start date is required');
    }

    if (!(this.startDate instanceof Date) || isNaN(this.startDate.getTime())) {
      throw new Error('Start date must be a valid date');
    }

    if (this.endDate && (!(this.endDate instanceof Date) || isNaN(this.endDate.getTime()))) {
      throw new Error('End date must be a valid date');
    }

    if (this.endDate && this.endDate <= this.startDate) {
      throw new Error('End date must be after start date');
    }

    if (!AssignmentStatus.isValid(this.status)) {
      throw new Error(AssignmentStatus.getValidationMessage());
    }
  }


  // Domain methods
  assign(userId = null) {
    if (userId) {
      this.userId = userId;
    }
    this.status = AssignmentStatus.ACTIVE;
    this.assignedAt = new Date();
    this.updatedAt = new Date();
  }

  activate() {
    this.status = AssignmentStatus.ACTIVE;
    this.updatedAt = new Date();
  }

  complete() {
    this.status = AssignmentStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  cancel() {
    this.status = AssignmentStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  unassign() {
    this.status = AssignmentStatus.UNASSIGNED;
    this.updatedAt = new Date();
  }

  updateDates(startDate, endDate = null) {
    if (!startDate || !(startDate instanceof Date)) {
      throw new Error('Start date is required and must be a valid date');
    }

    if (endDate && (!(endDate instanceof Date) || endDate <= startDate)) {
      throw new Error('End date must be a valid date after start date');
    }

    this.startDate = startDate;
    this.endDate = endDate;
    this.updatedAt = new Date();
  }

  isActive() {
    return this.status === AssignmentStatus.ACTIVE;
  }

  isCompleted() {
    return this.status === AssignmentStatus.COMPLETED;
  }

  isCancelled() {
    return this.status === AssignmentStatus.CANCELLED;
  }

  isPending() {
    return this.status === AssignmentStatus.PENDING;
  }

  isOverdue() {
    if (!this.endDate) return false;
    return new Date() > this.endDate && !this.isCompleted();
  }

  getDuration() {
    if (!this.endDate) return null;
    return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)); // días
  }

  getTimeRemaining() {
    if (!this.endDate || this.isCompleted()) return null;
    const now = new Date();
    if (now > this.endDate) return 0;
    return Math.ceil((this.endDate - now) / (1000 * 60 * 60 * 24)); // días
  }

  // Método para obtener información básica
  getBasicInfo() {
    return {
      id: this.id,
      userId: this.userId,
      roleId: this.roleId,
      companyId: this.companyId,
      status: this.status,
      startDate: this.startDate,
      endDate: this.endDate,
      assignedAt: this.assignedAt,
      isActive: this.isActive(),
      isOverdue: this.isOverdue(),
      duration: this.getDuration(),
      timeRemaining: this.getTimeRemaining(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Static method to create assignment with default values
  static create(userId, roleId, companyId, startDate, endDate = null) {
    return new Assignment({
      userId,
      roleId,
      companyId,
      startDate,
      endDate,
      status: AssignmentStatus.PENDING,
      assignedAt: new Date()
    });
  }

  // Método para validar fechas de solapamiento
  static checkDateOverlap(assignment1, assignment2) {
    if (!assignment1.endDate || !assignment2.endDate) {
      return false; // Si alguna no tiene fecha de fin, asumimos que no se solapan por ahora
    }

    return (assignment1.startDate <= assignment2.endDate &&
      assignment1.endDate >= assignment2.startDate);
  }
}

module.exports = Assignment;