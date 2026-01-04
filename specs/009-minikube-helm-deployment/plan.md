# Implementation Plan: Minikube Kubernetes Deployment

**Branch**: `009-minikube-helm-deployment` | **Date**: 2026-01-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-minikube-helm-deployment/spec.md`

## Summary

Deploy the Phase 3 AI-powered Todo application (Next.js frontend with OpenAI ChatKit + FastAPI backend with OpenAI Agents SDK) to a local Minikube Kubernetes cluster using Helm 3.x charts. Implementation includes containerizing both applications with multi-stage Docker builds, creating comprehensive Helm charts with health probes and security contexts, implementing ConfigMaps for non-sensitive configuration and Secrets for credentials, exposing services via NodePort (frontend) and ClusterIP (backend), and providing a single-command deployment automation script. All Phase 3 functionality must remain intact with zero regression.

## Technical Context

**Language/Version**:
- Backend: Python 3.13+ (FastAPI, OpenAI Agents SDK, SQLModel)
- Frontend: TypeScript, Next.js 16 (App Router, OpenAI ChatKit)
- Kubernetes: 1.28+ (Minikube 1.32+)
- Helm: 3.x
- Infrastructure: Bash shell scripting

**Primary Dependencies**:
- Kubernetes: Minikube 1.32+ (local cluster), kubectl 1.28+ (cli)
- Package Management: Helm 3.x
- Containerization: Docker 24+
- External Services: Neon PostgreSQL, Cloudflare R2

**Storage**:
- Database: External Neon PostgreSQL (not in-cluster)
- Object Storage: External Cloudflare R2 (not in-cluster)
- Container Images: Minikube Docker daemon (no external registry)

**Testing**:
- Deployment verification: Manual (quickstart.md procedures)
- Health checks: Kubernetes liveness and readiness probes
- End-to-end: Phase 3 existing tests against Kubernetes deployment

**Target Platform**:
- Local: Minikube on Linux/Windows WSL2/macOS
- Kubernetes: v1.28+
- Container Runtime: Docker (via Minikube daemon)

**Project Type**: Web application (frontend + backend, now with Kubernetes infrastructure)

**Performance Goals**:
- Pod Ready Time: <120 seconds from deployment start
- Frontend Load Time: <5 seconds via NodePort
- Backend API Response: <500ms p95
- Health Probe Response: <5 seconds timeout
- Deployment Script: <10 minutes complete execution

**Constraints**:
- Stateless pods: No persistent volumes allowed
- External dependencies: Database and storage must remain outside cluster
- Image pull: Must use Minikube Docker daemon (imagePullPolicy: IfNotPresent)
- Security: Non-root containers (UID 1000), no hardcoded secrets
- Resource limits: CPU 500m / Memory 512Mi per container maximum
- Network: Frontend NodePort 30300, Backend ClusterIP only

**Scale/Scope**:
- Pods: 2 frontend replicas + 2 backend replicas (configurable via Helm values)
- Services: 2 services (frontend NodePort, backend ClusterIP)
- Configuration: 1 ConfigMap (non-sensitive), 1 Secret (credentials)
- Namespaces: 1 namespace (todo-app)
- Files: ~20 new files (Dockerfiles, Helm charts, deployment script, docs)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Section XVIII: Phase IV Mandatory Requirements ✅

**Kubernetes Deployment Infrastructure**:
- ✅ Minikube Cluster - Application runs on local Minikube Kubernetes cluster
- ✅ Helm Packaging - Deployment uses Helm 3.x charts for packaging and versioning
- ✅ Pod Health Probes - Every pod has liveness and readiness probes configured
- ✅ Environment Configuration - All environment variables use ConfigMaps and Secrets
- ✅ Network Services - Frontend exposes NodePort service, backend uses ClusterIP
- ✅ Automated Deployment - Single deployment command provisions entire stack
- ✅ AI Operations Tooling - Integration with kubectl-ai, kagent, Docker AI documented

**Technology Stack**:
- ✅ Orchestration Platform - Minikube version 1.32+ provides Kubernetes environment
- ✅ Chart Management - Helm version 3.x handles all application deployments
- ✅ Containerization - Docker 24+ runs via Minikube's internal Docker daemon
- ✅ Image Registry - Container images build within Minikube (no external registries)
- ✅ External Services - PostgreSQL (Neon) and object storage (Cloudflare R2) stay external

**Deployment Architecture**:
- ✅ Zero-State Pods - Every pod is stateless with no persistent volume claims
- ✅ Replica Scalability - System allows horizontal pod autoscaling across replicas
- ✅ Automated Recovery - Health probes trigger automatic pod restarts on failure
- ✅ Secret Isolation - Sensitive credentials isolated in Secrets, configuration in ConfigMaps
- ✅ Environment Injection - All secrets injected at runtime, never hardcoded

**Success Criteria**:
- ✅ Frontend and backend containers achieve Ready status within 120 seconds
- ✅ Frontend responds to requests via NodePort within 5 seconds after pod readiness
- ✅ Complete user workflows (authentication, chat, tasks) function without errors
- ✅ Liveness probes identify failed pods and trigger restarts within 30 seconds
- ✅ Deployment logs and pod environments do NOT expose secrets/API keys in plaintext
- ✅ Automated deployment script completes full stack provisioning in under 10 minutes
- ✅ Documentation includes functional examples of kubectl-ai, kagent, Docker AI usage

**GATE STATUS**: ✅ **PASSED** - All Constitution Section XVIII requirements satisfied

### Additional Constitutional Compliance

**Spec-First Development (Section I)**: ✅
- Specification created and approved before implementation
- Implementation will follow spec.md requirements exactly

**No Manual Code (Section II)**: ✅
- All code will be generated via Spec-Kit Plus workflow
- Exception: Environment-specific .env files (allowed per Constitution)

**Evolutionary Architecture (Section IV)**: ✅
- Phase 3 application code unchanged (zero regression requirement)
- Kubernetes deployment adds orchestration layer without modifying business logic
- Architecture supports Phase V cloud deployment evolution

**Automated Testing (Section VIII)**: ✅
- Health probes provide automated pod health verification
- Deployment verification via quickstart.md test procedures
- Phase 3 automated tests will run against Kubernetes deployment

## Project Structure

### Documentation (this feature)

```text
specs/009-minikube-helm-deployment/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 research (complete)
├── data-model.md        # Kubernetes resource definitions (complete)
├── quickstart.md        # Deployment verification guide (complete)
├── checklists/
│   └── requirements.md  # Specification quality checklist (complete)
└── tasks.md             # Phase 2 task breakdown (created by /sp.tasks)
```

### Source Code (repository root)

```text
phase-4-k8s-deployment/        # Phase 4 deployment artifacts
│
├── frontend/                  # Next.js application (from Phase 3)
│   ├── src/                   # Application source (unchanged)
│   ├── Dockerfile             # NEW: Multi-stage Next.js container build
│   ├── .dockerignore          # NEW: Docker build exclusions
│   ├── next.config.js         # Existing: May need output: 'standalone'
│   └── package.json           # Existing
│
├── backend/                   # FastAPI application (from Phase 3)
│   ├── src/                   # Application source (unchanged)
│   │   ├── main.py            # May need: /health, /ready endpoints
│   │   └── ...
│   ├── Dockerfile             # NEW: Multi-stage Python container build
│   ├── .dockerignore          # NEW: Docker build exclusions
│   ├── pyproject.toml         # Existing (uv dependencies)
│   └── requirements.txt       # Existing or generated
│
├── helm/                      # NEW: Helm chart directory
│   └── todo-app/
│       ├── Chart.yaml         # NEW: Helm chart metadata
│       ├── values.yaml        # NEW: Default configuration values
│       ├── values-dev.yaml    # NEW: Development environment overrides
│       └── templates/
│           ├── _helpers.tpl   # NEW: Template helper functions
│           ├── deployment-frontend.yaml   # NEW: Frontend Deployment
│           ├── deployment-backend.yaml    # NEW: Backend Deployment
│           ├── service-frontend.yaml      # NEW: Frontend NodePort Service
│           ├── service-backend.yaml       # NEW: Backend ClusterIP Service
│           ├── configmap.yaml             # NEW: Non-sensitive config
│           └── secret.yaml                # NEW: Sensitive credentials template
│
├── scripts/                   # NEW: Deployment automation
│   └── deploy.sh              # NEW: One-command deployment script
│
├── docs/                      # NEW: AI DevOps documentation
│   ├── kubectl-ai-examples.md # NEW: kubectl-ai usage examples
│   ├── kagent-guide.md        # NEW: kagent troubleshooting guide
│   └── docker-ai-optimization.md  # NEW: Docker AI image optimization
│
├── .env.example               # NEW: Template for required environment variables
├── docker-compose.yml         # OPTIONAL: Local dev without Kubernetes
└── README.md                  # UPDATE: Add Phase 4 deployment instructions
```

**Structure Decision**:
This is a **web application** (frontend + backend) enhanced with **Kubernetes infrastructure**. The existing Phase 3 application code in `phase-3-todo-ai-chatbot/` will be copied to `phase-4-k8s-deployment/` and extended with:

1. **Containerization Layer**: Dockerfiles for both frontend and backend
2. **Kubernetes Package Layer**: Helm charts defining all Kubernetes resources
3. **Automation Layer**: Deployment scripts for prerequisite validation and orchestration
4. **Documentation Layer**: AI DevOps tool usage guides

The Phase 3 application source code (`frontend/src/`, `backend/src/`) remains **unchanged** to satisfy zero-regression requirement. Only deployment infrastructure is added.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**NO VIOLATIONS** - All Constitution Section XVIII requirements are satisfied. No complexity tracking needed.

## Implementation Phases

### Phase 0: Research ✅ COMPLETE

**Status**: Complete (see [research.md](research.md))

**Deliverables**:
- ✅ Kubernetes health probe configuration patterns
- ✅ ConfigMap vs Secret usage guidelines
- ✅ NodePort vs ClusterIP service type decisions
- ✅ Helm chart structure and templating patterns
- ✅ Minikube Docker daemon integration method
- ✅ Container security (non-root user) configuration
- ✅ Resource requests and limits recommendations
- ✅ Deployment automation script workflow

### Phase 1: Design ✅ COMPLETE

**Status**: Complete

**Deliverables**:
- ✅ [data-model.md](data-model.md) - Kubernetes resource definitions
- ✅ [quickstart.md](quickstart.md) - Deployment verification procedures
- ✅ Helm values structure design
- ✅ Resource relationship mapping
- ✅ External dependency architecture

### Phase 2: Implementation Planning (Current)

**This phase (sp.plan)** creates the task breakdown for implementation.

**Next Step**: Run `/sp.tasks` to generate [tasks.md](tasks.md) with specific implementation tasks organized by user story priority.

## File-by-File Implementation Guide

### 1. Frontend Dockerfile

**Path**: `phase-4-k8s-deployment/frontend/Dockerfile`

**Purpose**: Multi-stage container build for Next.js application

**Implementation Requirements**:
- Stage 1 (deps): Install Node.js dependencies using pnpm
- Stage 2 (builder): Build Next.js production bundle
- Stage 3 (runner): Minimal runtime image with non-root user
- Security: Run as user `nextjs` (UID 1000)
- Output: Standalone Next.js server (next.config.js: output: 'standalone')
- Expose: Port 3000
- Health: Application must implement /api/health and /api/ready endpoints

**Key Configuration**:
```dockerfile
FROM node:22-alpine AS deps
RUN npm install -g pnpm@9
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

