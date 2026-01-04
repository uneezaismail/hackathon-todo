---
id: 0004
title: Phase IV Kubernetes Deployment Principles
stage: constitution
date: 2026-01-03
surface: claude-code
model: claude-sonnet-4.5
feature: none
branch: 008-ui-redesign-modern
user: cyb3r
command: sp.constitution
labels: [phase-iv, kubernetes, deployment, helm, minikube]
links:
  spec: N/A
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - path: .specify/memory/constitution.md
    lines_changed: 47
    change_type: update
tests:
  - N/A
---

## Prompt

Update constitution.md to add Phase IV Kubernetes Deployment requirements. Keep concise - detailed implementation goes in spec/plan/tasks.

Insert AFTER Section XVII (Conversation Management) and BEFORE "Definition of Done" section.

Add new section:

## 6. Phase IV: Kubernetes Deployment Principles

### XVIII. Phase IV Mandatory Requirements
**Every Phase IV requirement is MANDATORY - no exceptions permitted.**

**Kubernetes Deployment Infrastructure (All Required)**
Every Kubernetes deployment component MUST be fully implemented:

- **Minikube Cluster** - The application MUST run on a local Minikube Kubernetes cluster
- **Helm Packaging** - Deployment MUST use Helm 3.x charts for packaging and versioning
- **Pod Health Probes** - Every pod MUST have liveness and readiness probes configured
- **Environment Configuration** - All environment variables MUST use ConfigMaps and Secrets
- **Network Services** - Frontend MUST expose NodePort service, backend MUST use ClusterIP
- **Automated Deployment** - A single deployment command MUST provision the entire stack
- **AI Operations Tooling** - Integration with kubectl-ai, kagent, and Docker AI MUST be documented

**Technology Stack (All Required)**

- **Orchestration Platform:** Minikube version 1.32 or higher MUST provide the Kubernetes environment
- **Chart Management:** Helm version 3.x MUST handle all application deployments
- **Containerization:** Docker 24+ MUST run via Minikube's internal Docker daemon
- **Image Registry:** Container images MUST build within Minikube (no external registries required)
- **External Services:** PostgreSQL database (Neon) and object storage (Cloudflare R2) MUST stay external

**Deployment Architecture (All Required)**

- **Zero-State Pods:** Every pod MUST be stateless with no persistent volume claims
- **Replica Scalability:** The system MUST allow horizontal pod autoscaling across replicas
- **Automated Recovery:** Health probes MUST trigger automatic pod restarts on failure
- **Secret Isolation:** Sensitive credentials MUST be isolated in Secrets, configuration in ConfigMaps
- **Environment Injection:** All secrets MUST be injected at runtime, never hardcoded

**Success Criteria (All Required)**

- Frontend and backend containers MUST achieve Ready status within 120 seconds of deployment start
- The frontend MUST respond to requests via NodePort within 5 seconds after pod readiness
- Complete user workflows (authentication, chat interface, task operations) MUST function without errors
- Liveness probes MUST identify failed pods and trigger restarts within 30 seconds
- Deployment logs and pod environments MUST NOT expose secrets or API keys in plaintext
- The automated deployment script MUST complete the full stack provisioning in under 10 minutes
- Documentation MUST include functional examples of kubectl-ai, kagent, and Docker AI usage

Also update Section 4 (Immutable Tech Stack) to add:
- **Container Orchestration:** Minikube 1.32+, Helm 3.x, Kubernetes 1.28+
- **Health Monitoring:** Liveness and readiness probes for all pods

Also update Section 8 (Governance) to add:
- **Phase IV Mandatory:** All Kubernetes deployment features are mandatory

## Response snapshot

Constitution updated from v1.2.0 to v1.3.0 with Phase IV Kubernetes Deployment requirements:

**Changes made:**
1. Added Section XVIII "Phase IV Mandatory Requirements" with comprehensive Kubernetes deployment infrastructure requirements
2. Updated Section 4 (Immutable Tech Stack) with Container Orchestration and Health Monitoring requirements
3. Updated Section 8 (Governance) to enforce Phase IV mandatory requirements
4. Updated Sync Impact Report with version change rationale
5. Updated version footer to 1.3.0 and amendment date to 2026-01-03

**Key Principles Added:**
- Mandatory Minikube, Helm, Docker stack for Phase IV
- Health checks (liveness/readiness probes) for all pods
- Stateless design with external dependencies (Neon PostgreSQL, Cloudflare R2)
- Configuration separation (Secrets vs ConfigMaps)
- One-command deployment automation
- AI DevOps tools documentation (kubectl-ai, kagent, Docker AI)
- Horizontal scaling with configurable replicas
- Security requirements (non-root containers, no hardcoded credentials)

**Success Criteria:**
- 2-minute pod readiness
- 5-second frontend accessibility
- End-to-end functionality verification
- 30-second health probe failure detection
- No plaintext secrets
- <10 minute deployment script execution

## Outcome

- ✅ Impact: Constitution successfully updated to v1.3.0 with Phase IV Kubernetes deployment requirements
- 🧪 Tests: N/A (constitution document, no tests required)
- 📁 Files: 1 file modified (.specify/memory/constitution.md)
- 🔁 Next prompts: sp.specify (create Phase IV specification)
- 🧠 Reflection: Constitution now enforces mandatory Kubernetes deployment infrastructure, preparing the project for Phase IV local deployment with Minikube and Phase V cloud deployment. All deployment features are explicitly marked as mandatory to ensure complete implementation.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A (constitution amendment)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Proceed with sp.specify to create Phase IV deployment specification based on these constitutional requirements
