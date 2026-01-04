# Feature Specification: Minikube Kubernetes Deployment with Helm

**Feature Branch**: `009-minikube-helm-deployment`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "Deploy the Phase 3 AI-powered Todo application (FastAPI backend with OpenAI Agents + Next.js chatbot frontend) on a local Minikube Kubernetes environment. Implementation requires Helm 3.x charts for deployment packaging, comprehensive pod health monitoring (both liveness and readiness checks), environment management via ConfigMaps and Secrets, network exposure through NodePort (frontend access) and ClusterIP (backend internal), fully automated single-command provisioning, and documented AI-assisted DevOps workflows using kubectl-ai, kagent, and Docker AI/Gordon. Database (Neon PostgreSQL) and object storage (Cloudflare R2) remain as external dependencies outside the cluster. Container image builds execute within Minikube's internal Docker environment. All existing Phase 3 capabilities must continue working without regression or functional degradation"

## User Scenarios & Testing

### User Story 1 - Orchestrate Application in Local Kubernetes (Priority: P1)

As a developer, I need to run the complete Todo application stack in a local Minikube cluster so that I can validate containerized deployment and test orchestration patterns before cloud deployment.

**Why this priority**: This establishes the foundational infrastructure for all subsequent deployment features. Without the ability to successfully deploy and run the application in Kubernetes, health monitoring, scaling, and automation features cannot be tested. This delivers immediate value by proving the application functions correctly in a containerized orchestration environment.

**Independent Test**: Can be verified by executing the deployment process and confirming both frontend and backend containers achieve running state, network services expose the correct ports, and end-to-end user workflows (authentication, task management, AI chat) operate without errors.

**Acceptance Scenarios**:

1. **Given** Minikube cluster is operational and Helm is available, **When** developer initiates deployment, **Then** both frontend and backend containers reach Ready state within 120 seconds
2. **Given** deployment is complete, **When** developer accesses the frontend through NodePort, **Then** the application interface loads within 5 seconds and presents the login screen
3. **Given** application is running in Kubernetes, **When** developer performs complete workflows (user login, task creation, AI chatbot interaction), **Then** all functionality works correctly and data persists to external Neon database
4. **Given** container images need updating, **When** developer rebuilds images in Minikube's Docker context and redeploys, **Then** updated containers launch using new images without requiring external registry push

---

### User Story 2 - Automated Health Monitoring and Recovery (Priority: P2)

As a platform operator, I need the Kubernetes cluster to automatically detect container failures and restart unhealthy pods so that service availability is maintained without manual intervention.

**Why this priority**: While basic deployment (P1) is the foundation, automated health monitoring and recovery are essential for production-grade reliability. This feature validates that Kubernetes self-healing capabilities integrate correctly with the application's health endpoints.

**Independent Test**: Can be tested by simulating failure conditions (terminating processes, blocking health endpoints, introducing application errors) and verifying that Kubernetes detects failures through probes and automatically restarts affected containers within defined recovery time windows.

**Acceptance Scenarios**:

1. **Given** pods have health probes configured, **When** a container's health check returns failure status, **Then** Kubernetes initiates pod restart within 30 seconds
2. **Given** frontend container is operational, **When** the application process becomes unresponsive (liveness probe failure), **Then** Kubernetes automatically terminates and replaces the container
3. **Given** backend container is initializing, **When** application dependencies are not ready (readiness probe failure), **Then** Kubernetes withholds traffic routing until the container passes readiness checks
4. **Given** health monitoring is active, **When** examining pod configurations, **Then** both liveness and readiness probes are visible with appropriate initial delays and timeout thresholds

---

### User Story 3 - Secure Configuration and Secret Management (Priority: P3)

As a security-focused engineer, I need sensitive credentials isolated in Kubernetes Secrets and non-sensitive configuration in ConfigMaps so that authentication tokens and API keys are never exposed in source code, logs, or pod specifications.

**Why this priority**: Security is critical, but the application can initially function with environment-based credentials during development (P1, P2). This priority ensures production-readiness through proper secret isolation while allowing earlier deployment testing.

**Independent Test**: Can be validated by inspecting deployed resources and container environments to confirm that database credentials, JWT secrets, and API keys are injected from Kubernetes Secrets (not visible in plaintext), and that application configuration uses ConfigMaps for non-sensitive values.

**Acceptance Scenarios**:

1. **Given** application requires database credentials, **When** these are stored as Kubernetes Secrets, **Then** pod specifications and container logs do not reveal plaintext credential values
2. **Given** application has environment-specific settings, **When** non-sensitive configuration is managed via ConfigMaps, **Then** configuration updates can be applied without rebuilding container images
3. **Given** Secrets are created for sensitive data, **When** inspecting pod environment variables, **Then** values are injected from Secret resources, not hardcoded in manifests
4. **Given** both ConfigMaps and Secrets are deployed, **When** containers initialize, **Then** all required environment variables from both sources are correctly available to the application

---

### User Story 4 - AI-Enhanced DevOps Tooling (Priority: P4)

