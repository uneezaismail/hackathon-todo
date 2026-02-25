# Implementation Plan: 010-cloud-deployment (Phase V - Enterprise-Grade Cloud Infrastructure)

**Branch**: `010-cloud-deployment` | **Date**: 2026-01-12 | **Spec**: `specs/010-cloud-deployment/spec.md`
**Input**: Feature specification from `/specs/010-cloud-deployment/spec.md`

## 1. Executive Summary (Summary)

Phase V evolves the Todo platform into an **event-driven microservices architecture** with **Dapr 1.12+** and **Apache Kafka 3.x** to support:

- **Recurring tasks** (simplified RRULE support; UTC-only computation)
- **Deadline alerts/reminders** with precise scheduling (Dapr Jobs API; email primary + push fallback)
- **Reliable task-event processing** with at-least-once delivery + consumer idempotency
- **Cloud deployment** targeting **Azure AKS (primary)** with multi-cloud extensibility
- **Observability** via Prometheus + Grafana + Alertmanager; distributed tracing via Zipkin
- **CI/CD** via GitHub Actions with automated deploy + rollback patterns

The approach is to implement new Phase V services in `phase-5-cloud-deployment/` (copied from Phase IV) while keeping Phase V requirements and artifacts in `specs/010-cloud-deployment/`.

Key decision anchors (from `research.md`, `data-model.md`, `contracts/`):
- Event contracts use **CloudEvents 1.0** and Kafka topics (`task-events`, `task-updates`, `reminders`).
- Dapr Jobs API is used for exact-time alert firing; Cron binding is only for periodic jobs.
- PostgreSQL remains the system of record for tasks; Dapr State is used for idempotency/deduplication only.

## 2. Technical Landscape (Technical Context)

**Language/Version**: Python 3.13+ (services), TypeScript (Next.js 16 frontend)

**Primary Dependencies**:
- Backend: FastAPI, SQLModel, Alembic, Better Auth JWT validation
- Eventing: Dapr (Pub/Sub, Jobs API, Secrets, Service Invocation for *frontend → backend only*)
- Messaging: Kafka 3.x (local: Redpanda/Strimzi; cloud: managed Kafka)
- Observability: Prometheus, Grafana, Alertmanager, Zipkin

**Storage**:
- Primary: Neon Serverless PostgreSQL (tasks, recurring, alerts, audit)
- State store: Redis (local) or managed Redis (cloud) used for **event idempotency markers** / short-lived coordination state

**Testing**:
- Backend: pytest (unit + integration + contract)
- Event-driven: consumer tests (idempotency/retry/DLQ), Dapr component tests (pubsub/state/jobs)
- Frontend: Vitest + Playwright (existing patterns from Phase IV)

**Target Platform**:
- Local: Minikube + Helm
- Cloud: Azure AKS (primary), designed to extend to OKE/GKE

**Project Type**: Monorepo with per-phase folders (Phase V continues in `phase-5-cloud-deployment/`)

**Performance Goals** (from spec success criteria):
- 1,000 task ops/min; alert delivery within 1 minute of configured time; no message loss; scale to 10k concurrent users

**Constraints**:
- UTC-only recurrence scheduling (DST ignored)
- No hardcoded secrets; use K8s Secrets / Dapr secrets
- Event consumers must implement retries + DLQ + backoff

**Scale/Scope**:
- Multiple microservices + shared contracts; cloud-native observability and CI/CD

## 3. Constitution Alignment (Constitution Check)

*GATE: Must pass before implementation. Re-check after Phase 1 design changes.*

Validated against `.specify/memory/constitution.md` (v2.0.0):

- **Spec-first workflow**: spec.md exists, research/data-model/contracts exist, plan.md completed; next is `sp.tasks`.
- **Event-driven architecture (Phase V mandatory)**:
  - Kafka topics required by constitution are defined in `contracts/events-contracts.md`.
  - Consumers implement at-least-once + idempotency; DLQ topics planned.
