const { ValidationError, NotFoundError, ConflictError } = require('../../../shared/errors');
const Rule = require('../../../domain/entities/Rule');
const RuleRole = require('../../../domain/entities/RuleRole');
const { logToDatabase } = require('../../../shared/logger/logToDatabase');

class CreateRuleUseCase {
  constructor(ruleRepository, companyRepository, ruleRoleRepository, roleRepository) {
    this.ruleRepository = ruleRepository;
    this.companyRepository = companyRepository;
    this.ruleRoleRepository = ruleRoleRepository;
    this.roleRepository = roleRepository;
  }
  
  async execute(ruleData, companyId) {
    try {
      // Validaciones de entrada
      if (!ruleData.name) {
        throw new ValidationError('Rule name is required');
      }
      if (!ruleData.description) {
        throw new ValidationError('Rule description is required');
      }
      if (!ruleData.type) {
        throw new ValidationError('Rule type is required');
      }
      if (!companyId) {
        throw new ValidationError('Company ID is required');
      }
      // Verificar que la compañía existe
      const company = await this.companyRepository.findById(companyId);
      if (!company) {
        throw new NotFoundError(`Company with ID ${companyId} not found`);
      }
      if (!company.isActive) {
        throw new ValidationError('Cannot create rules for inactive company');
      }
      // Validar roleIds si se proporcionan
      if (ruleData.roleIds && ruleData.roleIds.length > 0) {
        // Verificar que todos los roles existen y pertenecen a la misma compañía
        for (const roleId of ruleData.roleIds) {
          const role = await this.roleRepository.findById(roleId);
          if (!role) {
            throw new NotFoundError(`Role with ID ${roleId} not found`);
          }
          if (role.companyId !== companyId) {
            throw new ValidationError(`Role with ID ${roleId} does not belong to company ${companyId}`);
          }
          if (!role.isActive) {
            throw new ValidationError(`Role with ID ${roleId} is not active`);
          }
        }
      }
      // Verificar que el nombre de la regla no exista en la misma compañía
      const existingRule = await this.ruleRepository.findByName(ruleData.name.trim(), companyId);
      if (existingRule) {
        throw new ConflictError(`Rule with name '${ruleData.name}' already exists in this company`);
      }

      // Si el tipo es COMPANY, verificar que no exista otra regla con el mismo nitAssociatedCompany
      if (ruleData.type.toUpperCase() === 'COMPANY' && ruleData.nitAssociatedCompany) {
        const existingRulesWithType = await this.ruleRepository.findByCompany(companyId, {
          type: 'COMPANY'
        });

        const duplicateNit = existingRulesWithType.find(
          rule => rule.nitAssociatedCompany && rule.nitAssociatedCompany.trim() === ruleData.nitAssociatedCompany.trim()
        );

        if (duplicateNit) {
          throw new ConflictError(
            `A COMPANY rule with NIT '${ruleData.nitAssociatedCompany}' already exists in this company`
          );
        }
      }

      // Validar rangos de montos para reglas tipo AMOUNT
      if (ruleData.type.toUpperCase() === 'AMOUNT' && ruleData.minimumAmount !== undefined && ruleData.maximumAmount !== undefined) {
        const existingAmountRules = await this.ruleRepository.findByCompany(companyId, {
          type: 'AMOUNT'
        });

        const overlappingRule = existingAmountRules.find(rule =>
          rule.minimumAmount !== undefined &&
          rule.maximumAmount !== undefined &&
          rangesOverlap(ruleData.minimumAmount, ruleData.maximumAmount, rule.minimumAmount, rule.maximumAmount)
        );

        if (overlappingRule) {
          throw new ConflictError(
            `Ya existe una regla con un rango que se solapa con el especificado`
          );
        }
      }

      // Validar rangos de montos para reglas tipo COMPANY-AMOUNT con mismo NIT
      if (ruleData.type.toUpperCase() === 'COMPANY-AMOUNT' && ruleData.nitAssociatedCompany && ruleData.minimumAmount !== undefined && ruleData.maximumAmount !== undefined) {
        const existingCompanyAmountRules = await this.ruleRepository.findByCompany(companyId, {
          type: 'COMPANY-AMOUNT'
        });

        const overlappingRule = existingCompanyAmountRules.find(rule =>
          rule.nitAssociatedCompany &&
          rule.nitAssociatedCompany.trim() === ruleData.nitAssociatedCompany.trim() &&
          rule.minimumAmount !== undefined &&
          rule.maximumAmount !== undefined &&
          rangesOverlap(ruleData.minimumAmount, ruleData.maximumAmount, rule.minimumAmount, rule.maximumAmount)
        );

        if (overlappingRule) {
          throw new ConflictError(
            `Ya existe una regla con un rango que se solapa con el especificado para el NIT asociado`
          );
        }
      }

      // Validar reglas con CODE (nuevos tipos)
      if (['CODE', 'CODE-AMOUNT', 'COMPANY-CODE', 'CODE-AMOUNT-COMPANY'].includes(ruleData.type.toUpperCase())) {
        await validateCodeRules(this.ruleRepository, ruleData, companyId);
      }

      // Crear la entidad
      const rule = new Rule(
        null, // ID será generado por el repositorio
        ruleData.name.trim(),
        ruleData.description.trim(),
        companyId,
        ruleData.type.toUpperCase(),
        ruleData.isActive !== undefined ? ruleData.isActive : true,
        new Date(),
        ruleData.minimumAmount,
        ruleData.maximumAmount,
        ruleData.nitAssociatedCompany,
        ruleData.code || null
      );
      // Guardar usando el repositorio
      const savedRule = await this.ruleRepository.save(rule);
      // Si se proporcionaron roleIds, crear las relaciones en rule_role
      if (ruleData.roleIds && ruleData.roleIds.length > 0) {
        const ruleRoles = ruleData.roleIds.map(roleId => 
          new RuleRole(null, savedRule.id, roleId)
        );
        await this.ruleRoleRepository.bulkCreate(ruleRoles);
      }
      await logToDatabase({ level: 'info', message: 'Regla creada', meta: { ruleId: savedRule.id, ruleData, companyId }, service: 'RuleUseCase' });
      return savedRule;
    } catch (error) {
      await logToDatabase({ level: 'error', message: 'Error creando regla', meta: { error: error.message, ruleData, companyId }, service: 'RuleUseCase' });
      throw error;
    }
  }
}

