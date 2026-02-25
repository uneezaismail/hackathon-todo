# Tasks: Phase V - Enterprise-Grade Cloud Infrastructure

**Input**: Design documents from `/specs/010-cloud-deployment/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md, contracts/events-contracts.md
**Implementation Agent**: `phase5-cloud-deployment-engineer` with skills: `dapr-integration`, `kafka-event-driven`, `kubernetes-helm-deployment`, `microservices-patterns`, `terraform-infrastructure`, `rrule-recurring-tasks`
**Cloud Target**: Microsoft Azure AKS (using free $200 credits)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## User Stories Summary (from spec.md)

| Story | Title | Priority | Description |
|-------|-------|----------|-------------|
| US1 | Automated Recurring Task Management | P1 | RRULE patterns, auto-generate next instance on completion |
| US2 | Timely Deadline Alerts and Reminders | P1 | Dapr Jobs API scheduling, email/push notifications |
| US3 | Message-Driven Task Event Processing | P2 | Kafka events, CloudEvents, idempotency, DLQ |
| US4 | Cloud Deployment Scalability | P3 | Azure AKS, Terraform, Helm, CI/CD, monitoring |
| US5 | Local Development Environment | P3 | Minikube, local Kafka/Dapr, dev workflow |

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Copy Phase IV baseline, establish Phase V project structure

- [x] T001 Copy phase-4-k8s-deployment/ to phase-5-cloud-deployment/ preserving git history
- [x] T002 [P] Update phase-5-cloud-deployment/CLAUDE.md with Phase V context and skills references
- [x] T003 [P] Create phase-5-cloud-deployment/services/ directory structure for microservices
- [x] T004 [P] Create phase-5-cloud-deployment/dapr/ directory with components/ and config/ subdirs
- [x] T005 [P] Create phase-5-cloud-deployment/terraform/aks/ directory for Azure infrastructure
- [x] T006 [P] Create phase-5-cloud-deployment/monitoring/ directory with prometheus/, grafana/, alertmanager/, zipkin/ subdirs
- [x] T007 [P] Create phase-5-cloud-deployment/.github/workflows/ directory for CI/CD pipelines
- [x] T008 Update phase-5-cloud-deployment/backend/pyproject.toml with Phase V dependencies (dapr, python-dateutil, cloudevents)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

### Database Schema Extensions

- [x] T009 Create Alembic migration for recurring task fields in phase-5-cloud-deployment/backend/alembic/versions/004_add_recurring_fields.py (add recurring_pattern, recurring_end_date, next_occurrence, parent_task_id to tasks table)
- [x] T010 Create Alembic migration for alerts table in phase-5-cloud-deployment/backend/alembic/versions/005_create_alerts_table.py (alert_id, task_id, user_id, alert_time, notification_channels, delivery_status, delivery_attempts)
- [x] T011 Create Alembic migration for task_events audit table in phase-5-cloud-deployment/backend/alembic/versions/006_create_task_events_table.py (event_id UUID, event_type, user_id, task_id, payload JSON, occurred_at, event_version)

### Dapr Components Configuration

- [x] T012 [P] Create Dapr Pub/Sub component for Kafka in phase-5-cloud-deployment/dapr/components/pubsub-kafka.yaml (brokers, consumer groups, DLQ config per reference-phase-5)
- [x] T013 [P] Create Dapr State Store component for Redis in phase-5-cloud-deployment/dapr/components/statestore-redis.yaml (for event idempotency keys)
- [x] T014 [P] Create Dapr Secrets Store component in phase-5-cloud-deployment/dapr/components/secretstore-kubernetes.yaml
- [x] T015 [P] Create Dapr Jobs Scheduler component in phase-5-cloud-deployment/dapr/components/jobs-scheduler.yaml (for alert scheduling)

### Event Schemas and Publishers

- [x] T016 Create CloudEvents base schemas in phase-5-cloud-deployment/backend/src/events/__init__.py
- [x] T017 Create event schema definitions in phase-5-cloud-deployment/backend/src/events/schemas.py (TaskCreatedEvent, TaskCompletedEvent, TaskDeletedEvent, AlertScheduledEvent, AlertFiredEvent, NotificationSentEvent per contracts/events-contracts.md)
- [x] T018 Create Dapr Pub/Sub publisher client in phase-5-cloud-deployment/backend/src/events/publisher.py (publish_task_event, publish_alert_event using Dapr HTTP API localhost:3500)
- [x] T019 Create event idempotency helper in phase-5-cloud-deployment/backend/src/events/idempotency.py (check/mark event processed using Dapr State Store)

### Shared Models

- [x] T020 Update Task model in phase-5-cloud-deployment/backend/src/models/task.py (add recurring_pattern, recurring_end_date, next_occurrence, parent_task_id, is_pattern fields)
- [x] T021 Create Alert model in phase-5-cloud-deployment/backend/src/models/alert.py (alert_id, task_id, user_id, alert_time, notification_channels, delivery_status, delivery_attempts, failed_reason)
- [x] T022 Create TaskEvent model in phase-5-cloud-deployment/backend/src/models/task_event.py (event_id, event_type, user_id, task_id, payload, occurred_at, event_version)

### Health and Metrics Endpoints

- [x] T023 Add Prometheus metrics endpoint in phase-5-cloud-deployment/backend/src/api/v1/metrics.py (expose /metrics for scraping)
- [x] T024 Update health endpoints in phase-5-cloud-deployment/backend/src/api/v1/health.py (add Dapr sidecar check, Kafka connectivity check)

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Automated Recurring Task Management (Priority: P1) 🎯 MVP

**Goal**: Users can create recurring tasks with RRULE patterns; completing an instance auto-generates the next one

**Independent Test**: Create a daily recurring task, complete it, verify next instance is auto-created with correct next_occurrence date

### Tests for User Story 1

- [x] T025 [P] [US1] Create unit tests for RRULE parser in phase-5-cloud-deployment/backend/tests/unit/test_rrule_parser.py (DAILY, WEEKLY, MONTHLY, YEARLY, custom BYDAY patterns, UTC-only, leap year edge cases)
- [x] T026 [P] [US1] Create unit tests for recurring service in phase-5-cloud-deployment/backend/tests/unit/test_recurring_service_v2.py (next occurrence calculation, end date handling, pattern validation)
- [x] T027 [P] [US1] Create integration tests for recurring task flow in phase-5-cloud-deployment/backend/tests/integration/test_recurring_flow.py (create recurring → complete → verify next instance created)

### Implementation for User Story 1

- [x] T028 [US1] Create RRULE parser service in phase-5-cloud-deployment/backend/src/services/rrule_parser.py (using python-dateutil, UTC-only per spec clarification, support DAILY/WEEKLY/MONTHLY/YEARLY plus BYDAY/BYHOUR)
- [x] T029 [US1] Create recurring task service in phase-5-cloud-deployment/backend/src/services/recurring_service_v2.py (calculate_next_occurrence, validate_pattern, should_generate_next per rrule-recurring-tasks skill)
- [x] T030 [US1] Update task service create method in phase-5-cloud-deployment/backend/src/services/task_service.py (validate recurring_pattern, calculate initial next_occurrence, set is_pattern=True for parent)
- [x] T031 [US1] Update task service complete method in phase-5-cloud-deployment/backend/src/services/task_service.py (check if recurring, call recurring_service to generate next instance, publish task.completed event)
- [x] T032 [US1] Update task schemas in phase-5-cloud-deployment/backend/src/schemas/task.py (add recurring_pattern, recurring_end_date, next_occurrence to TaskCreate and TaskResponse)
- [x] T033 [US1] Update tasks API endpoints in phase-5-cloud-deployment/backend/src/api/v1/tasks.py (handle recurring fields in create/update, return next_occurrence in responses)
- [x] T034 [US1] Create recurring-service microservice in phase-5-cloud-deployment/services/recurring-service/ (consumes task.completed events via Dapr, calculates next occurrence, publishes task.create_next command)
- [x] T035 [US1] Create recurring-service Dockerfile in phase-5-cloud-deployment/services/recurring-service/Dockerfile
- [x] T036 [US1] Create recurring-service Dapr subscription in phase-5-cloud-deployment/services/recurring-service/dapr/subscription.yaml (subscribe to task-events topic, filter task.completed)

**Checkpoint**: User Story 1 complete - recurring tasks work end-to-end

---

## Phase 4: User Story 2 - Timely Deadline Alerts and Reminders (Priority: P1)

**Goal**: Users can set alerts for tasks with due dates; alerts fire precisely at configured time via email (primary) and push (fallback)

**Independent Test**: Create task with due date and alert, wait for alert time, verify notification received

### Tests for User Story 2

- [x] T037 [P] [US2] Create unit tests for alert service in phase-5-cloud-deployment/backend/tests/unit/test_alert_service.py (schedule alert, cancel alert, multiple alerts per task)
- [x] T038 [P] [US2] Create unit tests for notification service in phase-5-cloud-deployment/backend/tests/unit/test_notification_service.py (email send, push fallback, retry logic)
- [x] T039 [P] [US2] Create integration tests for alert flow in phase-5-cloud-deployment/backend/tests/integration/test_alert_flow.py (create alert → job fires → notification sent)

### Implementation for User Story 2

- [x] T040 [US2] Create alert service in phase-5-cloud-deployment/backend/src/services/alert_service.py (create_alert, cancel_alert, schedule_job using Dapr Jobs API per dapr-integration skill)
- [x] T041 [US2] Create alert schemas in phase-5-cloud-deployment/backend/src/schemas/alert.py (AlertCreate, AlertResponse, AlertUpdate)
- [x] T042 [US2] Create alerts API endpoints in phase-5-cloud-deployment/backend/src/api/v1/alerts.py (POST /tasks/{task_id}/alerts, GET /tasks/{task_id}/alerts, DELETE /alerts/{alert_id})
- [x] T043 [US2] Create alert-service microservice in phase-5-cloud-deployment/services/alert-service/ (consumes task events, schedules/cancels Dapr Jobs, emits alert.fired on job trigger)
- [x] T044 [US2] Create alert-service job handler in phase-5-cloud-deployment/services/alert-service/src/job_handler.py (HTTP endpoint that Dapr Jobs API calls when job fires)
- [x] T045 [US2] Create alert-service Dockerfile in phase-5-cloud-deployment/services/alert-service/Dockerfile
- [x] T046 [US2] Create notification-service microservice in phase-5-cloud-deployment/services/notification-service/ (consumes alert.fired events, sends email primary/push fallback)
- [x] T047 [US2] Create email sender in phase-5-cloud-deployment/services/notification-service/src/email_sender.py (SMTP or SendGrid integration)
- [x] T048 [US2] Create push sender in phase-5-cloud-deployment/services/notification-service/src/push_sender.py (Web Push or Firebase FCM)
- [x] T049 [US2] Create notification-service Dockerfile in phase-5-cloud-deployment/services/notification-service/Dockerfile
- [x] T050 [US2] Update task service to cancel alerts on task completion/deletion in phase-5-cloud-deployment/backend/src/services/task_service.py

**Checkpoint**: User Story 2 complete - alerts and notifications work end-to-end

---

## Phase 5: User Story 3 - Message-Driven Task Event Processing (Priority: P2)

**Goal**: All task operations publish CloudEvents to Kafka; consumers process reliably with at-least-once + idempotency

**Independent Test**: Create/update/complete/delete tasks, verify all events published to Kafka and processed by consumers without duplicates

### Tests for User Story 3

- [x] T051 [P] [US3] Create unit tests for event publisher in phase-5-cloud-deployment/backend/tests/unit/test_event_publisher.py (CloudEvents format, all event types)
- [x] T052 [P] [US3] Create unit tests for idempotency service in phase-5-cloud-deployment/backend/tests/unit/test_idempotency.py (duplicate detection, TTL expiry)
- [x] T053 [P] [US3] Create integration tests for event flow in phase-5-cloud-deployment/backend/tests/integration/test_event_processing.py (publish → consume → no duplicates)
- [x] T054 [P] [US3] Create contract tests for event schemas in phase-5-cloud-deployment/backend/tests/contract/test_event_contracts.py (validate against contracts/events-contracts.md)

### Implementation for User Story 3

- [x] T055 [US3] Update task service to publish task.created event in phase-5-cloud-deployment/backend/src/services/task_service.py
- [x] T056 [US3] Update task service to publish task.updated event in phase-5-cloud-deployment/backend/src/services/task_service.py
- [x] T057 [US3] Update task service to publish task.deleted event in phase-5-cloud-deployment/backend/src/services/task_service.py
- [x] T058 [US3] Create audit-service microservice in phase-5-cloud-deployment/services/audit-service/ (consumes all task-events, writes to task_events table for long-term audit)
- [x] T059 [US3] Create audit-service consumer in phase-5-cloud-deployment/services/audit-service/src/consumer.py (Dapr subscription handler with idempotency check)
- [x] T060 [US3] Create audit-service Dockerfile in phase-5-cloud-deployment/services/audit-service/Dockerfile
- [x] T061 [US3] Implement exponential backoff retry in all consumers per kafka-event-driven skill (1s, 2s, 4s, 8s, 16s max)
- [x] T062 [US3] Create DLQ topic configuration in phase-5-cloud-deployment/dapr/components/pubsub-kafka.yaml (dlq-task-events, dlq-reminders, dlq-task-updates)
- [x] T063 [US3] Create websocket-service for real-time updates in phase-5-cloud-deployment/services/websocket-service/ (consumes task-updates, pushes to connected clients via SSE)
- [x] T064 [US3] Create websocket-service Dockerfile in phase-5-cloud-deployment/services/websocket-service/Dockerfile

**Checkpoint**: User Story 3 complete - event-driven architecture operational

---

## Phase 6: User Story 4 - Cloud Deployment Scalability (Priority: P3)

**Goal**: Deploy to Azure AKS with auto-scaling, monitoring, and CI/CD pipeline

**Independent Test**: Deploy to AKS, increase load 10x, verify auto-scaling and no degradation

### Tests for User Story 4

- [x] T065 [P] [US4] Create Terraform validation tests in phase-5-cloud-deployment/terraform/aks/test_plan.sh (terraform validate, terraform plan)
- [x] T066 [P] [US4] Create Helm chart lint tests in phase-5-cloud-deployment/helm/todo-app/test_lint.sh (helm lint)
- [x] T067 [P] [US4] Create smoke tests for deployed services in phase-5-cloud-deployment/tests/e2e/test_smoke.py (health checks, basic CRUD)

### Implementation for User Story 4

- [x] T068 [US4] Create Azure AKS Terraform main config in phase-5-cloud-deployment/terraform/aks/main.tf (resource group, AKS cluster with Standard tier, node pools per terraform-infrastructure skill)
- [x] T069 [US4] Create Azure AKS Terraform variables in phase-5-cloud-deployment/terraform/aks/variables.tf (location, node_count, vm_size, k8s_version)
- [x] T070 [US4] Create Azure AKS Terraform outputs in phase-5-cloud-deployment/terraform/aks/outputs.tf (kube_config, cluster_name, resource_group)
- [x] T071 [US4] Create Azure Container Registry Terraform in phase-5-cloud-deployment/terraform/aks/acr.tf (for container images)
- [x] T072 [US4] Update Helm chart values for AKS in phase-5-cloud-deployment/helm/todo-app/values-aks.yaml (image registry, ingress, TLS, resource limits)
- [x] T073 [US4] Create Helm chart for Dapr components in phase-5-cloud-deployment/helm/todo-app/templates/dapr-components.yaml
- [x] T074 [US4] Create HPA configs in phase-5-cloud-deployment/helm/todo-app/templates/hpa.yaml (backend, recurring-service, alert-service, notification-service)
- [x] T075 [US4] Create Ingress with TLS in phase-5-cloud-deployment/helm/todo-app/templates/ingress-aks.yaml (NGINX ingress controller, cert-manager)
- [x] T076 [US4] Create GitHub Actions CI workflow in phase-5-cloud-deployment/.github/workflows/ci.yml (lint, test, build images)
- [x] T077 [US4] Create GitHub Actions CD workflow for staging in phase-5-cloud-deployment/.github/workflows/cd-staging.yml (deploy on develop branch)
- [x] T078 [US4] Create GitHub Actions CD workflow for production in phase-5-cloud-deployment/.github/workflows/cd-production.yml (deploy on main branch with manual approval)
- [x] T079 [US4] Create Prometheus config in phase-5-cloud-deployment/monitoring/prometheus/prometheus.yaml (scrape configs for all services, Dapr metrics)
- [x] T080 [US4] Create Prometheus alert rules in phase-5-cloud-deployment/monitoring/prometheus/alerts.yaml (high error rate, high latency, consumer lag, pod crashes)
- [x] T081 [US4] Create Grafana dashboards in phase-5-cloud-deployment/monitoring/grafana/dashboards/ (RED metrics, Kafka lag, Dapr health, alert delivery)
- [x] T082 [US4] Create Alertmanager config in phase-5-cloud-deployment/monitoring/alertmanager/alertmanager.yaml (email/slack routing)
- [x] T083 [US4] Create Zipkin deployment in phase-5-cloud-deployment/monitoring/zipkin/deployment.yaml (distributed tracing)
- [x] T084 [US4] Create deployment script for AKS in phase-5-cloud-deployment/scripts/deploy-aks.sh (terraform apply, helm install, verify)
- [x] T085 [US4] Create rollback script in phase-5-cloud-deployment/scripts/rollback.sh (helm rollback with revision)

**Checkpoint**: User Story 4 complete - production-ready cloud deployment

---

## Phase 7: User Story 5 - Local Development Environment (Priority: P3)

**Goal**: Developers can run complete platform locally with Minikube, mimicking production

**Independent Test**: Run deploy-local.sh, verify all services accessible and recurring/alert features work

### Tests for User Story 5

- [x] T086 [P] [US5] Create local environment validation tests in phase-5-cloud-deployment/tests/local/test_local_env.py (all services healthy, Kafka topics exist, Dapr components ready)

### Implementation for User Story 5

- [x] T087 [US5] Create Minikube setup script in phase-5-cloud-deployment/scripts/setup-minikube.sh (start cluster, enable addons, install Dapr)
- [x] T088 [US5] Create local Kafka deployment in phase-5-cloud-deployment/helm/kafka/values-local.yaml (Redpanda single-node for simplicity)
- [x] T089 [US5] Create Kafka topics script in phase-5-cloud-deployment/scripts/create-kafka-topics.sh (task-events, reminders, task-updates with 12 partitions, 7-day retention)
- [x] T090 [US5] Create local Helm values in phase-5-cloud-deployment/helm/todo-app/values-local.yaml (reduced resources, no TLS, NodePort)
- [x] T091 [US5] Create Dapr local config in phase-5-cloud-deployment/dapr/config/config-local.yaml (mTLS disabled, debug logging)
- [x] T092 [US5] Create local deployment script in phase-5-cloud-deployment/scripts/deploy-local.sh (minikube setup, dapr init, kafka, helm install)
- [x] T093 [US5] Create docker-compose.yml alternative in phase-5-cloud-deployment/docker-compose.yml (for non-k8s local dev)
- [x] T094 [US5] Update phase-5-cloud-deployment/README-QUICKSTART.md with quickstart guide (prerequisites, setup steps, access URLs)
- [x] T095 [US5] Create .env.example files for all services in phase-5-cloud-deployment/

**Checkpoint**: User Story 5 complete - local development environment ready

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, security hardening

- [ ] T096 [P] Create comprehensive API documentation in phase-5-cloud-deployment/docs/api-reference.md
- [ ] T097 [P] Create architecture diagram in phase-5-cloud-deployment/docs/architecture.md (system context, event flows)
- [ ] T098 [P] Create troubleshooting guide in phase-5-cloud-deployment/docs/troubleshooting.md
- [ ] T099 [P] Create runbook for operations in phase-5-cloud-deployment/docs/runbook.md (deploy, rollback, scale, debug)
- [ ] T100 Add rate limiting to task endpoints in phase-5-cloud-deployment/backend/src/middleware/rate_limit.py
- [ ] T101 Add input sanitization for notification content in phase-5-cloud-deployment/services/notification-service/src/sanitizer.py
- [ ] T102 Create secret rotation documentation in phase-5-cloud-deployment/docs/secret-rotation.md
- [ ] T103 Run security scan on all Dockerfiles and fix issues
- [ ] T104 Verify all tests pass with 80%+ coverage
- [ ] T105 Run quickstart.md validation end-to-end
- [ ] T106 Create PHR record for Phase V implementation completion

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────────────────────────────────────────>
                 │
                 v
Phase 2 (Foundational) ──────────────────────────────────────────────────────────>
                         │
                         ├─────────────────────────────────────────────────────────>
                         │                │                │         │         │
                         v                v                v         v         v
                    Phase 3 (US1)   Phase 4 (US2)   Phase 5 (US3)  ...       ...
                    Recurring       Alerts          Events
                         │                │                │
                         └────────────────┴────────────────┴─────────────────────>
                                                                                 │
                                                                                 v
                                                                    Phase 8 (Polish)
```

