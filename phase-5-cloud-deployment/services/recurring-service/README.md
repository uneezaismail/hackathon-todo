# Recurring Task Service

Microservice for handling recurring task logic in the Phase V cloud deployment.

## Overview

The Recurring Task Service is a stateless microservice that:

1. **Consumes task.completed events** from Kafka (via Dapr Pub/Sub)
2. **Validates recurring patterns** using RRULE (RFC 5545)
3. **Calculates next occurrences** using python-dateutil
4. **Creates next task instances** via backend service invocation
5. **Publishes task.created events** back to Kafka for auditing

## Architecture

```
┌──────────────┐
│   Kafka      │
│ task-events  │
└──────┬───────┘
       │ (via Dapr Pub/Sub)
       ▼
┌──────────────────┐
│  Recurring Task  │
│    Service       │
└──────┬───────────┘
       │ (Dapr Service Invocation)
       ▼
┌──────────────┐
│   Backend    │
│   Service    │
└──────────────┘
```

## Features

### Event Processing
- **Dapr Pub/Sub Integration**: Subscribes to task-events topic
- **CloudEvents Format**: Receives events wrapped in CloudEvents 1.0 specification
- **Idempotency**: Tracks processed event IDs in Dapr State Store to prevent duplicates
- **User Isolation**: All operations validated with user_id

### RRULE Support
- Simplified patterns: DAILY, WEEKLY, MONTHLY, YEARLY
- Full RFC 5545: FREQ=DAILY;INTERVAL=2;BYDAY=MO,WE,FR
- UTC-only datetime handling
- End date constraints (recurring_end_date)

### Error Handling
- Exponential backoff retries (3 attempts)
- Dead letter queue (dlq-task-events) for failed events
- Structured logging with correlation IDs
- Health checks for Dapr connectivity

### Dapr Building Blocks
- **Pub/Sub**: Event-driven messaging via Kafka
- **State Store**: Redis for idempotency tracking
- **Service Invocation**: mTLS calls to backend service
- **Configuration**: Dapr component references

## Development

### Prerequisites
- Python 3.13+
- UV package manager
- Docker (for containerization)

### Local Setup

```bash
# Install dependencies
uv sync

# Run service locally (without Dapr)
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Run with Dapr sidecar
dapr run --app-id recurring-task-service --app-port 8001 -- uvicorn main:app --host 0.0.0.0 --port 8001
```

### Environment Variables

```bash
# Dapr Configuration
DAPR_HTTP_PORT=3500                    # Dapr sidecar port
PUBSUB_NAME=kafka-pubsub               # Dapr Pub/Sub component name
STATE_STORE_NAME=statestore            # Dapr State Store component name

# Backend Service
BACKEND_APP_ID=backend                 # Backend service app ID for invocation

# Server Configuration
PORT=8001                              # Service port
HOST=0.0.0.0                          # Bind address
```

## API Endpoints

### Health Checks

**Liveness Probe**
```
GET /health/live
Response: {"status": "alive", "service": "recurring-task-service"}
```

**Readiness Probe**
```
GET /health/ready
Response: {"status": "ready"} (or 503 if not ready)
```

**Combined Health**
```
GET /health
Response: {"status": "healthy", "service": "recurring-task-service", "timestamp": "..."}
```

### Dapr Integration

**Subscription Registration**
```
POST /dapr/subscribe
Response: [
  {
    "pubsubname": "kafka-pubsub",
    "topic": "task-events",
    "route": "/api/events/task-events"
  }
]
```

**Event Handler**
```
POST /api/events/task-events
Expects: CloudEvents 1.0 format with task.completed event
Response: {"status": "success", "processed": true}
```

## Event Schema

### Input: task.completed Event