class GetRuleByIdUseCase {
  constructor(ruleRepository) {
    this.ruleRepository = ruleRepository;
  }
  
  async execute(ruleId, companyId) {
    if (!ruleId) {
      throw new ValidationError('Rule ID is required');
    }

    if (!companyId) {
      throw new ValidationError('Company ID is required');
    }
    
    const rule = await this.ruleRepository.findById(ruleId, companyId);
    
    if (!rule) {
      throw new NotFoundError(`Rule with ID ${ruleId} not found in this company`);
    }
    
    return rule;
  }
}

class GetRulesByCompanyUseCase {
  constructor(ruleRepository) {
    this.ruleRepository = ruleRepository;
  }
  
  async execute(companyId, filters = {}) {
    if (!companyId) {
      throw new ValidationError('Company ID is required');
    }
    
    return await this.ruleRepository.findByCompany(companyId, filters);
  }
}

class UpdateRuleUseCase {
  constructor(ruleRepository) {
    this.ruleRepository = ruleRepository;
  }
  
  async execute(ruleId, companyId, updateData) {
    try {
      if (!ruleId) {
        throw new ValidationError('Rule ID is required');
      }
      if (!companyId) {
        throw new ValidationError('Company ID is required');
      }
      // Verificar que la regla existe en la compañía
      const existingRule = await this.ruleRepository.findById(ruleId, companyId);
      if (!existingRule) {
        throw new NotFoundError(`Rule with ID ${ruleId} not found in this company`);
      }
      // Si se está actualizando el nombre, verificar que no exista otra regla con ese nombre en la misma compañía
      if (updateData.name && updateData.name.trim() !== existingRule.name) {
        const ruleWithSameName = await this.ruleRepository.findByName(updateData.name.trim(), companyId);
        if (ruleWithSameName && ruleWithSameName.id !== ruleId) {
          throw new ConflictError(`Rule with name '${updateData.name}' already exists in this company`);
        }
      }

      // Determinar el tipo y rangos finales después de la actualización
      const finalType = (updateData.type || existingRule.type).toUpperCase();
      const finalMinAmount = updateData.minimumAmount !== undefined ? updateData.minimumAmount : existingRule.minimumAmount;
      const finalMaxAmount = updateData.maximumAmount !== undefined ? updateData.maximumAmount : existingRule.maximumAmount;
      const finalNit = updateData.nitAssociatedCompany !== undefined ? updateData.nitAssociatedCompany : existingRule.nitAssociatedCompany;
      const finalCode = updateData.code !== undefined ? updateData.code : existingRule.code;

      // Validar rangos de montos para reglas tipo AMOUNT
      if (finalType === 'AMOUNT' && finalMinAmount !== undefined && finalMaxAmount !== undefined) {
        const existingAmountRules = await this.ruleRepository.findByCompany(companyId, {
          type: 'AMOUNT'
        });

        const overlappingRule = existingAmountRules.find(rule =>
          rule.id !== ruleId && // Excluir la regla actual
          rule.minimumAmount !== undefined &&
          rule.maximumAmount !== undefined &&
          rangesOverlap(finalMinAmount, finalMaxAmount, rule.minimumAmount, rule.maximumAmount)
        );

        if (overlappingRule) {
          throw new ConflictError(
            `Ya existe una regla con un rango que se solapa con el especificado`
          );
        }
      }

      // Validar rangos de montos para reglas tipo COMPANY-AMOUNT con mismo NIT
      if (finalType === 'COMPANY-AMOUNT' && finalNit && finalMinAmount !== undefined && finalMaxAmount !== undefined) {
        const existingCompanyAmountRules = await this.ruleRepository.findByCompany(companyId, {
          type: 'COMPANY-AMOUNT'
        });

        const overlappingRule = existingCompanyAmountRules.find(rule =>
          rule.id !== ruleId && // Excluir la regla actual
          rule.nitAssociatedCompany &&
          rule.nitAssociatedCompany.trim() === finalNit.trim() &&
          rule.minimumAmount !== undefined &&
          rule.maximumAmount !== undefined &&
          rangesOverlap(finalMinAmount, finalMaxAmount, rule.minimumAmount, rule.maximumAmount)
        );

        if (overlappingRule) {
          throw new ConflictError(
            `Ya existe una regla con un rango que se solapa con el especificado para el NIT asociado`
          );
        }
      }

      // Validar reglas con CODE (nuevos tipos)
      if (['CODE', 'CODE-AMOUNT', 'COMPANY-CODE', 'CODE-AMOUNT-COMPANY'].includes(finalType)) {
        const finalRuleData = {
          type: finalType,
          code: finalCode,
          minimumAmount: finalMinAmount,
          maximumAmount: finalMaxAmount,
          nitAssociatedCompany: finalNit
        };
        await validateCodeRules(this.ruleRepository, finalRuleData, companyId, ruleId);
      }

      // Actualizar usando el repositorio
      const updatedRule = await this.ruleRepository.update(ruleId, companyId, updateData);
      await logToDatabase({ level: 'info', message: 'Regla actualizada', meta: { ruleId, updateData, companyId }, service: 'RuleUseCase' });
      return updatedRule;
    } catch (error) {
      await logToDatabase({ level: 'error', message: 'Error actualizando regla', meta: { error: error.message, ruleId, updateData, companyId }, service: 'RuleUseCase' });
      throw error;
    }
  }
}

