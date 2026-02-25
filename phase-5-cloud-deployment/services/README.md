# Phase V Microservices

This directory contains the microservices for Phase V event-driven architecture.

## Services

| Service | Port | Description |
|---------|------|-------------|
| `recurring-service` | 8001 | Handles recurring task logic, RRULE parsing, next occurrence creation |
| `alert-service` | 8002 | Alert scheduling, delivery management, retry logic |
| `notification-service` | 8003 | Multi-channel notification delivery (email, push, webhook) |
| `audit-service` | 8004 | Event auditing, logging, compliance tracking |
| `websocket-service` | 8005 | Real-time WebSocket gateway for live updates |

## Architecture

All services communicate via Dapr Pub/Sub (Kafka backend):

```
Backend Service
      │
      ▼ (publish event)
   Dapr Sidecar ──▶ Kafka ──▶ Dapr Sidecar ──▶ Microservice
      │                             │
      └─── HTTP localhost:3500 ─────┘
```

## Running Services

### Local Development (with Dapr)

```bash
# Start recurring-service with Dapr sidecar
cd services/recurring-service
dapr run --app-id recurring-service --app-port 8001 -- uvicorn main:app --port 8001
```

### Kubernetes Deployment

Services are deployed with Dapr sidecar injection via annotations:

```yaml
annotations:
  dapr.io/enabled: "true"
  dapr.io/app-id: "recurring-service"
  dapr.io/app-port: "8001"
```

## Event Subscriptions

Each service subscribes to specific Kafka topics via Dapr:

| Service | Subscribed Topics |
|---------|-------------------|
| recurring-service | `task-events` |
| alert-service | `task-events`, `reminders` |
| notification-service | `alert-events` |
| audit-service | `task-events`, `alert-events` |
| websocket-service | `task-events`, `alert-events` |
