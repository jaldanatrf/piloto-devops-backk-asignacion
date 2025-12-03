const Claim = require('../../../domain/entities/Claim');
const { ValidationError, NotFoundError } = require('../../../shared/errors');
const { logger } = require('../../../shared/logger');

/**
 * BusinessRuleProcessorUseCases - Caso de uso para procesar reglas empresariales
 * y determinar qué usuarios deben ser notificados según el tipo de reclamación
 */
class BusinessRuleProcessorUseCases {
  constructor(
    companyRepository,
    ruleRepository,
    ruleRoleRepository,
    userRoleRepository,
    userRepository,
    roleRepository
  ) {
    this.companyRepository = companyRepository;
    this.ruleRepository = ruleRepository;
    this.ruleRoleRepository = ruleRoleRepository;
    this.userRoleRepository = userRoleRepository;
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
  }

  /**
   * Procesar una reclamación y determinar usuarios a notificar
   * @param {Object|Claim} claimDataOrClaim - Datos de la reclamación o instancia de Claim
   * @returns {Object} - Resultado con usuarios y reglas aplicadas
   */
  async processClaim(claimDataOrClaim) {
    try {
      // 1. Crear entidad Claim y validar datos (o usar el Claim ya creado)
      const claim = claimDataOrClaim instanceof Claim ? claimDataOrClaim : new Claim(claimDataOrClaim);

      // 2. Buscar empresa que tiene las reglas (Source) - Esta es la empresa que tiene las reglas configuradas
      const sourceCompany = await this.findCompanyByDocumentNumber(claim.source);
      if (!sourceCompany) {
        return {
          success: false,
          message: `No se encontró empresa con reglas (Source) con documento: ${claim.source}`,
          claim: claim.getBasicInfo(),
          users: [],
          appliedRules: []
        };
      }

      // 3. Obtener reglas activas de la empresa SOURCE (quien tiene las reglas)
      const companyRules = await this.ruleRepository.findByCompany(sourceCompany.id);
      const activeRules = companyRules.filter(rule => rule.isActive);

      if (activeRules.length === 0) {
        return {
          success: true,
          message: 'No se encontraron reglas activas para la empresa (Source)',
          claim: claim.getBasicInfo(),
          company: {
            id: sourceCompany.id,
            name: sourceCompany.name,
            documentNumber: sourceCompany.documentNumber
          },
          users: [],
          appliedRules: []
        };
      }

      // 4. Evaluar cada regla y obtener usuarios
      const evaluatedRules = []; // Todas las reglas evaluadas
      const appliedRules = []; // Solo las que aplicaron
      const allUsers = new Map(); // Para evitar duplicados

      for (const rule of activeRules) {
        const ruleResult = await this.evaluateRule(rule, claim);

        // Guardar todas las reglas evaluadas
        evaluatedRules.push(ruleResult);

        if (ruleResult.applies) {
          appliedRules.push(ruleResult);

          // Agregar usuarios de esta regla al mapa
          for (const user of ruleResult.users) {
            if (!allUsers.has(user.id)) {
              allUsers.set(user.id, {
                ...user,
                appliedRules: [ruleResult.rule]
              });
            } else {
              // Si el usuario ya existe, agregar esta regla a su lista
              allUsers.get(user.id).appliedRules.push(ruleResult.rule);
            }
          }
        }
      }

      // Priorizar COMPANY-AMOUNT sobre COMPANY para el mismo NIT asociado
      const prioritizedUsers = this.prioritizeUsersByRuleSpecificity(allUsers, appliedRules);

      const uniqueUsers = Array.from(prioritizedUsers.values());

      // Log de información importante del negocio
      logger.debug('Resultado del procesamiento de reclamación', {
        empresa: {
          source: {
            name: sourceCompany.name,
            documentNumber: sourceCompany.documentNumber
          },
          target: claim.target
        },
        claim: {
          claimId: claim.claimId || 'N/A',
          objectionCode: claim.objectionCode || 'N/A'
        },
        reglas: {
          evaluadas: activeRules.length,
          aplicadas: appliedRules.length,
          detalle: appliedRules.map(rule => ({
            name: rule.rule.name,
            type: rule.rule.type,
            nitAssociatedCompany: rule.rule.nitAssociatedCompany || 'N/A',
            code: rule.rule.code || 'N/A'
          }))
        },
        usuarios: {
          filtrados: uniqueUsers.length,
          detalle: uniqueUsers.map(user => ({
            name: user.name,
            dud: user.dud,
            role: user.role?.name || 'N/A'
          }))
        }
      });

      return {
        success: true,
        message: uniqueUsers.length > 0
          ? `Se encontraron ${uniqueUsers.length} usuario(s) que deben ser notificados`
          : 'No se encontraron usuarios que cumplan con las reglas aplicables',
        claim: claim.getBasicInfo(),
        company: {
          id: sourceCompany.id,
          name: sourceCompany.name,
          documentNumber: sourceCompany.documentNumber
        },
        users: uniqueUsers,
        appliedRules: evaluatedRules.map(ar => ({
          ...ar.rule,
          applies: ar.applies,
          reason: ar.reason
        })),
        totalRulesEvaluated: activeRules.length,
        totalRulesApplied: appliedRules.length
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Evaluar una regla específica contra una reclamación
   * @param {Object} rule - Regla a evaluar
   * @param {Claim} claim - Reclamación
   * @returns {Object} - Resultado de la evaluación
   */
  async evaluateRule(rule, claim) {
    try {
      let applies = false;
      let reason = '';

      switch (rule.type.toUpperCase()) {
        case 'COMPANY':
          applies = claim.matchesTargetCompany(rule.nitAssociatedCompany);
          reason = applies
            ? `Empresa destino (target) ${claim.target} coincide con NIT asociado ${rule.nitAssociatedCompany}`
            : `Empresa destino (target) ${claim.target} no coincide con NIT asociado ${rule.nitAssociatedCompany}`;
          break;

        case 'AMOUNT':
          applies = claim.isAmountInRange(rule.minimumAmount, rule.maximumAmount);
          reason = applies
            ? `Monto ${claim.invoiceAmount} está dentro del rango [${rule.minimumAmount}, ${rule.maximumAmount}]`
            : `Monto ${claim.invoiceAmount} está fuera del rango [${rule.minimumAmount}, ${rule.maximumAmount}]`;
          break;

        case 'COMPANY-AMOUNT':
          const companyMatches = claim.matchesTargetCompany(rule.nitAssociatedCompany);
          const amountMatches = claim.isAmountInRange(rule.minimumAmount, rule.maximumAmount);
          applies = companyMatches && amountMatches;

          if (applies) {
            reason = `Empresa destino (target) ${claim.target} coincide con NIT ${rule.nitAssociatedCompany} Y monto ${claim.invoiceAmount} está en rango [${rule.minimumAmount}, ${rule.maximumAmount}]`;
          } else if (!companyMatches) {
            reason = `Empresa destino (target) ${claim.target} no coincide con NIT asociado ${rule.nitAssociatedCompany}`;
          } else {
            reason = `Monto ${claim.invoiceAmount} está fuera del rango [${rule.minimumAmount}, ${rule.maximumAmount}]`;
          }
          break;

        case 'CODE':
          applies = claim.matchesObjectionCode(rule.code);
          reason = applies
            ? `Código de objeción '${claim.objectionCode}' coincide con código configurado '${rule.code}'`
            : `Código de objeción '${claim.objectionCode}' no coincide con código configurado '${rule.code}'`;
          break;

        case 'CODE-AMOUNT':
          const codeMatches = claim.matchesObjectionCode(rule.code);
          const codeAmountMatches = claim.isAmountInRange(rule.minimumAmount, rule.maximumAmount);
          applies = codeMatches && codeAmountMatches;

          if (applies) {
            reason = `Código '${rule.code}' coincide Y monto ${claim.invoiceAmount} está en rango [${rule.minimumAmount}, ${rule.maximumAmount}]`;
          } else if (!codeMatches) {
            reason = `Código de objeción '${claim.objectionCode}' no coincide con código configurado '${rule.code}'`;
          } else {
            reason = `Monto ${claim.invoiceAmount} está fuera del rango [${rule.minimumAmount}, ${rule.maximumAmount}]`;
          }
          break;

        case 'COMPANY-CODE':
          const companyMatchesCC = claim.matchesTargetCompany(rule.nitAssociatedCompany);
          const codeMatchesCC = claim.matchesObjectionCode(rule.code);
          applies = companyMatchesCC && codeMatchesCC;

          if (applies) {
            reason = `Empresa destino (target) ${claim.target} coincide con NIT ${rule.nitAssociatedCompany} Y código '${rule.code}' coincide`;
          } else if (!companyMatchesCC) {
            reason = `Empresa destino (target) ${claim.target} no coincide con NIT asociado ${rule.nitAssociatedCompany}`;
          } else {
            reason = `Código de objeción '${claim.objectionCode}' no coincide con código configurado '${rule.code}'`;
          }
          break;

        case 'CODE-AMOUNT-COMPANY':
          const codeMatchesCAC = claim.matchesObjectionCode(rule.code);
          const amountMatchesCAC = claim.isAmountInRange(rule.minimumAmount, rule.maximumAmount);
          const companyMatchesCAC = claim.matchesTargetCompany(rule.nitAssociatedCompany);
          applies = codeMatchesCAC && amountMatchesCAC && companyMatchesCAC;

          if (applies) {
            reason = `Código '${rule.code}' coincide, monto ${claim.invoiceAmount} en rango [${rule.minimumAmount}, ${rule.maximumAmount}] Y empresa destino (target) ${claim.target} coincide con NIT ${rule.nitAssociatedCompany}`;
          } else {
            const reasons = [];
            if (!codeMatchesCAC) reasons.push(`código de objeción '${claim.objectionCode}' no coincide con '${rule.code}'`);
            if (!amountMatchesCAC) reasons.push(`monto ${claim.invoiceAmount} fuera de rango [${rule.minimumAmount}, ${rule.maximumAmount}]`);
            if (!companyMatchesCAC) reasons.push(`empresa destino (target) ${claim.target} no coincide con NIT ${rule.nitAssociatedCompany}`);
            reason = reasons.join(', ');
          }
          break;

        default:
          // Para otros tipos de reglas (BUSINESS, SECURITY, etc.) - siempre aplican
          applies = true;
          reason = `Regla tipo ${rule.type} - aplicación general`;
          break;
      }

      const result = {
        applies,
        reason,
        rule: {
          id: rule.id,
          name: rule.name,
          type: rule.type,
          description: rule.description,
          nitAssociatedCompany: rule.nitAssociatedCompany, // Necesario para priorización
          code: rule.code // Necesario para priorización y logging
        },
        users: []
      };

      // Si la regla aplica, obtener usuarios asociados
      if (applies) {
        result.users = await this.getUsersForRule(rule.id);
      }

      return result;

    } catch (error) {
      throw new Error(`Error evaluating rule ${rule.id}: ${error.message}`);
    }
  }

  /**
   * Obtener usuarios asociados a una regla específica
   * @param {number} ruleId - ID de la regla
   * @returns {Array} - Lista de usuarios
   */
  async getUsersForRule(ruleId) {
    try {
      // 1. Obtener roles asociados a la regla
      const ruleRoles = await this.ruleRoleRepository.findByRuleId(ruleId);

      if (ruleRoles.length === 0) {
        return [];
      }

      const roleIds = ruleRoles.map(rr => rr.roleId);
      const allUsers = new Map();

      // 2. Para cada rol, obtener usuarios
      for (const roleId of roleIds) {
        const users = await this.userRoleRepository.getUsersByRole(roleId);

        for (const user of users) {
          if (!allUsers.has(user.id)) {
            if (user.isActive) {
              const role = await this.roleRepository.findById(roleId);
              allUsers.set(user.id, {
                id: user.id,
                name: user.name,
                dud: user.dud,
                role: {
                  id: role.id,
                  name: role.name,
                  description: role.description
                }
              });
            }
          }
        }
      }

      return Array.from(allUsers.values());

    } catch (error) {
      throw new Error(`Error getting users for rule ${ruleId}: ${error.message}`);
    }
  }

  /**
   * Buscar empresa por número de documento
   * @param {string} documentNumber - Número de documento
   * @returns {Object|null} - Empresa encontrada o null
   */
  async findCompanyByDocumentNumber(documentNumber) {
    try {
      // Buscar por número de documento exacto
      const company = await this.companyRepository.findByDocumentNumber(documentNumber);
      if (company) {
        return company;
      }

      // Si no se encuentra, buscar normalizado (sin guiones ni espacios)
      const normalizedDocument = documentNumber.replace(/[-\s]/g, '');
      const allCompanies = await this.companyRepository.findAll();

      const foundCompany = allCompanies.find(company => {
        const normalizedCompanyDoc = company.documentNumber.replace(/[-\s]/g, '');
        return normalizedCompanyDoc === normalizedDocument;
      });

      return foundCompany || null;

    } catch (error) {
      throw new Error(`Error searching company by document ${documentNumber}: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de reglas por empresa
   * @param {number} companyId - ID de la empresa
   * @returns {Object} - Estadísticas
   */
  async getCompanyRuleStats(companyId) {
    try {
      const rules = await this.ruleRepository.findByCompany(companyId) || [];

      const stats = {
        total: rules.length,
        active: rules.filter(r => r.isActive).length,
        inactive: rules.filter(r => !r.isActive).length,
        byType: {}
      };

      // Agrupar por tipo
      rules.forEach(rule => {
        if (!stats.byType[rule.type]) {
          stats.byType[rule.type] = { total: 0, active: 0, inactive: 0 };
        }
        stats.byType[rule.type].total++;
        if (rule.isActive) {
          stats.byType[rule.type].active++;
        } else {
          stats.byType[rule.type].inactive++;
        }
      });

      return stats;
    } catch (error) {
      throw error;
    }
  }


  async testRuleAgainstClaim(ruleId, claimData) {
    try {
      const rule = await this.ruleRepository.findById(ruleId);
      if (!rule) {
        throw new NotFoundError(`Rule with ID ${ruleId} not found`);
      }

      const claim = new Claim(claimData);
      const result = await this.evaluateRule(rule, claim);

      return {
        rule: result.rule,
        claim: claim.getBasicInfo(),
        applies: result.applies,
        reason: result.reason,
        affectedUsers: result.users.length,
        users: result.users
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Priorizar usuarios según jerarquía de especificidad de reglas
   *
   * NUEVA JERARQUÍA DE PRIORIZACIÓN (8 niveles, 1 = más específica):
   * 1. CODE-AMOUNT-COMPANY (3 criterios: código + monto + NIT)
   * 2. COMPANY-CODE (2 criterios: NIT + código)
   * 3. CODE-AMOUNT (2 criterios: código + monto)
   * 4. COMPANY-AMOUNT (2 criterios: NIT + monto)
   * 5. COMPANY (1 criterio: NIT)
   * 6. CODE (1 criterio: código)
   * 7. AMOUNT (1 criterio: monto)
   * 8. CUSTOM (0 criterios: aplicación general)
   *
   * REGLA DE APLICACIÓN:
   * SOLO se aplican usuarios de la regla MÁS ESPECÍFICA que coincida.
   * Si múltiples reglas tienen la misma especificidad, se combinan sus usuarios.
   *
   * EJEMPLO:
   * - Aplican: CODE-AMOUNT-COMPANY (5 usuarios), COMPANY-CODE (3 usuarios), CODE (10 usuarios)
   * - Resultado: Solo 5 usuarios de CODE-AMOUNT-COMPANY (nivel 1, más específica)
   *
   * @param {Map} allUsers - Mapa de usuarios con reglas aplicadas
   * @param {Array} appliedRules - Reglas que aplicaron a la reclamación
   * @returns {Map} - Usuarios priorizados según especificidad de reglas
   */
  prioritizeUsersByRuleSpecificity(allUsers, appliedRules) {
    // Validación de entrada
    if (!appliedRules || appliedRules.length === 0) {
      return new Map();
    }

    // Mapa de especificidad por tipo (menor número = mayor especificidad)
    const specificityMap = {
      'CODE-AMOUNT-COMPANY': 1,
      'COMPANY-CODE': 2,
      'CODE-AMOUNT': 3,
      'COMPANY-AMOUNT': 4,
      'COMPANY': 5,
      'CODE': 6,
      'AMOUNT': 7,
      'CUSTOM': 8
    };

    // Asignar nivel de especificidad a cada regla aplicada
    const rulesWithSpecificity = appliedRules.map(ruleResult => {
      const ruleType = ruleResult.rule.type?.toUpperCase() || 'CUSTOM';
      const specificity = specificityMap[ruleType] || 999; // Tipos desconocidos tienen especificidad muy baja

      return {
        ...ruleResult,
        specificity: specificity,
        specificityName: ruleType
      };
    });

    // Encontrar el nivel de especificidad más alto (número más bajo)
    const highestSpecificity = Math.min(
      ...rulesWithSpecificity.map(r => r.specificity)
    );

    // Filtrar SOLO las reglas con la máxima especificidad
    const mostSpecificRules = rulesWithSpecificity.filter(
      r => r.specificity === highestSpecificity
    );

    // Obtener IDs de las reglas más específicas
    const mostSpecificRuleIds = new Set(
      mostSpecificRules.map(r => r.rule.id)
    );

    // Log de priorización para debugging
    logger.debug('Priorización de reglas', {
      totalReglasAplicadas: appliedRules.length,
      nivelEspecificidad: highestSpecificity,
      reglasEspecificas: mostSpecificRules.map(r => ({
        name: r.rule.name,
        type: r.specificityName,
        specificity: r.specificity
      }))
    });

    // Recolectar usuarios SOLO de las reglas más específicas
    const prioritizedUsers = new Map();

    for (const [userId, userData] of allUsers.entries()) {
      // Filtrar solo reglas que están en el conjunto de más específicas
      const remainingRules = userData.appliedRules.filter(
        rule => mostSpecificRuleIds.has(rule.id)
      );

      // Solo incluir usuario si tiene al menos una regla de máxima especificidad
      if (remainingRules.length > 0) {
        prioritizedUsers.set(userId, {
          ...userData,
          appliedRules: remainingRules
        });
      }
    }

    return prioritizedUsers;
  }
}

module.exports = BusinessRuleProcessorUseCases;
