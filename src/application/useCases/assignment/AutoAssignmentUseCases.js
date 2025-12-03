const { ValidationError, NotFoundError } = require('../../../shared/errors');
const { logger } = require('../../../shared/logger');

/**
 * AutoAssignmentUseCases - Casos de uso para manejo automático de asignaciones
 * Coordina el procesamiento de reclamaciones y creación de asignaciones
 */
class AutoAssignmentUseCases {
  constructor(
    assignmentQueueService,
    assignmentRepository,
    userRepository,
    businessRuleProcessorUseCases
  ) {
    this.assignmentQueueService = assignmentQueueService;
    this.assignmentRepository = assignmentRepository;
    this.userRepository = userRepository;
    this.businessRuleProcessorUseCases = businessRuleProcessorUseCases;
  }

  /**
   * Inicializar el servicio de cola automática
   */
  async initializeQueueService() {
    try {
      logger.info('🚀 Initializing automatic assignment queue service...');

      // Conectar a RabbitMQ
      await this.assignmentQueueService.connect();

      // Iniciar consumo de mensajes
      await this.assignmentQueueService.startConsuming();

      logger.info('✅ Automatic assignment queue service initialized successfully');

      return {
        success: true,
        message: 'Assignment queue service is running',
        status: this.assignmentQueueService.getStatus()
      };

    } catch (error) {
      logger.error('❌ Failed to initialize assignment queue service:', error);
      throw error;
    }
  }

  /**
   * Detener el servicio de cola automática
   */
  async stopQueueService() {
    try {
      logger.info('🛑 Stopping automatic assignment queue service...');

      await this.assignmentQueueService.stop();

      logger.info('✅ Assignment queue service stopped successfully');

      return {
        success: true,
        message: 'Assignment queue service stopped'
      };

    } catch (error) {
      logger.error('❌ Failed to stop assignment queue service:', error);
      throw error;
    }
  }

  /**
   * Obtener el estado actual del servicio de cola
   */
  async getQueueServiceStatus() {
    try {
      const status = this.assignmentQueueService.getStatus();

      const detailedStatus = {
        ...status,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        queueUrl: process.env.ASSIGNMENT_QUEUE ? 'configured' : 'not configured'
      };

      return {
        success: true,
        data: detailedStatus
      };

    } catch (error) {
      logger.error('❌ Error getting queue service status:', error);
      throw error;
    }
  }

  /**
   * Procesar una reclamación manualmente (para testing o casos especiales)
   * @param {Object} claimData - Datos de la reclamación
   * @returns {Object} - Resultado del procesamiento
   */
  async processClaimManually(claimData) {
    try {
      logger.info('🔧 Processing claim manually:', { claimId: claimData.ClaimId });

      // 1. Procesar con reglas empresariales
      const processResult = await this.businessRuleProcessorUseCases.processClaim(claimData);

      if (!processResult.success) {
        return {
          success: false,
          message: processResult.message,
          claimData: claimData
        };
      }

      // 2. Obtener usuarios candidatos
      const candidateUsers = processResult.users || [];

      if (candidateUsers.length === 0) {
        return {
          success: true,
          message: 'No candidate users found',
          claimData: claimData,
          processResult: processResult
        };
      }

      // 3. Seleccionar usuario con menos asignaciones pendientes
      const selectedUser = await this.selectOptimalUser(candidateUsers);

      // 4. Crear asignación
      const assignment = await this.createAutoAssignment(selectedUser, processResult, claimData);

      return {
        success: true,
        message: 'Assignment created successfully',
        data: {
          assignment: assignment.getBasicInfo(),
          selectedUser: {
            id: selectedUser.id,
            name: `${selectedUser.firstName} ${selectedUser.lastName}`,
            email: selectedUser.email,
            pendingAssignments: selectedUser.pendingCount || 0
          },
          processResult: {
            appliedRules: processResult.appliedRules?.length || 0,
            totalRulesEvaluated: processResult.totalRulesEvaluated || 0,
            company: processResult.company
          },
          claimInfo: {
            claimId: claimData.ClaimId,
            processId: claimData.ProcessId,
            target: claimData.Target,
            invoiceAmount: claimData.InvoiceAmount
          }
        }
      };

    } catch (error) {
      logger.error('❌ Error processing claim manually:', error);
      throw error;
    }
  }

  /**
   * Seleccionar el usuario óptimo basado en carga de trabajo
   * @param {Array} candidateUsers - Lista de usuarios candidatos
   * @returns {Object} - Usuario seleccionado con información adicional
   */
  async selectOptimalUser(candidateUsers) {
    try {
      let optimalUser = null;
      let minPendingCount = Infinity;

      // Obtener conteo de asignaciones pendientes para cada usuario
      for (const user of candidateUsers) {
        const pendingCount = await this.assignmentRepository.count({
          userId: user.id,
          status: 'pending'
        });

        // Agregar información de carga de trabajo al usuario
        user.pendingCount = pendingCount;

        if (pendingCount < minPendingCount) {
          minPendingCount = pendingCount;
          optimalUser = user;
        }
      }

      if (!optimalUser) {
        throw new Error('No optimal user could be determined');
      }

      logger.info('🎯 Optimal user selected:', {
        userId: optimalUser.id,
        userName: `${optimalUser.firstName} ${optimalUser.lastName}`,
        pendingAssignments: minPendingCount,
        totalCandidates: candidateUsers.length
      });

      return optimalUser;

    } catch (error) {
      logger.error('❌ Error selecting optimal user:', error);
      throw error;
    }
  }

