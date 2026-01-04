# Phase 4: Local Kubernetes Deployment

This directory contains the Kubernetes deployment configuration for the Todo application with AI chatbot, designed to run on Minikube using Helm charts.

## Overview

Phase 4 packages the Phase 3 application (Full-stack Todo app with AI chatbot) for local Kubernetes deployment using:
- **Minikube** - Local Kubernetes cluster
- **Helm 3** - Kubernetes package manager
- **Docker** - Container runtime
- **kubectl** - Kubernetes CLI

## Prerequisites

Before deploying, ensure you have the following tools installed:

1. **Minikube** - Local Kubernetes cluster
   ```bash
   # macOS
   brew install minikube

   # Linux
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube

   # Windows (WSL2)
   curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube
   ```

2. **Helm 3** - Kubernetes package manager
   ```bash
   # macOS
   brew install helm

   # Linux/WSL2
   curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
   ```

3. **Docker** - Container runtime
   ```bash
   # macOS
   brew install --cask docker

   # Linux/WSL2
   # Follow: https://docs.docker.com/engine/install/
   ```

4. **kubectl** - Kubernetes CLI
   ```bash
   # macOS
   brew install kubectl

   # Linux/WSL2
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   ```

## Quick Start (One-Command Deployment)

### 1. Set up environment variables

**📖 See [Environment Setup Guide](./docs/environment-setup.md) for detailed instructions on getting all required credentials.**

Quick setup:

```bash
# Copy template
cp .env.example .env

# Edit with your credentials
nano .env  # or vim, code, etc.
```

