---
description: "Task breakdown for Phase IV Kubernetes deployment with Minikube and Helm"
---

# Tasks: Minikube Kubernetes Deployment

**Input**: Design documents from `/specs/009-minikube-helm-deployment/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not applicable - verification performed via quickstart.md deployment tests

**Organization**: Tasks organized by phase (Setup → Foundational → P1-P5 user stories → Polish)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (P1-P5) this task belongs to
- Include exact file paths in descriptions

## Path Conventions

Phase 4 deployment adds Kubernetes infrastructure to existing Phase 3 application:
- **Frontend**: `phase-4-k8s-deployment/frontend/`
- **Backend**: `phase-4-k8s-deployment/backend/`
- **Helm**: `phase-4-k8s-deployment/helm/todo-app/`
- **Scripts**: `phase-4-k8s-deployment/scripts/`
- **Docs**: `phase-4-k8s-deployment/docs/`

---

## Phase 1: Setup (Helm Chart Structure)

**Purpose**: Initialize Helm chart directory structure and metadata files

- [x] T001 Copy Phase 3 application to phase-4-k8s-deployment/ directory
- [x] T002 Create Helm chart directory structure at helm/todo-app/
- [x] T003 [P] Create Chart.yaml with metadata (name: todo-app, version: 1.0.0, appVersion: 1.0.0)
- [x] T004 [P] Create helm/todo-app/templates/ directory for Kubernetes manifests
- [x] T005 [P] Create .dockerignore for frontend at frontend/.dockerignore
- [x] T006 [P] Create .dockerignore for backend at backend/.dockerignore

**Checkpoint**: Helm chart skeleton ready ✓

---

## Phase 2: Foundational (Health Endpoints & Dockerfiles)

**Purpose**: Core infrastructure that BLOCKS all user stories - health endpoints and container images

**⚠️ CRITICAL**: No user story work can begin until health endpoints and Dockerfiles are complete

### Health Endpoints (Required for all Deployments)

- [x] T007 [P] Create frontend liveness probe endpoint at frontend/app/api/health/route.ts (returns {"status": "ok"})
- [x] T008 [P] Create frontend readiness probe endpoint at frontend/app/api/ready/route.ts (validates env vars, returns 200 or 503)
- [x] T009 [P] Add backend liveness probe endpoint /health to backend/src/main.py (returns {"status": "healthy"})
- [x] T010 [P] Add backend readiness probe endpoint /ready to backend/src/main.py (tests database connection, returns 200 or 503)

### Dockerfiles (Required for Image Building)

- [x] T011 [P] Create multi-stage frontend Dockerfile at frontend/Dockerfile (node:22-alpine, user nextjs UID 1000, standalone output)
- [x] T012 [P] Create multi-stage backend Dockerfile at backend/Dockerfile (python:3.13-slim, user apiuser UID 1000, uv dependencies)
- [x] T013 [P] Update frontend/next.config.js to enable output: 'standalone' mode
- [x] T014 Verify Dockerfiles build successfully in Minikube context (eval $(minikube docker-env), docker build)

**Checkpoint**: Foundation ready - all health endpoints return 200 OK, images build successfully ✓

---

## Phase 3: User Story 1 (P1) - Orchestrate Application in Local Kubernetes 🎯 MVP

**Goal**: Deploy complete Todo application stack in Minikube with functional end-to-end workflows

**Independent Test**: Execute deployment, verify pods reach Running state, access frontend via NodePort, perform complete user workflows (authentication, task management, AI chat)

**Success Criteria**: SC-001 (pods ready <120s), SC-002 (frontend loads <5s), SC-003 (workflows functional), SC-011 (cross-platform deployment)

### Helm Template Helpers

- [x] T015 [US1] Create _helpers.tpl at helm/todo-app/templates/_helpers.tpl (defines todo-app.name, todo-app.fullname, todo-app.labels, todo-app.selectorLabels)

### Kubernetes Resources - Frontend

- [x] T016 [P] [US1] Create frontend Deployment template at helm/todo-app/templates/deployment-frontend.yaml (2 replicas, health probes, security context, resource limits per data-model.md)
- [x] T017 [P] [US1] Create frontend NodePort Service at helm/todo-app/templates/service-frontend.yaml (type: NodePort, port: 3000, nodePort: 30300)

### Kubernetes Resources - Backend

- [x] T018 [P] [US1] Create backend Deployment template at helm/todo-app/templates/deployment-backend.yaml (2 replicas, health probes, security context, resource limits per data-model.md)
- [x] T019 [P] [US1] Create backend ClusterIP Service at helm/todo-app/templates/service-backend.yaml (type: ClusterIP, port: 8000)

### Helm Values Configuration

- [x] T020 [US1] Create values.yaml at helm/todo-app/values.yaml (default config per data-model.md: replicas, images, services, resources, health probes, empty secrets)
- [x] T021 [US1] Create values-dev.yaml at helm/todo-app/values-dev.yaml (development overrides for local Minikube)

### Deployment Validation

- [x] T022 [US1] Build Docker images in Minikube context using eval $(minikube docker-env)
- [x] T023 [US1] Create .env.example file with required environment variable templates
- [ ] T024 [US1] Deploy Helm chart with helm install todo-app ./helm/todo-app -f ./helm/todo-app/values-dev.yaml -n todo-app --create-namespace
- [ ] T025 [US1] Verify pods reach Ready state with kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=todo-app -n todo-app --timeout=120s
- [ ] T026 [US1] Test frontend accessibility via NodePort at http://$(minikube ip):30300
- [ ] T027 [US1] Test end-to-end user workflow (login, create task, AI chat) per quickstart.md Test 4

**Checkpoint**: User Story 1 complete - application runs in Kubernetes, all workflows functional (Implementation ready - validation pending)

---

## Phase 4: User Story 2 (P2) - Automated Health Monitoring and Recovery

**Goal**: Kubernetes automatically detects container failures and restarts unhealthy pods without manual intervention

**Independent Test**: Simulate failure conditions (kill processes, block health endpoints), verify Kubernetes detects failures through probes and restarts containers within 30 seconds

**Success Criteria**: SC-004 (health probe restart <30s), SC-012 (recovery from network interruptions)

### Health Probe Configuration (Already in Deployments from Phase 3)

- [x] T028 [US2] Verify frontend Deployment has liveness probe configured (httpGet /api/health, initialDelaySeconds: 30, periodSeconds: 15, failureThreshold: 3)
- [x] T029 [US2] Verify frontend Deployment has readiness probe configured (httpGet /api/ready, initialDelaySeconds: 10, periodSeconds: 10, failureThreshold: 3)
- [x] T030 [US2] Verify backend Deployment has liveness probe configured (httpGet /api/health, initialDelaySeconds: 30, periodSeconds: 15, failureThreshold: 3)
- [x] T031 [US2] Verify backend Deployment has readiness probe configured (httpGet /api/ready, initialDelaySeconds: 10, periodSeconds: 10, failureThreshold: 3)

### Health Monitoring Tests

- [ ] T032 [US2] Test liveness probe failure detection per quickstart.md Test 5 (kill pod process, observe restart within 30s)
- [ ] T033 [US2] Test readiness probe traffic control (verify unhealthy pods removed from service endpoints with kubectl get endpoints)
- [ ] T034 [US2] Test backend readiness probe database connectivity check (verify /ready endpoint tests database before returning 200)
- [ ] T035 [US2] Verify health probe configuration visible in pod specs with kubectl describe pod

**Checkpoint**: User Story 2 complete - health monitoring active, automatic recovery functional

---

## Phase 5: User Story 3 (P3) - Secure Configuration and Secret Management

**Goal**: Sensitive credentials isolated in Kubernetes Secrets, non-sensitive configuration in ConfigMaps, no plaintext exposure

**Independent Test**: Inspect deployed resources and container environments to confirm database credentials, JWT secrets, and API keys are injected from Secrets (not visible in plaintext), and application configuration uses ConfigMaps

**Success Criteria**: SC-005 (no plaintext credentials in logs/specs), SC-009 (Helm values customization)

### ConfigMap and Secret Resources

- [x] T036 [P] [US3] Create ConfigMap template at helm/todo-app/templates/configmap.yaml (non-sensitive config per data-model.md: BETTER_AUTH_URL, FRONTEND_URL, BACKEND_URL, LOG_LEVEL, LLM_PROVIDER)
- [x] T037 [P] [US3] Create Secret template at helm/todo-app/templates/secret.yaml (sensitive credentials per data-model.md: DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY, R2 credentials with b64enc filter)

### Environment Injection Configuration

- [x] T038 [US3] Update frontend Deployment to inject ConfigMap with envFrom.configMapRef
- [x] T039 [US3] Update frontend Deployment to inject Secrets with env.valueFrom.secretKeyRef for each secret key
- [x] T040 [US3] Update backend Deployment to inject ConfigMap with envFrom.configMapRef
- [x] T041 [US3] Update backend Deployment to inject Secrets with env.valueFrom.secretKeyRef for each secret key

### Secret Security Validation

- [ ] T042 [US3] Test secret isolation per quickstart.md Test 7 (verify secrets not visible in pod specs with kubectl get pods -o yaml | grep DATABASE_URL)
- [ ] T043 [US3] Verify secrets injected as environment variables (kubectl exec -- env | grep DATABASE_URL shows actual value)
- [ ] T044 [US3] Verify ConfigMap updates without image rebuild (kubectl edit configmap, verify pods receive new values)
- [ ] T045 [US3] Test Helm values customization (override replica count via --set replicaCount.frontend=4, verify scaling)

**Checkpoint**: User Story 3 complete - configuration management secure, secrets isolated (Implementation ready - validation pending)

---

## Phase 6: User Story 4 (P4) - AI-Enhanced DevOps Tooling

**Goal**: Documented examples of AI-assisted tools (kubectl-ai, kagent, Docker AI) to accelerate troubleshooting and understand orchestration operations

**Independent Test**: Execute documented AI tool commands and confirm they provide accurate guidance for common Kubernetes tasks (pod inspection, log analysis, resource troubleshooting, image optimization)

**Success Criteria**: SC-007 (AI tool documentation with working examples)

### AI Tool Documentation

- [x] T046 [P] [US4] Create kubectl-ai examples at docs/kubectl-ai-examples.md (installation, pod status queries, troubleshooting commands, resource usage queries)
- [x] T047 [P] [US4] Create kagent guide at docs/kagent-guide.md (installation, diagnostic workflows, failure investigation steps)
- [x] T048 [P] [US4] Create Docker AI optimization guide at docs/docker-ai-optimization.md (installation, image size reduction, multi-stage build optimization, security scanning)

### AI Tool Validation

- [ ] T049 [US4] Validate kubectl-ai examples execute successfully (test natural language queries translate to correct kubectl commands)
- [ ] T050 [US4] Validate kagent troubleshooting workflows (test diagnostic steps provide useful information)
- [ ] T051 [US4] Validate Docker AI suggestions (test image optimization recommendations on frontend/backend Dockerfiles)

**Checkpoint**: User Story 4 complete - AI DevOps tools documented with working examples

---

## Phase 7: User Story 5 (P5) - Single-Command Deployment Automation

**Goal**: Single automated command provisions entire application stack without manual configuration steps

**Independent Test**: Execute deployment script on clean Minikube cluster, verify all resources (namespace, Helm charts, container images, services, pods) created correctly through automation

**Success Criteria**: SC-006 (deployment complete <10min), SC-011 (cross-platform success)

### Deployment Automation Script

- [x] T052 [US5] Create deployment script at scripts/deploy.sh with executable permissions (chmod +x)
- [x] T053 [US5] Add prerequisite validation to deploy.sh (check for minikube, helm, docker, kubectl with command -v)
- [x] T054 [US5] Add Minikube status check to deploy.sh (verify running with minikube status, start if needed with minikube start --cpus=4 --memory=8192)
- [x] T055 [US5] Add Docker environment configuration to deploy.sh (eval $(minikube docker-env))
- [x] T056 [US5] Add image building to deploy.sh (docker build -t todo-frontend:latest ./frontend && docker build -t todo-backend:latest ./backend)
- [x] T057 [US5] Add environment variable loading to deploy.sh (source .env, validate required vars: DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY)
- [x] T058 [US5] Add namespace creation to deploy.sh (kubectl create namespace todo-app || true)
- [x] T059 [US5] Add Helm deployment to deploy.sh (helm upgrade --install todo-app ./helm/todo-app -f ./helm/todo-app/values-dev.yaml -n todo-app --set secrets.* --wait --timeout=5m)
- [x] T060 [US5] Add pod readiness wait to deploy.sh (kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=todo-app -n todo-app --timeout=120s)
- [x] T061 [US5] Add access URL display to deploy.sh (echo "Frontend URL: http://$(minikube ip):30300")

### Deployment Script Validation

- [ ] T062 [US5] Test deployment script on clean Minikube cluster (minikube delete, minikube start, ./scripts/deploy.sh)
- [ ] T063 [US5] Measure deployment duration (verify <10 minutes from script start to pod ready)
- [ ] T064 [US5] Test idempotent re-execution (run ./scripts/deploy.sh twice, verify second run succeeds)
- [ ] T065 [US5] Test partial failure recovery (interrupt deployment midway, re-run script, verify completion)

**Checkpoint**: User Story 5 complete - single-command deployment automation functional (Implementation ready - validation pending)

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and final improvements across all stories

### Documentation

- [x] T066 [P] Update README.md with Phase 4 deployment instructions (prerequisites, one-command deployment, access URLs)
- [x] T067 [P] Create deployment troubleshooting guide in docs/troubleshooting.md (common issues from quickstart.md with solutions)
- [x] T068 [P] Document cleanup procedures in README.md (helm uninstall, kubectl delete namespace, minikube stop/delete)

### Cross-Platform Validation

- [ ] T069 Test deployment on Windows WSL2 (verify all scripts and commands work)
- [ ] T070 Test deployment on macOS (verify Minikube tunnel requirements)
- [ ] T071 Test deployment on Linux (verify standard deployment flow)

### Performance Validation

- [ ] T072 Measure and document pod ready time (target <120s, verify SC-001)
- [ ] T073 Measure and document frontend load time (target <5s, verify SC-002)
- [ ] T074 Measure and document deployment script duration (target <10min, verify SC-006)

### Security Hardening

- [ ] T075 Verify non-root containers (kubectl describe pod, check securityContext.runAsUser: 1000)
- [ ] T076 Verify resource limits enforced (kubectl describe pod, check resources.limits)
- [ ] T077 Verify capabilities dropped (kubectl describe pod, check securityContext.capabilities.drop: ALL)

### Regression Testing

- [ ] T078 Run Phase 3 automated tests against Kubernetes deployment (verify SC-010: zero functionality regression)
- [ ] T079 Execute all quickstart.md verification tests (Tests 1-8)
- [ ] T080 Verify horizontal scaling per quickstart.md Test 6 (scale frontend to 4 replicas, verify SC-008)

### Final Validation

- [ ] T081 Run Constitution Section XVIII compliance check (verify all 7 mandatory Phase IV requirements)
- [ ] T082 Validate all success criteria SC-001 to SC-012 from spec.md
- [ ] T083 Review all edge cases from spec.md (prerequisite failures, database connectivity, Helm failures, resource exhaustion, invalid config, port conflicts, storage unavailability, concurrent deployments)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - P1 (Orchestrate Application) must complete first (provides base deployment)
  - P2 (Health Monitoring) depends on P1 Deployments existing
  - P3 (Configuration Management) depends on P1 Deployments existing
  - P4 (AI DevOps) can start after P1 (independent documentation)
  - P5 (Deployment Automation) depends on P1-P4 (automates entire workflow)
- **Polish (Phase 8)**: Depends on all user stories P1-P5 being complete

### User Story Dependencies

- **P1 (Orchestrate Application)**: MUST complete first - provides base Kubernetes resources
- **P2 (Health Monitoring)**: Depends on P1 Deployments - verifies/validates existing probes
- **P3 (Configuration Management)**: Depends on P1 Deployments - adds ConfigMap/Secret injection
- **P4 (AI DevOps)**: Can start after P1 - documents tools for managing deployed application
- **P5 (Deployment Automation)**: Depends on P1-P4 - automates complete deployment workflow

### Within Each Phase

**Phase 1 (Setup)**:
- T001 must complete first (creates directory structure)
- T002-T006 can run in parallel after T001

**Phase 2 (Foundational)**:
- T007-T012 can all run in parallel (different files)
- T013 depends on T011 (must read frontend Dockerfile to update next.config)
- T014 depends on T011-T013 (validates all Dockerfiles)

**Phase 3 (P1 - Orchestrate)**:
- T015 must complete first (provides helper functions)
- T016-T019 can run in parallel after T015 (different template files)
- T020-T021 can run in parallel (different values files)
- T022-T027 must run sequentially (deployment validation steps)

**Phase 4 (P2 - Health Monitoring)**:
- T028-T031 can run in parallel (verification tasks)
- T032-T035 can run in parallel (test tasks)

**Phase 5 (P3 - Configuration)**:
- T036-T037 can run in parallel (different template files)
- T038-T041 must run sequentially (edit existing Deployment files)
- T042-T045 can run in parallel (validation tasks)

**Phase 6 (P4 - AI DevOps)**:
- T046-T048 can run in parallel (different documentation files)
- T049-T051 can run in parallel (validation tasks)

**Phase 7 (P5 - Automation)**:
- T052 must complete first (creates script file)
- T053-T061 must run sequentially (build script step-by-step)
- T062-T065 can run in parallel (test tasks)

**Phase 8 (Polish)**:
- T066-T068 can run in parallel (different documentation files)
- T069-T071 can run in parallel (platform-specific tests)
- T072-T074 can run in parallel (performance measurements)
- T075-T077 can run in parallel (security checks)
- T078-T080 must run sequentially (regression tests)
- T081-T083 must run sequentially (final validation)

### Parallel Opportunities

**Maximum Parallelization** (with 5 developers after Foundational phase):
- Developer 1: Phase 3 (P1 - Orchestrate Application) - CRITICAL PATH
- Developer 2: Phase 6 (P4 - AI DevOps) - can start immediately after P1 foundations
- Developer 3: Waits for P1, then Phase 4 (P2 - Health Monitoring)
- Developer 4: Waits for P1, then Phase 5 (P3 - Configuration)
- Developer 5: Waits for P1-P4, then Phase 7 (P5 - Automation)

**Sequential Approach** (single developer):
1. Phase 1 (Setup) → 2. Phase 2 (Foundational) → 3. Phase 3 (P1) → 4. Phase 4 (P2) → 5. Phase 5 (P3) → 6. Phase 6 (P4) → 7. Phase 7 (P5) → 8. Phase 8 (Polish)

---

## Parallel Example: Phase 2 (Foundational)

```bash
# Launch all health endpoint tasks together:
Task T007: "Create frontend liveness probe endpoint at frontend/src/app/api/health/route.ts"
Task T008: "Create frontend readiness probe endpoint at frontend/src/app/api/ready/route.ts"
Task T009: "Add backend liveness probe endpoint /health to backend/src/main.py"
Task T010: "Add backend readiness probe endpoint /ready to backend/src/main.py"