### User Story Dependencies

- **US1 (Recurring Tasks)**: Depends on Phase 2 (Foundational) only
- **US2 (Alerts/Reminders)**: Depends on Phase 2; can run parallel to US1
- **US3 (Event Processing)**: Depends on Phase 2; integrates with US1/US2 but independently testable
- **US4 (Cloud Deployment)**: Depends on US1-US3 being implemented; can start Terraform/Helm in parallel
- **US5 (Local Dev)**: Can start after Phase 2; useful to have before US1-US3 for testing

### Suggested Execution Order (Serial)

1. Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7 (US5) → Phase 8

### Parallel Opportunities

**Within Phase 2 (Foundational)**:
- T012, T013, T014, T015 (Dapr components) can run in parallel
- T020, T021, T022 (Models) can run in parallel

**Within Phase 3 (US1)**:
- T025, T026, T027 (Tests) can run in parallel
- T028, T029 (Services) can run in parallel after tests written

**Across User Stories**:
- US1 and US2 can be developed in parallel by different team members
- US4 Terraform/Helm work can start while US1-US3 are in progress

---

## Implementation Strategy

### MVP Scope (Recommended First Delivery)

**Phase 1 + Phase 2 + Phase 3 (US1)** = Recurring Tasks Working

This delivers:
- Users can create recurring tasks with patterns
- Completing a task auto-generates the next instance
- Foundation for alerts and events in place