As a developer learning Kubernetes concepts, I need documented examples of AI-assisted tools (kubectl-ai, kagent, Docker AI) so that I can accelerate troubleshooting and understand orchestration operations through natural language interactions.

**Why this priority**: AI tooling enhances developer productivity but is not required for core deployment functionality. The application must deploy and operate correctly (P1-P3) before optimizing developer experience with AI assistance.

**Independent Test**: Can be verified by executing documented AI tool commands and confirming they provide accurate guidance for common Kubernetes tasks such as pod inspection, log analysis, resource troubleshooting, and image optimization.

**Acceptance Scenarios**:

1. **Given** kubectl-ai is installed, **When** developer asks questions about pod status using natural language, **Then** kubectl-ai translates queries to appropriate kubectl commands with explanations
2. **Given** kagent is configured, **When** developer investigates failing containers, **Then** kagent recommends relevant diagnostic steps and command sequences
3. **Given** Docker AI integration is documented, **When** developer builds images in Minikube context, **Then** Docker AI provides suggestions for image optimization and best practices
4. **Given** AI tool documentation is available, **When** developer follows provided examples, **Then** all documented commands execute successfully and return useful information

---

### User Story 5 - Single-Command Deployment Automation (Priority: P5)

As a developer, I need a single automated command to provision the entire application stack so that I can rapidly establish or reset development environments without executing manual configuration steps.

**Why this priority**: While automation significantly improves developer experience, it builds upon proven deployment mechanisms (P1-P4). Manual deployment procedures can be followed initially, with automation providing convenience once core deployment stability is confirmed.

**Independent Test**: Can be tested by executing the deployment script on a clean Minikube cluster and verifying that all resources (namespace, Helm charts, container images, services, pods) are created and configured correctly through automation without requiring any manual steps.

**Acceptance Scenarios**:

1. **Given** Minikube cluster is running and dependencies are installed, **When** developer executes the deployment script, **Then** the complete provisioning process completes successfully within 10 minutes
2. **Given** deployment automation exists, **When** running against a fresh cluster, **Then** the script handles all initialization (namespace creation, image building, Helm installation) without manual intervention
3. **Given** an existing deployment is present, **When** re-executing the deployment script, **Then** the script performs a clean update of all resources without errors
4. **Given** a deployment fails partway through, **When** re-running the automation script, **Then** the script detects partial state and completes the deployment successfully

---

### Edge Cases

- What happens when Minikube is not running or the Docker daemon is inaccessible?
  - Deployment automation should detect missing prerequisites and display clear error messages with specific remediation guidance
- How does the system handle connection failures to external Neon PostgreSQL database?
  - Readiness probes should detect database connectivity issues and prevent traffic routing to unhealthy pods
  - Application should implement connection retry logic with exponential backoff to handle transient failures
- What happens when Helm chart installation fails midway through deployment?
  - Deployment script should provide rollback capability to remove partially-created resources
  - Error output should clearly identify which resources failed to deploy and why
- How does the system handle container resource exhaustion (CPU or memory limits exceeded)?
  - Pods should have resource requests and limits defined in Helm values
  - Kubernetes should throttle or evict containers exceeding limits rather than allowing node crashes
- What happens when ConfigMap or Secret values are invalid or missing?
  - Containers should fail fast during initialization with descriptive error messages
  - Readiness probes should prevent traffic routing to misconfigured pods
- How does the system handle NodePort conflicts (port 30300 already in use)?
  - Deployment should fail with clear error indicating port conflict
  - Documentation should specify default ports and provide instructions for customization via Helm values
- What happens when external Cloudflare R2 storage is unavailable?
  - Application should handle storage failures gracefully without crashing
  - Features dependent on object storage should degrade gracefully with appropriate user feedback
- How does the system handle multiple simultaneous deployments to the same cluster?
  - Helm releases should use unique names or namespace isolation
  - Documentation should specify cluster isolation strategies for multiple developers

## Requirements

### Functional Requirements

