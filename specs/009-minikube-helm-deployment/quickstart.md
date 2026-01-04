# Quick Start - Minikube Kubernetes Deployment

**Feature**: 009-minikube-helm-deployment
**Date**: 2026-01-03
**Purpose**: Rapid deployment verification and testing guide

## Prerequisites

Before deploying, ensure the following tools are installed:

| Tool | Minimum Version | Check Command | Install Link |
|------|----------------|---------------|--------------|
| Minikube | 1.32+ | `minikube version` | https://minikube.sigs.k8s.io/docs/start/ |
| Helm | 3.x | `helm version` | https://helm.sh/docs/intro/install/ |
| Docker | 24+ | `docker --version` | https://docs.docker.com/get-docker/ |
| kubectl | 1.28+ | `kubectl version --client` | https://kubernetes.io/docs/tasks/tools/ |

**System Requirements**:
- CPU: 4 cores minimum
- Memory: 8GB minimum
- Disk: 20GB free space

## One-Command Deployment

```bash
# From project root
./scripts/deploy.sh
```

This single command will:
1. Validate prerequisites
2. Start Minikube (if not running)
3. Build Docker images in Minikube context
4. Deploy application via Helm
5. Wait for pods to be ready
6. Display access URL

**Expected Duration**: 5-10 minutes on first run

## Manual Deployment Steps

If you prefer step-by-step deployment or need to troubleshoot:

### Step 1: Start Minikube

```bash
# Start Minikube cluster
minikube start --cpus=4 --memory=8192 --disk-size=20g

# Verify cluster is running
minikube status

# Expected output:
# minikube
# type: Control Plane
# host: Running
# kubelet: Running
# apiserver: Running
```

### Step 2: Build Docker Images

```bash
# Configure Docker to use Minikube's daemon
eval $(minikube docker-env)

# Verify Docker is using Minikube
docker info | grep -i "Operating System"
# Should show: Operating System: Buildroot

# Build frontend image
cd frontend
docker build -t todo-frontend:latest .
cd ..

# Build backend image
cd backend
docker build -t todo-backend:latest .
cd ..

# Verify images exist
docker images | grep todo-
# Should show: todo-frontend:latest and todo-backend:latest
```

### Step 3: Configure Environment Variables

```bash
# Create .env file with required secrets
cat > .env << 'EOF'
DATABASE_URL=postgresql://user:password@host:5432/database
BETTER_AUTH_SECRET=your-secret-min-32-characters-long
OPENAI_API_KEY=sk-your-openai-api-key
CLOUDFLARE_R2_ACCOUNT_ID=your-account-id
CLOUDFLARE_R2_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name
EOF

# Source environment variables
source .env
```

### Step 4: Create Kubernetes Namespace

```bash
# Create namespace
kubectl create namespace todo-app

# Verify namespace exists
kubectl get namespaces | grep todo-app
# Should show: todo-app
```

### Step 5: Deploy with Helm

```bash
# Install Helm chart
helm install todo-app ./helm/todo-app \
  -f ./helm/todo-app/values-dev.yaml \
  -n todo-app \
  --set secrets.DATABASE_URL="$DATABASE_URL" \
  --set secrets.BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  --set secrets.OPENAI_API_KEY="$OPENAI_API_KEY" \
  --set secrets.CLOUDFLARE_R2_ACCOUNT_ID="$CLOUDFLARE_R2_ACCOUNT_ID" \
  --set secrets.CLOUDFLARE_R2_ACCESS_KEY_ID="$CLOUDFLARE_R2_ACCESS_KEY_ID" \
  --set secrets.CLOUDFLARE_R2_SECRET_ACCESS_KEY="$CLOUDFLARE_R2_SECRET_ACCESS_KEY" \
  --set secrets.CLOUDFLARE_R2_BUCKET_NAME="$CLOUDFLARE_R2_BUCKET_NAME" \
  --wait --timeout=5m

# Expected output:
# NAME: todo-app
# LAST DEPLOYED: [timestamp]
# NAMESPACE: todo-app
# STATUS: deployed
```

### Step 6: Verify Deployment

