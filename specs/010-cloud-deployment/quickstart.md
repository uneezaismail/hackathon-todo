# Quick Start Guide: Phase V - Enterprise-Grade Cloud Infrastructure

**Feature**: 010-cloud-deployment
**Date**: 2026-01-11
**Target Audience**: Developers deploying and running Phase V locally

---

## Overview

This guide helps you get Phase V running locally with all production-equivalent services (Kafka, Dapr, microservices). For local development, we use Minikube with simplified configurations (no TLS, limited resource allocation).

**Prerequisites**:
- Docker Desktop installed
- Minikube installed and running
- kubectl configured for Minikube
- Python 3.11+ with Poetry
- Node.js 18+ with npm
- Git

---

## Local Development Setup (Minikube)

### Step 1: Start Minikube with Required Resources

```bash
# Start Minikube with adequate resources
minikube start --cpus=4 --memory=8192 --disk-size=50gb

# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server

# Verify cluster status
kubectl get nodes
```

### Step 2: Install Dapr CLI

```bash
# Install Dapr CLI
wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | /bin/bash -s 1.12.0

# Initialize Dapr in Kubernetes (no TLS for local dev)
dapr init --kubernetes --runtime-version=1.12.0 --log-level=info --wait
dapr uninstall --all
dapr init --kubernetes --runtime-version=1.12.0 --enable-mtls=false --log-level=info --wait
```

### Step 3: Deploy Kafka (Redpanda for Local)

```bash
# Navigate to phase-5-cloud-deployment directory
cd phase-5-cloud-deployment

# Apply Kafka deployment (Redpanda via Helm)
helm repo add redpanda https://charts.redpanda.com
helm repo update
helm install redpanda redpanda/redpanda -f k8s/redpanda-values.yaml

# Wait for Kafka to be ready
kubectl wait --for=condition=ready pod -l app=redpanda --timeout=300s

# Verify Kafka topics exist
kubectl exec -it redpanda-0 -- rpk topic create task-events --replicas 1 --partitions 12
kubectl exec -it redpanda-0 -- rpk topic create reminders --replicas 1 --partitions 3
kubectl exec -it redpanda-0 -- rpk topic create task-updates --replicas 1 --partitions 6
```

### Step 4: Create Dapr Components

```bash
# Apply Dapr Pub/Sub component for Kafka
kubectl apply -f k8s/components/pubsub-kafka.yaml

# Apply Dapr State Store (for event idempotency only)
kubectl apply -f k8s/components/statestore-redis.yaml

# Apply Dapr Secret Store
kubectl apply -f k8s/components/secretstore-kubernetes.yaml
```

### Step 5: Deploy Services

```bash
# Deploy Backend Service with Dapr sidecar
kubectl apply -f k8s/backend/deployment.yaml
kubectl apply -f k8s/backend/service.yaml

# Deploy Recurring Task Service with Dapr sidecar
kubectl apply -f k8s/recurring-task/deployment.yaml
kubectl apply -f k8s/recurring-task/service.yaml

# Deploy Alert Service with Dapr sidecar
kubectl apply -f k8s/alert-service/deployment.yaml
kubectl apply -f k8s/alert-service/service.yaml

# Deploy Notification Service with Dapr sidecar
kubectl apply -f k8s/notification-service/deployment.yaml
kubectl apply -f k8s/notification-service/service.yaml

# Deploy Frontend (Next.js)
kubectl apply -f k8s/frontend/deployment.yaml
kubectl apply -f k8s/frontend/service.yaml
kubectl apply -f k8s/frontend/ingress.yaml

# Wait for all pods to be ready
kubectl wait --for=condition=ready pod -l app=todo-backend --timeout=300s
kubectl wait --for=condition=ready pod -l app=recurring-task-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=alert-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=notification-service --timeout=300s
kubectl wait --for=condition=ready pod -l app=todo-frontend --timeout=300s
```

### Step 6: Access the Application