class DeleteRuleUseCase {
  constructor(ruleRepository) {
    this.ruleRepository = ruleRepository;
  }
  
  async execute(ruleId, companyId) {
    try {
      if (!ruleId) {
        throw new ValidationError('Rule ID is required');
      }
      if (!companyId) {
        throw new ValidationError('Company ID is required');
      }
      // Verificar que la regla existe en la compañía
      const existingRule = await this.ruleRepository.findById(ruleId, companyId);
      if (!existingRule) {
        throw new NotFoundError(`Rule with ID ${ruleId} not found in this company`);
      }
      // TODO: Verificar que la regla no esté siendo usada por asignaciones
      // Esta validación se implementará cuando tengamos la relación Rule-Assignment
      const result = await this.ruleRepository.delete(ruleId, companyId);
      await logToDatabase({ level: 'info', message: 'Regla eliminada', meta: { ruleId, companyId }, service: 'RuleUseCase' });
      return result;
    } catch (error) {
      await logToDatabase({ level: 'error', message: 'Error eliminando regla', meta: { error: error.message, ruleId, companyId }, service: 'RuleUseCase' });
      throw error;
    }
  }
}

class GetRulesByTypeUseCase {
  constructor(ruleRepository) {
    this.ruleRepository = ruleRepository;
  }
  