---

### 2. Backend Dockerfile

**Path**: `phase-4-k8s-deployment/backend/Dockerfile`

**Purpose**: Multi-stage container build for FastAPI application

**Implementation Requirements**:
- Stage 1 (builder): Install Python dependencies using uv
- Stage 2 (runtime): Minimal Python image with non-root user
- Security: Run as user `apiuser` (UID 1000)
- Expose: Port 8000
- Health: Application must implement /health and /ready endpoints
- Command: uvicorn with multiple workers

**Key Configuration**:
```dockerfile
FROM python:3.13-slim AS builder
RUN pip install --no-cache-dir uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

FROM python:3.13-slim
WORKDIR /app
RUN groupadd -r apiuser && useradd -r -g apiuser -u 1001 apiuser
COPY --from=builder /app/.venv /app/.venv
COPY src/ ./src/
USER apiuser
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

---

### 3. Helm Chart.yaml

**Path**: `phase-4-k8s-deployment/helm/todo-app/Chart.yaml`

**Purpose**: Helm chart metadata

**Implementation Requirements**:
```yaml
apiVersion: v2
name: todo-app
description: Phase 3 Todo Application with AI Chatbot
type: application
version: 1.0.0
appVersion: "1.0.0"
keywords:
  - todo
  - chatbot
  - ai
  - nextjs
  - fastapi