  /**
   * Crear una asignación automática
   * @param {Object} selectedUser - Usuario seleccionado
   * @param {Object} processResult - Resultado del procesamiento de reglas
   * @param {Object} claimData - Datos originales de la reclamación
   * @returns {Object} - Asignación creada
   */
  async createAutoAssignment(selectedUser, processResult, claimData) {
    try {
      const Assignment = require('../../../domain/entities/assignment');

      // Preparar datos de la asignación
      const assignmentData = {
        userId: selectedUser.id,
        roleId: selectedUser.role?.id || (selectedUser.appliedRules?.[0]?.id), // Usar el rol del usuario o del primer regla aplicada
        companyId: processResult.company?.id,
        status: 'pending',
        type: this.determineAssignmentType(claimData, processResult),
        startDate: new Date(),
        assignedAt: new Date()
      };

      // Crear entidad de asignación
      const assignment = new Assignment(assignmentData);

      // Guardar en base de datos
      const savedAssignment = await this.assignmentRepository.create(assignment);

      logger.info('💾 Auto-assignment created:', {
        assignmentId: savedAssignment.id,
        userId: selectedUser.id,
        claimId: claimData.ClaimId,
        type: assignmentData.type
      });

      return savedAssignment;

    } catch (error) {
      logger.error('❌ Error creating auto-assignment:', error);
      throw error;
    }
  }

  /**
   * Determinar el tipo de asignación basado en la reclamación y reglas aplicadas
   * @param {Object} claimData - Datos de la reclamación
   * @param {Object} processResult - Resultado del procesamiento
   * @returns {string} - Tipo de asignación
   */
  determineAssignmentType(claimData, processResult) {
    // Usar el tipo de la primera regla aplicada si está disponible
    if (processResult.appliedRules && processResult.appliedRules.length > 0) {
      const firstRule = processResult.appliedRules[0];
      return `AUTO_${firstRule.type}_${claimData.ConceptApplicationCode || 'GENERAL'}`;
    }

    // Fallback basado en datos de la reclamación
    if (claimData.ConceptApplicationCode) {
      return `AUTO_CLAIM_${claimData.ConceptApplicationCode}`;
    }

    if (claimData.ObjectionCode) {
      return `AUTO_OBJECTION_${claimData.ObjectionCode}`;
    }

    return 'AUTO_ASSIGNMENT';
  }

  /**
   * Obtener estadísticas de asignaciones automáticas
   * @param {Object} filters - Filtros opcionales (fechas, usuario, etc.)
   * @returns {Object} - Estadísticas
   */
  async getAutoAssignmentStats(filters = {}) {
    try {
      // Filtros base para asignaciones automáticas
      const baseFilters = {
        ...filters,
        // Filtrar por tipos de asignación automática
        typeStartsWith: 'AUTO_'
      };

      // Obtener conteos
      const totalAutoAssignments = await this.assignmentRepository.count(baseFilters);

      const pendingAutoAssignments = await this.assignmentRepository.count({
        ...baseFilters,
        status: 'pending'
      });

      const completedAutoAssignments = await this.assignmentRepository.count({
        ...baseFilters,
        status: 'completed'
      });

      // Obtener asignaciones recientes para análisis
      const recentAssignments = await this.assignmentRepository.findAll(
        baseFilters,
        { limit: 50, offset: 0, orderBy: 'assignedAt', orderDirection: 'DESC' }
      );

      // Calcular estadísticas adicionales
      const userDistribution = {};
      const typeDistribution = {};

      recentAssignments.forEach(assignment => {
        // Distribución por usuario
        const userId = assignment.userId;
        userDistribution[userId] = (userDistribution[userId] || 0) + 1;

        // Distribución por tipo
        const type = assignment.type || 'UNKNOWN';
        typeDistribution[type] = (typeDistribution[type] || 0) + 1;
      });

      return {
        success: true,
        data: {
          summary: {
            total: totalAutoAssignments,
            pending: pendingAutoAssignments,
            completed: completedAutoAssignments,
            completionRate: totalAutoAssignments > 0 ?
              (completedAutoAssignments / totalAutoAssignments * 100).toFixed(2) : 0
          },
          distribution: {
            byUser: userDistribution,
            byType: typeDistribution
          },
          recentCount: recentAssignments.length,
          queueStatus: this.assignmentQueueService.getStatus()
        }
      };

    } catch (error) {
      logger.error('❌ Error getting auto-assignment stats:', error);
      throw error;
    }
  }

  /**
   * Enviar mensaje de prueba para testing
   * @param {Object} testClaimData - Datos de prueba
   * @returns {Object} - Resultado
   */
  async sendTestMessage(testClaimData) {
    try {
      // Validar que el servicio esté conectado
      const status = this.assignmentQueueService.getStatus();
      if (!status.isConnected) {
        throw new Error('Queue service is not connected');
      }

      // Enviar mensaje de prueba
      await this.assignmentQueueService.sendTestMessage(testClaimData);

      logger.info('📤 Test message sent successfully:', {
        claimId: testClaimData.ClaimId
      });

      return {
        success: true,
        message: 'Test message sent to queue',
        data: {
          claimId: testClaimData.ClaimId,
          queueStatus: status
        }
      };

    } catch (error) {
      logger.error('❌ Error sending test message:', error);
      throw error;
    }
  }
}

module.exports = AutoAssignmentUseCases;