- **FR-001**: System MUST deploy to Minikube version 1.32 or higher running Kubernetes 1.28+
- **FR-002**: System MUST package deployment configuration using Helm 3.x charts with templated manifests
- **FR-003**: System MUST build container images within Minikube's internal Docker daemon, not external registries
- **FR-004**: System MUST expose frontend service as NodePort on port 30300 for external browser access
- **FR-005**: System MUST expose backend service as ClusterIP on port 8000 for internal cluster communication
- **FR-006**: System MUST implement liveness probes on both frontend and backend pods to detect unresponsive containers
- **FR-007**: System MUST implement readiness probes on both frontend and backend pods to control traffic routing
- **FR-008**: System MUST store non-sensitive configuration (service URLs, log levels, feature flags) in Kubernetes ConfigMaps
- **FR-009**: System MUST store sensitive credentials (database connection strings, API keys, JWT secrets) in Kubernetes Secrets
- **FR-010**: System MUST inject environment variables into containers from both ConfigMaps and Secrets
- **FR-011**: System MUST preserve all Phase 3 functionality (task CRUD, user authentication, AI chatbot) without breaking changes
- **FR-012**: System MUST connect to external Neon PostgreSQL database (not deployed in-cluster)
- **FR-013**: System MUST connect to external Cloudflare R2 object storage (not deployed in-cluster)
- **FR-014**: System MUST support horizontal scaling through replica count configuration in Helm values
- **FR-015**: System MUST maintain stateless pod design with no persistent volume claims required
- **FR-016**: System MUST provide single-command deployment script that automates the complete provisioning workflow
- **FR-017**: System MUST document integration and usage examples for kubectl-ai, kagent, and Docker AI tools
- **FR-018**: System MUST provide Helm values file allowing configuration customization (replicas, resources, ports)
- **FR-019**: System MUST include health check HTTP endpoints in both frontend (/api/health) and backend (/health) applications
- **FR-020**: System MUST configure liveness probe initial delay allowing sufficient application startup time
- **FR-021**: System MUST configure readiness probe to verify external database connectivity before accepting traffic
- **FR-022**: System MUST create Kubernetes namespace for deployment isolation
- **FR-023**: System MUST configure appropriate resource requests and limits for both frontend and backend pods
- **FR-024**: System MUST run containers as non-root users for security compliance
- **FR-025**: System MUST provide deployment script that validates prerequisites (Minikube, Helm, Docker, kubectl) before deployment

### Key Entities

- **Minikube Cluster**: Local Kubernetes environment running on developer workstation. Provides container orchestration, service networking, and resource scheduling. Single-node cluster configuration sufficient for development and testing scenarios.

- **Helm Chart**: Package structure containing Kubernetes resource definitions (Deployments, Services, ConfigMaps, Secrets) with templated values. Includes separate resource definitions for frontend and backend components with configurable parameters managed through values files.

- **Frontend Pod**: Container executing Next.js application serving the chatbot user interface. Exposes port 3000 internally, mapped to NodePort 30300 for external access. Includes liveness probe (HTTP GET /api/health) checking basic process health and readiness probe (HTTP GET /api/ready) verifying initialization completion.

- **Backend Pod**: Container executing FastAPI application with OpenAI Agents SDK integration. Exposes port 8000 internally, accessible via ClusterIP service within cluster network. Includes liveness probe (HTTP GET /health) monitoring process health and readiness probe (HTTP GET /ready) validating database connectivity and dependency availability.

- **ConfigMap**: Kubernetes resource storing non-sensitive configuration as key-value pairs. Contains frontend service URL, backend service URL, logging configuration, LLM provider settings, and feature toggles. Values mounted as environment variables into pod containers.

- **Secret**: Kubernetes resource storing sensitive credentials with base64 encoding. Contains DATABASE_URL (Neon PostgreSQL connection string), BETTER_AUTH_SECRET (JWT signing key), OPENAI_API_KEY, LLM provider credentials, and Cloudflare R2 access keys. Values injected as environment variables into containers at runtime.

- **NodePort Service**: Kubernetes service type exposing frontend on static port 30300 across all cluster nodes, enabling external access from host machine browser to application interface.

- **ClusterIP Service**: Kubernetes service type exposing backend exclusively within cluster internal network, allowing frontend pods to communicate with backend via stable DNS name (e.g., todo-backend:8000).

- **Health Probe Endpoint**: HTTP endpoint implemented in application code returning 200 OK status when application is healthy, 5xx status codes when unhealthy. Separate endpoints distinguish liveness (basic process health) from readiness (external dependency availability).

- **Deployment Automation Script**: Shell script orchestrating complete deployment workflow including prerequisite validation, image building in Minikube Docker context, Helm chart installation, pod readiness monitoring, and deployment success verification.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Frontend and backend containers achieve Ready state within 120 seconds of deployment command execution
- **SC-002**: Frontend application becomes accessible via NodePort and loads within 5 seconds when accessed through browser
- **SC-003**: Complete user workflows (authentication, task creation, task completion, AI chatbot interaction) function correctly with data persisting to external database
- **SC-004**: Health probes successfully detect simulated failures and trigger pod restart within 30 seconds
- **SC-005**: No authentication tokens, API keys, or database credentials are visible in plaintext when inspecting pod specifications or container logs
- **SC-006**: Single-command deployment script completes entire provisioning process within 10 minutes on a fresh Minikube cluster
- **SC-007**: Documentation for kubectl-ai, kagent, and Docker AI includes working examples that execute successfully and provide useful output
- **SC-008**: Application supports horizontal scaling by successfully running multiple frontend and backend pod replicas without state conflicts
- **SC-009**: Developers can customize deployment parameters (replica counts, resource limits, service ports) through Helm values file without modifying chart templates
- **SC-010**: All existing Phase 3 automated tests pass after Kubernetes deployment, confirming zero functionality regression
- **SC-011**: Deployment succeeds on different developer machines with varying host operating systems (Windows WSL2, macOS, Linux)
- **SC-012**: System successfully recovers from network interruptions to external dependencies (database, object storage) through automatic pod restarts