```

---

### 4. Helm values.yaml

**Path**: `phase-4-k8s-deployment/helm/todo-app/values.yaml`

**Purpose**: Default Helm chart configuration values

**Implementation Requirements**: See data-model.md "Helm Values Structure" section

**Key Sections**:
- replicaCount (frontend/backend)
- image (repository/tag/pullPolicy)
- service (type/port/nodePort)
- resources (requests/limits)
- healthProbe (liveness/readiness)
- config (ConfigMap values)
- secrets (Secret value templates)
- securityContext (runAsUser/runAsGroup)

---

### 5. Helm Deployment Templates

**Paths**:
- `phase-4-k8s-deployment/helm/todo-app/templates/deployment-frontend.yaml`
- `phase-4-k8s-deployment/helm/todo-app/templates/deployment-backend.yaml`

**Purpose**: Kubernetes Deployment resource definitions with Helm templating

**Implementation Requirements**:
- Use `.Values` for all configurable parameters
- Include template helpers for labels ({{ include "todo-app.labels" . }})
- Configure pod security context (runAsNonRoot, fsGroup)
- Configure container security context (runAsUser, capabilities.drop)
- Inject environment variables from ConfigMap and Secret
- Configure liveness and readiness probes with values from .Values.healthProbe
- Set resource requests and limits from .Values.resources
- Set imagePullPolicy: IfNotPresent (use Minikube images)

**Template Example** (frontend):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "todo-app.fullname" . }}-frontend
  labels:
    {{- include "todo-app.labels" . | nindent 4 }}
    app.kubernetes.io/component: frontend
spec:
  replicas: {{ .Values.replicaCount.frontend }}
  selector:
    matchLabels:
      {{- include "todo-app.selectorLabels" . | nindent 6 }}
      app.kubernetes.io/component: frontend
  template:
    metadata:
      labels:
        {{- include "todo-app.selectorLabels" . | nindent 8 }}
        app.kubernetes.io/component: frontend
    spec:
      securityContext:
        runAsNonRoot: true
        fsGroup: {{ .Values.securityContext.fsGroup }}
      containers:
      - name: nextjs-app
        image: "{{ .Values.image.frontend.repository }}:{{ .Values.image.frontend.tag }}"
        imagePullPolicy: {{ .Values.image.frontend.pullPolicy }}
        ports:
        - name: http
          containerPort: 3000
          protocol: TCP
        envFrom:
        - configMapRef:
            name: {{ include "todo-app.fullname" . }}-config
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: {{ include "todo-app.fullname" . }}-secrets
              key: DATABASE_URL
        # ... additional secrets
        livenessProbe:
          httpGet:
            path: {{ .Values.healthProbe.frontend.liveness.path }}
            port: http
          initialDelaySeconds: {{ .Values.healthProbe.frontend.liveness.initialDelaySeconds }}
          periodSeconds: {{ .Values.healthProbe.frontend.liveness.periodSeconds }}
        readinessProbe:
          httpGet:
            path: {{ .Values.healthProbe.frontend.readiness.path }}
            port: http
          initialDelaySeconds: {{ .Values.healthProbe.frontend.readiness.initialDelaySeconds }}
          periodSeconds: {{ .Values.healthProbe.frontend.readiness.periodSeconds }}
        resources:
          {{- toYaml .Values.resources.frontend | nindent 10 }}
        securityContext:
          runAsUser: {{ .Values.securityContext.runAsUser }}
          runAsGroup: {{ .Values.securityContext.runAsGroup }}
          allowPrivilegeEscalation: false
          capabilities:
            drop:
            - ALL
```

