const {
  CreateRoleUseCase,
  GetRoleByIdUseCase,
  GetAllRolesUseCase,
  UpdateRoleUseCase,
  DeleteRoleUseCase
} = require('../../../application/useCases/roles/RoleUseCases');

/**
 * Controlador para la gestión de roles específicos de compañía
 * 
 * ARQUITECTURA DEL PROYECTO:
 * Este proyecto maneja roles atados a compañías específicas.
 * No existen roles globales - cada compañía define sus propios roles.
 * 
 * CONTROLADORES DEL SISTEMA:
 * - RoleController: Gestión de roles por compañía (/api/companies/:companyId/roles)
 * - UserRoleController: Asignación de roles a usuarios (/api/users/:userId/roles)
 * 
 * Este controlador maneja:
 * - Roles específicos de una compañía (companyId requerido)
 * - URLs: /api/companies/:companyId/roles/*
 * 
 * Flujo:
 * 1. Los roles se crean para una compañía específica
 * 2. Solo usuarios de esa compañía pueden tener estos roles
 * 3. Cada compañía administra sus propios roles independientemente
 */
class RoleController {
  constructor(roleUseCases, roleRepository = null) {
    this.roleUseCases = roleUseCases;
    this.roleRepository = roleRepository;
  }

  async create(req, res, next) {
    try {
      const { companyId } = req.params;
      
      // Validar que el companyId sea un número válido
      const validCompanyId = parseInt(companyId);
      if (isNaN(validCompanyId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid company ID format' }
        });
      }
      
      const role = await this.roleUseCases.createRole.execute(req.body, validCompanyId);
      
      res.status(201).json({
        success: true,
        data: role,
        message: 'Role created successfully for company'
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { companyId, roleId } = req.params;
      
      // Validar formato de IDs
      const validCompanyId = parseInt(companyId);
      const validRoleId = parseInt(roleId);
      
      if (isNaN(validCompanyId) || isNaN(validRoleId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid ID format' }
        });
      }
      
      const role = await this.roleUseCases.getRoleById.execute(validRoleId, validCompanyId);
      
      res.json({
        success: true,
        data: role,
        message: `Role retrieved from company ${validCompanyId}`
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const { companyId } = req.params;
      
      // Validar formato del companyId
      const validCompanyId = parseInt(companyId);
      if (isNaN(validCompanyId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid company ID format' }
        });
      }
      
      const filters = {
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        name: req.query.name
      };
      
      const roles = await this.roleUseCases.getAllRoles.execute(validCompanyId, filters);
      
      res.json({
        success: true,
        data: roles,
        count: roles.length,
        message: `Roles retrieved for company ${validCompanyId}`,
        filters: filters
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { companyId, roleId } = req.params;
      
      const role = await this.roleUseCases.updateRole.execute(parseInt(roleId), parseInt(companyId), req.body);
      
      res.json({
        success: true,
        data: role,
        message: 'Role updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { companyId, roleId } = req.params;
      
      await this.roleUseCases.deleteRole.execute(parseInt(roleId), parseInt(companyId));
      
      res.json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Método para búsqueda de roles
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

      // Usar el filtro de getAllRoles para búsqueda
      const roles = await this.roleUseCases.getAllRoles.execute(parseInt(companyId), { 
        name: searchTerm 
      });
      
      // Limitar resultados
      const limitedRoles = roles.slice(0, parseInt(limit));
      
      res.json({
        success: true,
        data: limitedRoles,
        count: limitedRoles.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Método para obtener roles activos con filtros específicos
  async getActive(req, res, next) {
    try {
      const { companyId } = req.params;
      
      const validCompanyId = parseInt(companyId);
      if (isNaN(validCompanyId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid company ID format' }
        });
      }
      
      // Parámetros de paginación y filtros específicos
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      const name = req.query.name || '';
      const isActive = req.query.isActive;
      const sortBy = req.query.sortBy || 'name';
      const sortOrder = req.query.sortOrder || 'asc';
      
      // Validar parámetros
      if (limit > 100) {
        return res.status(400).json({
          success: false,
          error: { message: 'Limit cannot exceed 100' }
        });
      }
      
      const validSortFields = ['name', 'createdAt', 'isActive'];
      const validSortOrders = ['asc', 'desc'];
      
      if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid sortBy field. Valid options: ${validSortFields.join(', ')}` }
        });
      }
      
      if (!validSortOrders.includes(sortOrder)) {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid sortOrder. Valid options: ${validSortOrders.join(', ')}` }
        });
      }
      
      if (isActive !== undefined && isActive !== 'true' && isActive !== 'false') {
        return res.status(400).json({
          success: false,
          error: { message: 'isActive must be true or false' }
        });
      }
      
      // Obtener todos los roles (sin filtros iniciales)
      const allRoles = await this.roleUseCases.getAllRoles.execute(validCompanyId, {});
      
      if (!allRoles || allRoles.length === 0) {
        return res.json({
          success: true,
          data: [],
          total: 0,
          totalFiltered: 0,
          currentPage: Math.floor(offset / limit) + 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        });
      }
      
      const totalUnfiltered = allRoles.length;
      
      // Aplicar filtros específicos
      let filteredRoles = allRoles;
      
      // Filtro específico por nombre
      if (name.trim()) {
        const nameLower = name.toLowerCase();
        filteredRoles = filteredRoles.filter(role => 
          role.name && role.name.toLowerCase().includes(nameLower)
        );
      }
      
      // Filtro específico por estado activo
      if (isActive !== undefined) {
        const activeFilter = isActive === 'true';
        console.log('Filtering by isActive:', activeFilter);
        filteredRoles = filteredRoles.filter(role => role.isActive === activeFilter);
      }
      
      const totalFiltered = filteredRoles.length;
      
      console.log('Roles Debug filtering:', {
        originalCount: totalUnfiltered,
        filteredCount: totalFiltered,
        filters: { name, isActive },
        sampleRole: filteredRoles[0] ? {
          name: filteredRoles[0].name,
          isActive: filteredRoles[0].isActive
        } : null
      });
      
      // Aplicar ordenamiento
      filteredRoles.sort((a, b) => {
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
      const paginatedRoles = filteredRoles.slice(offset, offset + limit);
      
      // Calcular metadatos de paginación
      const currentPage = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(totalFiltered / limit);
      const hasNextPage = offset + limit < totalFiltered;
      const hasPreviousPage = offset > 0;
      
      res.json({
        success: true,
        data: paginatedRoles,
        total: totalUnfiltered,
        totalFiltered: totalFiltered,
        currentPage: currentPage,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage
      });
    } catch (error) {
      next(error);
    }
  }

  // Nuevo método: Obtener roles disponibles para asignar a un usuario de esta compañía
  async getAvailableForUser(req, res, next) {
    try {
      const { companyId } = req.params;
      const { userId } = req.query;

      const validCompanyId = parseInt(companyId);
      if (isNaN(validCompanyId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid company ID format' }
        });
      }

      // Obtener todos los roles activos de la empresa
      const allRoles = await this.roleUseCases.getAllRoles.execute(validCompanyId, { isActive: true });

      // Si se proporciona userId, filtrar roles que el usuario ya tiene
      if (userId) {
        // TODO: Implementar lógica para filtrar roles ya asignados al usuario
        // Por ahora, devolvemos todos los roles activos
        res.json({
          success: true,
          data: allRoles,
          count: allRoles.length,
          message: `Roles available for assignment in company ${validCompanyId}`,
          note: 'User-specific filtering not yet implemented'
        });
      } else {
        res.json({
          success: true,
          data: allRoles,
          count: allRoles.length,
          message: `All active roles available for assignment in company ${validCompanyId}`
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Nuevo método: Obtener roles con filtros, ordenamiento y paginación (BD optimizado)
   * GET /api/companies/:companyId/roles/filtered?name=admin&isActive=true&limit=10&offset=0&sortBy=name&sortOrder=asc
   */
  async getAllFiltered(req, res, next) {
    try {
      const { companyId } = req.params;

      const validCompanyId = parseInt(companyId);
      if (isNaN(validCompanyId)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid company ID format' }
        });
      }

      // Parámetros de query
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;
      const name = req.query.name || '';
      const isActive = req.query.isActive;
      const sortBy = req.query.sortBy || 'name';
      const sortOrder = req.query.sortOrder || 'asc';

      // Validaciones
      if (limit > 100) {
        return res.status(400).json({
          success: false,
          error: { message: 'Limit cannot exceed 100' }
        });
      }

      const validSortFields = ['name', 'createdAt', 'isActive'];
      const validSortOrders = ['asc', 'desc'];

      if (!validSortFields.includes(sortBy)) {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid sortBy field. Valid options: ${validSortFields.join(', ')}` }
        });
      }

      if (!validSortOrders.includes(sortOrder)) {
        return res.status(400).json({
          success: false,
          error: { message: `Invalid sortOrder. Valid options: ${validSortOrders.join(', ')}` }
        });
      }

      if (isActive !== undefined && isActive !== 'true' && isActive !== 'false') {
        return res.status(400).json({
          success: false,
          error: { message: 'isActive must be true or false' }
        });
      }

      // Verificar que el repositorio esté disponible
      if (!this.roleRepository || !this.roleRepository.findByCompanyFiltered) {
        return res.status(500).json({
          success: false,
          error: { message: 'Role repository not available for filtered queries' }
        });
      }

      // Usar repositorio con filtrado en BD
      const result = await this.roleRepository.findByCompanyFiltered(validCompanyId, {
        filters: {
          name: name.trim(),
          isActive: isActive !== undefined ? isActive === 'true' : undefined
        },
        pagination: { limit, offset },
        sorting: { sortBy, sortOrder }
      });

      // Caso sin resultados
      if (!result.data || result.data.length === 0) {
        return res.json({
          success: true,
          data: [],
          total: 0,
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

      return res.json({
        success: true,
        data: result.data,
        total: result.total,
        currentPage: currentPage,
        totalPages: totalPages,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = RoleController;
