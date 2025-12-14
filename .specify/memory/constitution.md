<!--
SYNC IMPACT REPORT
==================
Version Change: 1.0.0 → 1.1.0
Type: MINOR (New section added + material expansion of testing principles)
Date: 2025-12-11

Modified Principles:
- Section VIII: "Test-Driven Development (TDD)" → "Automated Testing"
  * Expanded to include Phase II-specific requirements
  * Added JWT authentication and user isolation testing requirements
  * Added frontend component and integration testing requirements
  * Streamlined language for token efficiency

Added Sections:
- Section XII: "AI Sub-Agents and Skills" (new governance for multi-agent workflows)

Removed Sections:
- N/A

Templates Requiring Updates:
- ✅ spec-template.md - Already aligned (testing section covers automated tests)
- ✅ plan-template.md - Already aligned (constitution check validates principles)
- ✅ tasks-template.md - Already aligned (task categorization supports testing tasks)
- ⚠️ commands/*.md - Review for any agent-specific references (pending manual check)

Follow-up TODOs:
- None - all placeholders filled

Rationale:
Phase II introduces a full-stack web application with JWT authentication and multi-user
support. The testing principles have been expanded to explicitly require:
1. Backend API integration tests for all endpoints
2. JWT authentication and user isolation testing
3. Frontend component and integration tests
4. All tests passing before merge (enforcement gate)

The new Section XII formalizes support for AI sub-agents and reusable skills while ensuring
they adhere to the spec-driven workflow. This prevents autonomous agent behavior that bypasses
specifications or planning.
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
* **Enforcement:** All tests MUST pass before merging any changes.

---

## 4. Immutable Tech Stack (Global Constraints)

The following stack is the **Destination**.  must not deviate from these choices without a Constitutional Amendment.

* **Language:** Python 3.13+ (Backend/CLI) utilizing `uv`, TypeScript (Frontend).
* **Backend:** FastAPI (API), SQLModel (ORM), Pydantic (Validation).
* **Frontend:** Next.js 15+ (App Router), Tailwind CSS.
* **Data & Auth:** Neon (Serverless PostgreSQL), Better Auth (JWT Plugin).
* **AI & Ops:** OpenAI Agents SDK, Official MCP Python SDK, Docker (Gordon), Kubernetes (Minikube/DOKS), Helm, Kafka (Redpanda), Dapr.

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

## 6. Definition of Done

Before marking any task or feature as complete, verify:
1.  **Constitutional Compliance:** Does the generated output strictly adhere to every rule and principle outlined in this document?
2.  **Spec Alignment:** Does the output precisely satisfy the Acceptance Criteria in the active Specification?
3.  **Clean Build:** Do all automated tests pass with ZERO failures? Are there zero linting/typing errors?
4.  **Reproducibility:** Can the feature run in a fresh environment based solely on the repository's instructions?

---

## 7. Governance

### Amendment Process
* **Authority:** This Constitution supersedes all other documentation.
* **Versioning:** Semantic versioning (MAJOR.MINOR.PATCH) must be used.
* **Process:** Any architectural change requires an ADR and explicit approval.


---

**Version**: 1.1.0 | **Ratified**: 2025-12-07 | **Last Amended**: 2025-12-11
