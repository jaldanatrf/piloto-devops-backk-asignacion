# 🌊 Diagramas de Flujo del Sistema

## 📊 Arquitectura Completa del Sistema

```mermaid
graph TB
    subgraph "🌐 Frontend Applications"
        WEB[Web Dashboard]
        MOB[Mobile App]
        EXT[External Systems]
    end
    
    subgraph "🌍 API Gateway / Load Balancer"
        LB[Load Balancer]
        GATE[API Gateway]
    end
    
    subgraph "🏗️ Backend Services - Hexagonal Architecture"
        subgraph "📡 Infrastructure Layer"
            REST[REST API<br/>Express.js]
            MQ[RabbitMQ<br/>Consumer]
            DB[Database<br/>SQL Server]
            LOGS[Winston<br/>Logger]
        end
        
        subgraph "🔧 Application Layer"
            UC_ASS[Assignment<br/>Use Cases]
            UC_BUS[Business Rules<br/>Use Cases]
            UC_COM[Company<br/>Use Cases]
            UC_USR[User<br/>Use Cases]
            
            SVC_QUEUE[AssignmentQueue<br/>Service]
            SVC_PROC[BusinessRule<br/>Processor]
            SVC_DB[Database<br/>Service]
        end
        
        subgraph "💎 Domain Layer"
            ENT[Entities<br/>Business Objects]
            REPO[Repository<br/>Interfaces]
            VO[Value<br/>Objects]
        end
    end
    
    subgraph "🗄️ Data & External Services"
        SQL[(SQL Server<br/>Database)]
        RABBIT[(RabbitMQ<br/>Message Queue)]
        ORCHEST[Orchestrator<br/>System]
        EMAIL[Email<br/>Service]
    end
    
    %% Connections
    WEB --> LB
    MOB --> LB
    EXT --> LB
    
    LB --> GATE
    GATE --> REST
    
    REST -.-> UC_ASS
    REST -.-> UC_BUS
    REST -.-> UC_COM
    REST -.-> UC_USR
    
    UC_ASS --> SVC_QUEUE
    UC_BUS --> SVC_PROC
    UC_ASS --> SVC_DB
    UC_COM --> SVC_DB
    UC_USR --> SVC_DB
    
    SVC_QUEUE --> ENT
    SVC_PROC --> ENT
    SVC_DB --> REPO
    
    MQ --> SVC_QUEUE
    SVC_DB --> DB
    DB --> SQL
    
    RABBIT --> MQ
    ORCHEST --> RABBIT
    SVC_PROC -.-> EMAIL
    
    REST --> LOGS
    SVC_QUEUE --> LOGS
    SVC_PROC --> LOGS
    
    classDef frontend fill:#e1f5fe
    classDef infrastructure fill:#f3e5f5
    classDef application fill:#e8f5e8
    classDef domain fill:#fff3e0
    classDef external fill:#fce4ec
    
    class WEB,MOB,EXT frontend
    class REST,MQ,DB,LOGS infrastructure
    class UC_ASS,UC_BUS,UC_COM,UC_USR,SVC_QUEUE,SVC_PROC,SVC_DB application
    class ENT,REPO,VO domain
    class SQL,RABBIT,ORCHEST,EMAIL external
```

## 🔄 Flujo de Procesamiento de Asignaciones Automáticas

```mermaid
sequenceDiagram
    participant ORCH as Orchestrator System
    participant RABBIT as RabbitMQ
    participant QUEUE as AssignmentQueueService
    participant PROC as BusinessRuleProcessor
    participant DB as Database
    participant USER as Selected User
    participant LOG as Logger
    
    Note over ORCH,LOG: Flujo de Asignación Automática
    
    ORCH->>RABBIT: 📨 Send Claim Message
    Note right of RABBIT: Queue: assignment_queue
    
    RABBIT->>QUEUE: 📥 Consume Message
    QUEUE->>LOG: 🔍 Log: Message received
    
    QUEUE->>QUEUE: ✅ Validate Message Structure
    alt Message Invalid
        QUEUE->>RABBIT: ❌ NACK (Reject)
        QUEUE->>LOG: ⚠️ Log: Validation failed
    else Message Valid
        QUEUE->>PROC: 🧠 Process Claim
        
        PROC->>DB: 🏢 Find Target Company
        DB-->>PROC: Company Data
        
        alt Company Not Found
            PROC->>LOG: ❌ Log: Company not found
            PROC-->>QUEUE: Error Response
        else Company Found
            PROC->>DB: 📋 Get Active Rules
            DB-->>PROC: Rules List
            
            PROC->>PROC: 🎯 Evaluate Rules
            Note right of PROC: Filter by type, amount, etc.
            
            PROC->>DB: 👥 Get Candidate Users
            DB-->>PROC: Users with Roles
            
            PROC->>PROC: ⚖️ Select User (Least Load)
            Note right of PROC: Count pending assignments
            
            PROC->>DB: 📝 Create Assignment
            DB-->>PROC: Assignment Created
            
            PROC->>LOG: ✅ Log: Assignment created
            PROC-->>QUEUE: Success Response
        end
        
        QUEUE->>RABBIT: ✅ ACK (Confirm)
        QUEUE->>LOG: 📊 Log: Message processed
    end
    
    Note over USER: 📧 User gets notified<br/>(Future enhancement)
```

