# Phase V - Enterprise-Grade Cloud Deployment

## Project Overview
This is the **Phase V** evolution of the Todo application - an enterprise-grade cloud deployment featuring event-driven microservices architecture with Dapr, Kafka, and Kubernetes on Azure AKS.

**Current Phase:** Phase V (Advanced Cloud Deployment)

## Core Principles
1. **Event-Driven Architecture:** Services communicate via Kafka events through Dapr Pub/Sub
2. **Microservices:** Loosely coupled services with single responsibility
3. **User Isolation:** All operations scoped to user_id (CRITICAL)
4. **UTC-Only Timestamps:** All datetime values in UTC timezone
5. **Idempotency:** All event consumers are idempotent using event_id keys
6. **CloudEvents 1.0:** All events follow CloudEvents specification

## Technology Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 16 (App Router), Tailwind CSS, Shadcn UI, Better Auth, OpenAI ChatKit |
| **Backend** | Python 3.13+, FastAPI, SQLModel, Alembic, UV, OpenAI Agents SDK |
| **AI/LLM** | Multi-provider support (OpenAI, Gemini, Groq, OpenRouter) |
| **Database** | Neon Serverless PostgreSQL |
| **Auth** | Better Auth (Frontend) + JWT Shared Secret (Backend Verification) |
| **Event Bus** | Apache Kafka via Dapr Pub/Sub |
| **State Store** | Redis via Dapr State Store (for idempotency) |
| **Orchestration** | Kubernetes (Azure AKS) |
| **Service Mesh** | Dapr 1.12+ (Pub/Sub, State Store, Jobs API, Secrets, Service Invocation) |
| **IaC** | Terraform |
| **Monitoring** | Prometheus, Grafana, Zipkin |

## Project Structure
```text
phase-5-cloud-deployment/
├── frontend/                    # Next.js 16 Web App (unchanged from Phase IV)
├── backend/                     # FastAPI Backend Service
│   ├── src/
│   │   ├── api/v1/             # REST endpoints + metrics + health
│   │   ├── auth/               # JWT validation
│   │   ├── db/                 # Database sessions
│   │   ├── events/             # Event schemas, publisher, idempotency
│   │   ├── models/             # SQLModel entities (Task, Alert, TaskEvent)
│   │   ├── schemas/            # Pydantic schemas
│   │   └── services/           # Business logic
│   ├── alembic/                # Database migrations
│   └── tests/                  # Pytest suite
├── services/                    # Phase V Microservices
│   ├── recurring-service/      # Handles recurring task logic
│   ├── alert-service/          # Alert scheduling and management
│   ├── notification-service/   # Notification delivery
│   ├── audit-service/          # Event auditing and logging
│   └── websocket-service/      # Real-time WebSocket gateway
├── dapr/                        # Dapr Configuration
│   ├── components/             # Dapr component YAMLs
│   │   ├── pubsub-kafka.yaml
│   │   ├── statestore-redis.yaml
│   │   ├── secretstore-kubernetes.yaml
│   │   └── jobs-scheduler.yaml
│   └── config/                 # Dapr runtime configuration
├── terraform/                   # Infrastructure as Code
│   └── aks/                    # Azure AKS provisioning
├── monitoring/                  # Observability Stack
│   ├── prometheus/
│   ├── grafana/
│   ├── alertmanager/
│   └── zipkin/
├── helm/                        # Helm charts
│   └── todo-app/
├── .github/workflows/           # CI/CD pipelines
└── CLAUDE.md                    # This file
```

## Phase V Architecture

### Event-Driven Flow
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Backend    │────▶│   Dapr      │────▶│   Kafka     │
│  Service    │     │  Sidecar    │     │   Topics    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
           ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
           │  Recurring    │          │    Alert      │          │    Audit      │
           │   Service     │          │   Service     │          │   Service     │
           └───────────────┘          └───────────────┘          └───────────────┘
