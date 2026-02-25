<!--
SYNC IMPACT REPORT
==================
Version Change: 1.3.0 → 2.0.0
Type: MAJOR (New phase with backward-incompatible architectural changes - event-driven architecture, cloud deployment)
Date: 2026-01-10

Modified Principles:
- Section IV: "Evolutionary Architecture" - Extended to support event-driven microservices
- Section XVIII: "Phase IV Mandatory Requirements" - Added Phase V reference
- Governance Section: Added Phase V mandatory enforcement

Added Sections:
- Section XIX: "Phase V Mandatory Requirements" (Advanced Cloud Deployment)
- New subsection in "6. Phase V: Advanced Cloud Deployment Principles"
- New subsection in "4. Immutable Tech Stack" for Dapr, Kafka, Cloud Providers

Removed Sections:
- N/A

Templates Requiring Updates:
- ✅ spec-template.md - Aligned (supports event-driven specifications)
- ✅ plan-template.md - Aligned (constitution check validates event-driven principles)
- ✅ tasks-template.md - Aligned (task categorization supports cloud deployment tasks)
- ⚠ spec-template.md: May need update for cloud provider scenarios

Follow-up TODOs:
- None - all placeholders filled

Rationale:
Phase V introduces Advanced Cloud Deployment with Event-Driven Architecture using Kafka and Dapr.
The new principles explicitly require:
1. Event-driven microservices with loose coupling
2. Asynchronous processing for recurring tasks and reminders
3. Dapr sidecar pattern for service communication
4. Apache Kafka 3.x for event streaming (task-events, reminders, task-updates)
5. Dapr 1.12+ integration (Pub/Sub, State, Jobs API, Service Invocation, Secrets)
6. Cloud deployment to OKE/GKE/AKS with production-ready Helm values
7. Monitoring stack with Prometheus + Grafana
8. CI/CD pipeline with GitHub Actions
9. Recurring Tasks with RRULE (RFC 5545) pattern support
10. Advanced features: Priorities & Tags, Search & Filter & Sort, Due Dates & Reminders

These principles build upon previous phases' evolutionary architecture, transforming the application
from stateful monolithic patterns to an event-driven, horizontally scalable microservices
system ready for production cloud deployment.
-->

# Evolution of Todo Constitution

### I. Spec-First Development (The Golden Rule)
**No implementation occurs without a specification.**
The workflow is strictly: **Constitution → Spec → Plan → Tasks → Implement**.
* Every feature MUST have a specification document (`spec.md`) before implementation begins.
* Code MUST be generated based on approved specifications.
* If generated code does not meet requirements, specification MUST be refined and regenerated.
* Any code written without a corresponding specification is a strict violation of this Constitution.

### II. No Manual Code
**Manual coding is strictly prohibited.**
* All production code, tests, and configuration files MUST be generated via Spec-Kit Plus (Claude Code).
* **Exceptions:** Emergency hotfixes (must be immediately backfilled with a spec-driven update) or explicit environment configuration that cannot be automated.
* **Review Focus:** Code reviews must focus on compliance with Specification, not syntax preferences.

### III. Reusable Intelligence
**Capture intelligence (Why & How) over just code (What).**
* **ADRs (Architectural Decision Records):** Mandatory for *all* architecturally significant decisions (e.g., "Why we chose Neon DB," "Why we selected this Auth provider"). Each ADR must document options, trade-offs, and rationale.
* **PHRs (Prompt History Records):** Mandatory for complex prompting sessions. PHRs must capture full prompt and outcome to improve future agent performance.
* **Subagents:** Prefer creating reusable Agent Skills and Subagents over one-off scripts.
---

## 2. Architectural Principles

### IV. Evolutionary Architecture
**Design for the future, implement for the present.**
The system architecture MUST be designed to evolve incrementally across phases (Console → Web → Chatbot → K8s → Event-Driven Cloud).* **Abstraction Rule:** Phase I (In-Memory) code MUST use interfaces/protocols (e.g., `TaskRepository`). This allows core business logic to be swapped for Phase II (Database) persistent storage without rewriting domain logic.
* **Forward Compatibility:** Architecture choices must not lock system into local-only patterns that prevent cloud deployment.
* **Event-Driven Evolution:** Phase V transforms to event-driven microservices where services communicate via Kafka events, enabling loose coupling and horizontal scalability.

