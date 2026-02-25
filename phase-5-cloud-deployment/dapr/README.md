# Dapr Configuration

This directory contains Dapr component configurations for Phase V.

## Directory Structure

```
dapr/
├── components/           # Dapr component definitions
│   ├── pubsub-kafka.yaml        # Kafka Pub/Sub component
│   ├── statestore-redis.yaml    # Redis State Store for idempotency
│   ├── secretstore-kubernetes.yaml  # Kubernetes Secrets access
│   └── jobs-scheduler.yaml      # Jobs API configuration
└── config/               # Dapr runtime configuration
    └── dapr-config.yaml  # Tracing, metrics, mTLS settings
```

## Components

### 1. Pub/Sub (Kafka)
- **Name:** `kafka-pubsub`
- **Type:** `pubsub.kafka`
- **Topics:** `task-events`, `alert-events`, `reminders`
- **Features:** Dead letter queue, retry logic

### 2. State Store (Redis)
- **Name:** `statestore`
- **Type:** `state.redis`
- **Purpose:** Idempotency key storage for event deduplication

### 3. Secret Store (Kubernetes)
- **Name:** `kubernetes-secrets`
- **Type:** `secretstores.kubernetes`
- **Purpose:** Access Kubernetes secrets for credentials

### 4. Jobs Scheduler
- **Name:** `jobs-scheduler`
- **Type:** `scheduler` (built-in)
- **Purpose:** Exact-time reminder scheduling

## Deployment

### Local Development

```bash
# Apply components to local Dapr
dapr init
cp components/*.yaml ~/.dapr/components/
```

### Kubernetes

```bash
# Apply components to cluster
kubectl apply -f components/
kubectl apply -f config/
```

## Dapr Sidecar Configuration

Services should include these annotations for sidecar injection:

```yaml
annotations:
  dapr.io/enabled: "true"
  dapr.io/app-id: "backend"
  dapr.io/app-port: "8000"
  dapr.io/config: "dapr-config"
  dapr.io/log-level: "info"
```