- **Dapr integration (Phase V mandatory)**:
  - Use Dapr Pub/Sub abstraction; services do not use direct Kafka client libraries.
  - Use Dapr Jobs API for exact-time alert triggers.
- **User isolation**:
  - Every event includes `user_id` in payload; database queries filter by user.
- **No direct API calls between microservices**:
  - Internal workflows are modeled as **events/commands** on Kafka via Dapr Pub/Sub.
  - Frontend → Backend remains a normal public API (can optionally be routed via Dapr sidecar, but is not a microservice-to-microservice coupling).

## 4. Project Organization (Project Structure)

### Documentation (this feature)

```text
specs/010-cloud-deployment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api-contracts.md
│   └── events-contracts.md
└── tasks.md            # created by /sp.tasks
```

### Source Code (repository root)

```text
phase-5-cloud-deployment/
├── backend/                 # FastAPI + SQLModel (publishes events)
├── frontend/                # Next.js 16 + Better Auth + ChatKit
├── services/
│   ├── recurring-service/   # consumes task.completed; emits task.create-next command
│   ├── alert-service/       # consumes task events; schedules/cancels Jobs
│   ├── notification-service/# consumes alert.fired; sends email/push; emits notification.* events
│   ├── audit-service/       # consumes task-events; writes audit log
│   └── websocket-service/   # consumes task-updates; pushes SSE/WS to clients
├── dapr/                    # Dapr components (pubsub, state, secretstore)
├── helm/                    # Helm charts + values (local + cloud overrides)
└── terraform/               # AKS (and future OKE/GKE) infrastructure-as-code

reference-phase-5/           # reference implementation (read-only guidance)
phase-4-k8s-deployment/      # previous phase baseline
```

**Structure Decision**: We keep Phase V implementation isolated in `phase-5-cloud-deployment/` to match the "each phase in separate folder" rule. Specs remain centralized under `specs/010-cloud-deployment/`.

## 5. Phase 0: Technical Investigation (trace to research.md)

Primary outcomes captured in `specs/010-cloud-deployment/research.md`:

- **Dapr building blocks**: Pub/Sub, State, Jobs API, Secrets, Service Invocation
- **Kafka design**:
  - Partitioning: `task-events` partition by `user_id` (ordering per user)
  - Retention: 7d local, 30d cloud
  - Consumer groups per service
- **AKS strategy**: AKS primary; cluster autoscaler; node pool separation
- **RRULE**: python-dateutil with UTC-only calculations
- **Observability**: Prometheus/Grafana + Zipkin; logs via Azure Monitor or Loki
- **CI/CD**: GitHub Actions; main→prod, develop→staging; rollback on failed deploy

Plan refinements based on Context7 findings:
- **Dapr Jobs API vs cron binding**:
  - Jobs API supports **per-entity scheduling** (create/cancel/update job by name) and **one-shot dueTime**.
  - Cron binding is **component-configured periodic scheduling** (good for “run every 15m”, not for "fire at 2026-01-20T08:00Z").
- **AKS reliability best practices**:
  - Prefer Standard tier for production, use autoscaling, avoid B-series VMs for production, use availability zones when possible.
- **Prometheus architecture**:
  - Prometheus scrapes targets; rules generate alerts; Alertmanager handles routing.

## 6. Phase 1: Data Model and Contracts

Source of truth:
- `data-model.md` defines Task/RecurringTask/TaskInstance/Alert/TaskEvent/AlertSchedule.
- `contracts/api-contracts.md` defines public + internal API shapes.
- `contracts/events-contracts.md` defines CloudEvents 1.0 schemas and topic configuration.

### Database migration plan (Phase IV → Phase V)
- Add recurrence fields to existing tasks table (as needed)
- Add new tables:
  - recurring_tasks
  - task_instances
  - alerts
  - alert_schedules (tracks job scheduling metadata)
  - task_events (optional: if keeping an audit table separate from Kafka retention)

### Event contract plan
- All task lifecycle changes publish CloudEvents to Kafka via Dapr Pub/Sub.
- Add DLQ topics per constitution (example naming):
  - `task-events.dlq`
  - `task-updates.dlq`
  - `reminders.dlq`