---

### 6. Helm Service Templates

**Paths**:
- `phase-4-k8s-deployment/helm/todo-app/templates/service-frontend.yaml` (NodePort)
- `phase-4-k8s-deployment/helm/todo-app/templates/service-backend.yaml` (ClusterIP)

**Purpose**: Kubernetes Service resource definitions

**Implementation Requirements**:
- Frontend: type: NodePort, nodePort: 30300, port: 3000
- Backend: type: ClusterIP (default), port: 8000
- Selector must match Deployment pod labels
- Use template helpers for consistent labeling

**Template Example** (frontend NodePort):
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "todo-app.fullname" . }}-frontend
  labels:
    {{- include "todo-app.labels" . | nindent 4 }}
    app.kubernetes.io/component: frontend
spec:
  type: {{ .Values.service.frontend.type }}
  ports:
  - port: {{ .Values.service.frontend.port }}
    targetPort: http
    protocol: TCP
    name: http
    {{- if and (eq .Values.service.frontend.type "NodePort") .Values.service.frontend.nodePort }}
    nodePort: {{ .Values.service.frontend.nodePort }}
    {{- end }}
  selector:
    {{- include "todo-app.selectorLabels" . | nindent 4 }}
    app.kubernetes.io/component: frontend
```

---

### 7. Helm ConfigMap Template

**Path**: `phase-4-k8s-deployment/helm/todo-app/templates/configmap.yaml`

**Purpose**: Non-sensitive configuration storage

**Implementation Requirements**:
- Use `.Values.config` for all key-value pairs
- All values must be strings (use quote filter if needed)

**Template Example**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "todo-app.fullname" . }}-config
  labels:
    {{- include "todo-app.labels" . | nindent 4 }}
data:
  BETTER_AUTH_URL: {{ .Values.config.BETTER_AUTH_URL | quote }}
  FRONTEND_URL: {{ .Values.config.FRONTEND_URL | quote }}
  BACKEND_URL: {{ .Values.config.BACKEND_URL | quote }}
  NEXT_PUBLIC_API_URL: {{ .Values.config.NEXT_PUBLIC_API_URL | quote }}
  NEXT_PUBLIC_CHATKIT_API_URL: {{ .Values.config.NEXT_PUBLIC_CHATKIT_API_URL | quote }}
  LLM_PROVIDER: {{ .Values.config.LLM_PROVIDER | quote }}
  OPENAI_DEFAULT_MODEL: {{ .Values.config.OPENAI_DEFAULT_MODEL | quote }}
  LOG_LEVEL: {{ .Values.config.LOG_LEVEL | quote }}
```

