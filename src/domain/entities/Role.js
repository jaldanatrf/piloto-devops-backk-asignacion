class Role {
  constructor(id, name, description, companyId, isActive, createdAt, updatedAt) {
    this.id = id;
    this.name = name ? name.trim() : name;
    this.description = description ? description.trim() : description;
    this.companyId = companyId;
    this.isActive = isActive !== undefined ? isActive : true;
    // Preserve database dates if they exist, otherwise use current date for new entities
    this.createdAt = createdAt != null ? createdAt : new Date();
    this.updatedAt = updatedAt != null ? updatedAt : new Date();

    this.validate();
  }
  
  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Role name is required');
    }

    if (this.name.trim().length < 2) {
      throw new Error('Role name must be at least 2 characters long');
    }

    if (this.name.trim().length > 100) {
      throw new Error('Role name cannot exceed 100 characters');
    }

    if (this.description && this.description.trim().length > 500) {
      throw new Error('Role description cannot exceed 500 characters');
    }

    if (!this.companyId) {
      throw new Error('Company ID is required');
    }

    // Validar que el nombre no tenga caracteres especiales peligrosos
    const nameRegex = /^[a-zA-Z0-9\s._-]+$/;
    if (!nameRegex.test(this.name.trim())) {
      throw new Error('Role name contains invalid characters');
    }
  }

  // Domain methods
  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  updateDescription(newDescription) {
    if (newDescription && newDescription.trim().length > 500) {
      throw new Error('Role description cannot exceed 500 characters');
    }

    this.description = newDescription ? newDescription.trim() : null;
  }

  // Método para obtener información básica del rol
  getBasicInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      companyId: this.companyId,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  // Método para clonar un rol (útil para crear roles similares)
  clone(newName, newCompanyId = null) {
    return new Role(
      null, // Sin ID para que sea un nuevo rol
      newName,
      this.description,
      newCompanyId || this.companyId,
      this.isActive,
      new Date()
    );
  }

  // Método para validar si pertenece a una compañía específica
  belongsToCompany(companyId) {
    return this.companyId === companyId;
  }
}

module.exports = Role;