Required variables:
- `DATABASE_URL` - Get from [Neon Console](https://console.neon.tech/)
- `BETTER_AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `OPENAI_API_KEY` - Get from [OpenAI Platform](https://platform.openai.com/) (or use Gemini/Groq/OpenRouter)

Optional variables (for file uploads):
- Cloudflare R2 credentials (see [Environment Setup Guide](./docs/environment-setup.md#cloudflare-r2-storage-file-uploads))

### 2. Run the deployment script

```bash
./scripts/deploy.sh
```

This single command will:
1. ✅ Validate prerequisites (minikube, helm, docker, kubectl)
2. ✅ Start Minikube (if not running)
3. ✅ Build Docker images (frontend + backend)
4. ✅ Load environment variables from `.env`
5. ✅ Create Kubernetes namespace
6. ✅ Deploy application with Helm
7. ✅ Wait for pods to be ready
8. ✅ Display access URL

### 3. Access the application

Once deployment completes, access the application at:

```
http://<minikube-ip>:30300
```

To get the Minikube IP:
```bash
minikube ip
```

## Manual Deployment (Step-by-Step)

If you prefer to deploy manually:

### 1. Start Minikube

```bash
minikube start --cpus=4 --memory=8192 --disk-size=20g
```

### 2. Configure Docker to use Minikube

```bash
eval $(minikube docker-env)
```

### 3. Build Docker images

```bash
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend
```

### 4. Create namespace

```bash
kubectl create namespace todo-app
```

### 5. Deploy with Helm

```bash
# Source environment variables
source .env

# Deploy with Helm
helm upgrade --install todo-app ./helm/todo-app \
  -f ./helm/todo-app/values-dev.yaml \
  -n todo-app \
  --set secrets.DATABASE_URL="$DATABASE_URL" \
  --set secrets.BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  --set secrets.OPENAI_API_KEY="$OPENAI_API_KEY" \
  --wait \
  --timeout=5m
```

### 6. Verify deployment

```bash
# Check pods
kubectl get pods -n todo-app

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=todo-app -n todo-app --timeout=120s
```

### 7. Access the application

```bash
echo "Frontend URL: http://$(minikube ip):30300"
```

## Architecture

### Components

- **Frontend** - Next.js 16 application (NodePort service on port 30300)
- **Backend** - FastAPI application (ClusterIP service on port 8000)
- **Database** - External Neon PostgreSQL (not deployed in cluster)
- **LLM** - External OpenAI API (or Gemini/Groq/OpenRouter)

### Kubernetes Resources

```
Namespace: todo-app
│
├── ConfigMap: todo-app-config (non-sensitive configuration)
├── Secret: todo-app-secrets (sensitive credentials)
│
├── Deployment: todo-app-frontend (1-2 replicas)
│   ├── Health Probes: /api/health (liveness), /api/ready (readiness)
│   ├── Resources: 100m-500m CPU, 256Mi-512Mi memory
│   └── Security: Non-root user (UID 1000)
│
├── Deployment: todo-app-backend (1-2 replicas)
│   ├── Health Probes: /api/health (liveness), /api/ready (readiness)
│   ├── Resources: 100m-500m CPU, 256Mi-512Mi memory
│   └── Security: Non-root user (UID 1000)
│
├── Service: todo-app-frontend (NodePort 30300)
└── Service: todo-app-backend (ClusterIP 8000)
```

### Health Checks

All pods implement health probes:

- **Liveness Probe** - Detects if container needs restart
  - Frontend: `GET /api/health`
  - Backend: `GET /api/health`
  - Checks every 15s, restarts after 3 failures

- **Readiness Probe** - Controls traffic routing
  - Frontend: `GET /api/ready` (validates env vars)
  - Backend: `GET /api/ready` (tests database connection)
  - Checks every 10s, removes from service after 3 failures

## Useful Commands

### View Resources

```bash
# View all resources
kubectl get all -n todo-app

# View pods with details
kubectl get pods -n todo-app -o wide

# View services
kubectl get svc -n todo-app

# View deployments
kubectl get deployments -n todo-app

# View ConfigMaps
kubectl get configmaps -n todo-app

# View Secrets (names only)
kubectl get secrets -n todo-app
```

### Logs and Debugging

```bash
# View frontend logs
kubectl logs -n todo-app -l app.kubernetes.io/component=frontend --tail=100 -f

# View backend logs
kubectl logs -n todo-app -l app.kubernetes.io/component=backend --tail=100 -f

# Describe pod (includes events)
kubectl describe pod -n todo-app <pod-name>

# Execute command in pod
kubectl exec -n todo-app <pod-name> -- env
```

### Scaling

```bash
# Scale frontend to 3 replicas
kubectl scale deployment -n todo-app todo-app-frontend --replicas=3

# Scale backend to 3 replicas
kubectl scale deployment -n todo-app todo-app-backend --replicas=3

# Or use Helm
helm upgrade todo-app ./helm/todo-app \
  -f ./helm/todo-app/values-dev.yaml \
  -n todo-app \
  --set replicaCount.frontend=3 \
  --set replicaCount.backend=3
```

### Updates

```bash
# Update application (rebuild images first)
eval $(minikube docker-env)
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend

# Restart deployments to pick up new images
kubectl rollout restart deployment -n todo-app todo-app-frontend
kubectl rollout restart deployment -n todo-app todo-app-backend

# Watch rollout status
kubectl rollout status deployment -n todo-app todo-app-frontend
kubectl rollout status deployment -n todo-app todo-app-backend
```

## Cleanup

### Uninstall Application

```bash
# Remove Helm release
helm uninstall todo-app -n todo-app

# Delete namespace (removes all resources)
kubectl delete namespace todo-app
```

### Stop Minikube

```bash
# Stop cluster (keeps state)
minikube stop

# Delete cluster completely
minikube delete
```

## Troubleshooting

For detailed troubleshooting solutions, see [docs/troubleshooting.md](./docs/troubleshooting.md).

Common issues:
- **Pods not starting** → Check `kubectl describe pod` for ImagePullBackOff or CrashLoopBackOff
- **Health probes failing** → Test endpoints with `kubectl port-forward` and `curl`
- **Images not found** → Run `eval $(minikube docker-env)` before building
- **Database connection errors** → Verify DATABASE_URL secret and network connectivity

Quick diagnostics:
```bash
# Check pod status
kubectl get pods -n todo-app

# View recent events
kubectl get events -n todo-app --sort-by='.lastTimestamp'

# Check logs
kubectl logs -n todo-app -l app.kubernetes.io/name=todo-app --tail=100
```

**AI-Powered Troubleshooting**:
- [kubectl-ai examples](./docs/kubectl-ai-examples.md) - Natural language Kubernetes operations
- [kagent guide](./docs/kagent-guide.md) - Automated diagnostics and monitoring

## AI DevOps Tools

Phase 4 includes documentation for AI-powered Kubernetes operations:

- **[kubectl-ai](./docs/kubectl-ai-examples.md)** - Natural language interface for Kubernetes operations
  - Interactive troubleshooting
  - Pod status queries
  - Resource usage analysis
  - Supports OpenAI, Gemini, Groq

- **[kagent](./docs/kagent-guide.md)** - Kubernetes-native AI agent framework
  - Automated diagnostics
  - Failure investigation workflows
  - Continuous monitoring
  - Multi-provider LLM support

- **[Docker AI Optimization](./docs/docker-ai-optimization.md)** - Image optimization and security scanning
  - Docker Scout integration
  - Multi-stage build optimization
  - Security vulnerability detection
  - Image size reduction techniques

## Project Structure

```
phase-4-k8s-deployment/
├── frontend/                 # Next.js application
│   ├── app/api/health/      # Liveness probe endpoint
│   ├── app/api/ready/       # Readiness probe endpoint
│   ├── Dockerfile           # Multi-stage build (node:22-alpine)
│   └── .dockerignore
├── backend/                  # FastAPI application
│   ├── src/main.py          # Health endpoints: /api/health, /api/ready
│   ├── Dockerfile           # Multi-stage build (python:3.13-slim)
│   └── .dockerignore
├── helm/todo-app/           # Helm chart
│   ├── Chart.yaml           # Chart metadata
│   ├── values.yaml          # Default values (production)
│   ├── values-dev.yaml      # Development overrides (Minikube)
│   ├── .helmignore          # Helm package exclusions
│   └── templates/           # Kubernetes manifests
│       ├── _helpers.tpl     # Template helpers
│       ├── configmap.yaml   # Non-sensitive config
│       ├── secret.yaml      # Sensitive credentials
│       ├── deployment-frontend.yaml
│       ├── deployment-backend.yaml
│       ├── service-frontend.yaml
│       └── service-backend.yaml
├── docs/                    # Documentation
│   ├── environment-setup.md       # Environment variables setup guide
│   ├── kubectl-ai-examples.md     # kubectl-ai usage guide
│   ├── kagent-guide.md            # kagent installation and workflows
│   ├── docker-ai-optimization.md  # Docker image optimization
│   └── troubleshooting.md         # Comprehensive troubleshooting guide
├── scripts/
│   └── deploy.sh            # One-command deployment automation
├── .env.example             # Environment variable template
└── README.md                # This file
```

## Security

- **Non-root containers** - All containers run as UID 1000
- **Secret management** - Credentials stored in Kubernetes Secrets (base64-encoded)
- **Resource limits** - CPU and memory limits enforced
- **Security context** - Capabilities dropped, privilege escalation disabled
- **Health checks** - Automatic restart of unhealthy containers

## Next Steps

- **Phase 5**: Advanced cloud deployment with Dapr, Kafka, and DigitalOcean Kubernetes (DOKS)

## Support

For issues and questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review Kubernetes logs: `kubectl logs -n todo-app <pod-name>`
3. Check pod events: `kubectl describe pod -n todo-app <pod-name>`
4. Verify environment variables are set correctly in `.env`