## 7. Architecture Overview

### System context (high level)

- Users interact with Next.js frontend.
- Frontend calls Backend API (FastAPI) for task operations.
- Backend publishes CloudEvents via Dapr Pub/Sub.
- Event consumers implement recurring tasks, alerts, notifications, audit, and realtime sync.

### Core services and responsibilities

1. **Backend Service (FastAPI)**
   - Auth (JWT validation) + task CRUD
   - Emits events: `task.created`, `task.updated`, `task.completed`, `task.deleted` and `task-updates`
   - Consumes internal commands (event-driven) such as `task.create_next_instance` (to avoid microservice invocation)

2. **Recurring Service**
   - Consumes `task.completed`
   - Calculates next occurrence (python-dateutil; UTC-only)
   - Emits command event to create next instance (handled by backend)

3. **Alert Service**
   - Consumes task events to create/cancel alerts
   - Schedules per-alert jobs using Dapr Jobs API (job name includes alert_id)
   - On job fire, emits `alert.fired` event

4. **Notification Service**
   - Consumes `alert.fired`
   - Sends email (primary); if email fails then attempts push (fallback)
   - Emits `notification.sent` / `notification.failed`

5. **Audit Service**
   - Consumes task events
   - Writes audit record(s) to Postgres for long-term audit beyond Kafka retention

6. **WebSocket/SSE Service**
   - Consumes `task-updates` (or also task-events)
   - Pushes to connected clients for realtime task list updates

### Event flow (example)

- Task completion:
  1) Frontend → Backend: mark complete
  2) Backend publishes `task.completed` (CloudEvents)
  3) Recurring Service consumes → computes next occurrence → emits `task.create_next_instance`
  4) Backend consumes command → creates new Task row → publishes `task.created`
  5) WebSocket Service consumes task updates → pushes to clients

## 8. Deployment Methodology

### Part B: Local (Minikube)
- Helm installs:
  - Dapr control plane (mTLS disabled for local)
  - Kafka: Redpanda (simple) or Strimzi (operator)
  - Redis state store (for idempotency keys)
  - Application services + Dapr sidecars
  - Observability stack (optional but recommended)

Local Kafka retention: 7 days (topic config)

### Part C: Cloud (AKS via Terraform + Helm)

**AKS cluster design (high level)**
- Separate node pools:
  - system node pool (AKS-managed add-ons)
  - workload node pool(s) for app services
- Enable cluster autoscaler and HPA.
- Use Standard tier for production clusters.

**Kafka in cloud**
- Preferred: managed Kafka (Confluent Cloud or Redpanda Cloud)
- Alternative: self-hosted Kafka via Strimzi (higher ops burden)

**Ingress + TLS**
- Use Ingress controller (NGINX or AGIC); enforce HTTPS; cert-manager recommended.

## 9. Observability and Monitoring

### Metrics
- Prometheus scrapes:
  - backend and services `/metrics`
  - Dapr metrics endpoint(s)
  - Kafka metrics exporter (or managed service metrics integration)
- Grafana dashboards:
  - RED metrics: rate, errors, duration
  - Kafka consumer lag
  - Dapr component health
  - Alert delivery success/failure

### Alerting
- Prometheus alert rules + Alertmanager routing:
  - High error rate (>5%)
  - p95 latency > 1s
  - Consumer lag > 1000
  - Pod crash loops

### Tracing
- Zipkin selected for distributed tracing due to simpler operational footprint.

### Logging
- AKS baseline: Azure Monitor / Container Insights.
- Optional: Loki stack (especially if keeping Grafana as single pane of glass).

## 10. Security Framework

- **External auth**: Better Auth JWT (frontend → backend)
- **Internal service auth**:
  - Dapr mTLS for service identity and encryption-in-transit
  - Events include `user_id` for authorization checks

- **Secrets management**:
  - Kubernetes Secrets for local
  - Azure Key Vault integration for cloud (mounted or synced as Kubernetes secrets)

