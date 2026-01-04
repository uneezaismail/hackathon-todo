# Complete Deployment Guide - Todo App on Minikube

## 📋 Prerequisites

Ensure these are installed:
- Docker
- Minikube
- kubectl
- Helm 3.x

## 🚀 One-Command Deployment

```bash
cd /mnt/d/hackathon-todo/phase-4-k8s-deployment

# Run the deployment script
./scripts/deploy.sh
```

**What it does:**
1. Validates prerequisites
2. Starts Minikube (if not running)
3. Configures Docker to use Minikube daemon
4. Builds frontend and backend images
5. Loads secrets from .env file
6. Deploys with Helm
7. Waits for pods to be ready

---

## 🌐 Accessing the Application

### ✅ RECOMMENDED: Minikube Service Command

After deployment completes, run:

```bash
minikube service todo-app-frontend -n todo-app
```

**This command:**
- Automatically opens your browser
- Creates tunnel from Windows → WSL2 → Minikube
- Works around WSL2 networking limitations

### Alternative: Get URL Only

```bash
# Get the access URL (doesn't open browser)
minikube service todo-app-frontend -n todo-app --url
```

Then open that URL in your browser.

---

## 🔧 If You Need to Rebuild Frontend Only

After making changes to frontend code:

```bash
# Fix line endings (if on Windows)
sed -i 's/\r$//' ./rebuild-frontend.sh

# Rebuild frontend
./rebuild-frontend.sh

# Restart frontend deployment
kubectl rollout restart deployment/todo-app-frontend -n todo-app

# Wait for it to be ready
kubectl rollout status deployment/todo-app-frontend -n todo-app

# Access the updated application
minikube service todo-app-frontend -n todo-app
```

---

## 📊 Verify Deployment

```bash
# Check all resources
kubectl get all -n todo-app

# Check pods are running (should show 1/1 READY)
kubectl get pods -n todo-app

# Check services
kubectl get svc -n todo-app

# View frontend logs
kubectl logs -n todo-app -l app.kubernetes.io/component=frontend --tail=50

# View backend logs
kubectl logs -n todo-app -l app.kubernetes.io/component=backend --tail=50
```

---

## 🐛 Troubleshooting

### Issue: "Minikube is not running"

```bash
minikube start --cpus=4 --memory=8192 --disk-size=20g
```

### Issue: "Docker permission denied"

```bash
# Add user to docker group (requires logout/login)
sudo usermod -aG docker $USER
newgrp docker

# OR run deployment script with sudo (not recommended)
```

### Issue: "Can't access http://192.168.49.2:30300"

**This is expected on WSL2!** Use `minikube service` command instead:

```bash
minikube service todo-app-frontend -n todo-app
```

### Issue: "Pod not ready / CrashLoopBackOff"

```bash
# Check pod logs
kubectl logs -n todo-app <pod-name>

# Describe pod for more details
kubectl describe pod -n todo-app <pod-name>

# Check if secrets are set correctly
kubectl get secret todo-app-secrets -n todo-app -o yaml
```

### Issue: "Authentication fails / Better Auth errors"

Make sure `BETTER_AUTH_SECRET` in .env matches between frontend and backend.

```bash
# Verify secrets
kubectl get secret todo-app-secrets -n todo-app -o jsonpath='{.data.BETTER_AUTH_SECRET}' | base64 -d && echo
```

---

## 🗑️ Clean Up / Uninstall

```bash
# Uninstall Helm release
helm uninstall todo-app -n todo-app

# Delete namespace (removes everything)
kubectl delete namespace todo-app

# Stop Minikube (optional)
minikube stop

# Delete Minikube cluster (optional)
minikube delete
```

---

## 📝 Environment Variables Required

Create a `.env` file in project root with:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Authentication (shared secret - must match frontend & backend)
BETTER_AUTH_SECRET=your-secret-key-min-32-characters-long

# LLM Provider (at least one required)
OPENAI_API_KEY=sk-...
# OR
OPENROUTER_API_KEY=sk-or-v1-...
# OR
GROQ_API_KEY=gsk_...
# OR
GEMINI_API_KEY=...

# Optional: Cloudflare R2 for file storage
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=
```

---

## 🎯 What Reference-Phase4 Does

Reference-phase4 deployment shows:

```
Frontend:  http://192.168.49.2:30300
Backend:   http://todo-app-backend.todo.svc.cluster.local:8000 (internal)

Useful Commands:
  Open frontend:  minikube service todo-app-frontend -n todo
```

**Key Point:** They recommend using `minikube service` command, NOT direct Minikube IP access.

---

## ✅ Success Indicators

After deployment and accessing the app, you should be able to:

1. ✅ Open the frontend in browser
2. ✅ Sign up with email and password
3. ✅ Sign in successfully
4. ✅ See the dashboard
5. ✅ Create tasks
6. ✅ Open the AI chatbot (bottom right)
7. ✅ Chat with the AI to manage tasks

---

## 📚 Architecture (With Proxy Pattern)

```
Browser
  ↓
http://<minikube-service-url>  (via minikube service command)
  ↓
Frontend Pod (Next.js)
  ├─ /api/auth/*         → Better Auth (frontend)
  ├─ /api/chatkit        → Next.js rewrites → Backend Pod
  └─ /api/:userId/tasks  → Next.js rewrites → Backend Pod
      ↓
Backend Pod (FastAPI)
  └─ Database (Neon PostgreSQL)
```

**Benefits of Proxy Pattern:**
- ✅ No CORS issues (same origin)
- ✅ No hardcoded localhost URLs
- ✅ Works with Minikube IP AND port-forward
- ✅ Production-ready architecture