```bash
# Check pod status (wait for all to be Ready)
kubectl get pods -n todo-app

# Expected output (after 1-2 minutes):
# NAME                            READY   STATUS    RESTARTS   AGE
# todo-frontend-xxxxxxxxx-xxxxx   1/1     Running   0          2m
# todo-frontend-xxxxxxxxx-xxxxx   1/1     Running   0          2m
# todo-backend-xxxxxxxxx-xxxxx    1/1     Running   0          2m
# todo-backend-xxxxxxxxx-xxxxx    1/1     Running   0          2m

# Check services
kubectl get services -n todo-app

# Expected output:
# NAME            TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
# todo-frontend   NodePort    10.x.x.x        <none>        3000:30300/TCP   2m
# todo-backend    ClusterIP   10.x.x.x        <none>        8000/TCP         2m
```

### Step 7: Access Application

```bash
# Get Minikube IP
minikube ip

# Expected output: 192.168.49.2 (or similar)

# Access frontend in browser:
# http://<minikube-ip>:30300

# Example: http://192.168.49.2:30300
```

## Verification Tests

### Test 1: Frontend Accessibility

```bash
# Test frontend health endpoint
curl http://$(minikube ip):30300/api/health

# Expected response: {"status": "ok"}
```

**What this tests**: Frontend pod is running and health check endpoint responds

### Test 2: Frontend UI Load

1. Open browser: `http://$(minikube ip):30300`
2. Verify login page loads within 5 seconds
3. Verify no console errors in browser developer tools

**What this tests**: Frontend serves static assets and Next.js application initializes

### Test 3: Backend Internal Connectivity

```bash
# Port-forward backend service to test locally
kubectl port-forward -n todo-app service/todo-backend 8000:8000 &

# Test backend health endpoint
curl http://localhost:8000/health

# Expected response: {"status": "healthy"}

# Stop port-forward
pkill -f "port-forward.*todo-backend"
```

**What this tests**: Backend pod is running and accessible within cluster

### Test 4: End-to-End User Workflow

1. **Login**: Navigate to `http://$(minikube ip):30300`, log in with test credentials
2. **Create Task**: Click "Add Task", enter task title and description, save
3. **Verify Persistence**: Refresh page, verify task persists (database connection works)
4. **AI Chat**: Open chat interface, send message "List my tasks"
5. **Verify AI Response**: AI should respond with list of tasks (OpenAI integration works)

**What this tests**: Complete application functionality including:
- Frontend-backend communication
- Database connectivity (Neon PostgreSQL)
- Authentication (Better Auth)
- AI agent functionality (OpenAI Agents SDK)

### Test 5: Health Probe Functionality

```bash
# Watch pod status in one terminal
kubectl get pods -n todo-app --watch

# In another terminal, kill a pod's main process to trigger liveness probe
POD_NAME=$(kubectl get pods -n todo-app -l app.kubernetes.io/component=frontend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n todo-app $POD_NAME -- kill 1

# Observe pod restart in watch terminal
# Expected: Pod status goes to Error/CrashLoopBackOff, then restarts within 30 seconds
```

**What this tests**: Liveness probe detects failures and triggers automatic restart

### Test 6: Horizontal Scaling

```bash
# Scale frontend to 4 replicas
kubectl scale deployment todo-frontend -n todo-app --replicas=4

# Verify scaling
kubectl get pods -n todo-app -l app.kubernetes.io/component=frontend

# Expected output: 4 frontend pods in Running state

# Scale back to 2 replicas
kubectl scale deployment todo-frontend -n todo-app --replicas=2
```

**What this tests**: Horizontal pod autoscaling works correctly

### Test 7: Secret Security

```bash
# Verify secrets are not visible in pod spec
kubectl get pods -n todo-app -l app.kubernetes.io/component=backend -o yaml | grep -i "DATABASE_URL"

# Expected: Should NOT show actual database URL value
# Should show: valueFrom: secretKeyRef: name: todo-secrets

# Verify secrets are injected as environment variables
POD_NAME=$(kubectl get pods -n todo-app -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n todo-app $POD_NAME -- env | grep DATABASE_URL

# Expected: DATABASE_URL=postgresql://... (actual value injected)
```