- **Network policies**:
  - Restrict cross-namespace access
  - Only expose ingress to frontend/backend public endpoints

- **Data security**:
  - Encrypt sensitive data at rest (DB-level + provider-managed)
  - Sanitize notification content (SR-003)

## 11. Development Phases (8 phases; ordered, no time estimates)

1. Database Migration
2. Event Schemas + DLQ Topics
3. RRULE Parsing + Validation Rules
4. Recurring Service Implementation
5. Notification Service Implementation
6. Alert Service + Dapr Jobs Scheduling
7. Local Deployment (Minikube/Helm) + E2E tests
8. Cloud Deployment (AKS/Terraform + CI/CD)

## 12. Risk Management (Top 5)

| Risk | Impact | Mitigation |
|------|--------|------------|
| Duplicate processing causing double task instances / duplicate notifications | High | Consumer idempotency keys in state store; unique constraints in DB; strict event IDs |
| Mis-scheduled alerts due to timezone handling | High | UTC-only; RFC3339 `Z` timestamps; ensure scheduler nodes use UTC; integration tests |
| Kafka operational complexity (self-hosted) | Medium/High | Prefer managed Kafka in cloud; keep Strimzi as fallback |
| Dapr component misconfiguration / sidecar injection failures | Medium | Helm-tested annotations; readiness probes; install validation checks |
| CI/CD deploy failures causing downtime | High | Blue/green or canary; health-gated rollout; `helm rollback` automation |

## 13. Quality Assurance Strategy

- Unit tests:
  - RRULE parsing edge cases (leap year, month-end)
  - Idempotency and dedup logic
  - Alert cancellation logic

- Integration tests:
  - Backend publishes correct CloudEvents
  - Consumers process events and write expected DB changes
  - Dapr component tests (pubsub/state/jobs)

- Contract tests:
  - OpenAPI schema checks
  - Event schema validation against `events-contracts.md`

- E2E tests:
  - Create recurring task → complete → next instance appears
  - Create due date alerts → verify `alert.fired` and notification sent

- Coverage:
  - Target 80%+ for Phase V service layers (as requested)

## 14. Rollback Methodology

- **Application rollback**:
  - Helm revision rollback (`helm rollback`) when readiness checks fail or error budgets exceeded
  - Canary rollout: only increase replicas after metrics stable

- **Database rollback**:
  - Alembic down migrations where safe
  - Pre-deploy DB backup (or PITR on managed DB)

- **Kafka rollback**:
  - Schema evolution is versioned (`event_version`), avoid breaking changes
  - If consumer broken: rollback consumer deployment while producers keep backward compatible schema

- **Dapr component rollback**:
  - Version Dapr component YAML and Helm values
  - Re-apply last-known-good component manifests

## 15. Success Metrics Validation

Map spec success criteria to validation points:

- **SC-003** (next instance within 10s): integration test + consumer latency SLO metric
- **SC-004** (alert within 1m): Jobs API scheduling + alert fired time vs expected
- **SC-005** (99.9% reliability): no message loss; DLQ monitoring; consumer retry metrics
- **SC-006** (1,000 ops/min): load test + Kafka lag < threshold
- **SC-009** (local start under 5m): Minikube deploy script + readiness gate
- **SC-010** (cloud deploy under 15m): CI/CD pipeline runtime tracking + rollback if exceeded

## 16. Supplementary Materials

### Glossary
- **CloudEvents**: Standard event envelope format (v1.0)
- **DLQ**: Dead Letter Queue/topic for messages that cannot be processed after retries
- **HPA**: Horizontal Pod Autoscaler

### Related documents
- `specs/010-cloud-deployment/spec.md`
- `specs/010-cloud-deployment/research.md`
- `specs/010-cloud-deployment/data-model.md`
- `specs/010-cloud-deployment/contracts/api-contracts.md`
- `specs/010-cloud-deployment/contracts/events-contracts.md`

## Complexity Tracking

> No constitutional violations are required by this plan.
> Primary complexity driver is multi-service event-driven architecture, which is explicitly mandated by Phase V constitution sections XIX–XXII.