### V. Single Responsibility (SRP)
**High cohesion, low coupling.**
* **Separation of Concerns:** Business Logic MUST be strictly separated from Input/Output (I/O) operations and User Interface (UI) concerns.
* **Modularity:** Each module, class, and function must have one clear, well-defined purpose.
* **Event Boundary:** In Phase V, each microservice must own specific event topics (producers/consumers) with clear contract boundaries.

### VI. User Experience First
**Interfaces must be intuitive, regardless of medium.**
* **Consistency:** Whether interface is a Command Line Interface (CLI) in Phase I or a Chatbot in Phase III, user vocabulary (e.g., "Add Task", "Mark Complete") must remain consistent.
* **Feedback:** Interfaces must handle errors gracefully and provide actionable feedback, never raw stack traces.
* **Real-Time Responsiveness:** Phase V must provide real-time updates via event streaming (WebSocket or SSE) for task changes.

---

## 3. Workflow Standards

### VII. The Checkpoint Pattern
**Atomic, Verifiable Progress.**
All implementation work must follow this atomic loop:
1. **Generate:** AI Agent generates code for *one* atomic task.
2. **Review:** Human reviews code against Spec and Constitution.
3. **Commit:** Human commits changes.
4. **Next:** Move to next task.
*Batching multiple tasks into one commit without review is prohibited.*

### VIII. Automated Testing
**The project MUST include automated tests for both frontend and backend.**
* **Backend:** MUST include API integration tests for all endpoints. Backend tests MUST verify JWT authentication and user isolation.
* **Frontend:** MUST include component tests and integration tests.
* **AI/MCP:** Phase III and beyond MUST include MCP tool unit tests and agent integration tests with mock agent behavior.
* **Event-Driven:** Phase V MUST include event consumer tests, integration tests for Kafka topics, and Dapr component tests.
* **Enforcement:** All tests MUST pass before merging any changes.

---

## 4. Immutable Tech Stack (Global Constraints)

The following stack is **Destination** - must not deviate from these choices without a Constitutional Amendment.

* **Language:** Python 3.13+ (Backend/CLI) utilizing `uv`, TypeScript (Frontend).
* **Backend:** FastAPI (API), SQLModel (ORM), Pydantic (Validation), Openai-agents, chatkit-python.
* **Frontend:** Next.js 16+ (App Router), Tailwind CSS, Openai-agents SDK, OpenAI ChatKit (Phase III).
* **Data & Auth:** Neon (Serverless PostgreSQL), Better Auth (JWT Plugin).
* **AI & Ops:** OpenAI Agents SDK, Official MCP Python SDK, Docker (Gordon), Kubernetes (Minikube/DOKS), Helm.
* **Event Streaming (Phase V):** Apache Kafka 3.x with Redpanda or Strimzi operator.
* **Service Mesh (Phase V):** Dapr 1.12+ for distributed application runtime.
* **Dapr Building Blocks (Phase V):** Pub/Sub (Kafka), State (PostgreSQL/Redis), Bindings/Jobs API (Cron triggers), Secrets Management, Service Invocation.
* **Cloud Providers (Phase V):** Oracle OKE (recommended - always free 4 OCPUs/24GB RAM), Google GKE, or Azure AKS.
* **Infrastructure-as-Code (Phase V):** Terraform templates for cloud provisioning.
* **Monitoring Stack (Phase V):** Prometheus + Grafana for metrics collection and visualization.
* **Distributed Tracing (Phase V - Optional):** Zipkin or Jaeger for request tracing across microservices.
* **Container Orchestration:** Minikube 1.32+ (local), Helm 3.x (local/cloud), Kubernetes 1.28+ (local/cloud).
* **Health Monitoring:** Liveness and readiness probes for all pods, Prometheus metrics endpoints.

---

## 5. Code Quality Gates

### IX. Strict Type Safety
* **Python:** Strict type hints are **REQUIRED** for all function signatures. `mypy --strict` equivalent enforcement is mandatory.
* **TypeScript:** `"strict": true` mode is required.

### X. Strict Error Handling
* **No Silent Failures:** Catching an exception and using `pass` is strictly prohibited.
* **User-Friendly Errors:** Errors must return structured, user-friendly responses (JSON/Text). Internal details (stack traces) must be hidden from client/user.
* **Event Handling (Phase V):** Event consumers MUST implement dead letter queues (DLQ) for failed events and exponential backoff for retry logic.

