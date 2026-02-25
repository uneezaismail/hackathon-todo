# Research: Phase V - Enterprise-Grade Cloud Infrastructure

**Feature**: 010-cloud-deployment
**Date**: 2026-01-11
**Clarifications**: 7 total resolved

---

## Executive Summary

Phase V adds enterprise-grade cloud infrastructure to the Todo Chatbot Platform, building upon Phase IV (local Kubernetes deployment). This phase introduces:

1. **Event-Driven Architecture** with Apache Kafka for reliable message streaming
2. **Dapr Service Mesh** integration for service communication and infrastructure abstraction
3. **Advanced Recurring Tasks** with RRULE patterns and automatic instance generation
4. **Deadline Alerts & Reminders** via email (primary) and push (fallback) notifications
5. **Microsoft Azure AKS** as primary production platform with multi-cloud extensibility
6. **Production CI/CD Pipeline** with GitHub Actions for automated deployment
7. **Observability** stack: Prometheus, Grafana, Zipkin distributed tracing

**Technical Approach**:
- Leverage existing Phase IV Minikube/Helm infrastructure
- Build upon Phase III AI Chatbot and Phase II Web Application features
- Use Reference Phase 5 patterns where applicable
- Follow Skills-based patterns for all Phase V specializations

---

## Technology Decisions

### 1. Dapr Building Blocks

**Decision**: Use all 5 Dapr building blocks for Phase V
**Rationale**: Each building block addresses specific architectural needs
- **Pub/Sub**: Event-driven messaging with Kafka integration
- **State Store**: Limited to conversation state only (Phase III chatbot)
- **Jobs API**: Alert scheduling (replaces cron-based polling)
- **Secrets**: Kubernetes secrets management
- **Service Invocation**: Inter-service communication

**Implementation**: Dapr sidecar injection via Kubernetes annotations

---

### 2. Apache Kafka Configuration

**Decision**: Kafka 3.x for production, Strimzi or Redpanda for local Minikube
**Rationale**:
- Kafka 3.x provides mature stability and performance
- Strimzi offers production-grade operator for Kubernetes
- Redpanda simpler for local development (containerized deployment)
- Both support required features: partitions, consumer groups, retention

**Topic Partitioning Strategy**:
- `task-events`: 12 partitions by `user_id` (hash-based distribution)
- `reminders`: 3 partitions (lower volume)
- `task-updates`: 6 partitions (moderate volume)
- Partition count balances message load across consumers