## 🎛️ Flujo de Control Manual del Servicio

```mermaid
stateDiagram-v2
    [*] --> Disconnected: Server Start
    
    Disconnected --> Connecting: POST /service/start
    Connecting --> Connected: Connection Success
    Connecting --> Error: Connection Failed
    
    Connected --> Consuming: Queue Setup
    Consuming --> Processing: Message Received
    Processing --> Consuming: Message Processed
    Processing --> Error: Processing Failed
    
    Error --> Reconnecting: Auto Retry
    Reconnecting --> Connected: Retry Success
    Reconnecting --> Disconnected: Max Retries Reached
    
    Connected --> Disconnecting: POST /service/stop
    Consuming --> Disconnecting: POST /service/stop
    Processing --> Disconnecting: POST /service/stop
    
    Disconnecting --> Disconnected: Cleanup Complete
    
    note right of Connecting
        Max 5 retry attempts
        5 second delay
    end note
    
    note right of Processing
        ACK on success
        NACK on failure
    end note
```

## 🏗️ Arquitectura de Componentes por Capas

```mermaid
graph TD
    subgraph "🌐 Presentation Layer"
        SWAGGER[Swagger UI<br/>API Documentation]
        REST_API[REST API<br/>Express Routes]
        MIDDLEWARE[Middleware<br/>Auth, CORS, Helmet]
    end
    
    subgraph "🎮 Controllers Layer"
        CTRL_COMP[Company<br/>Controller]
        CTRL_USER[User<br/>Controller]
        CTRL_ROLE[Role<br/>Controller]
        CTRL_RULE[Rule<br/>Controller]
        CTRL_ASS[Assignment<br/>Controller]
        CTRL_AUTO[AutoAssignment<br/>Controller]
        CTRL_BIZ[BusinessRule<br/>Controller]
    end
    
    subgraph "📋 Use Cases Layer"
        UC_COMP[Company<br/>Use Cases]
        UC_USER[User<br/>Use Cases]
        UC_ROLE[Role<br/>Use Cases]
        UC_RULE[Rule<br/>Use Cases]
        UC_ASS[Assignment<br/>Use Cases]
        UC_AUTO[AutoAssignment<br/>Use Cases]
        UC_BIZ[BusinessRule<br/>Use Cases]
    end
    
    subgraph "🔧 Services Layer"
        SVC_DB[Database<br/>Service]
        SVC_QUEUE[AssignmentQueue<br/>Service]
        SVC_PROC[Assignment<br/>Process Service]
        SVC_BIZ[BusinessRule<br/>Processor]
        SVC_COMP[Company<br/>Service]
    end
    
    subgraph "🏪 Repository Layer"
        REPO_COMP[Company<br/>Repository]
        REPO_USER[User<br/>Repository]
        REPO_ROLE[Role<br/>Repository]
        REPO_RULE[Rule<br/>Repository]
        REPO_ASS[Assignment<br/>Repository]
        REPO_UR[UserRole<br/>Repository]
        REPO_RR[RuleRole<br/>Repository]
    end
    
    subgraph "💾 Data Layer"
        MODELS[Sequelize<br/>Models]
        DB_ADAPTER[Database<br/>Adapter]
        MIGRATIONS[Database<br/>Migrations]
    end
    
    subgraph "🗄️ Infrastructure"
        SQL_SERVER[(SQL Server<br/>Database)]
        RABBITMQ[(RabbitMQ<br/>Queue)]
        LOGS[Winston<br/>Logger]
    end
    
    %% Connections
    SWAGGER --> REST_API
    REST_API --> MIDDLEWARE
    MIDDLEWARE --> CTRL_COMP
    MIDDLEWARE --> CTRL_USER
    MIDDLEWARE --> CTRL_ROLE
    MIDDLEWARE --> CTRL_RULE
    MIDDLEWARE --> CTRL_ASS
    MIDDLEWARE --> CTRL_AUTO
    MIDDLEWARE --> CTRL_BIZ
    
    CTRL_COMP --> UC_COMP
    CTRL_USER --> UC_USER
    CTRL_ROLE --> UC_ROLE
    CTRL_RULE --> UC_RULE
    CTRL_ASS --> UC_ASS
    CTRL_AUTO --> UC_AUTO
    CTRL_BIZ --> UC_BIZ
    
    UC_COMP --> SVC_DB
    UC_USER --> SVC_DB
    UC_ROLE --> SVC_DB
    UC_RULE --> SVC_DB
    UC_ASS --> SVC_PROC
    UC_AUTO --> SVC_QUEUE
    UC_BIZ --> SVC_BIZ
    
    SVC_DB --> REPO_COMP
    SVC_DB --> REPO_USER
    SVC_DB --> REPO_ROLE
    SVC_DB --> REPO_RULE
    SVC_PROC --> REPO_ASS
    SVC_QUEUE --> SVC_BIZ
    SVC_BIZ --> REPO_COMP
    SVC_BIZ --> REPO_RULE
    SVC_BIZ --> REPO_USER
    
    REPO_COMP --> MODELS
    REPO_USER --> MODELS
    REPO_ROLE --> MODELS
    REPO_RULE --> MODELS
    REPO_ASS --> MODELS
    REPO_UR --> MODELS
    REPO_RR --> MODELS
    
    MODELS --> DB_ADAPTER
    DB_ADAPTER --> SQL_SERVER
    
    SVC_QUEUE --> RABBITMQ
    
    REST_API --> LOGS
    SVC_QUEUE --> LOGS
    SVC_BIZ --> LOGS
    
    classDef presentation fill:#e3f2fd
    classDef controllers fill:#f1f8e9
    classDef usecases fill:#fff3e0
    classDef services fill:#f3e5f5
    classDef repositories fill:#fce4ec
    classDef data fill:#e0f2f1
    classDef infrastructure fill:#fff8e1
    
    class SWAGGER,REST_API,MIDDLEWARE presentation
    class CTRL_COMP,CTRL_USER,CTRL_ROLE,CTRL_RULE,CTRL_ASS,CTRL_AUTO,CTRL_BIZ controllers
    class UC_COMP,UC_USER,UC_ROLE,UC_RULE,UC_ASS,UC_AUTO,UC_BIZ usecases
    class SVC_DB,SVC_QUEUE,SVC_PROC,SVC_BIZ,SVC_COMP services
    class REPO_COMP,REPO_USER,REPO_ROLE,REPO_RULE,REPO_ASS,REPO_UR,REPO_RR repositories
    class MODELS,DB_ADAPTER,MIGRATIONS data
    class SQL_SERVER,RABBITMQ,LOGS infrastructure
```

