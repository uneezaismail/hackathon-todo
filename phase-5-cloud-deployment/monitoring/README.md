# Monitoring Stack

Observability infrastructure for Phase V.

## Components

### Prometheus
- **Purpose:** Metrics collection and storage
- **Port:** 9090
- **Scrape targets:** All microservices, Dapr sidecars

### Grafana
- **Purpose:** Visualization dashboards
- **Port:** 3001
- **Dashboards:** Service health, Kafka lag, API latency

### Alertmanager
- **Purpose:** Alert routing and notification
- **Port:** 9093
- **Integrations:** Slack, PagerDuty, email

### Zipkin
- **Purpose:** Distributed tracing
- **Port:** 9411
- **Integration:** Dapr tracing configuration

## Deployment

### Kubernetes

```bash
# Deploy monitoring stack
kubectl apply -f prometheus/
kubectl apply -f grafana/
kubectl apply -f alertmanager/
kubectl apply -f zipkin/
```

### Local Development

```bash
# Run with docker-compose
docker-compose -f monitoring/docker-compose.yml up -d
```

## Dapr Tracing Integration

Configure Dapr to send traces to Zipkin:

```yaml
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: dapr-config
spec:
  tracing:
    samplingRate: "1.0"
    zipkin:
      endpointAddress: "http://zipkin:9411/api/v2/spans"
```