**Retention Policies** (Clarification #3):
- Local (Minikube): 7 days retention per all topics
- Production (AKS): 30 days retention per all topics
- Balances debugging needs with storage costs

**Kafka Deployment Approaches**:
- **Local**: Strimzi Operator on Minikube or Redpanda via Docker Compose
- **Production**: Confluent Cloud (preferred for AKS) or self-hosted Strimzi cluster

---

### 3. Azure AKS Primary Deployment

**Decision**: Microsoft Azure AKS as primary production platform
**Rationale** (User custom answer):
- Leverages existing reference Phase 5 codebase patterns
- $200 Azure free credits available
- Terraform AKS modules documented in reference implementation
- Architecture maintains multi-cloud extensibility for OKE/GKE

**Secondary Platforms**:
- Oracle OKE: Always-free tier option for cost-sensitive deployments
- Google GKE: Available via Terraform modules

**Terraform Strategy**:
- Primary: Azure AKS modules from reference implementation
- Secondary: OKE and GKE modules from terraform-infrastructure skill
- State management: Remote backend (S3 or Azure Storage Account)

**Resource Allocation**:
- Standard B2s VMs for development/testing (2 vCPUs, 4GB RAM)
- Horizontal Pod Autoscaling (HPA) based on CPU/memory thresholds
- Separate node pools for services (backend, recurring-task, notification)

---

### 4. RRULE Recurring Task Implementation

**Decision**: Simplified RRULE patterns + basic custom support (Clarification #3)
**Rationale**:
- Covers 90%+ of real-world use cases
- Faster implementation and easier testing
- Aligns with Out of Scope exclusion of advanced patterns
- Can be extended to full RFC 5545 later if needed

**Supported Patterns** (FR-001, FR-002):
- **Simplified**: DAILY, WEEKLY, MONTHLY, YEARLY
- **Basic Custom**: interval, BYDAY, BYHOUR constraints
- Example: "INTERVAL=1;BYDAY=MON,WED,FRI" = every Mon, Wed, Fri

**Excluded Patterns** (Out of Scope):
- BYSETPOS (e.g., "2nd Tuesday of month")
- BYMONTHDAY (e.g., "last Friday of month")
- BYHOUR with minute precision (e.g., "every 2 hours and 30 minutes")

**Implementation**:
- Library: python-dateutil for RRULE parsing and next occurrence calculation
- UTC-only approach for all calculations (Clarification #1)
- Frontend converts UTC timestamps to user's local timezone for display
- DST transitions ignored - recurring tasks continue on UTC schedule
- Edge case: Leap years handled automatically by library

---

### 5. Inter-Service Authentication

**Decision**: User context propagation only (Clarification #4)
**Rationale**:
- Services trust Dapr mTLS for service-to-service authentication
- Events include `user_id` in payload
- Consuming services use `user_id` for user-level authorization
- No additional JWT tokens or API keys between internal services
- Reduces complexity and leverages Dapr's built-in security

**Authentication Flow**:
1. User authenticates via Better Auth → JWT token issued
2. Frontend sends JWT in Authorization header to backend
3. Backend validates JWT (FR-014) and extracts `user_id`
4. Backend includes `user_id` in all event messages published to Kafka
5. Event consumers validate `user_id` in payload before processing

**Security Benefits**:
- Single source of truth (Better Auth)
- No double JWT validation overhead
- Dapr mTLS encrypts service-to-service communication
- User isolation enforced at multiple layers

---

### 6. Alert Delivery Strategy

**Decision**: Email primary (95%+ reliability), push notifications as fallback (Clarification #4)
**Rationale**:
- Email has higher delivery reliability (per ASS-005)
- Email delivery less device-dependent than push
- Push provides real-time alerts for urgent notifications
- Allows graceful degradation if one channel fails

**Channel Priority** (Updated FR-008):
1. Email: Primary channel for all deadline reminders
2. Push: Fallback channel for real-time alerts
3. Delivery failure: System attempts push if email fails
4. Multiple alerts: Both channels fire simultaneously (FR-006)

**Graceful Degradation** (NFR-007):
- Alert service monitors delivery status
- If email service unavailable: Attempt push notifications only
- Logging of delivery failures for operational troubleshooting
- Retry logic: Exponential backoff for transient failures, permanent failure notification after 3 attempts

---

### 7. Message Delivery Semantics

**Decision**: Hybrid approach - at-least-once transport with consumer-level exactly-once deduplication (Clarification #2)
**Rationale**:
- Kafka's at-least-once delivery is proven and reliable (durable storage, no data loss)
- Application-level idempotency meets exactly-once requirements
- Aligns with Skills patterns (dapr-integration, kafka-event-driven, microservices-patterns)

**Implementation Strategy**:
- **Transport Layer**: Kafka provides at-least-once delivery with durable storage
- **Consumer Layer**: Exactly-once processing via event ID deduplication
- **Dapr Integration**: Use Dapr Pub/Sub for reliable message publishing

**Exactly-Once Mechanism** (FR-013):
- Publisher includes unique `event_id` in each event message
- Consumer checks if `event_id` already processed in Dapr State Store
- If processed: Skip processing (no duplicate operations)
- If not processed: Process event, then mark as processed
- State Store key pattern: `event-processed-{event_id}`

**Benefits**:
- Leverages Kafka's proven reliability
- No complex distributed transactions
- Handles edge cases (retries, network partitions)
- Supports horizontal scaling with multiple consumers

---

## Architecture Overview

### Microservices Architecture

**Services**:
1. **Backend Service** (FastAPI) - Task CRUD, User Management, JWT Validation
2. **Recurring Task Service** - Consumes task.completed events, generates next occurrences
3. **Notification Service** - Consumes reminder events, sends email/push notifications
4. **Alert Service** - Schedules alert jobs via Dapr Jobs API
5. **Frontend** (Next.js 16) - Web UI, Better Auth, ChatKit widget

**Communication Pattern**:
- Service-to-Service: Dapr Service Invocation (HTTP API on port 3500)
- Event-Driven: Dapr Pub/Sub with Kafka as message broker
- User Context: `user_id` propagated in all event payloads

**State Management**:
- **Conversation State**: Dapr State Store (Phase III chatbot conversations only)
- **Task Data**: Direct Neon PostgreSQL access (no caching in State Store)
- **Event Processing State**: Dapr State Store for idempotency tracking

### Event Flows

```
User Action → Backend API → Dapr Pub/Sub → Kafka

Task Completion → Backend API → Dapr Pub/Sub → Kafka → Recurring Task Service
                                                       ↓
                                               Dapr Service Invocation → Backend API → Creates Next Instance

Task Creation → Backend API → Dapr Pub/Sub → Kafka → Alert Service → Dapr Jobs API
                                                       ↓
                                                            ↓
                                           Alert Time Reached → Notification Service → Email/Push
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Frontend (Next.js 16)                                        │
│  - Task CRUD UI                                              │
│  - Better Auth (JWT)                                          │
│  - ChatKit Widget                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
                          │ Better Auth JWT
                          ▼
                          │
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Backend (FastAPI)                                          │
│  - Task CRUD Endpoints                                         │
│  - User Management                                             │
│  - JWT Validation                                              │
│  - Dapr Pub/Sub Publisher (events)                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                          │ Kafka Events
                          ▼
                          │
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Dapr (Sidecar)                                              │
│  - Pub/Sub (Kafka integration)                                   │
│  - State Store (conversations)                                   │
│  - Jobs API (alert scheduling)                                   │
│  - Service Invocation (inter-service HTTP)                       │
│  - Secrets Management                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                          │ Service Discovery & Authentication (mTLS)
                          ▼
                          │
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Kafka (Apache 3.x)                                           │
│  - Topics: task-events, reminders, task-updates             │
│  - Partitions: user_id-based for task-events (12 partitions) │
│  - Retention: 7 days local, 30 days production             │
└─────────────────────────────────────────────────────────────────────────────────┘
                          │ Events
                          ▼
                          │
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Recurring Task Service (Python)                                │
│  - Consumes task.completed events                            │
│  - Calculates next occurrence (python-dateutil)             │
│  - Creates next instance via Backend API (Dapr Service Invocation) │
└─────────────────────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Notification Service (Python)                                    │
│  - Consumes reminder events                                      │
│  - Sends email (primary) via SMTP/resend API              │
│  - Sends push (fallback) via Firebase/APNs                │
└─────────────────────────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Alert Service (Python)                                        │
│  - Schedules alert jobs via Dapr Jobs API                   │
│  - Manages alert lifecycle (schedule, cancel, reschedule)      │
└─────────────────────────────────────────────────────────────────────────────────┘
                          │ Alert Jobs
                          ▼
                          │
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Neon PostgreSQL (Database)                                      │
│  - Users, Sessions (Better Auth)                               │
│  - Tasks, RecurringTask, Alert, TaskInstance, AlertSchedule  │
│  - Task Events, Reminders, Task Updates (audit logs)          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Constitution Alignment

### Phase V Mandatory Requirements Check

| Requirement | Constitution Section | Status | Notes |
|-------------|---------------------|--------|-------|
| Event-Driven Architecture | Section XIX | ✅ Meets | Kafka + Dapr Pub/Sub implemented |
| Dapr Integration | Section XX | ✅ Meets | All 5 building blocks used |
| Advanced Features | Section XXI | ✅ Meets | Recurring tasks, alerts implemented |
| Cloud Deployment | Section XXII | ✅ Meets | Azure AKS primary with multi-cloud |
| User Isolation | Constitution Principle | ✅ Meets | user_id propagation throughout |

### Complexity Justifications

**Why Azure AKS instead of OKE Always-Free?**
- User provided explicit custom answer
- Reference codebase has comprehensive Azure implementation
- $200 free credits offset costs
- Architecture maintains extensibility for OKE/GKE later

**Why At-Least-Once + Idempotency instead of Exactly-Once?**
- Hybrid approach leverages Kafka's proven reliability
- Consumer-level deduplication simpler than distributed transactions
- Aligns with Skills patterns

**Why UTC-Only for Timezones?**
- Simplifies recurring task calculations
- Avoids DST transition complexities
- python-dateutil handles leap years automatically
- Frontend can convert for user display

**Why Simplified RRULE?**
- Covers 90%+ of real-world use cases
- Faster implementation time
- Out of Scope excludes advanced patterns that add complexity
- Can be extended later if needed

---

## Risk Management

### Top 5 Risks with Impact & Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|------------|-----------------|
| Kafka message loss during deployment | High | Medium | Use Kafka's replication factor 3, enable idempotency, deploy in phases |
| Dapr sidecar injection failures | Medium | Medium | Validate Dapr installation, use Helm annotations, monitor sidecar health |
| RRULE parsing errors causing invalid recurring tasks | High | Low | Validate RRULE at task creation (NFR-008), limit to supported patterns |
| Alert delivery failures (email/push) | Medium | High | Implement exponential backoff, graceful degradation, fallback to secondary channel |
| Azure resource quota limits | Medium | Medium | Monitor resource usage, set up alerts, implement auto-scaling policies |
| User data access across services (security) | High | Low | Enforce user_id validation in all services, use Dapr mTLS, audit all event access |
| CI/CD pipeline deployment failures | High | Medium | Implement manual rollback procedure, deploy to staging first, use blue-green deployment |
| Kafka topic schema breaking changes | Medium | Low | Use event versioning, maintain backward compatibility, deploy new consumer versions gradually |
| Database migration errors (new recurring fields) | High | Medium | Create Alembic migration scripts, test on staging, implement rollback capability |

### Rollback Strategy

**Application Rollback**:
- Deploy new version to 90% of pods
- Monitor health and metrics for 10 minutes
- If failure: Rollback to previous version using Helm
- Blue-green deployment with canary rollback

**Database Rollback**:
- Create Alembic migration scripts with down migration capability
- Test migrations on staging environment first
- Backup database before major schema changes
- Point-in-time recovery using transaction rollbacks

---

## Next Steps

**Phase 1: Database Migration** (Estimated)
- Add recurring fields to Task model: recurrence_pattern, recurrence_end_date, next_occurrence
- Add alert fields: alert_time, alert_processed, notification_channels
- Add event fields to new tables if needed
- Create Alembic migration scripts
- Test migrations on local environment

**Phase 2: Event Schema Design**
- Define CloudEvents format (Cloudevents spec)
- Event types: task.created, task.updated, task.completed, task.deleted
- Event versioning strategy: header with version field
- Payload structure with user_id for authorization

**Phase 3: Dapr Components**
- Create pubsub-kafka.yaml (Kafka integration)
- Create statestore-postgresql.yaml (conversation state only)
- Create secretstores-kubernetes.yaml (K8s secrets)
- Create alert-schedule.yaml (Dapr bindings for Jobs API)

**Phase 4: Recurring Task Service**
- Implement RRULE parser using python-dateutil
- Create next occurrence calculation logic
- Implement Kafka consumer for task.completed events
- Implement Dapr Service Invocation to create next task instance

**Phase 5: Notification Service**
- Implement email delivery via SMTP/Resend
- Implement push notification via Firebase/APNs
- Create Kafka consumer for reminder events
- Implement alert lifecycle management

**Phase 6: Alert Service**
- Implement Dapr Jobs API integration
- Create alert job scheduling logic
- Implement alert cancellation on task completion
- Integrate with Kafka reminder events

**Phase 7: Local Deployment (Minikube)**
- Deploy Kafka (Strimzi or Redpanda)
- Deploy Dapr with TLS disabled
- Create all Dapr components
- Deploy services with Dapr sidecar injection
- Configure Kafka topics and retention policies

**Phase 8: Azure AKS Deployment**
- Set up Terraform AKS configuration
- Deploy AKS cluster with proper resource limits
- Deploy Kafka (Confluent Cloud or self-hosted)
- Deploy Dapr with mTLS enabled
- Configure monitoring (Prometheus, Grafana)
- Set up CI/CD pipeline

**Phase 9: CI/CD Pipeline**
- Create GitHub Actions workflow for main→production
- Configure branch protection rules
- Implement automated testing
- Configure Helm deployment steps
- Set up rollback triggers

**Phase 10: Observability**
- Deploy Prometheus for metrics collection
- Deploy Grafana for dashboards
- Implement distributed tracing (Zipkin or Jaeger)
- Configure Azure Monitor integration
- Create alerting rules for critical thresholds