### XI. 12-Factor Configuration & Monorepo Discipline
* **Secrets:** No hardcoded secrets. All configuration must be managed via Environment Variables (`.env`) or Kubernetes Secrets.
* **Dapr Configuration (Phase V):** Dapr sidecar MUST inject configuration via Kubernetes ConfigMaps and Secrets. Application MUST read from Dapr HTTP API (localhost:3500).

### XII. AI Sub-Agents and Skills
**The project explicitly supports use of multiple AI sub-agents and reusable skills.**
* **Compliance:** Sub-agents and skills MUST strictly adhere to this constitution and spec-driven workflow.
* **Role Clarity:** Each sub-agent MUST have a clear, narrow role (e.g., writing specifications, planning, implementation, testing, or refactoring).
* **No Bypass:** Sub-agents MUST NOT bypass established specification or plan.
* **Event-Driven Agents (Phase V):** Agents MUST use Dapr Pub/Sub API for event publishing/subscribing, not direct Kafka client libraries.

---

## 6. Phase III: AI Chatbot Principles

### XIII. Conversational AI Architecture
**All chatbot functionality MUST use OpenAI Agents SDK and Official MCP Python SDK.**
* **Agent Orchestration:** OpenAI Agents SDK MUST handle all AI orchestration, decision-making, and tool routing.
* **MCP Server:** The Model Context Protocol (MCP) Server MUST be built using Official MCP Python SDK.
* **Stateless Tools:** MCP tools MUST be stateless and store all state in Neon PostgreSQL database.
* **Natural Language Mapping:** Natural language user inputs MUST be mapped to structured MCP tool calls by agent.
* **Deterministic Behavior:** Agent behavior MUST be deterministic and testable (no hidden state, no randomness in tool selection logic).

### XIV. Stateless Service Pattern
**Chat endpoints MUST be completely stateless with database-backed conversation state.**
* **No In-Memory Sessions:** Chat endpoints MUST NOT store conversation state in memory (e.g., no session dictionaries, no global state).
* **Database-First:** Every request MUST fetch conversation history from database (`conversations` and `messages` tables).
* **Persistence:** Conversation state MUST persist in Neon PostgreSQL tables for durability.
* **Server Restart Resilience:** Server restarts MUST NOT lose conversation context. All state must be recoverable from database.
* **Horizontal Scaling:** The stateless design MUST enable horizontal scaling without shared state or sticky sessions.

### XV. MCP Tool Design Standards
**MCP tools MUST follow single-purpose design with clear interfaces.**
* **Single Purpose:** Each MCP tool MUST have one well-defined purpose (e.g., `add_task`, `list_tasks`, `complete_task`, `delete_task`, `update_task`).
* **Naming Convention:** Tool names MUST use `snake_case` (lowercase with underscores).
* **User Validation:** Tool parameters MUST include `user_id` as a required parameter for security validation.
* **JSON Serializable:** Tool responses MUST be JSON-serializable (no custom objects, no function references).
* **Service Reuse:** Tools MUST reuse existing backend service layer logic. No duplicate business logic between REST API and MCP tools.

### XVI. AI Safety and User Isolation
**Every MCP tool call MUST validate user access and protect user data.**
* **User Validation:** Every MCP tool MUST validate that `user_id` parameter matches authenticated user from JWT token.
* **Data Isolation:** The agent MUST NOT access data belonging to other users. All database queries MUST filter by authenticated user's ID.
* **No Information Leakage:** Agent responses MUST NOT leak internal system details (database schemas, internal IDs, stack traces).
* **User-Friendly Errors:** Tool errors MUST return user-friendly messages (e.g., "Task not found" instead of SQL errors).
* **Destructive Operation Confirmation:** The agent MUST confirm all destructive operations (delete, bulk updates) before execution.

### XVII. Conversation Management
**Conversations and messages MUST persist in Neon database with proper structure.**
* **Unique Conversation IDs:** Each conversation MUST have a unique ID and belong to a single user.
* **Message Storage:** Messages MUST be stored with `role` (user/assistant), `content`, and `created_at` timestamp.
* **History Loading:** Conversation history MUST be loaded from database on every chat request to provide context to agent.
* **Resumable Conversations:** Old conversations MUST be retrievable and resumable by conversation ID.
* **Message Ordering:** Message ordering MUST be preserved using `created_at` timestamp (chronological order).

---

## 7. Phase IV: Kubernetes Deployment Principles

### XVIII. Phase IV Mandatory Requirements
**Every Phase IV requirement is MANDATORY - no exceptions permitted.**

