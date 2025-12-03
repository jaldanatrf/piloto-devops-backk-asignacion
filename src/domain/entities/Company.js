class Company {
  constructor(id, name, description, documentNumber, documentType, type, isActive, createdAt, rules = []) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.documentNumber = documentNumber;
    this.documentType = documentType;
    this.type = type;
    this.isActive = isActive !== undefined ? isActive : true;
    this.createdAt = createdAt || new Date();
    this.rules = rules || []; // Array para almacenar las reglas asociadas
    
    this.validate();
  }
  
  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Company name is required');
    }
    
    if (this.name.trim().length < 2) {
      throw new Error('Company name must be at least 2 characters long');
    }
    
    if (this.name.trim().length > 100) {
      throw new Error('Company name cannot exceed 100 characters');
    }
    
    // Validar que el nombre no tenga caracteres especiales peligrosos (permitir acentos y ñ)
    const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d10-9\s._&-]+$/;
    if (!nameRegex.test(this.name.trim())) {
      throw new Error('Company name contains invalid characters');
    }
    
    if (this.description && this.description.length > 500) {
      throw new Error('Company description cannot exceed 500 characters');
    }
    
    // Validar document number (obligatorio)
    if (!this.documentNumber || this.documentNumber.trim().length === 0) {
      throw new Error('Company document number is required');
    }
    
    if (this.documentNumber.trim().length < 5) {
      throw new Error('Company document number must be at least 5 characters long');
    }
    
    if (this.documentNumber.trim().length > 20) {
      throw new Error('Company document number cannot exceed 20 characters');
    }
    
    // Validar que el número de documento solo contenga números, letras y guiones
    const docRegex = /^[a-zA-Z0-9-]+$/;
    if (!docRegex.test(this.documentNumber.trim())) {
      throw new Error('Company document number contains invalid characters');
    }

    // Validar document type (obligatorio)
    if (!this.documentType || this.documentType.trim().length === 0) {
      throw new Error('Company document type is required');
    }

    // Validar que el tipo de documento sea uno de los valores permitidos
    const allowedDocumentTypes = ['NIT', 'CC', 'CE', 'RUT'];
    if (!allowedDocumentTypes.includes(this.documentType.trim().toUpperCase())) {
      throw new Error('Company document type must be one of: NIT, CC, CE, RUT');
    }

    // Normalizar documentType a mayúsculas
    this.documentType = this.documentType.trim().toUpperCase();

    // Validar company type (obligatorio)
    if (!this.type || this.type.trim().length === 0) {
      throw new Error('Company type is required');
    }

    if (this.type.trim().length > 50) {
      throw new Error('Company type cannot exceed 50 characters');
    }

    // Validar que el tipo sea de una lista válida
    const validTypes = ['PAYER', 'PROVIDER'];
    if (!validTypes.includes(this.type.toUpperCase())) {
      // Temporal: Solo advertir sobre tipos inválidos pero no fallar
      console.warn(`⚠️  Company ID ${this.id} has invalid type '${this.type}'. Valid types are: ${validTypes.join(', ')}`);
      // TODO: Limpiar base de datos y restaurar validación estricta
      // throw new Error(`Company type must be one of: ${validTypes.join(', ')}`);
    }

    // Normalizar type a mayúsculas
    this.type = this.type.toUpperCase();
  }

  // Domain methods
  activate() {
    this.isActive = true;
  }

  deactivate() {
    this.isActive = false;
  }

  updateDescription(newDescription) {
    if (newDescription && newDescription.length > 500) {
      throw new Error('Company description cannot exceed 500 characters');
    }
    this.description = newDescription;
  }

  // Métodos para manejar reglas asociadas
  addRule(rule) {
    if (!rule || !rule.id) {
      throw new Error('Invalid rule');
    }
    
    // Verificar que la regla no esté ya agregada
    const existingRule = this.rules.find(r => r.id === rule.id);
    if (existingRule) {
      throw new Error('Rule is already associated with this company');
    }
    
    this.rules.push(rule);
  }

  removeRule(ruleId) {
    if (!ruleId) {
      throw new Error('Rule ID is required');
    }
    
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    
    if (this.rules.length === initialLength) {
      throw new Error('Rule not found in this company');
    }
  }

  getRules() {
    return [...this.rules];
  }

  getRuleById(ruleId) {
    return this.rules.find(rule => rule.id === ruleId) || null;
  }

  hasRule(ruleId) {
    return this.rules.some(rule => rule.id === ruleId);
  }

  getActiveRules() {
    return this.rules.filter(rule => rule.isActive);
  }

  getRulesCount() {
    return this.rules.length;
  }

  getActiveRulesCount() {
    return this.getActiveRules().length;
  }

  // Método para obtener información básica de la compañía
  getBasicInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      documentNumber: this.documentNumber,
      documentType: this.documentType,
      type: this.type,
      isActive: this.isActive,
      createdAt: this.createdAt,
      rulesCount: this.getRulesCount()
    };
  }

  // Método para obtener estadísticas de la compañía
  getStats() {
    return {
      totalRules: this.getRulesCount(),
      activeRules: this.getActiveRulesCount(),
      inactiveRules: this.getRulesCount() - this.getActiveRulesCount(),
      isActive: this.isActive
    };
  }

  // Método para validar si la compañía puede realizar operaciones
  canPerformOperations() {
    return this.isActive;
  }
}

module.exports = Company;
