/**
 * UserRole Entity - Entidad de dominio para la relación N:M entre usuarios y roles
 * Representa la asignación de un rol específico a un usuario específico
 */
class UserRole {
  constructor(id, userId, roleId, assignedAt) {
    this.id = id;
    this.userId = userId;
    this.roleId = roleId;
    this.assignedAt = assignedAt || new Date();

    this.validate();
  }

  /**
   * Validar los datos de la relación User-Role
   */
  validate() {
    if (!this.userId) {
      throw new Error('User ID is required for UserRole relationship');
    }

    if (!this.roleId) {
      throw new Error('Role ID is required for UserRole relationship');
    }

    // Validar que userId sea un número válido
    if (typeof this.userId !== 'number' || this.userId <= 0) {
      throw new Error('User ID must be a positive number');
    }

    // Validar que roleId sea un número válido
    if (typeof this.roleId !== 'number' || this.roleId <= 0) {
      throw new Error('Role ID must be a positive number');
    }

    // Validar fecha de asignación
    if (this.assignedAt && !(this.assignedAt instanceof Date)) {
      throw new Error('Assigned date must be a valid Date object');
    }
  }

  /**
   * Obtener información básica de la relación
   */
  getBasicInfo() {
    return {
      id: this.id,
      userId: this.userId,
      roleId: this.roleId,
      assignedAt: this.assignedAt
    };
  }

  /**
   * Verificar si la relación es válida (tiene IDs válidos)
   */
  isValid() {
    try {
      this.validate();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Comparar si dos relaciones UserRole son iguales
   */
  equals(otherUserRole) {
    if (!otherUserRole || !(otherUserRole instanceof UserRole)) {
      return false;
    }

    return this.userId === otherUserRole.userId && 
           this.roleId === otherUserRole.roleId;
  }

  /**
   * Clonar la relación UserRole
   */
  clone() {
    return new UserRole(
      this.id,
      this.userId,
      this.roleId,
      new Date(this.assignedAt.getTime())
    );
  }

  /**
   * Convertir a objeto plano para serialización
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      roleId: this.roleId,
      assignedAt: this.assignedAt
    };
  }

  /**
   * Crear UserRole desde objeto plano
   */
  static fromObject(obj) {
    return new UserRole(
      obj.id,
      obj.userId,
      obj.roleId,
      obj.assignedAt ? new Date(obj.assignedAt) : undefined
    );
  }

  /**
   * Crear múltiples UserRole desde un array de objetos
   */
  static fromArray(arrayOfObjects) {
    return arrayOfObjects.map(obj => UserRole.fromObject(obj));
  }

  /**
   * Crear UserRole para un usuario con múltiples roles
   */
  static createMultipleForUser(userId, roleIds) {
    if (!Array.isArray(roleIds)) {
      throw new Error('Role IDs must be an array');
    }

    return roleIds.map(roleId => new UserRole(null, userId, roleId));
  }

  /**
   * Validar que un array de UserRoles no tenga duplicados
   */
  static validateNoDuplicates(userRoles) {
    const seen = new Set();
    
    for (const userRole of userRoles) {
      const key = `${userRole.userId}-${userRole.roleId}`;
      if (seen.has(key)) {
        throw new Error(`Duplicate UserRole relationship found: User ${userRole.userId} - Role ${userRole.roleId}`);
      }
      seen.add(key);
    }

    return true;
  }
}

module.exports = UserRole;
