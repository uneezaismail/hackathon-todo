# Accessing Todo App on Minikube (Local Deployment)

## 🚀 After Deployment - How to Access

Based on Minikube documentation and reference-phase4, there are **3 ways** to access your application:

---

## ✅ Method 1: Minikube Service Command (RECOMMENDED for WSL2)

**Best for:** Windows users with WSL2 + Minikube

```bash
# Opens frontend in your default browser automatically
minikube service todo-app-frontend -n todo-app

# Or get the URL only (use this URL in browser)
minikube service todo-app-frontend -n todo-app --url
```

**What it does:**
- Creates a tunnel from Windows to WSL2 to Minikube
- Opens browser automatically with correct URL
- Works around WSL2 networking limitations

---

## Method 2: NodePort with Minikube IP (Linux/Mac)

**Best for:** Linux or Mac users

```bash
# Get Minikube IP
MINIKUBE_IP=$(minikube ip)

# Access frontend
echo "Frontend: http://$MINIKUBE_IP:30300"
```

**Example:**
```
Frontend: http://192.168.49.2:30300
```

**⚠️ Does NOT work on WSL2/Windows** - Minikube IP is not accessible from Windows browser.

---

## Method 3: Port Forward (Alternative for WSL2)

**Best for:** When you need specific ports or debugging

```bash
# Terminal 1 - Forward frontend
kubectl port-forward -n todo-app --address 0.0.0.0 svc/todo-app-frontend 3000:3000

# Get your WSL2 IP
hostname -I | awk '{print $1}'
```

**Access from Windows:**
```
Frontend: http://<WSL2-IP>:3000
Example:  http://172.24.21.3:3000
```

**Note:** With Next.js proxy pattern, you only need to forward frontend (not backend).

---

## 🎯 Reference-Phase4 Approach

Reference shows this after deployment:

```bash
Frontend:  http://$(minikube ip):30300
Backend:   http://todo-app-backend.todo.svc.cluster.local:8000 (internal)

Useful Commands:
  Open frontend:  minikube service todo-app-frontend -n todo
```

**They recommend:** `minikube service` command for easy access.

---

## 📊 Comparison

| Method | Works on WSL2? | Automatic? | Best For |
|--------|----------------|------------|----------|
| `minikube service` | ✅ Yes | ✅ Yes | Windows/WSL2 users |
| NodePort + Minikube IP | ❌ No | Manual | Linux/Mac |
| Port Forward | ✅ Yes | Manual | Debugging |

---

## 🔍 Verify Deployment

```bash
# Check pods
kubectl get pods -n todo-app

# Check services
kubectl get svc -n todo-app

# View frontend logs
kubectl logs -n todo-app -l app.kubernetes.io/component=frontend -f

# View backend logs
kubectl logs -n todo-app -l app.kubernetes.io/component=backend -f
```

---

## 🐛 Troubleshooting

### "Can't reach 192.168.49.2" (Windows/WSL2)
**Solution:** Use `minikube service` command instead of Minikube IP

### "Connection refused on localhost:3000"
**Solution:** Make sure port-forward is running with `--address 0.0.0.0`

### "503 Service Unavailable"
**Solution:** Wait for pods to be ready: `kubectl get pods -n todo-app`

---

## 📝 Quick Start (WSL2/Windows)

```bash
# After deployment, run this ONE command:
minikube service todo-app-frontend -n todo-app

# Browser opens automatically! 🎉
```
