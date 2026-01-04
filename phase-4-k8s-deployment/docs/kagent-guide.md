# Kagent Guide for Todo App Kubernetes Management

## Overview

Kagent is a Kubernetes-native framework for building, deploying, and managing AI agents with built-in observability and troubleshooting capabilities. This guide shows how to use Kagent for diagnosing and managing the Todo application deployment.

## What is Kagent?

Kagent provides:
- **AI-Powered Diagnostics**: Natural language troubleshooting for Kubernetes issues
- **Automated Failure Investigation**: Analyzes pod failures, events, and logs
- **Kubernetes-Native**: Runs as a controller with Custom Resource Definitions (CRDs)
- **Multi-Provider Support**: Works with OpenAI, Anthropic, Azure OpenAI, Ollama

## Installation

### Prerequisites

- Kubernetes cluster (Minikube for local development)
- kubectl configured
- Helm 3.x
- API key for an LLM provider (OpenAI, Anthropic, etc.)

### Quick Installation with Helm

```bash
# Set your API key (choose one provider)
export OPENAI_API_KEY=your-openai-api-key
# OR
export ANTHROPIC_API_KEY=your-anthropic-api-key

# Install Kagent using Helm
helm repo add kagent https://kagent-dev.github.io/kagent
helm repo update

# Install with OpenAI provider
helm install kagent kagent/kagent \
  --set modelConfig.provider=openAI \
  --set modelConfig.apiKey=$OPENAI_API_KEY \
  --create-namespace \
  --namespace kagent-system

# OR install with Anthropic provider
helm install kagent kagent/kagent \
  --set modelConfig.provider=anthropic \
  --set modelConfig.apiKey=$ANTHROPIC_API_KEY \
  --create-namespace \
  --namespace kagent-system
```

### Advanced Installation (from source)

```bash
# Clone the repository
git clone https://github.com/kagent-dev/kagent.git
cd kagent

# Create kind cluster for testing (optional)
make create-kind-cluster

# Set API key
export OPENAI_API_KEY=your-openai-api-key

# Install with make (uses default OpenAI provider)
make helm-install

# OR specify different provider
make KAGENT_DEFAULT_MODEL_PROVIDER=anthropic helm-install
```

### Verify Installation

```bash
# Check Kagent pods
kubectl -n kagent-system get pods

# Expected output:
# NAME                               READY   STATUS    RESTARTS   AGE
# kagent-controller-xxxxx-xxxxx      1/1     Running   0          1m
# kagent-ui-xxxxx-xxxxx              1/1     Running   0          1m

# View Kagent resources
kubectl -n kagent-system get agents,modelconfigs,toolservers,memories
```

### Access Kagent UI

```bash
# Port-forward to access the UI
kubectl port-forward svc/kagent-ui -n kagent-system 8001:80

# Open in browser: http://localhost:8001
```

## Diagnostic Workflows for Todo App

### Workflow 1: Investigate Pod Failures

**Scenario**: Frontend pod is not starting in todo-app namespace

```bash
# Check pod status
kubectl -n kagent-system logs -l app.kubernetes.io/component=controller -f
```

**Using Kagent Agent**:
1. Open Kagent UI at http://localhost:8001
2. Create a diagnostic agent with task: "Investigate why frontend pod is failing in todo-app namespace"
3. Kagent will automatically:
   - Check pod status and events
   - Analyze container logs
   - Review resource limits
   - Check health probe failures
   - Suggest remediation steps

**Expected Output**:
- Root cause analysis (e.g., "ImagePullBackOff - image not found in Minikube registry")
- Recommended fix (e.g., "Build images in Minikube context with eval $(minikube docker-env)")

### Workflow 2: Database Connectivity Issues

**Scenario**: Backend pods failing readiness probes

**Diagnostic Steps**:
```bash
# View recent events
kubectl -n todo-app get events --sort-by='.lastTimestamp'

# Check backend pod logs
kubectl -n todo-app logs -l app.kubernetes.io/component=backend --tail=50
```

**Using Kagent Agent**:
1. Create agent with task: "Analyze backend readiness probe failures in todo-app"
2. Kagent investigates:
   - Readiness probe configuration
   - Backend logs for database errors
   - Secret injection (DATABASE_URL)
   - Network connectivity to database
3. Provides diagnosis and remediation plan

### Workflow 3: Resource Exhaustion

**Scenario**: Pods being OOMKilled or throttled

```bash
# Check pod resource usage
kubectl -n todo-app top pods

# View resource limits
kubectl -n todo-app describe deployment todo-app-frontend | grep -A 5 Limits
```

**Using Kagent Agent**:
1. Task: "Analyze resource usage and limits for all pods in todo-app namespace"
2. Kagent provides:
   - Current CPU/memory usage vs. limits
   - Historical resource trends
   - Recommendations for limit adjustments
   - Horizontal scaling suggestions

### Workflow 4: Network Troubleshooting

**Scenario**: Frontend cannot reach backend service

**Using Kagent Agent**:
1. Task: "Troubleshoot frontend to backend connectivity in todo-app"
2. Kagent checks:
   - Service endpoints
   - Network policies
   - DNS resolution
   - Backend pod readiness
   - Environment variable configuration (NEXT_PUBLIC_API_URL)

### Workflow 5: Health Probe Failures

**Scenario**: Pods restart frequently due to failed health checks

```bash
# Check liveness probe failures
kubectl -n todo-app describe pod -l app.kubernetes.io/name=todo-app | grep -A 10 Liveness
```