  async execute(type, companyId = null) {
    if (!type) {
      throw new ValidationError('Rule type is required');
    }
    
    return await this.ruleRepository.findByType(type, companyId);
  }
}

class GetAvailableTypesUseCase {
  constructor(ruleRepository) {
    this.ruleRepository = ruleRepository;
  }
  
  async execute(companyId = null) {
    return await this.ruleRepository.getAvailableTypes(companyId);
  }
}

class GetRuleStatsByTypeUseCase {
  constructor(ruleRepository) {
    this.ruleRepository = ruleRepository;
  }
  
  async execute(companyId = null) {
    return await this.ruleRepository.getStatsByType(companyId);
  }
}

class GetRulesWithRolesUseCase {
  constructor(ruleRepository) {
    this.ruleRepository = ruleRepository;
  }
  async execute(companyId) {
    return await this.ruleRepository.getRulesWithRoles(companyId);
  }
}

class UpdateRuleWithRolesUseCase {
  constructor(ruleRepository, ruleRoleRepository, roleRepository) {
    this.ruleRepository = ruleRepository;
    this.ruleRoleRepository = ruleRoleRepository;
    this.roleRepository = roleRepository;
  }
  
  async execute(ruleId, companyId, updateData) {
    try {
      if (!ruleId) {
        throw new ValidationError('Rule ID is required');
      }
      if (!companyId) {
        throw new ValidationError('Company ID is required');
      }
      
      // Verificar que la regla existe en la compañía
      const existingRule = await this.ruleRepository.findById(ruleId, companyId);
      if (!existingRule) {
        throw new NotFoundError(`Rule with ID ${ruleId} not found in this company`);
      }
      
      // Si se está actualizando el nombre, verificar que no exista otra regla con ese nombre en la misma compañía
      if (updateData.name && updateData.name.trim() !== existingRule.name) {
        const ruleWithSameName = await this.ruleRepository.findByName(updateData.name.trim(), companyId);
        if (ruleWithSameName && ruleWithSameName.id !== ruleId) {
          throw new ConflictError(`Rule with name '${updateData.name}' already exists in this company`);
        }
      }
      
      // Determinar los valores finales después de la actualización para validaciones
      const finalType = (updateData.type || existingRule.type).toUpperCase();
      const finalMinAmount = updateData.minimumAmount !== undefined ? updateData.minimumAmount : existingRule.minimumAmount;
      const finalMaxAmount = updateData.maximumAmount !== undefined ? updateData.maximumAmount : existingRule.maximumAmount;
      const finalNit = updateData.nitAssociatedCompany !== undefined ? updateData.nitAssociatedCompany : existingRule.nitAssociatedCompany;
      const finalCode = updateData.code !== undefined ? updateData.code : existingRule.code;

      // Validar reglas con CODE (nuevos tipos)
      if (['CODE', 'CODE-AMOUNT', 'COMPANY-CODE', 'CODE-AMOUNT-COMPANY'].includes(finalType)) {
        const finalRuleData = {
          type: finalType,
          code: finalCode,
          minimumAmount: finalMinAmount,
          maximumAmount: finalMaxAmount,
          nitAssociatedCompany: finalNit
        };
        await validateCodeRules(this.ruleRepository, finalRuleData, companyId, ruleId);
      }

      // Validar roleIds si se proporcionan
      if (updateData.roleIds !== undefined) {
        if (Array.isArray(updateData.roleIds) && updateData.roleIds.length > 0) {
          // Verificar que todos los roles existen y pertenecen a la misma compañía
          for (const roleId of updateData.roleIds) {
            const role = await this.roleRepository.findById(roleId);
            if (!role) {
              throw new NotFoundError(`Role with ID ${roleId} not found`);
            }
            if (role.companyId !== companyId) {
              throw new ValidationError(`Role with ID ${roleId} does not belong to company ${companyId}`);
            }
            if (!role.isActive) {
              throw new ValidationError(`Role with ID ${roleId} is not active`);
            }
          }
        }

        // Actualizar las relaciones role-rule
        // Primero eliminar todas las relaciones existentes para esta regla
        await this.ruleRoleRepository.deleteByRuleId(ruleId);

        // Crear las nuevas relaciones si hay roleIds
        if (Array.isArray(updateData.roleIds) && updateData.roleIds.length > 0) {
          const ruleRoles = updateData.roleIds.map(roleId =>
            new (require('../../../domain/entities/RuleRole'))(null, ruleId, roleId)
          );
          await this.ruleRoleRepository.bulkCreate(ruleRoles);
        }

        // Remover roleIds de updateData para que no se trate de actualizar en la tabla Rule
        const { roleIds, ...ruleUpdateData } = updateData;
        updateData = ruleUpdateData;
      }

      // Actualizar la regla usando el repositorio
      const updatedRule = await this.ruleRepository.update(ruleId, companyId, updateData);
      
      await logToDatabase({ 
        level: 'info', 
        message: 'Regla y roles actualizados', 
        meta: { ruleId, updateData, companyId }, 
        service: 'UpdateRuleWithRolesUseCase' 
      });
      
      return updatedRule;
    } catch (error) {
      await logToDatabase({ 
        level: 'error', 
        message: 'Error actualizando regla con roles', 
        meta: { error: error.message, ruleId, updateData, companyId }, 
        service: 'UpdateRuleWithRolesUseCase' 
      });
      throw error;
    }
  }
}