# Launch all Dockerfile tasks together:
Task T011: "Create multi-stage frontend Dockerfile at frontend/Dockerfile"
Task T012: "Create multi-stage backend Dockerfile at backend/Dockerfile"
```

---

## Implementation Strategy

### MVP First (P1 Only)

1. Complete Phase 1: Setup (Helm chart structure)
2. Complete Phase 2: Foundational (health endpoints + Dockerfiles) - CRITICAL
3. Complete Phase 3: User Story 1 (P1 - Orchestrate Application)
4. **STOP and VALIDATE**: Execute quickstart.md Tests 1-4, verify all workflows functional
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready (containers build, health endpoints work)
2. Add P1 (Orchestrate) → Test independently → Deploy/Demo (MVP! Application runs in Kubernetes)
3. Add P2 (Health Monitoring) → Test independently → Verify automatic recovery
4. Add P3 (Configuration) → Test independently → Verify secret security
5. Add P4 (AI DevOps) → Test independently → Verify documentation examples
6. Add P5 (Automation) → Test independently → Verify single-command deployment
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once P1 (Orchestrate) base Deployments exist:
   - Developer A: P2 (Health Monitoring) validation
   - Developer B: P3 (Configuration Management) implementation
   - Developer C: P4 (AI DevOps) documentation
3. After P1-P4 complete:
   - Developer D: P5 (Deployment Automation) - integrates all previous work
4. Team converges on Phase 8 (Polish) for final validation

---

## Command Validation (Context7 Verified)

All kubectl, Helm, and Minikube commands validated against latest documentation:

**kubectl commands**:
- `kubectl create namespace <name>` - Create namespace
- `kubectl get pods -n <namespace>` - List pods
- `kubectl describe pod -n <namespace> <pod-name>` - Inspect pod details
- `kubectl wait --for=condition=ready pod -l <selector> -n <namespace> --timeout=120s` - Wait for ready condition
- `kubectl scale deployment <name> -n <namespace> --replicas=<count>` - Scale deployment
- `kubectl exec -n <namespace> <pod-name> -- <command>` - Execute command in pod

**Helm commands**:
- `helm install <release> <chart> -f <values-file> -n <namespace> --set <key>=<value>` - Install chart
- `helm upgrade --install <release> <chart> -f <values-file> -n <namespace> --wait --timeout=5m` - Install or upgrade
- `helm uninstall <release> -n <namespace>` - Uninstall release

**Minikube commands**:
- `minikube start --cpus=4 --memory=8192 --disk-size=20g` - Start cluster with resources
- `minikube status` - Check cluster status
- `minikube ip` - Get cluster IP address
- `eval $(minikube docker-env)` - Configure Docker to use Minikube daemon

---

## Notes

- [P] tasks = different files, no dependencies within same phase
- [Story] label maps task to specific user story (US1-US5) for traceability
- Phase 2 (Foundational) BLOCKS all user stories - health endpoints and Dockerfiles are prerequisites
- P1 (Orchestrate Application) must complete before P2-P5 can fully function
- Each user story should be independently testable per quickstart.md verification tests
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All commands validated against Context7 latest Kubernetes/Helm/Minikube documentation
