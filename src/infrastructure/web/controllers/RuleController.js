const {
  CreateRuleUseCase,
  GetRuleByIdUseCase,
  GetRulesByCompanyUseCase,
  UpdateRuleUseCase,
  DeleteRuleUseCase,
  GetRulesByTypeUseCase,
  GetAvailableTypesUseCase,
  GetRuleStatsByTypeUseCase,
  GetRulesWithRolesUseCase,
  UpdateRuleWithRolesUseCase
} = require('../../../application/useCases/rules/RuleUseCase');
const { logger } = require('../../../shared/logger');

class RuleController {
  constructor(ruleUseCases, ruleRepository = null) {
    this.ruleUseCases = ruleUseCases;
    this.ruleRepository = ruleRepository;
    // Diagnóstico temporal
    if (!ruleUseCases.GetRulesWithRolesUseCase) {
      console.error('❌ GetRulesWithRolesUseCase is missing from ruleUseCases');
    }
  }

  async create(req, res, next) {
    try {
      const { companyId } = req.params;
      
      logger.info('Creating rule:', {
        companyId: companyId,
        body: req.body,
        bodyType: typeof req.body,
        bodyKeys: Object.keys(req.body || {}),
        headers: {
          'content-type': req.headers['content-type'],
          'content-length': req.headers['content-length']
        }
      });
      
      const rule = await this.ruleUseCases.createRule.execute(req.body, parseInt(companyId));
      
      logger.info('Rule created successfully:', {
        ruleId: rule.id,
        ruleType: rule.type,
        companyId: companyId
      });
      
      res.status(201).json({
        success: true,
        data: rule,
        message: 'Rule created successfully'
      });
    } catch (error) {
      logger.error('Error creating rule:', {
        error: error.message,
        companyId: req.params.companyId,
        body: req.body
      });
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { companyId, ruleId } = req.params;
      
      const rule = await this.ruleUseCases.getRuleById.execute(parseInt(ruleId), parseInt(companyId));
      
      res.json({
        success: true,
        data: rule
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const { companyId } = req.params;
      const filters = {
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        type: req.query.type,
        name: req.query.name
      };
      
      const rules = await this.ruleUseCases.getRulesByCompany.execute(parseInt(companyId), filters);
      
      res.json({
        success: true,
        data: rules,
        count: rules.length
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { companyId, ruleId } = req.params;
      
      const rule = await this.ruleUseCases.updateRule.execute(parseInt(ruleId), parseInt(companyId), req.body);
      
      res.json({
        success: true,
        data: rule,
        message: 'Rule updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWithRoles(req, res, next) {
    try {
      const { companyId, ruleId } = req.params;
      
      // Verificar que tenemos el caso de uso necesario
      if (!this.ruleUseCases.UpdateRuleWithRolesUseCase) {
        throw new Error('UpdateRuleWithRolesUseCase is not available');
      }
      
      const rule = await this.ruleUseCases.UpdateRuleWithRolesUseCase.execute(
        parseInt(ruleId), 
        parseInt(companyId), 
        req.body
      );
      
      res.json({
        success: true,
        data: rule,
        message: 'Rule and roles updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { companyId, ruleId } = req.params;
      
      await this.ruleUseCases.deleteRule.execute(parseInt(ruleId), parseInt(companyId));
      
      res.json({
        success: true,
        message: 'Rule deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Método para búsqueda de reglas
  async search(req, res, next) {
    try {
      const { companyId } = req.params;
      const { q: searchTerm, limit = 10 } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          error: { message: 'Search term is required' }
        });
      }

      // Implementación temporal: usar getRulesByCompany con filtro de nombre
      const allRules = await this.ruleUseCases.getRulesByCompany.execute(parseInt(companyId), {
        name: searchTerm
      });
      
      // Limitar resultados
      const limitedRules = allRules.slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: limitedRules,
        count: limitedRules.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Método para obtener solo reglas activas
  async getActive(req, res, next) {
    try {
      const { companyId } = req.params;
      const rules = await this.ruleUseCases.GetRulesWithRolesUseCase.execute(parseInt(companyId));
      const activeRules = rules.filter(r => r.isActive);
      if (!activeRules || activeRules.length === 0) {
        return res.status(204).send();
      }
      res.json({
        success: true,
        data: activeRules,
        count: activeRules.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Método para obtener reglas por tipo
  async getByType(req, res, next) {
    try {
      const { companyId, type } = req.params;
      
      const rules = await this.ruleUseCases.getRulesByType.execute(type, parseInt(companyId));
      
      res.json({
        success: true,
        data: rules,
        count: rules.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Método para obtener tipos de reglas disponibles
  async getAvailableTypes(req, res, next) {
    try {
      const { companyId } = req.params;
      
      const types = await this.ruleUseCases.getAvailableTypes.execute(parseInt(companyId));
      
      res.json({
        success: true,
        data: types
      });
    } catch (error) {
      next(error);
    }
  }

  // Método para obtener estadísticas por tipo
  async getStatsByType(req, res, next) {
    try {
      const { companyId } = req.params;
      
      const stats = await this.ruleUseCases.getRuleStatsByType.execute(parseInt(companyId));
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Método para obtener todas las reglas (no solo de una compañía) - para administradores
  async getAllRules(req, res, next) {
    try {
      const filters = {
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        companyId: req.query.companyId ? parseInt(req.query.companyId) : undefined,
        type: req.query.type,
        name: req.query.name
      };
      
      const rules = await this.ruleRepository.findAll(filters);
      
      res.json({
        success: true,
        data: rules,
        count: rules.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Método para obtener reglas y sus roles asociados con filtros específicos
  // GET /api/rules/with-roles?companyId=123&limit=5&offset=5&name=contrato&description=monto&type=AMOUNT&sortBy=name&sortOrder=asc
  async getRulesWithRoles(req, res, next) {
    try {
      const companyId = req.query.companyId ? parseInt(req.query.companyId) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      const name = req.query.name || '';
      const description = req.query.description || '';
      const type = req.query.type || '';
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder || 'desc';

      logger.info('getRulesWithRoles called with params:', {
        companyId,
        limit,
        offset,
        name,
        description,
        type,
        sortBy,
        sortOrder
      });

      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'companyId es requerido',
          data: null
        });
      }

      // Validar parámetros de paginación
      if (limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Limit cannot exceed 100',
          data: null
        });
      }

      // Validar sortBy y sortOrder
      const validSortFields = ['name', 'createdAt', 'type', 'isActive'];
      const validSortOrders = ['asc', 'desc'];
      const validTypes = ['COMPANY', 'AMOUNT', 'COMPANY-AMOUNT', 'BUSINESS', 'SECURITY', 'COMPLIANCE', 'OPERATIONAL', 'TECHNICAL', 'CUSTOM'];

      if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({
          success: false,
          message: `Invalid sortBy field. Valid options: ${validSortFields.join(', ')}`,
          data: null
        });
      }

      if (!validSortOrders.includes(sortOrder)) {
        return res.status(400).json({
          success: false,
          message: `Invalid sortOrder. Valid options: ${validSortOrders.join(', ')}`,
          data: null
        });
      }

      if (type && !validTypes.includes(type.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid type. Valid options: ${validTypes.join(', ')}`,
          data: null
        });
      }

      // Usar el repositorio con filtrado en BD (optimizado)
      if (this.ruleRepository && this.ruleRepository.getRulesWithRolesFiltered) {
        const result = await this.ruleRepository.getRulesWithRolesFiltered(companyId, {
          filters: {
            name: name.trim(),
            description: description.trim(),
            type: type.trim(),
            isActive: true
          },
          pagination: { limit, offset },
          sorting: { sortBy, sortOrder }
        });

        if (!result.data || result.data.length === 0) {
          return res.status(200).json({
            success: true,
            message: 'No rules found',
            data: [],
            total: 0,
            totalFiltered: 0,
            currentPage: Math.floor(offset / limit) + 1,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          });
        }

        // Calcular metadatos de paginación
        const currentPage = Math.floor(offset / limit) + 1;
        const totalPages = Math.ceil(result.total / limit);
        const hasNextPage = offset + limit < result.total;
        const hasPreviousPage = offset > 0;

        const formattedData = result.data.map(rule => ({
          id: rule.id,
          name: rule.name,
          description: rule.description,
          type: rule.type,
          code: rule.code,
          isActive: rule.isActive,
          minimumAmount: rule.minimumAmount,
          maximumAmount: rule.maximumAmount,
          nitAssociatedCompany: rule.nitAssociatedCompany,
          createdAt: rule.createdAt,
          updatedAt: rule.updatedAt,
          roles: rule.roles || []
        }));

        return res.status(200).json({
          success: true,
          data: formattedData,
          total: result.total,
          totalFiltered: result.total,
          currentPage: currentPage,
          totalPages: totalPages,
          hasNextPage: hasNextPage,
          hasPreviousPage: hasPreviousPage
        });
      }

      // Fallback: Usar el método antiguo (filtrado en memoria) si el repositorio no está disponible
      logger.warn('Using fallback in-memory filtering for getRulesWithRoles');
      let allRules = await this.ruleUseCases.GetRulesWithRolesUseCase.execute(companyId);

      if (!allRules || allRules.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No rules found',
          data: [],
          total: 0,
          totalFiltered: 0,
          currentPage: Math.floor(offset / limit) + 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        });
      }

      const totalUnfiltered = allRules.length;

      // Aplicar filtros específicos por campo
      let filteredRules = allRules;

      // Filtro específico por nombre
      if (name.trim()) {
        const nameLower = name.toLowerCase();
        filteredRules = filteredRules.filter(rule =>
          rule.name && rule.name.toLowerCase().includes(nameLower)
        );
      }

      // Filtro específico por descripción
      if (description.trim()) {
        const descriptionLower = description.toLowerCase();
        filteredRules = filteredRules.filter(rule =>
          rule.description && rule.description.toLowerCase().includes(descriptionLower)
        );
      }

      // Filtro específico por tipo (exacto)
      if (type.trim()) {
        filteredRules = filteredRules.filter(rule =>
          rule.type && rule.type.toUpperCase() === type.toUpperCase()
        );
      }

      const totalFiltered = filteredRules.length;

      // Aplicar ordenamiento
      filteredRules.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];

        // Manejar valores nulos/undefined
        if (aValue == null) aValue = '';
        if (bValue == null) bValue = '';

        // Convertir a string para comparación consistente
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;

        return sortOrder === 'desc' ? comparison * -1 : comparison;
      });

      // Aplicar paginación
      const paginatedRules = filteredRules.slice(offset, offset + limit);

      // Calcular metadatos de paginación
      const currentPage = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(totalFiltered / limit);
      const hasNextPage = offset + limit < totalFiltered;
      const hasPreviousPage = offset > 0;

      const result = paginatedRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        type: rule.type,
        code: rule.code,
        isActive: rule.isActive,
        minimumAmount: rule.minimumAmount,
        maximumAmount: rule.maximumAmount,
        nitAssociatedCompany: rule.nitAssociatedCompany,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
        roles: rule.roles || []
      }));

      return res.status(200).json({
        success: true,
        data: result,
        total: totalUnfiltered,
        totalFiltered: totalFiltered,
        currentPage: currentPage,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage
      });
    } catch (error) {
      logger.error('Error in getRulesWithRoles:', {
        error: error.message,
        stack: error.stack,
        params: req.query
      });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  // Nuevo método global para actualizar regla con roles - diseño más RESTful
  async updateWithRolesGlobal(req, res, next) {
    try {
      const { ruleId } = req.params;
      const { companyId, ...ruleData } = req.body;
      
      // Validar que se proporcione el companyId en el body
      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: { message: 'companyId is required in request body for validation' }
        });
      }
      
      // Verificar que tenemos el caso de uso necesario
      if (!this.ruleUseCases.UpdateRuleWithRolesUseCase) {
        throw new Error('UpdateRuleWithRolesUseCase is not available');
      }
      
      const rule = await this.ruleUseCases.UpdateRuleWithRolesUseCase.execute(
        parseInt(ruleId), 
        parseInt(companyId), 
        ruleData
      );
      
      res.json({
        success: true,
        data: rule,
        message: 'Rule and roles updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RuleController;