/**
 * Valida reglas basadas en CODE para prevenir duplicados y solapamientos
 * @param {Object} ruleRepository - Repositorio de reglas
 * @param {Object} ruleData - Datos de la regla a validar
 * @param {number} companyId - ID de la empresa
 * @param {number|null} excludeRuleId - ID de regla a excluir (para actualizaciones)
 * @throws {ConflictError} Si se encuentra duplicado o solapamiento
 */
async function validateCodeRules(ruleRepository, ruleData, companyId, excludeRuleId = null) {
  const ruleType = ruleData.type.toUpperCase();

  // Validar solo si es un tipo CODE
  if (!['CODE', 'CODE-AMOUNT', 'COMPANY-CODE', 'CODE-AMOUNT-COMPANY'].includes(ruleType)) {
    return;
  }

  // Obtener reglas existentes del mismo tipo
  const existingRules = await ruleRepository.findByCompany(companyId, {
    type: ruleType
  });

  // Filtrar regla a excluir si existe (para actualizaciones)
  const rulesToCheck = excludeRuleId
    ? existingRules.filter(r => r.id !== excludeRuleId)
    : existingRules;

  switch (ruleType) {
    case 'CODE':
      // Validar code duplicado (case-sensitive)
      const duplicateCode = rulesToCheck.find(r => r.code === ruleData.code);
      if (duplicateCode) {
        throw new ConflictError(
          `A CODE rule with code '${ruleData.code}' already exists for this company`
        );
      }
      break;

    case 'CODE-AMOUNT':
      // Validar solapamiento de rangos con mismo CODE (case-sensitive)
      const overlappingCodeAmount = rulesToCheck.find(r => {
        return r.code === ruleData.code &&
               rangesOverlap(
                 ruleData.minimumAmount,
                 ruleData.maximumAmount,
                 r.minimumAmount,
                 r.maximumAmount
               );
      });
      if (overlappingCodeAmount) {
        throw new ConflictError(
          `CODE-AMOUNT rule overlaps with existing rule '${overlappingCodeAmount.name}' ` +
          `for code '${ruleData.code}' in range [${overlappingCodeAmount.minimumAmount}-${overlappingCodeAmount.maximumAmount}]`
        );
      }
      break;

    case 'COMPANY-CODE':
      // Validar duplicado de NIT + CODE (case-sensitive para code)
      const duplicateCompanyCode = rulesToCheck.find(r => {
        return r.nitAssociatedCompany &&
               r.nitAssociatedCompany.trim() === ruleData.nitAssociatedCompany.trim() &&
               r.code === ruleData.code;
      });
      if (duplicateCompanyCode) {
        throw new ConflictError(
          `A COMPANY-CODE rule with NIT '${ruleData.nitAssociatedCompany}' and code '${ruleData.code}' already exists`
        );
      }
      break;

    case 'CODE-AMOUNT-COMPANY':
      // Validar solapamiento con mismo CODE y NIT (case-sensitive para code)
      const overlappingCodeAmountCompany = rulesToCheck.find(r => {
        return r.code === ruleData.code &&
               r.nitAssociatedCompany &&
               r.nitAssociatedCompany.trim() === ruleData.nitAssociatedCompany.trim() &&
               rangesOverlap(
                 ruleData.minimumAmount,
                 ruleData.maximumAmount,
                 r.minimumAmount,
                 r.maximumAmount
               );
      });
      if (overlappingCodeAmountCompany) {
        throw new ConflictError(
          `CODE-AMOUNT-COMPANY rule overlaps with existing rule '${overlappingCodeAmountCompany.name}' ` +
          `for code '${ruleData.code}' and NIT '${ruleData.nitAssociatedCompany}' ` +
          `in range [${overlappingCodeAmountCompany.minimumAmount}-${overlappingCodeAmountCompany.maximumAmount}]`
        );
      }
      break;
  }
}