```bash
# Get Minikube IP
minikube ip

# Access frontend at http://$(minikube ip)
# Or use port-forward for development
kubectl port-forward svc/todo-frontend 3000:80
# Then open http://localhost:3000 in browser
```

---

## Quick Start Testing

### Test 1: Create a Recurring Task

**Request** (via Frontend or curl):

```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekly Team Meeting",
    "description": "Standup meeting every Monday",
    "priority": "high",
    "recurrence_pattern": "WEEKLY",
    "recurrence_interval": 1,
    "recurrence_byday": ["MO"],
    "due_date": "2026-01-20T09:00:00Z",
    "alerts": [
      {
        "alert_time": "2026-01-20T08:00:00Z",
        "notification_channels": ["email", "push"]
      }
    ]
  }'
```

**Expected Response**:

```json
{
  "task_id": 1,
  "user_id": "user-123",
  "title": "Weekly Team Meeting",
  "description": "Standup meeting every Monday",
  "status": "pending",
  "priority": "high",
  "due_date": "2026-01-20T09:00:00Z",
  "recurrence_pattern": "WEEKLY",
  "next_occurrence": "2026-01-20T09:00:00Z",
  "created_at": "2026-01-11T10:00:00Z",
  "updated_at": "2026-01-11T10:00:00Z"
}
```

### Test 2: Verify Event Publishing

```bash
# Check Kafka topics for events
kubectl exec -it redpanda-0 -- rpk topic consume task-events --from-beginning

# You should see a task.created event with CloudEvents format:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "source": "/todo-platform/backend-service",
  "specversion": "1.0",
  "type": "com.hackathon.todo.task.created",
  "datacontenttype": "application/json",
  "time": "2026-01-11T10:00:00Z",
  "data": {
    "event_version": "1.0.0",
    "user_id": "user-123",
    "task_id": 1,
    "title": "Weekly Team Meeting",
    "status": "pending"
  }
}
```

### Test 3: Complete Task and Verify Recurrence

```bash
# Mark task as complete
curl -X PUT http://localhost:3000/api/v1/tasks/1 \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'

# Verify next instance was created
curl -X GET http://localhost:3000/api/v1/tasks/2 \
  -H "Authorization: Bearer <your-jwt-token>"

# Should see new task with next occurrence date:
{
  "task_id": 2,
  "title": "Weekly Team Meeting",
  "parent_task_id": 1,
  "due_date": "2026-01-27T09:00:00Z",  # Next Monday
  "status": "pending"
}
```

### Test 4: Monitor Alert Delivery

```bash
# Check Alert Service logs
kubectl logs -f deployment/alert-service --tail=100

# Check Notification Service logs
kubectl logs -f deployment/notification-service --tail=100

# Verify alert was scheduled (check reminders topic)
kubectl exec -it redpanda-0 -- rpk topic consume reminders --from-beginning
```

---

## Development Workflow

### 1. Making Code Changes

**Backend Service Changes**:

```bash
# Edit backend code in phase-5-cloud-deployment/backend/
vim backend/src/api/v1/tasks.py

# Rebuild and redeploy
cd backend
docker build -t todo-backend:v1 .
docker tag todo-backend:v1 localhost:5000/todo-backend:v1
docker push localhost:5000/todo-backend:v1
kubectl set image deployment/backend-service todo-backend=localhost:5000/todo-backend:v1

# Verify rollout
kubectl rollout status deployment/backend-service
```

**Recurring Task Service Changes**:

```bash
# Edit recurring-task service code
vim recurring-task-service/src/consumer.py

# Rebuild and redeploy
cd recurring-task-service
docker build -t recurring-task-service:v1 .
docker tag recurring-task-service:v1 localhost:5000/recurring-task-service:v1
docker push localhost:5000/recurring-task-service:v1
kubectl set image deployment/recurring-task-service recurring-task-service=localhost:5000/recurring-task-service:v1
```

### 2. Viewing Logs

