/**
 * Claim Entity - Entidad de dominio para representar una reclamación
 * Contiene toda la información necesaria para procesar reglas empresariales
 */
class Claim {
  constructor(data) {
    this.processId = data.ProcessId;
    this.target = data.Target; // NIT de la empresa destino/objetivo de la reclamación
    this.source = data.Source; // NIT de la empresa que TIENE las reglas configuradas
    this.documentNumber = data.DocumentNumber;
    this.invoiceAmount = data.InvoiceAmount;
    this.externalReference = data.ExternalReference;
    this.claimId = data.ClaimId;
    this.conceptApplicationCode = data.ConceptApplicationCode;
    this.objectionCode = data.ObjectionCode;
    this.value = data.Value;

    this.validate();
  }

  /**
   * Validar los datos obligatorios de la reclamación
   */
  validate() {
    if (!this.processId) {
      throw new Error('ProcessId is required for Claim');
    }

    if (!this.target) {
      throw new Error('Target company identifier is required');
    }

    if (!this.source) {
      throw new Error('Source company identifier is required');
    }

    if (!this.invoiceAmount && this.invoiceAmount !== 0) {
      throw new Error('InvoiceAmount is required');
    }

    if (typeof this.invoiceAmount !== 'number' || this.invoiceAmount < 0) {
      throw new Error('InvoiceAmount must be a positive number');
    }

    if (!this.claimId) {
      throw new Error('ClaimId is required');
    }

    if (!this.value && this.value !== 0) {
      throw new Error('Value is required');
    }

    if (typeof this.value !== 'number' || this.value < 0) {
      throw new Error('Value must be a positive number');
    }
  }

  /**
   * Obtener información básica de la reclamación
   */
  getBasicInfo() {
    return {
      processId: this.processId,
      claimId: this.claimId,
      target: this.target,
      source: this.source,
      invoiceAmount: this.invoiceAmount,
      value: this.value
    };
  }

  /**
   * Verificar si el monto está dentro de un rango específico
   */
  isAmountInRange(minimumAmount, maximumAmount) {
    if (minimumAmount === null || minimumAmount === undefined) {
      return this.invoiceAmount <= maximumAmount;
    }
    
    if (maximumAmount === null || maximumAmount === undefined) {
      return this.invoiceAmount >= minimumAmount;
    }

    return this.invoiceAmount >= minimumAmount && this.invoiceAmount <= maximumAmount;
  }

  /**
   * Verificar si la empresa fuente (source) coincide con un NIT específico
   * @deprecated No longer used - rules evaluate against target company
   * Las reglas están en Source, evalúa contra Target
   */
  matchesSourceCompany(nitAssociatedCompany) {
    if (!nitAssociatedCompany) {
      return false;
    }

    // Normalizar NITs para comparación (quitar espacios y guiones)
    const normalizedSource = this.source.replace(/[-\s]/g, '').toUpperCase();
    const normalizedNit = nitAssociatedCompany.replace(/[-\s]/g, '').toUpperCase();

    return normalizedSource === normalizedNit;
  }

  /**
   * Verificar si el código de objeción del claim coincide exactamente con el código especificado
   * Usado para evaluar reglas CODE: coincidencia exacta, case-sensitive
   * @param {string} code - Código de objeción a comparar
   * @returns {boolean} - True si coincide exactamente, false en caso contrario
   */
  matchesObjectionCode(code) {
    if (!code) {
      return false;
    }

    // Si el claim no tiene objectionCode, no coincide
    if (!this.objectionCode) {
      return false;
    }

    // Coincidencia exacta, case-sensitive, sin normalización
    return this.objectionCode === code;
  }

  /**
   * Verificar si la empresa destino (target) coincide con un NIT específico
   * Usado para evaluar reglas COMPANY, COMPANY-CODE, COMPANY-AMOUNT, CODE-AMOUNT-COMPANY
   * Las reglas están configuradas en Source, y evalúan contra Target
   */
  matchesTargetCompany(nitAssociatedCompany) {
    if (!nitAssociatedCompany) {
      return false;
    }

    // Normalizar NITs para comparación (quitar espacios y guiones)
    const normalizedTarget = this.target.replace(/[-\s]/g, '').toUpperCase();
    const normalizedNit = nitAssociatedCompany.replace(/[-\s]/g, '').toUpperCase();

    return normalizedTarget === normalizedNit;
  }

  /**
   * Convertir a objeto plano para logging
   */
  toJSON() {
    return {
      processId: this.processId,
      target: this.target,
      source: this.source,
      documentNumber: this.documentNumber,
      invoiceAmount: this.invoiceAmount,
      externalReference: this.externalReference,
      claimId: this.claimId,
      conceptApplicationCode: this.conceptApplicationCode,
      objectionCode: this.objectionCode,
      value: this.value
    };
  }

  /**
   * Crear instancia desde objeto plano
   */
  static fromObject(obj) {
    return new Claim(obj);
  }
}

module.exports = Claim;