```

### Dapr Building Blocks
1. **Pub/Sub (Kafka):** Event-driven communication between services
2. **State Store (Redis):** Idempotency key storage for event deduplication
3. **Jobs API:** Scheduled alert/reminder execution
4. **Secrets:** Kubernetes secrets for credentials
5. **Service Invocation:** mTLS service-to-service calls

## Skills Reference

**MUST use these skills for Phase V implementation:**

| Skill | Purpose | Location |
|-------|---------|----------|
| `dapr-integration` | Dapr 1.12+ patterns (Pub/Sub, State, Jobs, Secrets, Service Invocation) | `.claude/skills/dapr-integration/` |
| `kafka-event-driven` | Kafka event schemas, DLQ, idempotency patterns | `.claude/skills/kafka-event-driven/` |
| `microservices-patterns` | Service design, user isolation, retry patterns | `.claude/skills/microservices-patterns/` |
| `kubernetes-helm-deployment` | Helm charts, Dapr sidecar injection | `.claude/skills/kubernetes-helm-deployment/` |
| `terraform-infrastructure` | AKS provisioning, network configuration | `.claude/skills/terraform-infrastructure/` |
| `rrule-recurring-tasks` | RRULE parsing, next occurrence calculation | `.claude/skills/rrule-recurring-tasks/` |

## Event Topics

| Topic | Publisher | Consumers | Description |
|-------|-----------|-----------|-------------|
| `task-events` | Backend | Recurring, Audit | Task CRUD events |
| `alert-events` | Alert Service | Notification, Audit | Alert lifecycle events |
| `reminders` | Dapr Jobs | Alert Service | Scheduled reminder triggers |

## Key Commands

| Context | Command | Description |
| :--- | :--- | :--- |
| **Backend** | `cd backend && uv sync` | Install backend deps |
| **Backend** | `uv run uvicorn src.main:app --reload --port 8000` | Start FastAPI |
| **Frontend** | `cd frontend && npm install && npm run dev` | Start Next.js |
| **Database** | `uv run alembic upgrade head` | Apply migrations |
| **Dapr** | `dapr run --app-id backend --app-port 8000 -- uvicorn src.main:app` | Run with Dapr |
| **Docker** | `docker-compose up --build` | Build and start all |
| **Tests** | `cd backend && uv run pytest` | Run backend tests |
| **Helm** | `helm install todo-app ./helm/todo-app` | Deploy to K8s |
| **Terraform** | `cd terraform/aks && terraform apply` | Provision AKS |

## Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://...              # Neon connection string
BETTER_AUTH_SECRET=your-secret-key         # MUST match frontend
CORS_ORIGINS=http://localhost:3000
LLM_PROVIDER=openai                        # openai | gemini | groq | openrouter
OPENAI_API_KEY=sk-...

# Phase V: Dapr Configuration
DAPR_HTTP_PORT=3500                        # Dapr sidecar port
PUBSUB_NAME=kafka-pubsub                   # Dapr Pub/Sub component name
STATE_STORE_NAME=statestore                # Dapr State Store component name
SECRETS_STORE_NAME=kubernetes-secrets      # Dapr Secrets component name
```

## Authentication Architecture
- **Frontend:** Better Auth handles Login/Signup
- **Backend:** Verifies JWT signature using shared `BETTER_AUTH_SECRET`
- **Microservices:** Use Dapr Service Invocation for mTLS communication
- **User Isolation:** All API endpoints and events validate `user_id`

## Phase V Features

### Recurring Tasks (RRULE)
- Pattern storage: `recurring_pattern` (RRULE string like "DAILY", "WEEKLY", "FREQ=DAILY;INTERVAL=1")
- End date: `recurring_end_date` (optional, NULL for infinite)
- Next occurrence: `next_occurrence` (calculated via RRULE parser)
- Parent linking: `parent_task_id` (links instances to pattern)
- Pattern flag: `is_pattern` (true for template, false for instance)

### Alert System
- Scheduled alerts via Dapr Jobs API
- Multiple notification channels (email, push, webhook)
- Delivery tracking with retry logic
- User-scoped alert management

### Event Sourcing
- All task mutations publish CloudEvents
- Event versioning for schema evolution
- Idempotent consumers using Dapr State Store
- Dead letter queue for failed processing

## Security
- **User Isolation:** Every endpoint validates `url_user_id == jwt_user_id`
- **JWT Validation:** All endpoints (except `/api/health`) require valid JWT
- **mTLS:** Dapr provides automatic mTLS between services
- **Secrets:** All credentials stored in Kubernetes secrets accessed via Dapr

## Monitoring
- **Prometheus:** Metrics collection from all services
- **Grafana:** Dashboards for service health and performance
- **Zipkin:** Distributed tracing across microservices
- **Alertmanager:** Alert routing and notification

## Recent Changes
- Phase V: Event-driven architecture with Dapr and Kafka
- Phase V: Microservices decomposition (recurring, alert, notification, audit, websocket)
- Phase V: Azure AKS deployment with Terraform
- Phase V: CloudEvents 1.0 compliant event schemas
- Phase V: RRULE-based recurring task support