/**
 * Helper function to check if two ranges overlap
 * Ranges overlap if they share any values (partial or complete overlap)
 * Adjacent ranges (e.g., [10-50] and [50-100]) are NOT considered overlapping
 * @param {number} min1 - Minimum value of first range
 * @param {number} max1 - Maximum value of first range
 * @param {number} min2 - Minimum value of second range
 * @param {number} max2 - Maximum value of second range
 * @returns {boolean} - True if ranges overlap, false otherwise
 */
function rangesOverlap(min1, max1, min2, max2) {
  // Two ranges overlap if: min1 < max2 AND max1 > min2
  // This formula correctly handles:
  // - Partial overlap: [10-50] and [40-80] → overlaps at [40-50]
  // - Complete containment: [10-100] and [20-50] → overlaps at [20-50]
  // - Adjacent ranges: [10-50] and [50-100] → does NOT overlap (50 < 50 is false)
  return min1 < max2 && max1 > min2;
}

module.exports = {
  CreateRuleUseCase,
  GetRuleByIdUseCase,
  GetRulesByCompanyUseCase,
  UpdateRuleUseCase,
  DeleteRuleUseCase,
  GetRulesByTypeUseCase,
  GetAvailableTypesUseCase,
  GetRuleStatsByTypeUseCase,
  GetRulesWithRolesUseCase,
  UpdateRuleWithRolesUseCase,
};