**Kubernetes Deployment Infrastructure (All Required)**

Every Kubernetes deployment component MUST be fully implemented:

* **Minikube Cluster** - The application MUST run on a local Minikube Kubernetes cluster
* **Helm Packaging** - Deployment MUST use Helm 3.x charts for packaging and versioning
* **Pod Health Probes** - Every pod MUST have liveness and readiness probes configured
* **Environment Configuration** - All environment variables MUST use ConfigMaps and Secrets
* **Network Services** - Frontend MUST expose NodePort service, backend MUST use ClusterIP
* **Automated Deployment** - A single deployment command MUST provision the entire stack
* **AI Operations Tooling** - Integration with kubectl-ai, kagent, and Docker AI MUST be documented

**Technology Stack (All Required)**

* **Orchestration Platform:** Minikube version 1.32 or higher MUST provide Kubernetes environment
* **Chart Management:** Helm version 3.x MUST handle all application deployments
* **Containerization:** Docker 24+ MUST run via Minikube's internal Docker daemon
* **Image Registry:** Container images MUST build within Minikube (no external registries required)
* **External Services:** PostgreSQL database (Neon) and object storage (Cloudflare R2) MUST stay external

**Deployment Architecture (All Required)**

* **Zero-State Pods:** Every pod MUST be stateless with no persistent volume claims
* **Replica Scalability:** The system MUST allow horizontal pod autoscaling across replicas
* **Automated Recovery:** Health probes MUST trigger automatic pod restarts on failure
* **Secret Isolation:** Sensitive credentials MUST be isolated in Secrets, configuration in ConfigMaps
* **Environment Injection:** All secrets MUST be injected at runtime, never hardcoded

**Success Criteria (All Required)**

* Frontend and backend containers MUST achieve Ready status within 120 seconds of deployment start
* The frontend MUST respond to requests via NodePort within 5 seconds after pod readiness
* Complete user workflows (authentication, chat interface, task operations) MUST function without errors
* Liveness probes MUST identify failed pods and trigger restarts within 30 seconds
* Deployment logs and pod environments MUST NOT expose secrets or API keys in plaintext
* The automated deployment script MUST complete full stack provisioning in under 10 minutes
* Documentation MUST include functional examples of kubectl-ai, kagent, and Docker AI usage

---

## 8. Phase V: Advanced Cloud Deployment Principles

### XIX. Event-Driven Architecture Requirement
**Phase V MUST implement event-driven microservices architecture using Apache Kafka.**

**Kafka Integration (All Required)**

Every event-driven component MUST be fully implemented:

* **Apache Kafka 3.x** - Event streaming platform MUST be deployed (local: Redpanda/Strimzi, cloud: managed service)
* **Event Topics (All Required):**
  * `task-events` - All task CRUD operations (created, updated, completed, deleted)
  * `reminders` - Scheduled reminder triggers for due dates
  * `task-updates` - Real-time task changes for client synchronization
* **Event Schema** - All events MUST be JSON-serializable with `event_type`, `task_id`, `task_data`, `user_id`, `timestamp` fields
* **Producer/Consumer Separation** - Services MUST publish events and consume from designated topics
* **Consumer Groups** - Each consumer service MUST use unique consumer group ID for load balancing
* **Dead Letter Queues (DLQ)** - Failed events MUST be routed to DLQ topics for manual inspection
* **Exponential Backoff** - Event consumers MUST implement retry with exponential backoff (1s, 2s, 4s, 8s, 16s)

**Event-Driven Services (All Required)**

* **Chat API Producer** - Chat API (MCP tools) MUST publish events to Kafka topics on task operations
* **Recurring Task Service** - Separate service MUST consume `task-events` to spawn next occurrences
* **Notification Service** - Separate service MUST consume `reminders` to send push/email/browser notifications
* **Audit Service** - Separate service MUST consume `task-events` to maintain complete history log
* **WebSocket Service** - Separate service MUST consume `task-updates` for real-time client sync

**Architecture Principles (All Required)**

* **Loose Coupling** - Services communicate ONLY via events, no direct API calls between microservices
* **Asynchronous Processing** - All recurring task and reminder processing MUST be async (no blocking)
* **Horizontal Scalability** - Each consumer service MUST scale independently via replica count
* **Fault Tolerance** - Failed events MUST be retried with backoff, then routed to DLQ
* **Event Ordering** - Kafka partitioning MUST maintain ordering per user for task events

