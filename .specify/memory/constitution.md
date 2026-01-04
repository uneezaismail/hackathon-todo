<!--
SYNC IMPACT REPORT
==================
Version Change: 1.2.0 → 1.3.0
Type: MINOR (New sections added for Phase IV Kubernetes Deployment)
Date: 2026-01-03

Modified Principles:
- Section IV: "Immutable Tech Stack" - Added Container Orchestration and Health Monitoring
- Section VIII: "Governance" - Added Phase IV Mandatory Requirements enforcement

Added Sections:
- Section XVIII: "Phase IV Mandatory Requirements" (Kubernetes deployment infrastructure)
- New subsection in "6. Phase IV: Kubernetes Deployment Principles"

Removed Sections:
- N/A

Templates Requiring Updates:
- ✅ spec-template.md - Already aligned (user stories support deployment scenarios)
- ✅ plan-template.md - Already aligned (constitution check validates principles)
- ✅ tasks-template.md - Already aligned (task categorization supports deployment tasks)

Follow-up TODOs:
- None - all placeholders filled

Rationale:
Phase IV introduces Kubernetes Deployment with Minikube, Helm, and containerization.
The new principles explicitly require:
1. Local Kubernetes cluster (Minikube) with Helm chart deployment
2. Health checks (liveness and readiness probes) for automatic failure detection
3. Stateless design with external database and storage dependencies
4. Configuration separation (Secrets vs ConfigMaps)
5. One-command deployment automation script
6. AI DevOps tools (kubectl-ai, kagent, Docker AI) documented with examples
7. Horizontal scaling support with configurable replicas
8. Security: non-root containers, no hardcoded credentials

These principles extend the existing Evolutionary Architecture from Phase III
to containerized orchestration, preparing for cloud deployment in Phase V.
-->

# Evolution of Todo Constitution

### I. Spec-First Development (The Golden Rule)
**No implementation occurs without a specification.**
The workflow is strictly: **Constitution → Spec → Plan → Tasks → Implement**.
* Every feature MUST have a specification document (`spec.md`) before implementation begins.
* Code MUST be generated based on approved specifications.
* If generated code does not meet requirements, the specification MUST be refined and regenerated.
* Any code written without a corresponding specification is a strict violation of this Constitution.

### II. No Manual Code
**Manual coding is strictly prohibited.**
* All production code, tests, and configuration files MUST be generated via Spec-Kit Plus (Claude Code).
* **Exceptions:** Emergency hotfixes (must be immediately backfilled with a spec-driven update) or explicit environment configuration that cannot be automated.
* **Review Focus:** Code reviews must focus on compliance with the Specification, not syntax preferences.

### III. Reusable Intelligence
**Capture intelligence (Why & How) over just the code (What).**
* **ADRs (Architectural Decision Records):** Mandatory for *all* architecturally significant decisions (e.g., "Why we chose Neon DB," "Why we selected this Auth provider"). Each ADR must document options, trade-offs, and rationale.
* **PHRs (Prompt History Records):** Mandatory for complex prompting sessions. PHRs must capture the full prompt and outcome to improve future agent performance.
* **Subagents:** Prefer creating reusable Agent Skills and Subagents over one-off scripts.
---

## 2. Architectural Principles

### IV. Evolutionary Architecture
**Design for the future, implement for the present.**
The system architecture MUST be designed to evolve incrementally across phases (Console → Web → Chatbot → K8s).* **Abstraction Rule:** Phase I (In-Memory) code MUST use interfaces/protocols (e.g., `TaskRepository`). This allows core business logic to be swapped for Phase II (Database) persistent storage without rewriting the domain logic.
* **Forward Compatibility:** Architecture choices must not lock the system into local-only patterns that prevent cloud deployment.

### V. Single Responsibility (SRP)
**High cohesion, low coupling.**
* **Separation of Concerns:** Business Logic MUST be strictly separated from Input/Output (I/O) operations and User Interface (UI) concerns.
* **Modularity:** Each module, class, and function must have one clear, well-defined purpose.

### VI. User Experience First
**Interfaces must be intuitive, regardless of the medium.**
* **Consistency:** Whether the interface is a Command Line Interface (CLI) in Phase I or a Chatbot in Phase III, the user vocabulary (e.g., "Add Task", "Mark Complete") must remain consistent.
* **Feedback:** Interfaces must handle errors gracefully and provide actionable feedback, never raw stack traces.

---

## 3. Workflow Standards

### VII. The Checkpoint Pattern
**Atomic, Verifiable Progress.**
All implementation work must follow this atomic loop:
1.  **Generate:** AI Agent generates code for *one* atomic task.
2.  **Review:** Human reviews code against the Spec and Constitution.
3.  **Commit:** Human commits changes.
4.  **Next:** Move to the next task.
*Batching multiple tasks into one commit without review is prohibited.*

### VIII. Automated Testing
**The project MUST include automated tests for both frontend and backend.**
* **Backend:** MUST include API integration tests for all endpoints. Backend tests MUST verify JWT authentication and user isolation.
* **Frontend:** MUST include component tests and integration tests.
* **AI/MCP:** Phase III and beyond MUST include MCP tool unit tests and agent integration tests with mock agent behavior.
* **Enforcement:** All tests MUST pass before merging any changes.

---

## 4. Immutable Tech Stack (Global Constraints)

The following stack is the **Destination**.  must not deviate from these choices without a Constitutional Amendment.