```bash
# View Backend Service logs
kubectl logs -f deployment/backend-service

# View Recurring Task Service logs
kubectl logs -f deployment/recurring-task-service

# View Alert Service logs
kubectl logs -f deployment/alert-service

# View Notification Service logs
kubectl logs -f deployment/notification-service

# View Dapr sidecar logs for Backend Service
kubectl logs -f deployment/backend-service -c daprd
```

### 3. Debugging Event Flow

```bash
# Check Kafka consumer group offsets
kubectl exec -it redpanda-0 -- rpk group describe recurring-task-consumers

# Check unprocessed messages
kubectl exec -it redpanda-0 -- rpk topic consume task-events --format json

# Check Dapr State Store for idempotency
kubectl exec -it redis-0 -- redis-cli
> GET event-processed-550e8400-e29b-41d4-a716-446655440000
```

### 4. Restarting Services

```bash
# Restart specific service
kubectl rollout restart deployment/backend-service

# Restart all services
kubectl rollout restart deployment/backend-service
kubectl rollout restart deployment/recurring-task-service
kubectl rollout restart deployment/alert-service
kubectl rollout restart deployment/notification-service
kubectl rollout restart deployment/todo-frontend
```

---

## Common Issues and Solutions

### Issue: Kafka Not Ready

**Symptom**: Services fail to start with "Kafka connection error"

**Solution**:
```bash
# Check Kafka pod status
kubectl get pods -l app=redpanda

# Check Kafka logs
kubectl logs redpanda-0

# Recreate Kafka topic
kubectl exec -it redpanda-0 -- rpk topic delete task-events
kubectl exec -it redpanda-0 -- rpk topic create task-events --replicas 1 --partitions 12
```

### Issue: Dapr Sidecar Not Injected

**Symptom**: Service pod runs but can't reach Dapr APIs

**Solution**:
```bash
# Check pod annotations
kubectl describe pod <backend-pod-name> | grep dapr

# Verify Dapr annotations in deployment
kubectl get deployment backend-service -o yaml | grep dapr.io

# Manually inject Dapr sidecar
kubectl patch deployment backend-service -p '{"spec":{"template":{"metadata":{"annotations":{"dapr.io/enabled":"true","dapr.io/app-id":"backend-service"}}}}'
```

### Issue: Events Not Being Processed

**Symptom**: Kafka events exist but consumers aren't processing

**Solution**:
```bash
# Check consumer group lag
kubectl exec -it redpanda-0 -- rpk group list
kubectl exec -it redpanda-0 -- rpk group describe recurring-task-consumers

# Check consumer logs
kubectl logs -f deployment/recurring-task-service

# Restart consumer service
kubectl rollout restart deployment/recurring-task-service
```

### Issue: Database Connection Errors

**Symptom**: Services fail with "database connection timeout"

**Solution**:
```bash
# Check database pod
kubectl get pods -l app=neon-postgres

# Check database logs
kubectl logs neon-postgres-0

# Verify environment variables
kubectl describe pod <backend-pod-name> | grep DATABASE_URL
```

---

## Cleanup

### Stop Local Environment

```bash
# Stop Minikube (preserves state)
minikube stop

# Delete Minikube (destroys all resources)
minikube delete

# Uninstall Dapr
dapr uninstall --all
helm uninstall redpanda
```

---

## Next Steps

After completing the quick start:

1. **Read Documentation**:
   - `spec.md` - Full feature requirements
   - `research.md` - Technology decisions and rationale
   - `data-model.md` - Database schema
   - `contracts/` - API and event contracts

2. **Explore Architecture**:
   - Review `plan.md` for detailed implementation plan
   - Study microservices interactions

3. **Start Development**:
   - Review task breakdown in `tasks.md` (after `/sp.tasks`)
   - Pick up first task for implementation

---

## Resources

- **Phase IV Documentation**: `phase-4-k8s-deployment/README.md`
- **Dapr Documentation**: https://docs.dapr.io/
- **Kafka Documentation**: https://kafka.apache.org/documentation/
- **FastAPI Documentation**: https://fastapi.tiangolo.com/
- **Next.js Documentation**: https://nextjs.org/docs
- **Constitution**: `.specify/memory/constitution.md`