### XX. Dapr Integration Requirement
**Phase V MUST integrate Dapr sidecar for all Kubernetes workloads.**

**Dapr Building Blocks (All Required)**

Every Dapr component MUST be configured and functional:

* **Pub/Sub Component** - Kafka abstraction via Dapr Pub/Sub for publishing/subscribing events
* **State Component** - Optional PostgreSQL or Redis state store for conversation state (alternative to direct DB)
* **Jobs API (Cron Bindings)** - Dapr Jobs API MUST schedule exact-time reminder triggers
* **Secrets Management** - Dapr Secrets API OR Kubernetes Secrets for API keys and credentials
* **Service Invocation** - Frontend → Backend communication via Dapr for automatic retries and mTLS

**Dapr Sidecar Configuration (All Required)**

* **App ID** - Each application MUST have unique `app-id` (e.g., `todo-backend`, `todo-frontend`, `recurring-service`)
* **HTTP API Port** - Dapr sidecar MUST expose HTTP API on port 3500 (default)
* **Dapr Placement Service** - Dapr placement service MUST be deployed for distributed tracing
* **Component YAML Files** - Dapr components MUST be configured via Kubernetes custom resources (`components-dapr.yaml`)

**Application Integration (All Required)**

* **Pub/Sub Usage** - Applications MUST use HTTP POST/GET to Dapr sidecar (e.g., `http://localhost:3500/v1.0/publish/kafka-pubsub/task-events`)
* **State API Usage** - Optional state operations via Dapr state API (`http://localhost:3500/v1.0/state/...`)
* **Service Invocation** - Inter-service calls MUST go through Dapr (`http://localhost:3500/v1.0/invoke/backend-service/method/...`)
* **Sidecar Injection** - Kubernetes deployment YAML MUST annotate pods for automatic Dapr sidecar injection (`dapr.io/enabled: "true"`)

### XXI. Advanced Features Requirement
**Phase V MUST implement all Intermediate and Advanced level features.**

**Intermediate Features (All Required)**

* **Priorities** - Tasks MUST support priority levels (High, Medium, Low) with visual indicators
* **Tags/Categories** - Tasks MUST support user-defined tags (e.g., work, home, urgent) for organization
* **Search** - Tasks MUST support keyword search across titles and descriptions
* **Filter** - Tasks MUST be filterable by status (pending/completed), priority (high/medium/low), and due date
* **Sort** - Tasks MUST be sortable by due date, priority, creation date, or alphabetically by title

**Advanced Features (All Required)**

* **Recurring Tasks (RRULE)** - Tasks MUST support recurring patterns using RFC 5545 RRULE format
  * **Pattern Support:** `FREQ=DAILY|WEEKLY|MONTHLY|YEARLY`, `INTERVAL`, `BYDAY`, `BYMONTH` parameters
  * **Next Occurrence:** System MUST calculate next occurrence from RRULE pattern when task is marked complete
  * **Pattern Storage:** `recurring_pattern` field in tasks table MUST store RRULE string
  * **Auto-Spawn:** Recurring Task Service MUST auto-create next task instance on completion events
* **Due Dates** - Tasks MUST support optional due dates with date/time pickers
* **Reminders** - Tasks with due dates MUST trigger reminder events (browser notification, email, push)
  * **Reminder Timing:** Reminders MUST be configurable (e.g., 15min, 1hr, 1day before due)
  * **Scheduling:** Dapr Jobs API MUST schedule exact reminder triggers (not polling)
* **User Experience** - UI MUST provide clear visual distinction between one-time and recurring tasks

### XXII. Cloud Deployment Requirement
**Phase V MUST deploy to production-grade Kubernetes cluster (Oracle OKE/GKE/AKS).**

**Cloud Providers (Choose One - All Required)**

Every cloud deployment component MUST be fully implemented:

* **Oracle OKE (Recommended)** - Oracle Cloud Infrastructure Kubernetes Engine with always-free tier (4 OCPUs, 24GB RAM)
* **Google GKE** - Google Kubernetes Engine with $300 credit trial (90 days)
* **Azure AKS** - Azure Kubernetes Service with $200 credit trial (30 days)

**Cloud Infrastructure (All Required)**