```json
{
  "specversion": "1.0",
  "type": "task.completed",
  "source": "backend",
  "id": "event-id-uuid",
  "data": {
    "event_type": "task.completed",
    "event_version": "1.0",
    "task_id": 123,
    "user_id": "user-456",
    "timestamp": "2025-01-17T10:00:00Z",
    "payload": {
      "task_id": 123,
      "completed_at": "2025-01-17T10:00:00Z",
      "recurring_pattern": "DAILY",
      "recurring_end_date": "2025-12-31",
      "title": "Daily standup"
    }
  }
}
```

### Output: task.created Event

```json
{
  "event_id": "event-id-uuid",
  "event_type": "task.created",
  "event_version": "1.0",
  "task_id": 124,
  "user_id": "user-456",
  "timestamp": "2025-01-18T10:00:00Z",
  "payload": {
    "task_id": 124,
    "recurring_pattern": "DAILY",
    "parent_task_id": 123,
    "created_at": "2025-01-18T10:00:00Z"
  }
}
```

## Deployment

### Docker

```bash
# Build image
docker build -t recurring-task-service:latest .

# Run locally
docker run -p 8001:8001 \
  -e DAPR_HTTP_PORT=3500 \
  -e PUBSUB_NAME=kafka-pubsub \
  -e STATE_STORE_NAME=statestore \
  recurring-task-service:latest
```

### Kubernetes with Dapr

```bash
# Deploy with Helm
helm install recurring-service ./helm/recurring-service

# Verify deployment
kubectl get deployment recurring-task-service
kubectl logs -f deployment/recurring-task-service
```

### Configuration

The service runs with Dapr sidecar injection via annotations:

```yaml
annotations:
  dapr.io/enabled: "true"
  dapr.io/app-id: "recurring-task-service"
  dapr.io/app-port: "8001"
  dapr.io/config: "dapr-config"
```

## Monitoring

### Structured Logging

All logs include:
- Event ID (correlation)
- User ID (for tracing)
- Operation (e.g., "create_next_occurrence")
- Result (success/failure)
- Error details (if applicable)

Example:
```
INFO: Received event 550e8400-e29b-41d4-a716-446655440000 of type task.completed
INFO: Created next occurrence for recurring task 123
```

### Metrics

Service exposes Prometheus metrics (future):
- `recurring_tasks_completed_total`
- `next_occurrences_created_total`
- `event_processing_duration_seconds`
- `dapr_invocation_errors_total`

## Troubleshooting

### Dapr Sidecar Not Responding

```bash
# Check if Dapr sidecar is running
curl http://localhost:3500/v1.0/healthz

# View sidecar logs
kubectl logs -f <pod-name> -c daprd
```

### Events Not Being Processed

1. Check readiness probe: `curl http://localhost:8001/health/ready`
2. Verify subscription: Check `dapr/subscription.yaml` is applied
3. Verify Kafka connectivity: Check Dapr Pub/Sub component
4. Check event format: Ensure CloudEvents 1.0 compliant

### State Store Issues

```bash
# Check state store connectivity via Dapr
curl http://localhost:3500/v1.0/state/statestore

# View state store keys
dapr run --app-id debugger -- dapr invoke --app-id recurring-task-service --method /debug/state
```

## Testing

### Unit Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test
pytest tests/test_event_handler.py::test_process_task_completed
```

### Integration Tests

```bash
# Start services with docker-compose
docker-compose up -d

# Run integration tests
pytest tests/integration/

# Stop services
docker-compose down
```

### Load Testing

```bash
# Install locust
pip install locust

# Run load test
locust -f tests/load/locustfile.py --host=http://localhost:8001
```

## Contributing

1. Follow PEP 8 style guide
2. Write tests for new features
3. Update documentation
4. Submit PR with description

## References

- [Dapr Documentation](https://docs.dapr.io/)
- [RFC 5545 RRULE](https://www.rfc-editor.org/rfc/rfc5545)
- [CloudEvents Specification](https://cloudevents.io/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## License

Part of GIAIC Phase V Todo Application
