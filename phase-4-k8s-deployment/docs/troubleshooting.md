# Troubleshooting Guide for Todo App Kubernetes Deployment

## Overview

This guide provides solutions to common issues encountered when deploying the Todo application to Minikube with Helm. For AI-powered troubleshooting, see [kubectl-ai examples](./kubectl-ai-examples.md) and [kagent guide](./kagent-guide.md).

## Table of Contents

1. [Prerequisites Issues](#prerequisites-issues)
2. [Minikube Problems](#minikube-problems)
3. [Image Build Failures](#image-build-failures)
4. [Pod Startup Issues](#pod-startup-issues)
5. [Health Probe Failures](#health-probe-failures)
6. [Database Connectivity](#database-connectivity)
7. [Networking Problems](#networking-problems)
8. [Resource Constraints](#resource-constraints)
9. [Configuration Issues](#configuration-issues)
10. [Deployment Script Errors](#deployment-script-errors)

---

## Prerequisites Issues

### Problem: Command not found (minikube, helm, kubectl, docker)

**Symptoms**:
```
bash: minikube: command not found
bash: helm: command not found
```

**Solution**:

**For Minikube**:
```bash
# macOS
brew install minikube

# Linux/WSL2
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64

# Verify installation
minikube version
```

**For Helm**:
```bash
# macOS
brew install helm

# Linux/WSL2
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify installation
helm version
```

**For kubectl**:
```bash
# macOS
brew install kubectl

# Linux/WSL2
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

# Verify installation
kubectl version --client
```

### Problem: Docker daemon not running

**Symptoms**:
```
Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Solution**:
```bash
# macOS
# Start Docker Desktop from Applications

# Linux
sudo systemctl start docker
sudo systemctl enable docker  # Start on boot

# WSL2
# Start Docker Desktop for Windows
# Ensure WSL integration is enabled in Settings > Resources > WSL Integration

# Verify Docker is running
docker ps
```

---

## Minikube Problems

### Problem: Minikube won't start

**Symptoms**:
```
😿  Failed to start minikube: driver "docker" not found
```

**Solution**:
```bash
# Check available drivers
minikube start --help | grep driver

# Start with specific driver (Docker recommended)
minikube start --driver=docker --cpus=4 --memory=8192 --disk-size=20g

# If Docker driver fails, try alternatives:
# macOS: hyperkit or virtualbox
minikube start --driver=hyperkit

# Linux: kvm2 or virtualbox
minikube start --driver=kvm2

# Windows (WSL2): docker or virtualbox
minikube start --driver=docker
```

### Problem: Insufficient resources

**Symptoms**:
```
💣  Exiting due to RSRC_INSUFFICIENT_CORES
```

**Solution**:
```bash
# Check available resources
# macOS/Linux
sysctl -n hw.ncpu  # CPU cores (macOS)
nproc              # CPU cores (Linux)
free -h            # Memory (Linux)

# Start Minikube with reduced resources
minikube start --cpus=2 --memory=4096 --disk-size=10g

# Recommended minimum:
# - CPUs: 2 cores
# - Memory: 4GB
# - Disk: 10GB
```

### Problem: Minikube IP not accessible

**Symptoms**:
```
curl: (7) Failed to connect to <minikube-ip> port 30300: Connection refused
```

**Solution**:
```bash
# Check Minikube status
minikube status

# Get Minikube IP
minikube ip

# Check if service is exposed
kubectl get svc -n todo-app

# For macOS users: Use minikube tunnel (required)
minikube tunnel  # Run in separate terminal, may require sudo

# Alternative: Use port-forward
kubectl port-forward -n todo-app svc/todo-app-frontend 3000:3000
# Access at http://localhost:3000
```

---

## Image Build Failures

### Problem: Docker images not found in Minikube

**Symptoms**:
```
Failed to pull image "todo-frontend:latest": rpc error: code = Unknown desc = Error response from daemon: pull access denied for todo-frontend, repository does not exist
```

**Root Cause**: Docker images built on host machine, but Minikube uses its own Docker daemon.

**Solution**:
```bash
# CRITICAL: Point Docker client to Minikube daemon
eval $(minikube docker-env)

# Verify you're using Minikube Docker
docker context show
# Should show minikube

# Rebuild images
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend

# Verify images exist in Minikube
docker images | grep todo

# Expected output:
# todo-frontend   latest   abc123   1 minute ago   120MB
# todo-backend    latest   def456   1 minute ago   150MB
```

**Note for multiple terminal sessions**: Run `eval $(minikube docker-env)` in each new terminal before building images.

### Problem: Build fails with "no space left on device"

**Symptoms**:
```
ERROR: failed to solve: write /var/lib/docker/tmp/...: no space left on device
```

**Solution**:
```bash
# Check disk usage
docker system df

# Clean up unused resources
docker system prune -af --volumes

# If still insufficient, recreate Minikube with more disk
minikube delete
minikube start --disk-size=20g --cpus=4 --memory=8192
```

### Problem: Frontend build fails during Docker build

**Symptoms**:
```
ERROR: process "/bin/sh -c npm run build" did not complete successfully
```

**Solution**:
```bash
# Check if .env or .env.local exists in frontend/
ls frontend/.env*

# Remove .env files (they should NOT be in Docker image)
rm frontend/.env frontend/.env.local

# Ensure .dockerignore excludes .env files
cat frontend/.dockerignore | grep .env

# Rebuild
docker build -t todo-frontend:latest ./frontend
```

---

## Pod Startup Issues

### Problem: Pods stuck in "ImagePullBackOff"

**Symptoms**:
```bash
kubectl get pods -n todo-app
# NAME                               READY   STATUS             RESTARTS   AGE
# todo-app-frontend-xxxxx-xxxxx      0/1     ImagePullBackOff   0          2m
```

**Solution**:
```bash
# Check pod events
kubectl describe pod -n todo-app todo-app-frontend-xxxxx-xxxxx

# Confirm Docker is using Minikube daemon
eval $(minikube docker-env)

# Verify images exist
docker images | grep todo

# If images missing, rebuild
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend

# Delete failing pods (Deployment will recreate them)
kubectl delete pod -n todo-app todo-app-frontend-xxxxx-xxxxx
```

### Problem: Pods stuck in "CrashLoopBackOff"

**Symptoms**:
```bash
kubectl get pods -n todo-app
# NAME                               READY   STATUS             RESTARTS   AGE
# todo-app-backend-xxxxx-xxxxx       0/1     CrashLoopBackOff   5          5m
```

**Solution**:
```bash
# Check pod logs
kubectl logs -n todo-app todo-app-backend-xxxxx-xxxxx

# Common causes:
# 1. Missing environment variables
# 2. Database connection failure
# 3. Application startup error

# Check if secrets exist
kubectl get secrets -n todo-app

# Verify secret values (DATABASE_URL, BETTER_AUTH_SECRET, etc.)
kubectl get secret -n todo-app todo-app-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d

# Check events for more details
kubectl describe pod -n todo-app todo-app-backend-xxxxx-xxxxx
```

### Problem: Pods stuck in "Pending"

**Symptoms**:
```bash
kubectl get pods -n todo-app
# NAME                               READY   STATUS    RESTARTS   AGE
# todo-app-frontend-xxxxx-xxxxx      0/1     Pending   0          5m
```

**Solution**:
```bash
# Check why pod is pending
kubectl describe pod -n todo-app todo-app-frontend-xxxxx-xxxxx

# Common causes:
# 1. Insufficient resources
kubectl top nodes  # Check node resource usage

# 2. Node not ready
kubectl get nodes  # Check node status

# If resources insufficient, increase Minikube resources
minikube stop
minikube start --cpus=4 --memory=8192 --disk-size=20g
```

---

## Health Probe Failures

### Problem: Pods restart frequently due to failed liveness probes

**Symptoms**:
```bash
kubectl get pods -n todo-app
# NAME                               READY   STATUS    RESTARTS   AGE
# todo-app-frontend-xxxxx-xxxxx      1/1     Running   15         10m
```

**Solution**:
```bash
# Check liveness probe configuration
kubectl describe pod -n todo-app todo-app-frontend-xxxxx-xxxxx | grep -A 10 Liveness

# Test health endpoint manually
kubectl port-forward -n todo-app todo-app-frontend-xxxxx-xxxxx 3000:3000
curl http://localhost:3000/api/health

# Expected response: {"status":"ok"}

# If endpoint fails, check application logs
kubectl logs -n todo-app todo-app-frontend-xxxxx-xxxxx

# If startup takes longer than initialDelaySeconds, adjust in values.yaml
# Edit helm/todo-app/values-dev.yaml:
# healthcheck:
#   liveness:
#     initialDelaySeconds: 60  # Increase from 30 to 60
```

### Problem: Pods not receiving traffic (readiness probe failing)

**Symptoms**:
```bash
kubectl get pods -n todo-app
# NAME                               READY   STATUS    RESTARTS   AGE
# todo-app-backend-xxxxx-xxxxx       0/1     Running   0          2m

kubectl get endpoints -n todo-app
# NAME                 ENDPOINTS     AGE
# todo-app-backend     <none>        2m
```

**Solution**:
```bash
# Check readiness probe status
kubectl describe pod -n todo-app todo-app-backend-xxxxx-xxxxx | grep -A 10 Readiness

# Test readiness endpoint
kubectl port-forward -n todo-app todo-app-backend-xxxxx-xxxxx 8000:8000
curl http://localhost:8000/api/ready

# Expected response (if ready): {"status":"ready"}
# Expected response (if not ready): {"status":"not ready","error":"..."}

# Common causes:
# 1. Missing DATABASE_URL
kubectl exec -n todo-app todo-app-backend-xxxxx-xxxxx -- env | grep DATABASE_URL

# 2. Database connection failure (check logs)
kubectl logs -n todo-app todo-app-backend-xxxxx-xxxxx

# 3. Missing BETTER_AUTH_SECRET (frontend)
kubectl exec -n todo-app todo-app-frontend-xxxxx-xxxxx -- env | grep BETTER_AUTH_SECRET
```

---

## Database Connectivity

### Problem: Backend cannot connect to database

**Symptoms**:
```
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) could not connect to server
```

**Solution**:
```bash
# 1. Verify DATABASE_URL is set correctly
kubectl get secret -n todo-app todo-app-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d

# Expected format: postgresql://user:pass@host/db?sslmode=require

# 2. Test connection from pod
kubectl exec -n todo-app <backend-pod-name> -- python3 -c "
from sqlmodel import create_engine
import os
engine = create_engine(os.environ['DATABASE_URL'])
with engine.connect() as conn:
    result = conn.execute('SELECT 1')
    print('Database connection successful!')
"

# 3. Check if database host is reachable
kubectl exec -n todo-app <backend-pod-name> -- ping <database-host>

# 4. Verify firewall rules allow connections from Minikube IP
minikube ip
# Add this IP to database firewall allowlist (for Neon, etc.)
```

### Problem: SSL/TLS connection errors

**Symptoms**:
```
ssl.SSLError: [SSL: CERTIFICATE_VERIFY_FAILED]
```

**Solution**:
```bash
# Ensure DATABASE_URL includes sslmode parameter
# Correct: postgresql://user:pass@host/db?sslmode=require
# Wrong: postgresql://user:pass@host/db

# Update .env file
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Redeploy with updated secret
source .env
helm upgrade todo-app ./helm/todo-app \
  -f ./helm/todo-app/values-dev.yaml \
  -n todo-app \
  --set secrets.DATABASE_URL="$DATABASE_URL"
```

---

## Networking Problems

### Problem: Frontend cannot reach backend

**Symptoms**:
- Frontend loads but shows "API connection failed"
- Browser console shows: `Failed to fetch http://localhost:8000/api/...`

**Solution**:
```bash
# 1. Check backend service exists
kubectl get svc -n todo-app todo-app-backend

# Expected output:
# NAME               TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
# todo-app-backend   ClusterIP   10.96.123.456    <none>        8000/TCP   5m

# 2. Check backend pods are ready
kubectl get pods -n todo-app -l app.kubernetes.io/component=backend

# 3. Verify NEXT_PUBLIC_API_URL in frontend
kubectl exec -n todo-app <frontend-pod-name> -- env | grep NEXT_PUBLIC_API_URL

# Should be: http://todo-app-backend:8000

# 4. Test backend connectivity from frontend pod
kubectl exec -n todo-app <frontend-pod-name> -- wget -O- http://todo-app-backend:8000/api/health

# Expected: {"status":"healthy"}
```

### Problem: Cannot access frontend via NodePort

**Symptoms**:
```
curl: (7) Failed to connect to <minikube-ip>:30300
```

**Solution**:
```bash
# 1. Verify Minikube is running
minikube status

# 2. Check frontend service NodePort
kubectl get svc -n todo-app todo-app-frontend

# Expected:
# NAME                 TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
# todo-app-frontend    NodePort   10.96.1.2      <none>        3000:30300/TCP   5m

# 3. macOS users MUST use minikube tunnel
minikube tunnel  # Run in separate terminal

# 4. Alternative: Use port-forward
kubectl port-forward -n todo-app svc/todo-app-frontend 3000:3000
# Access at http://localhost:3000

# 5. Check firewall rules
# Ensure port 30300 is not blocked by firewall
```

---

## Resource Constraints

### Problem: Pods being OOMKilled (Out of Memory)

**Symptoms**:
```bash
kubectl get pods -n todo-app
# NAME                               READY   STATUS      RESTARTS   AGE
# todo-app-frontend-xxxxx-xxxxx      0/1     OOMKilled   10         5m
```

**Solution**:
```bash
# 1. Check current memory usage
kubectl top pods -n todo-app

# 2. Check memory limits
kubectl describe pod -n todo-app <pod-name> | grep -A 5 Limits

# 3. Increase memory limits in values-dev.yaml
# Edit helm/todo-app/values-dev.yaml:
# resources:
#   frontend:
#     limits:
#       memory: 1Gi  # Increase from 512Mi
#   backend:
#     limits:
#       memory: 1Gi  # Increase from 512Mi

# 4. Redeploy
helm upgrade todo-app ./helm/todo-app \
  -f ./helm/todo-app/values-dev.yaml \
  -n todo-app
```

### Problem: Pods being throttled (CPU)

**Symptoms**:
- Slow response times
- Pods show high CPU usage but not OOMKilled

**Solution**:
```bash
# 1. Check CPU usage
kubectl top pods -n todo-app

# 2. Increase CPU limits
# Edit helm/todo-app/values-dev.yaml:
# resources:
#   frontend:
#     limits:
#       cpu: 1000m  # Increase from 500m
#   backend:
#     limits:
#       cpu: 1000m  # Increase from 500m

# 3. Redeploy
helm upgrade todo-app ./helm/todo-app \
  -f ./helm/todo-app/values-dev.yaml \
  -n todo-app
```

---

## Configuration Issues

### Problem: Environment variables not set in pods

**Symptoms**:
```
KeyError: 'DATABASE_URL'
```

**Solution**:
```bash
# 1. Check if ConfigMap exists
kubectl get configmap -n todo-app

# 2. Check ConfigMap contents
kubectl get configmap -n todo-app todo-app-config -o yaml

# 3. Check if Secret exists
kubectl get secret -n todo-app

# 4. Verify secret values (base64-encoded)
kubectl get secret -n todo-app todo-app-secrets -o yaml

# 5. Check environment variables in pod
kubectl exec -n todo-app <pod-name> -- env

# 6. If missing, re-run deployment with correct secrets
source .env
helm upgrade todo-app ./helm/todo-app \
  -f ./helm/todo-app/values-dev.yaml \
  -n todo-app \
  --set secrets.DATABASE_URL="$DATABASE_URL" \
  --set secrets.BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  --set secrets.OPENAI_API_KEY="$OPENAI_API_KEY"
```

### Problem: Secrets visible in plain text

**Symptoms**:
```bash
kubectl get pods -n todo-app -o yaml | grep DATABASE_URL
# Shows plain text password
```

**Solution**:
```bash
# This is expected behavior for secretKeyRef environment variables
# The secret VALUE is injected, but the reference is visible

# Verify secrets are actually stored encoded:
kubectl get secret -n todo-app todo-app-secrets -o yaml
# Should show base64-encoded values

# To prevent leaking secrets in logs, NEVER log environment variables
```

---

## Deployment Script Errors

### Problem: deploy.sh fails with "Permission denied"

**Symptoms**:
```bash
./scripts/deploy.sh
bash: ./scripts/deploy.sh: Permission denied
```

**Solution**:
```bash
# Make script executable
chmod +x scripts/deploy.sh

# Run again
./scripts/deploy.sh
```

### Problem: deploy.sh fails with ".env file not found"

**Symptoms**:
```
Error: .env file not found
```

**Solution**:
```bash
# Create .env from template
cp .env.example .env

# Edit .env and set required variables
nano .env  # or vim, code, etc.

# Required variables:
# - DATABASE_URL
# - BETTER_AUTH_SECRET
# - OPENAI_API_KEY

# Run deploy script again
./scripts/deploy.sh
```

### Problem: Helm deployment fails with "release not found"

**Symptoms**:
```
Error: release: not found
```

**Solution**:
```bash
# List Helm releases
helm list -n todo-app

# If no release exists, remove --upgrade flag
helm install todo-app ./helm/todo-app \
  -f ./helm/todo-app/values-dev.yaml \
  -n todo-app --create-namespace

# Or use the deploy script which handles this
./scripts/deploy.sh
```

---

## Advanced Troubleshooting

### Enable Verbose Logging

```bash
# Backend (FastAPI)
# Edit helm/todo-app/templates/configmap.yaml
# Set LOG_LEVEL: "DEBUG"

# Redeploy
helm upgrade todo-app ./helm/todo-app \
  -f ./helm/todo-app/values-dev.yaml \
  -n todo-app

# View detailed logs
kubectl logs -n todo-app -l app.kubernetes.io/component=backend -f
```

### Access Pod Shell for Debugging

```bash
# Frontend pod
kubectl exec -it -n todo-app <frontend-pod-name> -- sh

# Backend pod
kubectl exec -it -n todo-app <backend-pod-name> -- bash

# Inside pod, you can:
# - Check environment: env
# - Test network: wget, curl, ping
# - Check files: ls, cat
# - Test database: python3 -c "..."
```

### Export Cluster State for Analysis

```bash
# Export all resources
kubectl get all -n todo-app -o yaml > cluster-state.yaml

# Export events
kubectl get events -n todo-app --sort-by='.lastTimestamp' > events.txt

# Export pod logs
kubectl logs -n todo-app -l app.kubernetes.io/name=todo-app --all-containers > all-logs.txt
```

---

## Getting Help

If you're still stuck after trying these solutions:

1. **Check Application Logs**:
   ```bash
   kubectl logs -n todo-app -l app.kubernetes.io/name=todo-app --all-containers --tail=200
   ```

2. **Check Kubernetes Events**:
   ```bash
   kubectl get events -n todo-app --sort-by='.lastTimestamp' --watch
   ```

3. **Use AI Troubleshooting Tools**:
   - [kubectl-ai](./kubectl-ai-examples.md) for interactive diagnostics
   - [kagent](./kagent-guide.md) for automated monitoring

4. **Review Documentation**:
   - [README.md](../README.md) for deployment guide
   - [quickstart.md](../../specs/009-minikube-helm-deployment/quickstart.md) for verification tests

5. **Common Commands Reference**:
   ```bash
   # Full diagnostic report
   kubectl describe pod -n todo-app <pod-name>
   kubectl logs -n todo-app <pod-name> --previous  # Logs from crashed container
   kubectl get events -n todo-app
   kubectl top nodes
   kubectl top pods -n todo-app
   ```