* **Kubernetes Cluster** - Production-grade K8s cluster MUST be provisioned (OKE/GKE/AKS)
* **Container Registry** - Container images MUST be pushed to cloud registry (Oracle Container Registry, GCR, ACR)
* **Helm Charts** - Production Helm values MUST override local defaults for cloud environment
* **Ingress Controller** - LoadBalancer ingress MUST be configured (not NodePort)
* **TLS/SSL** - HTTPS MUST be enabled with valid SSL certificates
* **Managed Kafka** - Cloud-managed Kafka service (Confluent, Redpanda Cloud, or self-hosted Strimzi)
* **Monitoring Stack** - Prometheus + Grafana MUST be deployed with persistent storage
* **Logging Stack** - Centralized logging (Loki/ELK) or cloud-native logging solution

**CI/CD Pipeline (All Required)**

* **GitHub Actions** - Automated CI/CD workflow MUST be configured in `.github/workflows/`
* **Pipeline Stages:**
  * **Build** - Build Docker images for frontend + backend
  * **Test** - Run automated tests (unit, integration, contract)
  * **Push** - Push images to container registry
  * **Deploy** - Helm upgrade to production cluster
* **Environments:** Separate workflows for `dev`, `staging`, `production`
* **Approval Gates** - Production deployments MUST require manual approval

**Monitoring & Observability (All Required)**

* **Prometheus Metrics** - All applications MUST expose `/metrics` endpoints for Prometheus scraping
* **Grafana Dashboards** - Pre-built dashboards MUST visualize:
  * Request rate, latency, error rates (RED metrics)
  * Kafka consumer lag
  * Pod resource usage (CPU, memory)
  * Dapr component health
* **Alerting** - AlertManager MUST configure alerts for:
  * High error rate (>5%)
  * High latency (>1s p95)
  * Kafka consumer lag >1000 messages
  * Pod crashes/restarts
* **Distributed Tracing (Optional)** - Zipkin/Jaeger for request tracing across microservice boundaries

**Success Criteria (All Required)**

* Application MUST be accessible via HTTPS domain (not IP address)
* Production deployment MUST complete via CI/CD pipeline in <15 minutes
* Monitoring dashboards MUST display real-time metrics
* All event consumers MUST show zero consumer lag in healthy state
* Recurring tasks MUST automatically spawn next instances on completion
* Reminder notifications MUST fire at scheduled times
* Load testing MUST support 1000 concurrent users without degradation

### XXIII. Phase V Mandatory Requirements Summary
**All Phase V requirements are MANDATORY - no exceptions permitted.**

**Technology Compliance (All Required)**

* Apache Kafka 3.x for event streaming
* Dapr 1.12+ for distributed application runtime
* Oracle OKE or GKE or AKS for Kubernetes deployment
* Prometheus + Grafana for monitoring
* GitHub Actions for CI/CD

**Feature Completeness (All Required)**

* All Intermediate features implemented (Priorities, Tags, Search, Filter, Sort)
* All Advanced features implemented (Recurring Tasks with RRULE, Due Dates, Reminders)
* Event-driven architecture deployed with 4 Kafka topics
* Dapr sidecar injected into all workloads
* Cloud deployment to OKE/GKE/AKS with ingress and TLS
* CI/CD pipeline automating build-test-deploy

**Architecture Standards (All Required)**

* Loose coupling via events (no direct service API calls)
* Asynchronous processing for all background tasks
* Horizontal scalability for all microservices
* Fault tolerance with DLQ and exponential backoff
* Full observability (metrics, logging, traces)

---

## 9. Definition of Done

Before marking any task or feature as complete, verify:

1. **Constitutional Compliance:** Does not generated output strictly adhere to every rule and principle outlined in this document?
2. **Spec Alignment:** Does output precisely satisfy to Acceptance Criteria in to active Specification?
3. **Clean Build:** Do all automated tests pass with ZERO failures? Are there zero linting/typing errors?
4. **Reproducibility:** Can to feature run in a fresh environment based solely on to repository's instructions?

---

## 10. Governance

### Amendment Process

* **Authority:** This Constitution supersedes all other documentation.
* **Versioning:** Semantic versioning (MAJOR.MINOR.PATCH) must be used.
* **Process:** Any architectural change requires an ADR and explicit approval.
* **Phase IV Mandatory:** All Kubernetes deployment features are mandatory.
* **Phase V Mandatory:** All event-driven, Dapr, and cloud deployment features are mandatory.

---

**Version**: 2.0.0 | **Ratified**: 2025-12-07 | **Last Amended**: 2026-01-10
