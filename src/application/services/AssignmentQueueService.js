const amqp = require("amqplib");
const { logger } = require("../../shared/logger");
const { logToDatabase } = require("../../shared/logger/logToDatabase");
const DatabaseFactory = require("../../infrastructure/factories/DatabaseFactory");

/**
 * AssignmentQueueService - Servicio para manejar la cola de asignaciones de RabbitMQ
 * Consume mensajes de la cola y procesa asignaciones automáticamente
 */
class AssignmentQueueService {
  // ...existing code...
  constructor(
    businessRuleProcessorUseCases,
    assignmentRepository,
    userRepository,
    configurationRepository
  ) {
    this.businessRuleProcessorUseCases = businessRuleProcessorUseCases;
    this.assignmentRepository = assignmentRepository;
    this.userRepository = userRepository;
    this.configurationRepository = configurationRepository;
    this.connection = null;
    this.channel = null;
    this.queueName =
      process.env.ASSIGNMENT_QUEUE_NAME || "assignment_processing_queue";
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 segundos
  }

  /**
   * Conectar a RabbitMQ usando la URL del .env.local
   */
  async connect() {
    try {
      const queueUrl = process.env.ASSIGNMENT_QUEUE;

      if (!queueUrl) {
        throw new Error("ASSIGNMENT_QUEUE environment variable is not defined");
      }

      logger.info("🔌 Connecting to RabbitMQ...", {
        queueUrl: queueUrl.replace(/\/\/.*:.*@/, "//***:***@"),
      });

      this.connection = await amqp.connect(queueUrl);
      this.channel = await this.connection.createChannel();

      // Configurar manejadores de eventos
      this.connection.on("error", (err) => {
        logger.error("❌ RabbitMQ connection error:", err);
        logToDatabase(
          {
            level: "error",
            message: "RabbitMQ connection error",
            meta: err,
            service: "AssignmentQueueService",
          },
          this.databaseService
        );
        this.isConnected = false;
        this.attemptReconnect();
      });

      this.connection.on("close", () => {
        logger.warn("⚠️ RabbitMQ connection closed");
        logToDatabase(
          {
            level: "warn",
            message: "RabbitMQ connection closed",
            service: "AssignmentQueueService",
          },
          this.databaseService
        );
        this.isConnected = false;
        this.attemptReconnect();
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      logger.info("✅ Connected to RabbitMQ successfully");
      return true;
    } catch (error) {
      logger.error("❌ Failed to connect to RabbitMQ:", error);
      await logToDatabase(
        {
          level: "error",
          message: "Failed to connect to RabbitMQ",
          meta: error,
          service: "AssignmentQueueService",
        },
        this.databaseService
      );
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Intentar reconexión automática
   */
  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(
        `❌ Max reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`
      );
      await logToDatabase(
        {
          level: "error",
          message: `Max reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`,
          service: "AssignmentQueueService",
        },
        this.databaseService
      );
      return;
    }

    this.reconnectAttempts++;
    logger.info(
      `🔄 Attempting to reconnect to RabbitMQ (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );
    // No guardar logs de info normales en BD

    setTimeout(async () => {
      try {
        await this.connect();
        if (this.isConnected) {
          logger.info("✅ Reconnected to RabbitMQ successfully");
          await logToDatabase(
            {
              level: "info",
              message: "Reconnected to RabbitMQ successfully",
              service: "AssignmentQueueService",
            },
            this.databaseService
          );
          await this.startConsuming();
        }
      } catch (error) {
        logger.error("❌ Reconnection failed:", error);
        await logToDatabase(
          {
            level: "error",
            message: "Reconnection failed",
            meta: error,
            service: "AssignmentQueueService",
          },
          this.databaseService
        );
        this.attemptReconnect();
      }
    }, this.reconnectDelay);
  }

  /**
   * Iniciar el consumo de mensajes de la cola
   */
  async startConsuming() {
    if (!this.isConnected || !this.channel) {
      throw new Error("Not connected to RabbitMQ. Call connect() first.");
    }

    try {
      // Configurar prefetch para procesar un mensaje a la vez
      await this.channel.prefetch(1);

      logger.info(
        `📨 Started consuming messages from queue: ${this.queueName}`
      );
      // No guardar logs de info normales en BD

      // Iniciar consumo
      await this.channel.consume(
        this.queueName,
        async (message) => {
          if (message !== null) {
            await this.processMessage(message);
          }
        },
        {
          noAck: false, // Requerimos confirmación manual
        }
      );
    } catch (error) {
      logger.error("❌ Error starting message consumption:", error);
      await logToDatabase(
        {
          level: "error",
          message: "Error starting message consumption",
          meta: error,
          service: "AssignmentQueueService",
        },
        this.databaseService
      );
      throw error;
    }
  }

  /**
   * Procesar un mensaje de la cola
   * @param {Object} message - Mensaje de RabbitMQ
   */
  async processMessage(message) {
    const startTime = Date.now();
    let claimData = null;
    // Para obtener usuario, si está en claimData
    let logUser = null;

    try {
      const messageContent = message.content?.toString() || "";

      if (!messageContent || messageContent.trim() === "") {
        logger.warn("⚠️ Received empty message. Ignoring.");
        await logToDatabase(
          {
            level: "warn",
            message: "Received empty message. Ignoring.",
            meta: { messageId: message.properties?.messageId || "unknown" },
            user: logUser,
            service: "AssignmentQueueService",
          },
          this.databaseService
        );
        this.channel.ack(message);
        return;
      }
      function capitalizeKeys(obj) {
        if (Array.isArray(obj)) {
          return obj.map(capitalizeKeys);
        } else if (obj !== null && typeof obj === "object") {
          return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => {
              const newKey = key.charAt(0).toUpperCase() + key.slice(1);
              return [newKey, capitalizeKeys(value)];
            })
          );
        }
        return obj;
      }

      try {
        claimData = JSON.parse(messageContent);
        claimData = capitalizeKeys(claimData);

        logUser = claimData?.user || null;
      } catch (parseError) {
        logger.error("❌ Failed to parse message JSON:", {
          error: parseError.message,
          content: messageContent,
        });
        await logToDatabase(
          {
            level: "error",
            message: "Failed to parse message JSON",
            meta: { error: parseError.message, content: messageContent },
            user: logUser,
            service: "AssignmentQueueService",
          },
          this.databaseService
        );
        this.channel.ack(message);
        return;
      }

      if (!this.validateClaimMessage(claimData)) {
        logger.warn("⚠️ Invalid claim message structure. Ignoring.", {
          claimId: claimData?.ClaimId || "unknown",
        });
        await logToDatabase(
          {
            level: "warn",
            message: "Invalid claim message structure. Ignoring.",
            meta: { claimId: claimData?.ClaimId || "unknown", claimData },
            user: logUser,
            service: "AssignmentQueueService",
          },
          this.databaseService
        );
        this.channel.ack(message);
        return;
      }

      const processResult =
        await this.businessRuleProcessorUseCases.processClaim(claimData);

      if (!processResult.success) {
        logger.warn("⚠️ Business rule processing failed:", {
          claimId: claimData.ClaimId,
          message: processResult.message,
        });
        await logToDatabase(
          {
            level: "warn",
            message: "Business rule processing failed",
            meta: {
              claimId: claimData.ClaimId,
              message: processResult.message,
            },
            user: logUser,
            service: "AssignmentQueueService",
          },
          this.databaseService
        );
        this.channel.ack(message);
        return;
      }

      // Obtener la empresa Source (quien tiene las reglas y debe procesar)
      // Source es quien tiene las reglas configuradas, Target es solo criterio de evaluación
      const sourceCompany = await this.businessRuleProcessorUseCases.findCompanyByDocumentNumber(claimData.Source);

      if (!sourceCompany) {
        logger.warn("⚠️ Source company not found:", {
          claimId: claimData.ClaimId,
          source: claimData.Source,
        });
        await logToDatabase(
          {
            level: "warn",
            message: "Source company not found",
            meta: {
              claimId: claimData.ClaimId,
              source: claimData.Source,
            },
            user: logUser,
            service: "AssignmentQueueService",
          },
          this.databaseService
        );
        this.channel.ack(message);
        return;
      }

      const candidateUsers = processResult.users || [];

      if (candidateUsers.length === 0) {

        // Crear asignación en estado pending sin usuario asignado, incluyendo los datos del mensaje
        const Assignment = require("../../domain/entities/assignment");
        const getField = (field) => {
          return (
            claimData[field] ??
            claimData[field.charAt(0).toLowerCase() + field.slice(1)] ??
            (processResult.claim
              ? processResult.claim[field] ??
                processResult.claim[
                  field.charAt(0).toLowerCase() + field.slice(1)
                ]
              : null)
          );
        };
        const assignmentData = {
          userId: null,
          companyId: sourceCompany.id, // Empresa Source que tiene las reglas y procesa
          status: "pending",
          type: this.determineAssignmentType(claimData),
          dateAssignated: new Date(),
          startDate: new Date(),
          assignedAt: new Date(),
          ProcessId: getField("ProcessId"),
          Source: getField("Source"),
          DocumentNumber: getField("DocumentNumber"),
          InvoiceAmount: getField("InvoiceAmount"),
          ExternalReference: getField("ExternalReference"),
          ClaimId: getField("ClaimId"),
          ConceptApplicationCode: getField("ConceptApplicationCode"),
          ObjectionCode: getField("ObjectionCode"),
          Value: getField("Value"),
        };
        const assignment = new Assignment(assignmentData);
        const savedAssignment = await this.assignmentRepository.create(
          assignment
        );
        this.channel.ack(message);
        return;
      }

      const selectedUser = await this.selectUserWithLeastAssignments(
        candidateUsers
      );

      if (!selectedUser) {
        await logToDatabase(
          {
            level: "warn",
            message: "No suitable user found for assignment",
            meta: { claimId: claimData.ClaimId },
            user: logUser,
            service: "AssignmentQueueService",
          },
          this.databaseService
        );
        const Assignment = require("../../domain/entities/assignment");
        const assignmentData = {
          userId: null,
          companyId: sourceCompany.id, // Empresa Source que tiene las reglas y procesa
          status: "pending",
          type: this.determineAssignmentType(claimData),
          dateAssignated: new Date(),
          startDate: new Date(),
          assignedAt: new Date(),
        };
        const assignment = new Assignment(assignmentData);
        const savedAssignment = await this.assignmentRepository.create(
          assignment
        );
        this.channel.ack(message);
        return;
      }

      const assignment = await this.createAssignment(
        selectedUser,
        processResult,
        claimData,
        sourceCompany
      );

      // Invocar servicio externo para notificar asignación usando configuración por empresa
      try {
        // Obtener configuración de la empresa Source (quien procesa la asignación)
        const configuration = await this.configurationRepository.findByCompanyId(sourceCompany.id);

        if (!configuration) {
          logger.warn("⚠️ No configuration found for company, skipping notification", {
            companyId: sourceCompany.id,
            claimId: claimData.ClaimId,
          });
          await logToDatabase(
            {
              level: "warn",
              message: "No configuration found for company, skipping notification",
              meta: {
                companyId: sourceCompany.id,
                claimId: claimData.ClaimId,
              },
              user: logUser,
              service: "AssignmentQueueService",
            },
            this.databaseService
          );
        } else if (!configuration.isActive) {
          logger.warn("⚠️ Configuration is inactive, skipping notification", {
            companyId: sourceCompany.id,
            configurationId: configuration.id,
            claimId: claimData.ClaimId,
          });
          await logToDatabase(
            {
              level: "warn",
              message: "Configuration is inactive, skipping notification",
              meta: {
                companyId: sourceCompany.id,
                configurationId: configuration.id,
                claimId: claimData.ClaimId,
              },
              user: logUser,
              service: "AssignmentQueueService",
            },
            this.databaseService
          );
        } else {
          // Configuración válida, proceder con notificación
          const {
            assignMultipleDisputes,
          } = require("../../infrastructure/external/OrchestratorIntegration");

          // Preparar datos para resolver variables en la configuración
          const resolverData = {
            assignment: {
              id: assignment.id,
              processId: claimData.ProcessId,
              source: claimData.Source,
              target: claimData.Target,
              documentNumber: claimData.DocumentNumber,
              documentType: claimData.DocumentType,
              claimId: claimData.ClaimId,
              invoiceAmount: claimData.InvoiceAmount,
              value: claimData.Value,
              objectionCode: claimData.ObjectionCode,
              conceptApplicationCode: claimData.ConceptApplicationCode,
              externalReference: claimData.ExternalReference,
              companyId: sourceCompany.id,
              userId: selectedUser.id,
            },
            user: {
              id: selectedUser.id,
              name: selectedUser.name,
              dud: selectedUser.dud,
              companyId: selectedUser.companyId,
            },
            company: {
              id: sourceCompany.id,
              name: sourceCompany.name,
              documentNumber: sourceCompany.documentNumber,
              documentType: sourceCompany.documentType,
              type: sourceCompany.type,
            },
          };

          // Llamar con configuración dinámica
          await assignMultipleDisputes(
            configuration,
            [
              {
                documentNumber: claimData.DocumentNumber,
                claimId: claimData.ClaimId,
                newAssignedUserId: selectedUser.dud,
              },
            ],
            resolverData
          );

          await logToDatabase(
            {
              level: "info",
              message: "Notificación enviada usando configuración de empresa",
              meta: {
                processId: claimData.ProcessId,
                assignedUserId: selectedUser.id,
                claimId: claimData.ClaimId,
                companyId: sourceCompany.id,
                configurationId: configuration.id,
              },
              user: logUser,
              service: "AssignmentQueueService",
            },
            this.databaseService
          );
        }
      } catch (notifyError) {
        logger.error(
          "❌ Error notificando asignación:",
          notifyError
        );
        await logToDatabase(
          {
            level: "error",
            message: "Error notificando asignación",
            meta: {
              error: notifyError.message,
              stack: notifyError.stack,
              claimId: claimData.ClaimId,
              companyId: targetCompany.id,
            },
            user: logUser,
            service: "AssignmentQueueService",
          },
          this.databaseService
        );
      }

      this.channel.ack(message);
    } catch (error) {
      const processingTime = Date.now() - startTime;
      logger.error("❌ Error processing message:", {
        error: error.message,
        claimId: claimData?.ClaimId || "unknown",
        processingTimeMs: processingTime,
        stack: error.stack,
      });
      await logToDatabase(
        {
          level: "error",
          message: "Error processing message",
          meta: {
            error: error.message,
            claimId: claimData?.ClaimId || "unknown",
            processingTimeMs,
            stack: error.stack,
          },
          user: logUser,
          service: "AssignmentQueueService",
        },
        this.databaseService
      );
      this.channel.nack(message, false, false);
    }
  }

  /**
   * Validar estructura básica del mensaje de reclamación
   * @param {Object} claimData - Datos de la reclamación
   * @returns {boolean} - True si es válido
   */
  validateClaimMessage(claimData) {
    const requiredFields = [
      "ProcessId",
      "Target",
      "Source",
      "InvoiceAmount",
      "ClaimId",
      "Value",
    ];

    for (const field of requiredFields) {
      if (!claimData[field] && claimData[field] !== "0") {
        logger.error(`❌ Missing required field: ${field}`, { claimData });
        return false;
      }
      // Validar que todos los campos requeridos sean string
      if (typeof claimData[field] !== "string") {
        logger.error(`❌ Field ${field} must be a string`, { claimData });
        return false;
      }
    }

    // Convertir InvoiceAmount a número para comparaciones posteriores
    claimData.InvoiceAmount = Number(claimData.InvoiceAmount);
    if (isNaN(claimData.InvoiceAmount)) {
      logger.error("❌ InvoiceAmount is not a valid number after conversion", {
        amount: claimData.InvoiceAmount,
      });
      return false;
    }

    // Convertir Value a número para validación en Claim
    claimData.Value = Number(claimData.Value);
    if (isNaN(claimData.Value)) {
      logger.error("❌ Value is not a valid number after conversion", {
        value: claimData.Value,
      });
      return false;
    }
    return true;
  }

  /**
   * Seleccionar el usuario con menos asignaciones pendientes
   * @param {Array} candidateUsers - Lista de usuarios candidatos
   * @returns {Object|null} - Usuario seleccionado
   */
  async selectUserWithLeastAssignments(candidateUsers) {
    try {
      let selectedUser = null;
      let minPendingAssignments = Infinity;

      for (const user of candidateUsers) {
        const pendingCount = await this.assignmentRepository.count({
          userId: user.id,
          status: "assigned",
        });

        if (pendingCount < minPendingAssignments) {
          minPendingAssignments = pendingCount;
          selectedUser = user;
        }
      }

      return selectedUser;
    } catch (error) {
      logger.error("❌ Error selecting user with least assignments:", error);
      throw error;
    }
  }

  /**
   * Crear una nueva asignación en la base de datos
   * @param {Object} selectedUser - Usuario seleccionado
   * @param {Object} processResult - Resultado del procesamiento de reglas
   * @param {Object} claimData - Datos originales de la reclamación
   * @param {Object} sourceCompany - Empresa Source que tiene las reglas y procesa
   * @returns {Object} - Asignación creada
   */
  async createAssignment(selectedUser, processResult, claimData, sourceCompany) {
    try {
      const Assignment = require("../../domain/entities/assignment");

      // Crear nueva asignación incluyendo los nuevos campos del mensaje
      const assignmentData = {
        userId: selectedUser.id,
        roleId: selectedUser.role?.id,
        companyId: sourceCompany.id, // Empresa Source que tiene las reglas y procesa
        status: "assigned",
        assignedUserIdField: selectedUser.id,
        type: this.determineAssignmentType(claimData),
        dateAssignated: new Date(),
        startDate: new Date(),
        assignedAt: new Date(),
        // Nuevos campos capturados del mensaje
        ProcessId: claimData.ProcessId,
        Source: claimData.Source,
        DocumentNumber: claimData.DocumentNumber,
        InvoiceAmount: claimData.InvoiceAmount,
        ExternalReference: claimData.ExternalReference,
        ClaimId: claimData.ClaimId,
        ConceptApplicationCode: claimData.ConceptApplicationCode,
        ObjectionCode: claimData.ObjectionCode,
        Value: claimData.Value,
      };

      const assignment = new Assignment(assignmentData);
      const savedAssignment = await this.assignmentRepository.create(
        assignment
      );

      return savedAssignment;
    } catch (error) {
      logger.error("❌ Error creating assignment:", error);
      throw error;
    }
  }

  /**
   * Determinar el tipo de asignación basado en los datos de la reclamación
   * @param {Object} claimData - Datos de la reclamación
   * @returns {string} - Tipo de asignación
   */
  determineAssignmentType(claimData) {
    // Lógica para determinar el tipo basado en conceptos o códigos
    if (claimData.ConceptApplicationCode) {
      return `CLAIM_${claimData.ConceptApplicationCode}`;
    } else if (claimData.ObjectionCode) {
      return `OBJECTION_${claimData.ObjectionCode}`;
    } else {
      return "CLAIM_PROCESSING";
    }
  }

  /**
   * Detener el consumo y cerrar conexiones
   */
  async stop() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.isConnected = false;
    } catch (error) {
      logger.error("❌ Error stopping assignment queue service:", error);
      throw error;
    }
  }

  /**
   * Verificar el estado de la conexión
   * @returns {Object} - Estado del servicio
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      queueName: this.queueName,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      connectionStatus: this.connection ? "active" : "inactive",
      channelStatus: this.channel ? "active" : "inactive",
    };
  }

  /**
   * Enviar un mensaje de prueba a la cola (para testing)
   * @param {Object} testClaimData - Datos de prueba
   */
  async sendTestMessage(testClaimData) {
    if (!this.isConnected || !this.channel) {
      throw new Error("Not connected to RabbitMQ");
    }

    try {
      const message = JSON.stringify(testClaimData);

      const sent = this.channel.sendToQueue(
        this.queueName,
        Buffer.from(message),
        {
          persistent: true,
          messageId: `test_${Date.now()}`,
          timestamp: Date.now(),
        }
      );

      return sent;
    } catch (error) {
      logger.error("❌ Error sending test message:", error);
      throw error;
    }
  }
}

module.exports = AssignmentQueueService;