* **Language:** Python 3.13+ (Backend/CLI) utilizing `uv`, TypeScript (Frontend).
* **Backend:** FastAPI (API), SQLModel (ORM), Pydantic (Validation), Openai-agents, chatkit-python.
* **Frontend:** Next.js 15+ (App Router), Tailwind CSS, Openai-agents SDK , OpenAI ChatKit (Phase III).
* **Data & Auth:** Neon (Serverless PostgreSQL), Better Auth (JWT Plugin).
* **AI & Ops:** OpenAI Agents SDK, Official MCP Python SDK, Docker (Gordon), Kubernetes (Minikube/DOKS), Helm, Kafka (Redpanda), Dapr.
* **Container Orchestration:** Minikube 1.32+, Helm 3.x, Kubernetes 1.28+
* **Health Monitoring:** Liveness and readiness probes for all pods

---

## 5. Code Quality Gates

### IX. Strict Type Safety
* **Python:** Strict type hints are **REQUIRED** for all function signatures. `mypy --strict` equivalent enforcement is mandatory.
* **TypeScript:** `"strict": true` mode is required.

### X. Strict Error Handling
* **No Silent Failures:** Catching an exception and using `pass` is strictly prohibited.
* **User-Friendly Errors:** Errors must return structured, user-friendly responses (JSON/Text). Internal details (stack traces) must be hidden from the client/user.

### XI. 12-Factor Configuration & Monorepo Discipline
* **Secrets:** No hardcoded secrets. All configuration must be managed via Environment Variables (`.env`).

### XII. AI Sub-Agents and Skills
**The project explicitly supports the use of multiple AI sub-agents and reusable skills.**
* **Compliance:** Sub-agents and skills MUST strictly adhere to this constitution and the spec-driven workflow.
* **Role Clarity:** Each sub-agent MUST have a clear, narrow role (e.g., writing specifications, planning, implementation, testing, or refactoring).
* **No Bypass:** Sub-agents MUST NOT bypass the established specification or plan.

---

## 6. Phase III: AI Chatbot Principles

### XIII. Conversational AI Architecture
**All chatbot functionality MUST use OpenAI Agents SDK and Official MCP Python SDK.**
* **Agent Orchestration:** OpenAI Agents SDK MUST handle all AI orchestration, decision-making, and tool routing.
* **MCP Server:** The Model Context Protocol (MCP) Server MUST be built using the Official MCP Python SDK.
* **Stateless Tools:** MCP tools MUST be stateless and store all state in the Neon PostgreSQL database.
* **Natural Language Mapping:** Natural language user inputs MUST be mapped to structured MCP tool calls by the agent.
* **Deterministic Behavior:** Agent behavior MUST be deterministic and testable (no hidden state, no randomness in tool selection logic).

### XIV. Stateless Service Pattern
**Chat endpoints MUST be completely stateless with database-backed conversation state.**
* **No In-Memory Sessions:** Chat endpoints MUST NOT store conversation state in memory (e.g., no session dictionaries, no global state).
* **Database-First:** Every request MUST fetch conversation history from the database (`conversations` and `messages` tables).
* **Persistence:** Conversation state MUST persist in Neon PostgreSQL tables for durability.
* **Server Restart Resilience:** Server restarts MUST NOT lose conversation context. All state must be recoverable from the database.
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
* **User Validation:** Every MCP tool MUST validate that the `user_id` parameter matches the authenticated user from the JWT token.
* **Data Isolation:** The agent MUST NOT access data belonging to other users. All database queries MUST filter by the authenticated user's ID.
* **No Information Leakage:** Agent responses MUST NOT leak internal system details (database schemas, internal IDs, stack traces).
* **User-Friendly Errors:** Tool errors MUST return user-friendly messages (e.g., "Task not found" instead of SQL errors).
* **Destructive Operation Confirmation:** The agent MUST confirm all destructive operations (delete, bulk updates) before execution.

### XVII. Conversation Management
**Conversations and messages MUST persist in Neon database with proper structure.**
* **Unique Conversation IDs:** Each conversation MUST have a unique ID and belong to a single user.
* **Message Storage:** Messages MUST be stored with `role` (user/assistant), `content`, and `created_at` timestamp.
* **History Loading:** Conversation history MUST be loaded from the database on every chat request to provide context to the agent.
* **Resumable Conversations:** Old conversations MUST be retrievable and resumable by conversation ID.
* **Message Ordering:** Message ordering MUST be preserved using `created_at` timestamp (chronological order).

---

## 6. Phase IV: Kubernetes Deployment Principles

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

* **Orchestration Platform:** Minikube version 1.32 or higher MUST provide the Kubernetes environment
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
* The automated deployment script MUST complete the full stack provisioning in under 10 minutes
* Documentation MUST include functional examples of kubectl-ai, kagent, and Docker AI usage

---

## 7. Definition of Done

Before marking any task or feature as complete, verify:
1.  **Constitutional Compliance:** Does the generated output strictly adhere to every rule and principle outlined in this document?
2.  **Spec Alignment:** Does the output precisely satisfy the Acceptance Criteria in the active Specification?
3.  **Clean Build:** Do all automated tests pass with ZERO failures? Are there zero linting/typing errors?
4.  **Reproducibility:** Can the feature run in a fresh environment based solely on the repository's instructions?

---

## 8. Governance

### Amendment Process
* **Authority:** This Constitution supersedes all other documentation.
* **Versioning:** Semantic versioning (MAJOR.MINOR.PATCH) must be used.
* **Process:** Any architectural change requires an ADR and explicit approval.
* **Phase IV Mandatory:** All Kubernetes deployment features are mandatory


---

**Version**: 1.3.0 | **Ratified**: 2025-12-07 | **Last Amended**: 2026-01-03