---

### 8. Helm Secret Template

**Path**: `phase-4-k8s-deployment/helm/todo-app/templates/secret.yaml`

**Purpose**: Sensitive credentials storage (base64-encoded)

**Implementation Requirements**:
- Use `.Values.secrets` for all secret values
- Values must be base64-encoded (use b64enc filter)
- Never include actual secret values in version control
- Secrets provided via `helm install --set` or external secrets management

**Template Example**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "todo-app.fullname" . }}-secrets
  labels:
    {{- include "todo-app.labels" . | nindent 4 }}
type: Opaque
data:
  DATABASE_URL: {{ .Values.secrets.DATABASE_URL | b64enc | quote }}
  BETTER_AUTH_SECRET: {{ .Values.secrets.BETTER_AUTH_SECRET | b64enc | quote }}
  OPENAI_API_KEY: {{ .Values.secrets.OPENAI_API_KEY | b64enc | quote }}
  CLOUDFLARE_R2_ACCOUNT_ID: {{ .Values.secrets.CLOUDFLARE_R2_ACCOUNT_ID | b64enc | quote }}
  CLOUDFLARE_R2_ACCESS_KEY_ID: {{ .Values.secrets.CLOUDFLARE_R2_ACCESS_KEY_ID | b64enc | quote }}
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: {{ .Values.secrets.CLOUDFLARE_R2_SECRET_ACCESS_KEY | b64enc | quote }}
  CLOUDFLARE_R2_BUCKET_NAME: {{ .Values.secrets.CLOUDFLARE_R2_BUCKET_NAME | b64enc | quote }}