### Incremental Delivery

1. **MVP**: Recurring Tasks (US1)
2. **+Alerts**: Add US2 for deadline reminders
3. **+Events**: Add US3 for full event-driven architecture
4. **+Cloud**: Add US4 for production deployment
5. **+Polish**: Add US5 and Phase 8 for complete solution

---

## Task Summary

| Phase | Story | Task Count | Parallel Tasks |
|-------|-------|------------|----------------|
| Phase 1 | Setup | 8 | 6 |
| Phase 2 | Foundational | 16 | 8 |
| Phase 3 | US1 - Recurring | 12 | 3 |
| Phase 4 | US2 - Alerts | 14 | 3 |
| Phase 5 | US3 - Events | 14 | 4 |
| Phase 6 | US4 - Cloud | 21 | 3 |
| Phase 7 | US5 - Local | 10 | 1 |
| Phase 8 | Polish | 11 | 4 |
| **Total** | | **106** | **32** |

---

## Notes for Implementation

1. **Use Context7 MCP**: Before implementing any task, query Context7 for up-to-date patterns (Dapr, Kafka, FastAPI, etc.)
2. **Use Skills**: Reference the skills in CLAUDE.md (dapr-integration, kafka-event-driven, etc.) for implementation guidance
3. **Use Reference Code**: Check reference-phase-5/ for patterns but adapt to our spec requirements
4. **Test First**: Write tests before implementation where marked; ensure they fail first
5. **User Isolation**: All queries MUST filter by user_id (Constitution requirement)
6. **UTC Only**: All datetime calculations in UTC; frontend handles timezone display
7. **CloudEvents**: All events MUST follow CloudEvents 1.0 format per contracts/events-contracts.md