**What this tests**: Secrets are properly isolated and not exposed in pod manifests

### Test 8: Resource Limits

```bash
# Check resource requests and limits
kubectl describe pod -n todo-app -l app.kubernetes.io/component=frontend | grep -A 5 "Limits:"

# Expected output:
#   Limits:
#     cpu:     500m
#     memory:  512Mi
#   Requests:
#     cpu:        100m
#     memory:     256Mi
```

**What this tests**: Resource limits are configured correctly

## Troubleshooting

### Problem: Pods stuck in Pending state

**Check**:
```bash
kubectl describe pod -n todo-app <pod-name>
```

**Common causes**:
- Insufficient Minikube resources (increase `--cpus` or `--memory`)
- Image pull failures (verify images exist: `docker images | grep todo-`)
- Node not ready (check: `kubectl get nodes`)

**Solution**:
```bash
# Increase Minikube resources
minikube delete
minikube start --cpus=4 --memory=8192 --disk-size=20g
```

### Problem: Pods in CrashLoopBackOff

**Check logs**:
```bash
kubectl logs -n todo-app <pod-name>
```

**Common causes**:
- Missing environment variables (verify ConfigMap and Secret exist)
- Database connection failure (verify DATABASE_URL is correct)
- Health check endpoint not implemented

**Solution**:
```bash
# Check ConfigMap
kubectl get configmap -n todo-app todo-config -o yaml

# Check Secret (values are base64-encoded)
kubectl get secret -n todo-app todo-secrets -o yaml

# Verify database connectivity from pod
kubectl exec -n todo-app <backend-pod-name> -- curl http://localhost:8000/ready
```

### Problem: Frontend not accessible via NodePort

**Check**:
```bash
kubectl get services -n todo-app

# Verify NodePort is 30300
# Verify Minikube IP: minikube ip
```

**Common causes**:
- Minikube tunnel not running (Mac/Windows)
- Firewall blocking port 30300
- Service selector not matching pods

**Solution**:
```bash
# Mac/Windows: Start Minikube tunnel
minikube tunnel

# Verify service endpoints
kubectl get endpoints -n todo-app todo-frontend
```

### Problem: Backend health check failing

**Check backend logs**:
```bash
POD_NAME=$(kubectl get pods -n todo-app -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}')
kubectl logs -n todo-app $POD_NAME
```

**Common causes**:
- Database connection timeout (Neon PostgreSQL unreachable)
- Missing OPENAI_API_KEY
- Health check endpoint not implemented

**Solution**:
```bash
# Test database connection from pod
kubectl exec -n todo-app $POD_NAME -- env | grep DATABASE_URL

# Test health endpoint directly
kubectl exec -n todo-app $POD_NAME -- curl http://localhost:8000/health
```

## Cleanup

### Remove Deployment

```bash
# Uninstall Helm release
helm uninstall todo-app -n todo-app

# Delete namespace
kubectl delete namespace todo-app
```

### Stop Minikube

```bash
# Stop Minikube cluster
minikube stop

# Or delete cluster entirely
minikube delete
```

## Performance Metrics

Expected performance on developer workstation (4 CPU, 8GB RAM):

| Metric | Expected Value | Acceptance Threshold |
|--------|---------------|---------------------|
| Pod Ready Time | 60-90 seconds | <120 seconds |
| Frontend Load Time | 2-3 seconds | <5 seconds |
| Backend API Response | 100-200ms | <500ms |
| Health Probe Response | <1 second | <5 seconds |
| Deployment Script Duration | 5-8 minutes | <10 minutes |
| Pod Restart Time | 20-30 seconds | <30 seconds |

## Next Steps

After successful deployment and verification:

1. **Development Workflow**: Make code changes, rebuild images, upgrade Helm release
2. **Testing**: Run Phase 3 automated tests against Kubernetes deployment
3. **Monitoring**: Explore kubectl-ai, kagent, and Docker AI tools (see AI DevOps docs)
4. **Scaling**: Experiment with replica counts and resource limits
5. **Production Prep**: Review Phase V cloud deployment requirements