```

---

### 9. Helm _helpers.tpl

**Path**: `phase-4-k8s-deployment/helm/todo-app/templates/_helpers.tpl`

**Purpose**: Template helper functions for consistent labeling and naming

**Implementation Requirements**:
- `todo-app.name`: Chart name
- `todo-app.fullname`: Release name + chart name
- `todo-app.labels`: Common labels for all resources
- `todo-app.selectorLabels`: Labels for pod selectors

**Template Example**:
```go-template
{{/*
Expand the name of the chart.
*/}}
{{- define "todo-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "todo-app.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "todo-app.labels" -}}
helm.sh/chart: {{ include "todo-app.chart" . }}
{{ include "todo-app.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "todo-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "todo-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

---

### 10. Deployment Automation Script

**Path**: `phase-4-k8s-deployment/scripts/deploy.sh`

**Purpose**: One-command deployment automation satisfying Constitution requirement

**Implementation Requirements**:
See research.md "Deployment Automation Script" section for complete workflow

**Key Steps**:
1. Validate prerequisites (minikube, helm, docker, kubectl)
2. Check Minikube status, start if needed
3. Configure Docker to use Minikube daemon (`eval $(minikube docker-env)`)
4. Build frontend and backend images in Minikube context
5. Source .env file, validate required secrets
6. Create namespace if not exists
7. Install/upgrade Helm chart with secrets via --set
8. Wait for pods to be ready (120 second timeout with progress indicator)
9. Display access URL and verification commands
10. Exit with success/failure status

**Script Template**:
```bash
#!/bin/bash
set -e

echo "=== Todo App Kubernetes Deployment ==="

# Step 1: Validate prerequisites
command -v minikube >/dev/null 2>&1 || { echo "ERROR: minikube not installed"; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "ERROR: helm not installed"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not installed"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo "ERROR: kubectl not installed"; exit 1; }

# Step 2: Check Minikube
if ! minikube status | grep -q "Running"; then
  echo "Starting Minikube..."
  minikube start --cpus=4 --memory=8192 --disk-size=20g
fi

# Step 3: Configure Docker
eval $(minikube docker-env)

# Step 4: Build images
echo "Building images..."
docker build -t todo-frontend:latest ./frontend
docker build -t todo-backend:latest ./backend

# Step 5: Load secrets
if [ ! -f ".env" ]; then
  echo "ERROR: .env file not found"
  exit 1
fi
source .env

# Validate required secrets
: "${DATABASE_URL:?ERROR: DATABASE_URL not set}"
: "${BETTER_AUTH_SECRET:?ERROR: BETTER_AUTH_SECRET not set}"
: "${OPENAI_API_KEY:?ERROR: OPENAI_API_KEY not set}"

# Step 6: Create namespace
kubectl create namespace todo-app || true

# Step 7: Deploy with Helm
echo "Deploying with Helm..."
helm upgrade --install todo-app ./helm/todo-app \
  -f ./helm/todo-app/values-dev.yaml \
  -n todo-app \
  --set secrets.DATABASE_URL="$DATABASE_URL" \
  --set secrets.BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
  --set secrets.OPENAI_API_KEY="$OPENAI_API_KEY" \
  --set secrets.CLOUDFLARE_R2_ACCOUNT_ID="${CLOUDFLARE_R2_ACCOUNT_ID:-}" \
  --set secrets.CLOUDFLARE_R2_ACCESS_KEY_ID="${CLOUDFLARE_R2_ACCESS_KEY_ID:-}" \
  --set secrets.CLOUDFLARE_R2_SECRET_ACCESS_KEY="${CLOUDFLARE_R2_SECRET_ACCESS_KEY:-}" \
  --set secrets.CLOUDFLARE_R2_BUCKET_NAME="${CLOUDFLARE_R2_BUCKET_NAME:-}" \
  --wait --timeout=5m

# Step 8: Wait for ready
echo "Waiting for pods..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=todo-app -n todo-app --timeout=120s

# Step 9: Display access info
MINIKUBE_IP=$(minikube ip)
echo "✅ Deployment complete!"
echo "Frontend URL: http://$MINIKUBE_IP:30300"
echo ""
kubectl get pods -n todo-app
```

---

### 11. Health Check Endpoints

**Paths**:
- `phase-4-k8s-deployment/frontend/src/app/api/health/route.ts` (new)
- `phase-4-k8s-deployment/frontend/src/app/api/ready/route.ts` (new)
- `phase-4-k8s-deployment/backend/src/main.py` (update)

**Purpose**: HTTP endpoints for Kubernetes health probes

**Frontend Health Endpoints** (Next.js):
```typescript
// frontend/src/app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

// frontend/src/app/api/ready/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Verify application is initialized
  // Check for required environment variables
  if (!process.env.DATABASE_URL || !process.env.BETTER_AUTH_SECRET) {
    return NextResponse.json({ status: 'not ready', reason: 'missing env vars' }, { status: 503 });
  }

  return NextResponse.json({ status: 'ready' }, { status: 200 });
}
```

**Backend Health Endpoints** (FastAPI):
```python
# backend/src/main.py (add these endpoints)
from fastapi import FastAPI, Response, status

@app.get("/health")
async def health_check():
    """Liveness probe: Check if process is alive"""
    return {"status": "healthy"}

@app.get("/ready")
async def readiness_check():
    """Readiness probe: Check if dependencies are ready"""
    try:
        # Test database connection
        await db.execute("SELECT 1")
        return {"status": "ready"}
    except Exception as e:
        return Response(
            content=json.dumps({"status": "not ready", "reason": str(e)}),
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            media_type="application/json"
        )
```

---

### 12. AI DevOps Documentation

**Paths**:
- `phase-4-k8s-deployment/docs/kubectl-ai-examples.md`
- `phase-4-k8s-deployment/docs/kagent-guide.md`
- `phase-4-k8s-deployment/docs/docker-ai-optimization.md`

**Purpose**: Document AI-assisted DevOps tool usage (Constitution requirement)

**Content Requirements**:
- kubectl-ai: Natural language kubectl command examples
- kagent: Troubleshooting workflow examples
- Docker AI: Image optimization recommendations

**Example Structure** (kubectl-ai-examples.md):
```markdown
# kubectl-ai Usage Examples

## Installation
\`\`\`bash
# Install kubectl-ai plugin
kubectl krew install ai
\`\`\`

## Example Queries

### Check Pod Status
\`\`\`bash
kubectl ai "show me all pods in todo-app namespace"
# Translates to: kubectl get pods -n todo-app
\`\`\`

### Troubleshoot Failing Pods
\`\`\`bash
kubectl ai "why is my frontend pod crashing"
# Provides diagnostic steps and commands
\`\`\`

### Resource Usage
\`\`\`bash
kubectl ai "show resource usage for backend pods"
# Translates to: kubectl top pods -n todo-app -l component=backend
\`\`\`
```

---

## Implementation Dependencies

**External Dependencies** (must exist before deployment):
1. Neon PostgreSQL database (DATABASE_URL from Phase 3)
2. Cloudflare R2 bucket (R2 credentials from Phase 3)
3. OpenAI API key (OPENAI_API_KEY from Phase 3)

**Internal Dependencies** (created during implementation):
1. Frontend health endpoints (/api/health, /api/ready)
2. Backend health endpoints (/health, /ready)
3. Next.js standalone output configuration
4. Docker images built in Minikube context

## Testing Strategy

**Unit Testing**: Not applicable (infrastructure deployment, not code logic)

**Integration Testing**:
- Health probe endpoint responses (200 OK)
- ConfigMap and Secret injection verification
- Resource limits enforcement
- Security context (non-root user) validation

**End-to-End Testing**:
- Follow quickstart.md verification procedures
- Run Phase 3 automated tests against Kubernetes deployment
- Verify all user workflows (login, tasks, chat) function correctly

**Performance Testing**:
- Measure pod ready time (<120s requirement)
- Measure frontend load time (<5s requirement)
- Measure deployment script duration (<10min requirement)
- Verify health probe response times (<5s timeout)

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Phase 3 code breaks in containers | Low | High | Extensive testing, minimal code changes (only health endpoints) |
| Secrets exposed in logs/specs | Medium | Critical | Constitution compliance checks, base64 encoding, secretKeyRef |
| Resource exhaustion on Minikube | Medium | Medium | Resource limits in Helm values, prerequisite validation (4 CPU, 8GB RAM) |
| Health probes too aggressive | Medium | Medium | Research-based timeouts (30s initial delay, 15s period) |
| Image pull failures | Low | High | Use Minikube Docker daemon (imagePullPolicy: IfNotPresent) |
| Port conflicts (30300) | Low | Medium | Document port requirements, provide error messages |
| Database connection timeout | Medium | High | Readiness probe verifies database before accepting traffic |

## Success Metrics

**Deployment Success Criteria** (from spec.md Success Criteria):
1. ✅ Pod Ready Time: <120 seconds
2. ✅ Frontend Load Time: <5 seconds via NodePort
3. ✅ End-to-End Functionality: Login, tasks, chat work without errors
4. ✅ Health Probe Recovery: Restart within 30 seconds on failure
5. ✅ Secret Security: No plaintext credentials in logs/specs
6. ✅ Deployment Duration: <10 minutes complete script execution
7. ✅ AI Tool Documentation: kubectl-ai, kagent, Docker AI examples
8. ✅ Horizontal Scaling: Multiple replicas run without conflicts
9. ✅ Configuration Flexibility: Helm values allow customization
10. ✅ Zero Regression: All Phase 3 tests pass

**Measurement Methods**:
- Time measurements: `time ./scripts/deploy.sh`
- Frontend load: Browser Network tab timing
- Pod readiness: `kubectl get pods -w` timestamp monitoring
- Health recovery: Manually kill pod process, measure restart time
- Secret security: `kubectl get secret -o yaml` inspection
- Regression testing: Run Phase 3 test suite against `http://$(minikube ip):30300`

## Next Steps

1. **Run /sp.tasks**: Generate detailed task breakdown in tasks.md
2. **Begin Implementation**: Follow tasks.md user story priority order (P1→P2→P3→P4→P5)
3. **Continuous Verification**: Test each component as implemented per quickstart.md
4. **Documentation**: Update README.md with Phase 4 deployment instructions
5. **Handoff to Phase V**: Prepare for cloud deployment (DOKS, Dapr, Kafka)

---

**Plan Status**: ✅ **COMPLETE** - Ready for task generation via /sp.tasks
