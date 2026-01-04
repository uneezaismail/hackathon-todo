# Phase 0: Research - Minikube Kubernetes Deployment

**Feature**: 009-minikube-helm-deployment
**Date**: 2026-01-03
**Status**: Complete

## Overview

This research phase resolves all technical unknowns for deploying the Phase 3 AI-powered Todo application to a local Minikube Kubernetes cluster using Helm 3.x charts. Research covers Kubernetes resource configurations, Helm templating patterns, Minikube Docker integration, health probe configurations, and security best practices.

## Research Questions and Findings

### 1. Health Probe Configuration

**Question**: What are the recommended settings for liveness and readiness probes for containerized web applications?

**Decision**: Use HTTP health checks with the following configuration:

**Liveness Probe** (Detects unresponsive containers):
- Protocol: HTTP GET
- Path: `/api/health` (frontend), `/health` (backend)
- Port: Container port (3000 frontend, 8000 backend)
- initialDelaySeconds: 30 (allow application startup time)
- periodSeconds: 15 (check every 15 seconds)
- timeoutSeconds: 5 (5 seconds to respond)
- failureThreshold: 3 (restart after 3 consecutive failures)

**Readiness Probe** (Controls traffic routing):
- Protocol: HTTP GET
- Path: `/api/ready` (frontend), `/ready` (backend)
- Port: Container port (3000 frontend, 8000 backend)
- initialDelaySeconds: 10 (shorter delay for readiness)
- periodSeconds: 10 (more frequent checks)
- timeoutSeconds: 5
- failureThreshold: 3 (mark not ready after 3 failures)

**Rationale**:
- HTTP probes are simple and reliable for web applications
- Separate endpoints allow liveness to check basic process health while readiness verifies external dependencies (database, etc.)
- Initial delays account for application startup time (Next.js build, FastAPI initialization)
- Period and timeout values balance responsiveness with resource usage
- 2xx or 3xx HTTP status codes indicate success

**Alternatives Considered**:
- TCP probes: Simpler but don't verify application logic
- Exec probes: More flexible but higher overhead
- Rejected: TCP and exec probes don't validate HTTP endpoint availability

**Source**: Kubernetes documentation via Context7 (/websites/kubernetes_io)

---

### 2. ConfigMaps vs Secrets

**Question**: What configuration should go in ConfigMaps vs Secrets, and how should they be injected into containers?

**Decision**:

**ConfigMaps** (Non-sensitive configuration):
- Frontend URL (BETTER_AUTH_URL, FRONTEND_URL)
- Backend URL (NEXT_PUBLIC_API_URL)
- Log levels (LOG_LEVEL)
- LLM provider settings (LLM_PROVIDER, OPENAI_DEFAULT_MODEL)
- ChatKit API URL (NEXT_PUBLIC_CHATKIT_API_URL)

**Secrets** (Sensitive credentials):
- Database connection string (DATABASE_URL)
- JWT signing key (BETTER_AUTH_SECRET)
- OpenAI API key (OPENAI_API_KEY)
- Cloudflare R2 credentials (CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY)
- Any other API keys or tokens

**Injection Method**:
- Use `envFrom` with `configMapRef` to inject all ConfigMap entries as environment variables
- Use `env` with `valueFrom.secretKeyRef` for individual Secret values
- Alternative: Use `envFrom` with `secretRef` for all Secret entries

**Rationale**:
- ConfigMaps support runtime configuration updates without rebuilding images
- Secrets are base64-encoded (though not encrypted at rest without additional configuration)
- Environment variable injection is the simplest and most compatible method
- Separate Secret and ConfigMap ensures clear distinction between sensitive and non-sensitive data
- Matches Phase 3 application's existing environment variable usage

**Alternatives Considered**:
- Volume mounts: More complex, not needed for simple key-value pairs
- External secret management (HashiCorp Vault): Overkill for local development
- Rejected: Volume mounts add complexity without benefit for this use case

**Source**: Kubernetes documentation via Context7 (/websites/kubernetes_io)

---

### 3. NodePort vs ClusterIP Services

**Question**: When should we use NodePort vs ClusterIP service types?

**Decision**:

**Frontend Service**: NodePort
- Exposes service on each Node's IP at a static port (30300)
- Allows external access from developer's browser: `http://<minikube-ip>:30300`
- Kubernetes allocates port from range 30000-32767 (we'll specify 30300)

**Backend Service**: ClusterIP
- Exposes service only within cluster internal network
- Frontend pods access backend via DNS: `http://todo-backend:8000`
- No external access required (backend only serves internal API requests)

**Rationale**:
- NodePort enables external browser access to frontend UI
- ClusterIP provides internal-only access for backend API (security best practice)
- Static NodePort (30300) ensures consistent access URL across deployments
- ClusterIP is the default and requires less configuration

**Alternatives Considered**:
- LoadBalancer: Requires cloud provider, not available in Minikube
- Ingress: Additional complexity, not required for local development
- NodePort for backend: Unnecessary exposure, security risk
- Rejected: LoadBalancer and Ingress are overkill for local Minikube

**Source**: Kubernetes documentation via Context7 (/websites/kubernetes_io)

---

### 4. Helm Chart Structure

**Question**: How should Helm charts be structured for a multi-component application?

**Decision**:

**Chart Structure**:
```
helm/todo-app/
├── Chart.yaml           # Chart metadata (name, version, appVersion)
├── values.yaml          # Default configuration values
├── values-dev.yaml      # Development environment overrides
└── templates/
    ├── _helpers.tpl     # Template helpers (labels, names)
    ├── deployment-frontend.yaml
    ├── deployment-backend.yaml
    ├── service-frontend.yaml
    ├── service-backend.yaml
    ├── configmap.yaml
    └── secret.yaml
```

**Template Patterns**:
- Use `.Values` to reference values.yaml configuration
- Use template helpers for common labels and selectors
- Separate deployments for frontend and backend (independent scaling)
- Single ConfigMap and Secret (shared configuration)

**Example Template Syntax**:
```yaml
image: {{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}
replicas: {{ .Values.frontend.replicaCount }}
```

**Rationale**:
- Separate deployment files allow independent resource configuration
- values.yaml provides single source of configuration
- Template helpers reduce duplication
- Follows Helm best practices for multi-tier applications

**Alternatives Considered**:
- Single deployment with multiple containers: Less flexible scaling
- Separate Helm charts per component: Unnecessary complexity
- Rejected: Both alternatives reduce flexibility or increase complexity

**Source**: Helm documentation via Context7 (/websites/helm_sh)

---

### 5. Minikube Docker Integration

**Question**: How should container images be built for Minikube without an external registry?

**Decision**: Build images directly in Minikube's Docker daemon

**Commands**:
```bash
# Configure local Docker client to use Minikube's daemon
eval $(minikube docker-env)

# Build images (they're now available to Kubernetes)
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend

# Deploy with Helm (uses local images)
helm install todo-app ./helm/todo-app
```

**Configuration**:
- Set `imagePullPolicy: IfNotPresent` in Helm values (never pull from registry)
- Use `latest` tag for development (or version tags for releases)

**Rationale**:
- Eliminates need for external Docker registry (Docker Hub, GCR)
- Faster iteration cycle (no push/pull network overhead)
- Images are immediately available to Kubernetes after build
- Standard practice for local Minikube development

**Alternatives Considered**:
- Minikube registry addon: Additional setup, unnecessary for local dev
- Push to Docker Hub: Slower, requires authentication
- Rejected: External registries add complexity and latency

**Source**: Minikube documentation via Context7 (/kubernetes/minikube)

---

### 6. Container Security - Non-Root Users

**Question**: How should containers be configured to run as non-root users?

**Decision**: Configure SecurityContext in Deployment manifests

**Configuration**:
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  fsGroup: 1000
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
  readOnlyRootFilesystem: false  # Next.js needs write access for .next cache
```

**Implementation**:
- Frontend Dockerfile: Create user `nextjs` (UID 1000)
- Backend Dockerfile: Create user `apiuser` (UID 1000)
- Both containers run as these non-root users

**Rationale**:
- Security best practice: reduces container escape risk
- Kubernetes can enforce `runAsNonRoot` validation
- Matches production security requirements
- Constitution Section XVIII requires non-root containers

**Alternatives Considered**:
- Run as root: Security risk, violates Constitution
- Different UIDs per container: Unnecessary complexity
- Rejected: Running as root is explicitly prohibited

**Source**: Kubernetes documentation via Context7 (/websites/kubernetes_io)

---

### 7. Resource Requests and Limits

**Question**: What resource requests and limits should be set for frontend and backend pods?

**Decision**:

**Frontend Pod**:
- Requests: CPU 100m (0.1 core), Memory 256Mi
- Limits: CPU 500m (0.5 core), Memory 512Mi

**Backend Pod**:
- Requests: CPU 100m (0.1 core), Memory 256Mi
- Limits: CPU 500m (0.5 core), Memory 512Mi

**Rationale**:
- Requests guarantee minimum resources for scheduling
- Limits prevent resource exhaustion
- Values based on typical Next.js and FastAPI resource usage
- 2x memory limit allows for spikes (OpenAI SDK, large responses)
- CPU limits allow bursting for request processing

**Alternatives Considered**:
- No limits: Risk of resource exhaustion
- Higher limits: Wasteful on local Minikube
- Rejected: Unbounded resources can crash Minikube node

**Source**: Kubernetes documentation via Context7 (/websites/kubernetes_io)

---

### 8. Deployment Automation Script

**Question**: What should the single-command deployment script include?

**Decision**: Create `scripts/deploy.sh` with the following steps:

1. **Prerequisite Validation**:
   - Check for Minikube, Helm, Docker, kubectl
   - Verify Minikube is running (`minikube status`)
   - Verify Helm version (3.x required)

2. **Minikube Setup**:
   - Start Minikube if not running: `minikube start --cpus=4 --memory=8192`
   - Enable required addons: `minikube addons enable metrics-server`

3. **Docker Environment**:
   - Configure Docker to use Minikube daemon: `eval $(minikube docker-env)`

4. **Image Building**:
   - Build frontend image: `docker build -t todo-frontend:latest ./frontend`
   - Build backend image: `docker build -t todo-backend:latest ./backend`

5. **Environment Configuration**:
   - Source `.env` file for secrets
   - Validate required variables (DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY)

6. **Kubernetes Namespace**:
   - Create namespace: `kubectl create namespace todo-app || true`

7. **Helm Deployment**:
   - Install or upgrade chart: `helm upgrade --install todo-app ./helm/todo-app -f ./helm/todo-app/values-dev.yaml -n todo-app --set secrets.DATABASE_URL="$DATABASE_URL" --wait`

8. **Verification**:
   - Wait for pods to be ready (120 second timeout)
   - Display access URL: `http://$(minikube ip):30300`
   - Show pod status and logs

**Rationale**:
- Single command satisfies Constitution requirement
- Idempotent (can be run multiple times safely)
- Clear error messages with remediation guidance
- Waits for deployment completion before returning

**Alternatives Considered**:
- Makefile: Less portable across Windows/Mac/Linux
- CI/CD pipeline: Overkill for local deployment
- Rejected: Makefile syntax varies, script is more portable

**Source**: Best practices from reference-phase4 deploy.sh analysis

---

## Technology Stack Summary

### Confirmed Technologies

**Container Orchestration**:
- Minikube 1.32+ (local Kubernetes cluster)
- Kubernetes 1.28+ (orchestration platform)
- Helm 3.x (package manager)

**Container Runtime**:
- Docker 24+ (via Minikube's internal daemon)
- No external registry required

**Application Stack** (from Phase 3):
- Frontend: Next.js 16, TypeScript, Tailwind CSS, OpenAI ChatKit
- Backend: Python 3.13, FastAPI, OpenAI Agents SDK, SQLModel
- Database: Neon PostgreSQL (external)
- Storage: Cloudflare R2 (external)

**DevOps Tools** (documentation only):
- kubectl-ai (natural language kubectl commands)
- kagent (Kubernetes agent for troubleshooting)
- Docker AI/Gordon (Docker image optimization)

### Architecture Constraints

**Stateless Design**:
- All pods must be stateless (no PersistentVolumeClaims)
- State persists in external Neon PostgreSQL
- File uploads persist in external Cloudflare R2

**Network Architecture**:
- Frontend: NodePort 30300 (external access)
- Backend: ClusterIP (internal only)
- External dependencies: Neon (database), Cloudflare R2 (storage)

**Security Requirements**:
- Non-root containers (UID 1000)
- Secrets isolated from ConfigMaps
- No hardcoded credentials in manifests
- Resource limits to prevent exhaustion

**Scaling Support**:
- Horizontal pod autoscaling via replica count
- No sticky sessions (stateless architecture)
- External database handles concurrent connections

## Implementation Readiness

All technical unknowns have been resolved. The following artifacts can now be created:

1. ✅ **data-model.md**: Kubernetes resource definitions (Deployments, Services, ConfigMaps, Secrets)
2. ✅ **quickstart.md**: Deployment verification and testing procedures
3. ✅ **plan.md**: Complete implementation plan with file structure and tasks

No additional research required. Proceed to Phase 1 design artifacts.
