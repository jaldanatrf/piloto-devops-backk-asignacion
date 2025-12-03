class Rule {
    constructor(id, name, description, companyId, type, isActive, createdAt, minimumAmount, maximumAmount, nitAssociatedCompany, code) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.companyId = companyId;
        this.type = type;
        this.isActive = isActive !== undefined ? isActive : true;
        this.createdAt = createdAt || new Date();
        this.minimumAmount = minimumAmount || null;
        this.maximumAmount = maximumAmount || null;
        this.nitAssociatedCompany = nitAssociatedCompany || null;
        this.code = code || null;

        this.validate();
    }

    validate() {
        if (!this.name || this.name.trim().length === 0) {
            throw new Error('Rule name is required');
        }

        if (this.name.trim().length < 2) {
            throw new Error('Rule name must be at least 2 characters long');
        }

        if (this.name.trim().length > 100) {
            throw new Error('Rule name cannot exceed 100 characters');
        }

        if (!this.description || this.description.trim().length === 0) {
            throw new Error('Rule description is required');
        }

        if (this.description.trim().length > 500) {
            throw new Error('Rule description cannot exceed 500 characters');
        }

        if (!this.companyId) {
            throw new Error('Company ID is required');
        }

        if (!this.type || this.type.trim().length === 0) {
            throw new Error('Rule type is required');
        }

        if (this.type.trim().length > 50) {
            throw new Error('Rule type cannot exceed 50 characters');
        }

        // Validar que el tipo sea de una lista válida (compatibilidad con tipos antiguos y nuevos)
        const validTypes = [
            'AMOUNT',
            'COMPANY',
            'COMPANY-AMOUNT',
            'CODE',
            'CODE-AMOUNT',
            'COMPANY-CODE',
            'CODE-AMOUNT-COMPANY',
            'CUSTOM'
        ];
        if (!validTypes.includes(this.type.toUpperCase())) {
            throw new Error(`Rule type must be one of: ${validTypes.join(', ')}`);
        }

        // Validaciones específicas según el tipo (solo para nuevos tipos)
        this.validateFieldsByType();

        // Validar que el nombre no tenga caracteres especiales peligrosos
        const nameRegex = /^[a-zA-Z0-9\s._-]+$/;
        if (!nameRegex.test(this.name.trim())) {
            throw new Error('Rule name contains invalid characters');
        }
    }

    validateFieldsByType() {
        const type = this.type.toUpperCase();

        switch (type) {
            case 'AMOUNT':
                if (!this.minimumAmount && this.minimumAmount !== 0) {
                    throw new Error('Minimum amount is required for AMOUNT type rules');
                }
                if (!this.maximumAmount && this.maximumAmount !== 0) {
                    throw new Error('Maximum amount is required for AMOUNT type rules');
                }
                if (typeof this.minimumAmount !== 'number' || this.minimumAmount < 0) {
                    throw new Error('Minimum amount must be a positive number');
                }
                if (typeof this.maximumAmount !== 'number' || this.maximumAmount < 0) {
                    throw new Error('Maximum amount must be a positive number');
                }
                if (this.minimumAmount > this.maximumAmount) {
                    throw new Error('Minimum amount cannot be greater than maximum amount');
                }
                break;

            case 'COMPANY':
                if (!this.nitAssociatedCompany || this.nitAssociatedCompany.trim().length === 0) {
                    throw new Error('NIT associated company is required for COMPANY type rules');
                }
                // Validar formato NIT (básico)
                const nitRegex = /^[0-9]{8,15}-?[0-9kK]?$/;
                if (!nitRegex.test(this.nitAssociatedCompany.trim())) {
                    throw new Error('NIT associated company must have a valid format');
                }
                break;

            case 'COMPANY-AMOUNT':
                // Validar amounts
                if (!this.minimumAmount && this.minimumAmount !== 0) {
                    throw new Error('Minimum amount is required for COMPANY-AMOUNT type rules');
                }
                if (!this.maximumAmount && this.maximumAmount !== 0) {
                    throw new Error('Maximum amount is required for COMPANY-AMOUNT type rules');
                }
                if (typeof this.minimumAmount !== 'number' || this.minimumAmount < 0) {
                    throw new Error('Minimum amount must be a positive number');
                }
                if (typeof this.maximumAmount !== 'number' || this.maximumAmount < 0) {
                    throw new Error('Maximum amount must be a positive number');
                }
                if (this.minimumAmount > this.maximumAmount) {
                    throw new Error('Minimum amount cannot be greater than maximum amount');
                }
                // Validar NIT
                if (!this.nitAssociatedCompany || this.nitAssociatedCompany.trim().length === 0) {
                    throw new Error('NIT associated company is required for COMPANY-AMOUNT type rules');
                }
                const nitRegexCombined = /^[0-9]{8,15}-?[0-9kK]?$/;
                if (!nitRegexCombined.test(this.nitAssociatedCompany.trim())) {
                    throw new Error('NIT associated company must have a valid format');
                }
                break;

            case 'CODE':
                // Validar que el código esté presente
                if (!this.code || this.code.trim().length === 0) {
                    throw new Error('Code is required for CODE type rules');
                }
                // Validar longitud del código
                if (this.code.trim().length > 100) {
                    throw new Error('Code cannot exceed 100 characters');
                }
                break;

            case 'CODE-AMOUNT':
                // Validar código
                if (!this.code || this.code.trim().length === 0) {
                    throw new Error('Code is required for CODE-AMOUNT type rules');
                }
                if (this.code.trim().length > 100) {
                    throw new Error('Code cannot exceed 100 characters');
                }
                // Validar amounts
                if (!this.minimumAmount && this.minimumAmount !== 0) {
                    throw new Error('Minimum amount is required for CODE-AMOUNT type rules');
                }
                if (!this.maximumAmount && this.maximumAmount !== 0) {
                    throw new Error('Maximum amount is required for CODE-AMOUNT type rules');
                }
                if (typeof this.minimumAmount !== 'number' || this.minimumAmount < 0) {
                    throw new Error('Minimum amount must be a positive number');
                }
                if (typeof this.maximumAmount !== 'number' || this.maximumAmount < 0) {
                    throw new Error('Maximum amount must be a positive number');
                }
                if (this.minimumAmount > this.maximumAmount) {
                    throw new Error('Minimum amount cannot be greater than maximum amount');
                }
                break;

            case 'COMPANY-CODE':
                // Validar NIT
                if (!this.nitAssociatedCompany || this.nitAssociatedCompany.trim().length === 0) {
                    throw new Error('NIT associated company is required for COMPANY-CODE type rules');
                }
                const nitRegexCompanyCode = /^[0-9]{8,15}-?[0-9kK]?$/;
                if (!nitRegexCompanyCode.test(this.nitAssociatedCompany.trim())) {
                    throw new Error('NIT associated company must have a valid format');
                }
                // Validar código
                if (!this.code || this.code.trim().length === 0) {
                    throw new Error('Code is required for COMPANY-CODE type rules');
                }
                if (this.code.trim().length > 100) {
                    throw new Error('Code cannot exceed 100 characters');
                }
                break;

            case 'CODE-AMOUNT-COMPANY':
                // Validar código
                if (!this.code || this.code.trim().length === 0) {
                    throw new Error('Code is required for CODE-AMOUNT-COMPANY type rules');
                }
                if (this.code.trim().length > 100) {
                    throw new Error('Code cannot exceed 100 characters');
                }
                // Validar amounts
                if (!this.minimumAmount && this.minimumAmount !== 0) {
                    throw new Error('Minimum amount is required for CODE-AMOUNT-COMPANY type rules');
                }
                if (!this.maximumAmount && this.maximumAmount !== 0) {
                    throw new Error('Maximum amount is required for CODE-AMOUNT-COMPANY type rules');
                }
                if (typeof this.minimumAmount !== 'number' || this.minimumAmount < 0) {
                    throw new Error('Minimum amount must be a positive number');
                }
                if (typeof this.maximumAmount !== 'number' || this.maximumAmount < 0) {
                    throw new Error('Maximum amount must be a positive number');
                }
                if (this.minimumAmount > this.maximumAmount) {
                    throw new Error('Minimum amount cannot be greater than maximum amount');
                }
                // Validar NIT
                if (!this.nitAssociatedCompany || this.nitAssociatedCompany.trim().length === 0) {
                    throw new Error('NIT associated company is required for CODE-AMOUNT-COMPANY type rules');
                }
                const nitRegexCodeAmountCompany = /^[0-9]{8,15}-?[0-9kK]?$/;
                if (!nitRegexCodeAmountCompany.test(this.nitAssociatedCompany.trim())) {
                    throw new Error('NIT associated company must have a valid format');
                }
                break;

            default:
                // Para tipos legacy (BUSINESS, SECURITY, etc.), los campos adicionales pueden ser null
                // Para otros tipos no reconocidos, también permitir null
                break;
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
        if (!newDescription || newDescription.trim().length === 0) {
            throw new Error('Rule description is required');
        }

        if (newDescription.trim().length > 500) {
            throw new Error('Rule description cannot exceed 500 characters');
        }

        this.description = newDescription.trim();
    }

    // Método para obtener información básica de la regla
    getBasicInfo() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            companyId: this.companyId,
            type: this.type,
            isActive: this.isActive,
            createdAt: this.createdAt,
            minimumAmount: this.minimumAmount,
            maximumAmount: this.maximumAmount,
            nitAssociatedCompany: this.nitAssociatedCompany,
            code: this.code
        };
    }

    // Método para clonar una regla (útil para crear reglas similares)
    clone(newName, newCompanyId = null) {
        return new Rule(
            null, // Sin ID para que sea una nueva regla
            newName,
            this.description,
            newCompanyId || this.companyId,
            this.type,
            this.isActive,
            new Date(),
            this.minimumAmount,
            this.maximumAmount,
            this.nitAssociatedCompany,
            this.code
        );
    }

    // Método para validar si pertenece a una compañía específica
    belongsToCompany(companyId) {
        return this.companyId === companyId;
    }
}

module.exports = Rule;