**Using Kagent Agent**:
1. Task: "Investigate health probe failures causing pod restarts in todo-app"
2. Kagent analyzes:
   - Probe timing configuration (initialDelaySeconds, periodSeconds)
   - Application startup time vs. probe delays
   - Health endpoint responses
   - Resource constraints affecting startup
3. Suggests timing adjustments or resource increases

## Kagent Custom Resources

### Agent Resource

Defines an AI agent for specific diagnostic tasks:

```yaml
apiVersion: kagent.dev/v1alpha1
kind: Agent
metadata:
  name: todo-app-diagnostics
  namespace: kagent-system
spec:
  task: "Monitor and troubleshoot todo-app namespace pods"
  modelConfig:
    provider: openAI
    model: gpt-4
  tools:
    - kubernetes-inspector
    - log-analyzer
    - resource-monitor
```

### Create Diagnostic Agent

```bash
kubectl apply -f - <<EOF
apiVersion: kagent.dev/v1alpha1
kind: Agent
metadata:
  name: todo-diagnostics
  namespace: kagent-system
spec:
  task: "Continuously monitor todo-app namespace for failures"
  modelConfig:
    provider: openAI
  schedule: "*/5 * * * *"  # Run every 5 minutes
EOF
```

## Essential Kagent Commands

### View All Kagent Resources

```bash
kubectl -n kagent-system get agents,modelconfigs,toolservers,memories
```

### Get Agent Status

```bash
kubectl -n kagent-system get agents
kubectl -n kagent-system describe agent todo-diagnostics
```

### View Agent Logs

```bash
# Controller logs
kubectl -n kagent-system logs -l app.kubernetes.io/component=controller -f

# All Kagent logs
kubectl -n kagent-system logs -l app.kubernetes.io/name=kagent -f
```

### Check Cluster Events

```bash
kubectl -n kagent-system get events --sort-by='.lastTimestamp'
```

### Inspect Model Configuration

```bash
kubectl -n kagent-system get modelconfigs
kubectl -n kagent-system describe modelconfig default
```

## Troubleshooting Kagent Itself

### Kagent Pods Not Starting

```bash
# Check pod status
kubectl -n kagent-system get pods

# View pod events
kubectl -n kagent-system describe pod kagent-controller-xxxxx

# Check controller logs
kubectl -n kagent-system logs -l app.kubernetes.io/component=controller
```

**Common Issues**:
- **ImagePullBackOff**: Check image repository and credentials
- **CrashLoopBackOff**: Review controller logs for API key issues
- **Pending**: Check resource availability (CPU/memory)

### API Key Issues

```bash
# Verify secret exists
kubectl -n kagent-system get secrets

# Check API key is set correctly
kubectl -n kagent-system get secret kagent-api-keys -o yaml
```

### Controller Not Responding

```bash
# Restart controller
kubectl -n kagent-system rollout restart deployment kagent-controller

# Check webhook configuration
kubectl get validatingwebhookconfigurations
kubectl get mutatingwebhookconfigurations
```

## Integration with Todo App Monitoring

### Automated Failure Detection

Create an agent that continuously monitors the todo-app:

```yaml
apiVersion: kagent.dev/v1alpha1
kind: Agent
metadata:
  name: todo-app-monitor
  namespace: kagent-system
spec:
  task: |
    Monitor all pods in todo-app namespace.
    Alert on:
    - Pod failures or restarts
    - Readiness probe failures > 3 consecutive
    - Resource usage > 80% of limits
    - Error rate > 5% in logs
  modelConfig:
    provider: openAI
    model: gpt-4
  schedule: "*/2 * * * *"
  notifications:
    slack:
      webhook: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Post-Deployment Validation

```bash
# Create validation agent
kubectl apply -f - <<EOF
apiVersion: kagent.dev/v1alpha1
kind: Agent
metadata:
  name: todo-app-validator
  namespace: kagent-system
spec:
  task: |
    Validate todo-app deployment health:
    1. All pods are Running and Ready
    2. Services have active endpoints
    3. Frontend accessible via NodePort
    4. Backend readiness checks pass
    5. No recent errors in logs
  modelConfig:
    provider: openAI
EOF

# Get validation results
kubectl -n kagent-system describe agent todo-app-validator
```

## Best Practices

1. **Use Specific Tasks**: Provide clear, specific diagnostic tasks to agents
2. **Namespace Isolation**: Run Kagent in dedicated namespace (kagent-system)
3. **Resource Limits**: Set appropriate limits for Kagent controller pods
4. **API Key Security**: Store API keys in Kubernetes secrets, never in code
5. **Log Retention**: Configure log retention for agent execution history
6. **Scheduled Monitoring**: Use scheduled agents for proactive issue detection

## Comparison: kubectl-ai vs Kagent

| Feature | kubectl-ai | Kagent |
|---------|-----------|--------|
| **Type** | CLI tool | Kubernetes controller |
| **Usage** | Interactive queries | Automated agents |
| **Deployment** | Local installation | Cluster-wide deployment |
| **Persistence** | No state | Maintains agent state |
| **Automation** | Manual execution | Scheduled workflows |
| **Best For** | Ad-hoc troubleshooting | Continuous monitoring |

**Recommendation**: Use **kubectl-ai** for interactive debugging, **Kagent** for automated monitoring and scheduled diagnostics.

## Resources

- **Kagent GitHub**: https://github.com/kagent-dev/kagent
- **Kagent Documentation**: https://kagent.dev/docs
- **Helm Charts**: https://github.com/kagent-dev/kagent/tree/main/helm
- **OpenAI API**: https://platform.openai.com/
- **Anthropic API**: https://console.anthropic.com/