## 🎯 Flujo de Decisión para Asignaciones

```mermaid
flowchart TD
    START([📥 Claim Received]) --> VALIDATE{🔍 Valid Message?}
    
    VALIDATE -->|❌ No| REJECT[❌ Reject Message<br/>Log Error]
    VALIDATE -->|✅ Yes| FIND_COMPANY[🏢 Find Target Company]
    
    FIND_COMPANY --> COMPANY_EXISTS{🏢 Company Exists?}
    COMPANY_EXISTS -->|❌ No| REJECT
    COMPANY_EXISTS -->|✅ Yes| GET_RULES[📋 Get Active Rules]
    
    GET_RULES --> RULES_EXIST{📋 Rules Found?}
    RULES_EXIST -->|❌ No| REJECT
    RULES_EXIST -->|✅ Yes| EVAL_RULES[🧠 Evaluate Rules]
    
    EVAL_RULES --> AMOUNT_RULE{💰 Amount Rule?}
    AMOUNT_RULE -->|✅ Yes| CHECK_AMOUNT{💰 Amount in Range?}
    CHECK_AMOUNT -->|❌ No| COMPANY_RULE
    CHECK_AMOUNT -->|✅ Yes| GET_ROLES_AMOUNT[👥 Get Rule Roles]
    
    AMOUNT_RULE -->|❌ No| COMPANY_RULE{🏢 Company Rule?}
    COMPANY_RULE -->|✅ Yes| CHECK_COMPANY{🏢 Source Matches?}
    CHECK_COMPANY -->|❌ No| CUSTOM_RULE
    CHECK_COMPANY -->|✅ Yes| GET_ROLES_COMPANY[👥 Get Rule Roles]
    
    COMPANY_RULE -->|❌ No| CUSTOM_RULE{⚙️ Custom Rule?}
    CUSTOM_RULE -->|✅ Yes| EVAL_CUSTOM[⚙️ Evaluate Custom Logic]
    CUSTOM_RULE -->|❌ No| NO_RULES[❌ No Rules Apply]
    
    GET_ROLES_AMOUNT --> FIND_USERS[👤 Find Users with Roles]
    GET_ROLES_COMPANY --> FIND_USERS
    EVAL_CUSTOM --> GET_ROLES_CUSTOM[👥 Get Custom Roles]
    GET_ROLES_CUSTOM --> FIND_USERS
    
    FIND_USERS --> USERS_FOUND{👤 Users Found?}
    USERS_FOUND -->|❌ No| NO_USERS[❌ No Eligible Users]
    USERS_FOUND -->|✅ Yes| COUNT_ASSIGNMENTS[📊 Count Pending Assignments]
    
    COUNT_ASSIGNMENTS --> SELECT_USER[🎯 Select User<br/>Least Assignments]
    SELECT_USER --> CREATE_ASSIGNMENT[📝 Create Assignment]
    
    CREATE_ASSIGNMENT --> SUCCESS[✅ Assignment Created<br/>Send ACK]
    
    REJECT --> END([📋 End Process])
    NO_RULES --> END
    NO_USERS --> END
    SUCCESS --> END
    
    classDef startEnd fill:#c8e6c9
    classDef decision fill:#fff3e0
    classDef process fill:#e3f2fd
    classDef error fill:#ffcdd2
    classDef success fill:#c8e6c9
    
    class START,END startEnd
    class VALIDATE,COMPANY_EXISTS,RULES_EXIST,AMOUNT_RULE,CHECK_AMOUNT,COMPANY_RULE,CHECK_COMPANY,CUSTOM_RULE,USERS_FOUND decision
    class FIND_COMPANY,GET_RULES,EVAL_RULES,GET_ROLES_AMOUNT,GET_ROLES_COMPANY,EVAL_CUSTOM,GET_ROLES_CUSTOM,FIND_USERS,COUNT_ASSIGNMENTS,SELECT_USER,CREATE_ASSIGNMENT process
    class REJECT,NO_RULES,NO_USERS error
    class SUCCESS success
```

