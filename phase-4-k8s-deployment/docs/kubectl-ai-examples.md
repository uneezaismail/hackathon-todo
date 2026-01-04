# kubectl-ai Examples for Todo App

## Overview

kubectl-ai is an intelligent interface that translates natural language into precise Kubernetes operations. This guide provides examples for managing and troubleshooting the Todo application deployment in Minikube.

## Installation

### Linux/MacOS

```bash
curl -sSL https://raw.githubusercontent.com/GoogleCloudPlatform/kubectl-ai/main/install.sh | bash
```

### Setup API Key

kubectl-ai supports multiple LLM providers. Choose one:

**Option 1: Gemini (Default, Recommended)**
```bash
export GEMINI_API_KEY=your_api_key_here
# Get your key from: https://ai.google.dev/
```

**Option 2: OpenAI**
```bash
export OPENAI_API_KEY=sk-your_api_key_here
# Get your key from: https://platform.openai.com/
```

**Option 3: Groq (Fast, Free Tier)**
```bash
export GROQ_API_KEY=gsk_your_api_key_here
# Get your key from: https://console.groq.com/
```

## Basic Usage

### Interactive Mode

Maintains conversation context across multiple queries:

```bash
kubectl-ai
```

Example conversation:
```
>>> "show me all pods in the todo-app namespace"
>>> "which ones are not running?"
>>> "show me their logs"
>>> "describe the frontend deployment"
```

### One-Shot Mode

Execute a single query:

```bash
kubectl-ai --quiet "show me all pods in the todo-app namespace"
```

## Common Operations for Todo App

### Pod Status Queries

**Check all pods in todo-app namespace:**
```bash
kubectl-ai "show me all pods in the todo-app namespace"
```

**Find unhealthy pods:**
```bash
kubectl-ai "which pods in todo-app namespace are not healthy"
```

**Check specific pod status:**
```bash
kubectl-ai "is the frontend pod running in todo-app namespace"
```

### Resource Usage Queries

**Check resource usage:**
```bash
kubectl-ai "show me CPU and memory usage for pods in todo-app namespace"
```

**Identify resource-constrained pods:**
```bash
kubectl-ai "which pods in todo-app are using the most memory"
```

**Check resource limits:**
```bash
kubectl-ai "show me the resource limits for the backend deployment"
```

### Troubleshooting Commands

**Get logs from failing pods:**
```bash
kubectl-ai "show me logs from the failing pod in todo-app namespace"
```

**Check recent events:**
```bash
kubectl-ai "show me recent events in todo-app namespace"
```

**Investigate pod failures:**
```bash
kubectl-ai "why is the frontend pod failing in todo-app namespace"
```

**Check liveness probe status:**
```bash
kubectl-ai "show me the health check status for all pods in todo-app"
```

**Inspect service endpoints:**
```bash
kubectl-ai "show me which pods are behind the frontend service in todo-app"
```

### Deployment Management

**Scale frontend:**
```bash
kubectl-ai "scale the frontend deployment to 4 replicas in todo-app namespace"
```

**Restart deployment:**
```bash
kubectl-ai "restart the backend deployment in todo-app namespace"
```

**Check rollout status:**
```bash
kubectl-ai "show me the rollout status of frontend deployment in todo-app"
```

### Configuration Inspection

**View environment variables:**
```bash
kubectl-ai "show me environment variables in the backend pod"
```

**Check ConfigMap values:**
```bash
kubectl-ai "show me the todo-app-config ConfigMap contents"
```

**Verify secrets are injected:**
```bash
kubectl-ai "verify that DATABASE_URL secret is injected in backend pods"
```

### Network Debugging

**Check service connectivity:**
```bash
kubectl-ai "can the frontend pod connect to the backend service"
```

**Get service endpoints:**
```bash
kubectl-ai "show me the endpoints for the backend service in todo-app"
```

**Test NodePort access:**
```bash
kubectl-ai "what is the NodePort for the frontend service"
```

## Advanced Workflows

### Multi-Step Troubleshooting

```bash
kubectl-ai
>>> "show me all pods in todo-app that are not ready"
>>> "describe the unhealthy pod"
>>> "show me the last 50 lines of logs from that pod"
>>> "check if the database connection is working"
```

### Piping Input

```bash
# Analyze error logs
cat error.log | kubectl-ai "explain this Kubernetes error"

# Troubleshoot from previous command
kubectl describe pod -n todo-app | kubectl-ai "what's wrong with this pod"
```

### Using Different Models

**Fast queries (Gemini 2.5 Flash):**
```bash
kubectl-ai --model gemini-2.5-flash-preview-04-17 "list pods in todo-app"
```

**Complex analysis (Gemini 2.5 Pro):**
```bash
kubectl-ai --model gemini-2.5-pro-exp-03-25 "analyze why my deployment is failing"
```

**OpenAI (GPT-4):**
```bash
kubectl-ai --llm-provider openai --model gpt-4.1 "troubleshoot my pod errors"
```

## Safety Tips

**Always review commands before execution:**
- kubectl-ai will ask for confirmation before running destructive commands
- Use `--quiet` to suppress explanations but **NOT** for destructive operations
- Use `--skip-permissions` only for read-only operations you trust

**Good for automation (safe):**
```bash
kubectl-ai --quiet "show me pod status in todo-app"
```

**Bad for automation (dangerous):**
```bash
# DON'T DO THIS - bypasses safety checks
kubectl-ai --quiet --skip-permissions "delete all pods in todo-app"
```

## Common Todo App Scenarios

### Scenario 1: Frontend Not Accessible

```bash
kubectl-ai
>>> "is the frontend service in todo-app namespace running"
>>> "show me the NodePort for frontend service"
>>> "are there any healthy frontend pods"
>>> "show me frontend pod logs"
```

### Scenario 2: Backend Database Connection Issues

```bash
kubectl-ai
>>> "check if backend pods in todo-app are ready"
>>> "show me backend pod readiness probe failures"
>>> "get logs from backend pods filtering for database errors"
>>> "verify DATABASE_URL secret exists in todo-app namespace"
```

### Scenario 3: High Memory Usage

```bash
kubectl-ai
>>> "which pods in todo-app namespace are using the most memory"
>>> "what are the memory limits for the frontend deployment"
>>> "show me memory trends for the last hour"
>>> "should I increase memory limits based on current usage"
```

## Tips for Effective Usage

1. **Be specific about namespaces**: Always mention "todo-app namespace" to avoid confusion
2. **Use natural language**: kubectl-ai understands "show me", "list", "get", "describe" interchangeably
3. **Chain questions**: In interactive mode, follow up questions use context from previous queries
4. **Ask for explanations**: kubectl-ai can explain what commands it's running and why
5. **Request best practices**: Ask "what's the best way to..." for recommendations

## Resources

- **kubectl-ai GitHub**: https://github.com/GoogleCloudPlatform/kubectl-ai
- **Gemini API**: https://ai.google.dev/
- **kubectl Documentation**: https://kubernetes.io/docs/reference/kubectl/