## 📊 Modelo de Datos y Relaciones

```mermaid
erDiagram
    COMPANY ||--o{ USER : "belongs_to"
    COMPANY ||--o{ RULE : "has"
    COMPANY ||--o{ ROLE : "has"
    COMPANY ||--o{ ASSIGNMENT : "receives"
    
    USER ||--o{ ASSIGNMENT : "assigned_to"
    USER }o--o{ ROLE : "has_roles"
    
    ROLE }o--o{ RULE : "applies_to"
    
    COMPANY {
        int id PK
        string name UK
        string description
        string documentNumber UK
        string documentType
        string type
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    USER {
        int id PK
        string name
        string dud UK
        int companyId FK
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    ROLE {
        int id PK
        string name
        string description
        int companyId FK
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    RULE {
        int id PK
        string name
        string description
        string type
        int companyId FK
        decimal minimumAmount
        decimal maximumAmount
        string nitAssociatedCompany
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    ASSIGNMENT {
        int id PK
        int userId FK
        int companyId FK
        string type
        string status
        int processId
        string externalReference
        string claimId
        string documentNumber
        decimal invoiceAmount
        decimal value
        datetime assignedAt
        datetime createdAt
        datetime updatedAt
    }
    
    USER_ROLE {
        int id PK
        int userId FK
        int roleId FK
        datetime createdAt
        datetime updatedAt
    }
    
    RULE_ROLE {
        int id PK
        int ruleId FK
        int roleId FK
        datetime createdAt
        datetime updatedAt
    }
```

## 🚀 Flujo de Despliegue y CI/CD (Futuro)

```mermaid
gitGraph
    commit id: "Initial Setup"
    
    branch develop
    checkout develop
    commit id: "Feature Development"
    
    branch feature/auto-assignments
    checkout feature/auto-assignments
    commit id: "Add RabbitMQ Consumer"
    commit id: "Add Business Rules Engine"
    commit id: "Add Tests"
    
    checkout develop
    merge feature/auto-assignments
    
    branch release/v1.0
    checkout release/v1.0
    commit id: "Version Bump"
    commit id: "Documentation Update"
    
    checkout main
    merge release/v1.0
    commit id: "v1.0 Release" tag: "v1.0"
    
    checkout develop
    merge main
    
    branch feature/notifications
    checkout feature/notifications
    commit id: "Add Email Service"
    commit id: "Add Push Notifications"
    
    checkout develop
    merge feature/notifications
    
    checkout main
    merge develop
    commit id: "v1.1 Release" tag: "v1.1"
```

---

Estos diagramas proporcionan una vista completa del sistema desde diferentes perspectivas: arquitectura, flujo de datos, estados del servicio, estructura de componentes, lógica de decisiones, modelo de datos y proceso de desarrollo.
