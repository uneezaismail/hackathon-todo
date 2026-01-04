# Phase 1: Data Model - Kubernetes Resources

**Feature**: 009-minikube-helm-deployment
**Date**: 2026-01-03
**Status**: Complete

## Overview

This document defines the Kubernetes resource models required to deploy the Phase 3 Todo application to Minikube. Resources include Deployments, Services, ConfigMaps, Secrets, and their relationships. All resources are packaged in Helm charts for templated deployment.

## Resource Hierarchy

```
Namespace: todo-app
│
├── ConfigMap: todo-config (non-sensitive configuration)
├── Secret: todo-secrets (sensitive credentials)
│
├── Deployment: todo-frontend
│   └── Pod(s): todo-frontend-*
│       └── Container: nextjs-app
│           ├── Reads: ConfigMap (todo-config)
│           └── Reads: Secret (todo-secrets)
│
├── Deployment: todo-backend
│   └── Pod(s): todo-backend-*
│       └── Container: fastapi-app
│           ├── Reads: ConfigMap (todo-config)
│           └── Reads: Secret (todo-secrets)
│
├── Service: todo-frontend (NodePort 30300)
│   └── Routes to: Deployment/todo-frontend pods
│
└── Service: todo-backend (ClusterIP)
    └── Routes to: Deployment/todo-backend pods
```

## Resource Definitions

### 1. Namespace

**Purpose**: Isolate all Todo application resources in a dedicated namespace

**Resource Type**: `Namespace`

**Name**: `todo-app`

**Properties**:
- **metadata.name**: `todo-app`
- **metadata.labels**:
  - `app.kubernetes.io/name`: `todo-app`
  - `app.kubernetes.io/part-of`: `todo-application`

**Relationships**:
- Contains: All other Todo app resources

---

### 2. ConfigMap - Non-Sensitive Configuration

**Purpose**: Store non-sensitive environment configuration accessible to all pods

**Resource Type**: `ConfigMap`

**Name**: `todo-config`

**Properties**:
- **metadata.name**: `todo-config`
- **metadata.namespace**: `todo-app`
- **metadata.labels**:
  - `app.kubernetes.io/name`: `todo-app`
  - `app.kubernetes.io/component`: `configuration`

**Data Fields** (key-value pairs):
| Key | Value (Example) | Description |
|-----|----------------|-------------|
| `BETTER_AUTH_URL` | `http://todo-frontend:3000` | Better Auth callback URL |
| `FRONTEND_URL` | `http://todo-frontend:3000` | Frontend service URL |
| `BACKEND_URL` | `http://todo-backend:8000` | Backend service URL |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | External backend URL for browser |
| `NEXT_PUBLIC_CHATKIT_API_URL` | `/api/chat` | ChatKit API endpoint |
| `LLM_PROVIDER` | `openai` | LLM provider name |
| `OPENAI_DEFAULT_MODEL` | `gpt-4o-mini` | Default OpenAI model |
| `LOG_LEVEL` | `info` | Application log level |

**Injection Method**:
- Pods use `envFrom.configMapRef` to inject all keys as environment variables

**Validation Rules**:
- All values must be non-empty strings
- URLs must be valid HTTP/HTTPS format
- LOG_LEVEL must be one of: debug, info, warn, error

**Relationships**:
- Read by: Frontend Deployment, Backend Deployment

---

### 3. Secret - Sensitive Credentials

**Purpose**: Store sensitive credentials with base64 encoding

**Resource Type**: `Secret`

**Name**: `todo-secrets`

**Properties**:
- **metadata.name**: `todo-secrets`
- **metadata.namespace**: `todo-app`
- **metadata.labels**:
  - `app.kubernetes.io/name`: `todo-app`
  - `app.kubernetes.io/component`: `secrets`
- **type**: `Opaque`

**Data Fields** (base64-encoded):
| Key | Example Value (plaintext) | Description |
|-----|--------------------------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@host/db` | Neon PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | `your-secret-min-32-chars` | JWT signing secret |
| `OPENAI_API_KEY` | `sk-...` | OpenAI API authentication key |
| `CLOUDFLARE_R2_ACCOUNT_ID` | `account-id` | Cloudflare R2 account ID |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | `access-key` | R2 access key |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | `secret-key` | R2 secret access key |
| `CLOUDFLARE_R2_BUCKET_NAME` | `bucket-name` | R2 bucket name |

**Injection Method**:
- Pods use `env.valueFrom.secretKeyRef` for individual secret values

**Validation Rules**:
- DATABASE_URL must be valid PostgreSQL connection string
- BETTER_AUTH_SECRET minimum 32 characters
- OPENAI_API_KEY must start with `sk-`
- All fields required (no empty values)

**Security Notes**:
- Values are base64-encoded (NOT encrypted)
- Never log secret values
- Kubernetes RBAC controls access
- Values injected as environment variables (not visible in pod specs)

**Relationships**:
- Read by: Frontend Deployment, Backend Deployment

---

### 4. Deployment - Frontend

**Purpose**: Manage frontend pod lifecycle with replica scaling and health monitoring

**Resource Type**: `Deployment`

**Name**: `todo-frontend`

**Properties**:
- **metadata.name**: `todo-frontend`
- **metadata.namespace**: `todo-app`
- **metadata.labels**:
  - `app.kubernetes.io/name`: `todo-app`
  - `app.kubernetes.io/component`: `frontend`
- **spec.replicas**: `2` (configurable via Helm values)
- **spec.selector.matchLabels**:
  - `app.kubernetes.io/name`: `todo-app`
  - `app.kubernetes.io/component`: `frontend`

**Pod Template Spec**:
- **labels**:
  - `app.kubernetes.io/name`: `todo-app`
  - `app.kubernetes.io/component`: `frontend`
- **securityContext** (pod-level):
  - `runAsNonRoot`: `true`
  - `fsGroup`: `1000`
- **containers[0]** (nextjs-app):
  - **name**: `nextjs-app`
  - **image**: `todo-frontend:latest`
  - **imagePullPolicy**: `IfNotPresent`
  - **ports**:
    - `containerPort`: `3000`, `protocol`: `TCP`
  - **env**: Injected from ConfigMap and Secret
  - **envFrom**:
    - `configMapRef.name`: `todo-config`
  - **env** (explicit secret references):
    - `DATABASE_URL` from `todo-secrets.DATABASE_URL`
    - `BETTER_AUTH_SECRET` from `todo-secrets.BETTER_AUTH_SECRET`
    - Additional secrets as needed
  - **livenessProbe**:
    - `httpGet.path`: `/api/health`
    - `httpGet.port`: `3000`
    - `initialDelaySeconds`: `30`
    - `periodSeconds`: `15`
    - `timeoutSeconds`: `5`
    - `failureThreshold`: `3`
  - **readinessProbe**:
    - `httpGet.path`: `/api/ready`
    - `httpGet.port`: `3000`
    - `initialDelaySeconds`: `10`
    - `periodSeconds`: `10`
    - `timeoutSeconds`: `5`
    - `failureThreshold`: `3`
  - **resources.requests**:
    - `cpu`: `100m`
    - `memory`: `256Mi`
  - **resources.limits**:
    - `cpu`: `500m`
    - `memory`: `512Mi`
  - **securityContext** (container-level):
    - `runAsUser`: `1000`
    - `runAsGroup`: `1000`
    - `allowPrivilegeEscalation`: `false`
    - `capabilities.drop`: `["ALL"]`

**Relationships**:
- Reads: ConfigMap (todo-config), Secret (todo-secrets)
- Managed by: Kubernetes Deployment controller
- Exposed by: Service (todo-frontend)

---

### 5. Deployment - Backend

**Purpose**: Manage backend pod lifecycle with replica scaling and health monitoring

**Resource Type**: `Deployment`

**Name**: `todo-backend`

**Properties**:
- **metadata.name**: `todo-backend`
- **metadata.namespace**: `todo-app`
- **metadata.labels**:
  - `app.kubernetes.io/name`: `todo-app`
  - `app.kubernetes.io/component`: `backend`
- **spec.replicas**: `2` (configurable via Helm values)
- **spec.selector.matchLabels**:
  - `app.kubernetes.io/name`: `todo-app`
  - `app.kubernetes.io/component`: `backend`

**Pod Template Spec**:
- **labels**:
  - `app.kubernetes.io/name`: `todo-app`
  - `app.kubernetes.io/component`: `backend`
- **securityContext** (pod-level):
  - `runAsNonRoot`: `true`
  - `fsGroup`: `1000`
- **containers[0]** (fastapi-app):
  - **name**: `fastapi-app`
  - **image**: `todo-backend:latest`
  - **imagePullPolicy**: `IfNotPresent`
  - **ports**:
    - `containerPort`: `8000`, `protocol`: `TCP`
  - **envFrom**:
    - `configMapRef.name`: `todo-config`
  - **env** (explicit secret references):
    - `DATABASE_URL` from `todo-secrets.DATABASE_URL`
    - `BETTER_AUTH_SECRET` from `todo-secrets.BETTER_AUTH_SECRET`
    - `OPENAI_API_KEY` from `todo-secrets.OPENAI_API_KEY`
    - `CLOUDFLARE_R2_*` from corresponding secret keys
  - **livenessProbe**:
    - `httpGet.path`: `/health`
    - `httpGet.port`: `8000`
    - `initialDelaySeconds`: `30`
    - `periodSeconds`: `15`
    - `timeoutSeconds`: `5`
    - `failureThreshold`: `3`
  - **readinessProbe**:
    - `httpGet.path`: `/ready`
    - `httpGet.port`: `8000`
    - `initialDelaySeconds`: `10`
    - `periodSeconds`: `10`
    - `timeoutSeconds`: `5`
    - `failureThreshold`: `3`
  - **resources.requests**:
    - `cpu`: `100m`
    - `memory`: `256Mi`
  - **resources.limits**:
    - `cpu`: `500m`
    - `memory`: `512Mi`
  - **securityContext** (container-level):
    - `runAsUser`: `1000`
    - `runAsGroup`: `1000`
    - `allowPrivilegeEscalation`: `false`
    - `capabilities.drop`: `["ALL"]`

**Relationships**:
- Reads: ConfigMap (todo-config), Secret (todo-secrets)
- Managed by: Kubernetes Deployment controller
- Exposed by: Service (todo-backend)
- Connects to: External Neon PostgreSQL, External Cloudflare R2

---

### 6. Service - Frontend (NodePort)

**Purpose**: Expose frontend pods to external traffic via static NodePort

**Resource Type**: `Service`

**Name**: `todo-frontend`

**Properties**:
- **metadata.name**: `todo-frontend`
- **metadata.namespace**: `todo-app`
- **metadata.labels**:
  - `app.kubernetes.io/name`: `todo-app`
  - `app.kubernetes.io/component`: `frontend`
- **spec.type**: `NodePort`
- **spec.selector**:
  - `app.kubernetes.io/name`: `todo-app`
  - `app.kubernetes.io/component`: `frontend`
- **spec.ports[0]**:
  - `name`: `http`
  - `protocol`: `TCP`
  - `port`: `3000` (ClusterIP port)
  - `targetPort`: `3000` (container port)
  - `nodePort`: `30300` (external access port)

**Access Methods**:
- **External**: `http://<minikube-ip>:30300` (from developer's browser)
- **Internal**: `http://todo-frontend:3000` (from other pods)

**Traffic Routing**:
- Routes to: All pods matching selector (frontend Deployment pods)
- Load balancing: Round-robin across ready pods
- Health checks: Only routes to pods passing readiness probe

**Relationships**:
- Selects: Deployment/todo-frontend pods
- Accessed by: External browsers (NodePort), Backend pods (ClusterIP)

---

### 7. Service - Backend (ClusterIP)

**Purpose**: Expose backend pods within cluster network only

**Resource Type**: `Service`

**Name**: `todo-backend`

**Properties**:
- **metadata.name**: `todo-backend`
- **metadata.namespace**: `todo-app`
- **metadata.labels**:
  - `app.kubernetes.io/name`: `todo-app`
  - `app.kubernetes.io/component`: `backend`
- **spec.type**: `ClusterIP` (default, internal only)
- **spec.selector**:
  - `app.kubernetes.io/name`: `todo-app`
  - `app.kubernetes.io/component`: `backend`
- **spec.ports[0]**:
  - `name`: `http`
  - `protocol`: `TCP`
  - `port`: `8000` (service port)
  - `targetPort`: `8000` (container port)

**Access Methods**:
- **Internal only**: `http://todo-backend:8000` (from frontend pods)
- **External**: Not accessible (ClusterIP is internal)

**DNS Resolution**:
- Pods can resolve via: `todo-backend.todo-app.svc.cluster.local`
- Short name works within same namespace: `todo-backend`

**Traffic Routing**:
- Routes to: All pods matching selector (backend Deployment pods)
- Load balancing: Round-robin across ready pods
- Health checks: Only routes to pods passing readiness probe

**Relationships**:
- Selects: Deployment/todo-backend pods
- Accessed by: Frontend pods (API calls)

---

## Helm Values Structure

The following structure will be used in `values.yaml` to template all resources:

```yaml
# Replica counts (horizontal scaling)
replicaCount:
  frontend: 2
  backend: 2

# Container images
image:
  frontend:
    repository: todo-frontend
    tag: latest
    pullPolicy: IfNotPresent
  backend:
    repository: todo-backend
    tag: latest
    pullPolicy: IfNotPresent

# Service configurations
service:
  frontend:
    type: NodePort
    port: 3000
    nodePort: 30300
  backend:
    type: ClusterIP
    port: 8000

# Resource requests and limits
resources:
  frontend:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi
  backend:
    requests:
      cpu: 100m
      memory: 256Mi
    limits:
      cpu: 500m
      memory: 512Mi

# Health probe configurations
healthProbe:
  frontend:
    liveness:
      path: /api/health
      initialDelaySeconds: 30
      periodSeconds: 15
    readiness:
      path: /api/ready
      initialDelaySeconds: 10
      periodSeconds: 10
  backend:
    liveness:
      path: /health
      initialDelaySeconds: 30
      periodSeconds: 15
    readiness:
      path: /ready
      initialDelaySeconds: 10
      periodSeconds: 10

# Non-sensitive configuration (ConfigMap)
config:
  BETTER_AUTH_URL: "http://todo-frontend:3000"
  FRONTEND_URL: "http://todo-frontend:3000"
  BACKEND_URL: "http://todo-backend:8000"
  NEXT_PUBLIC_API_URL: "http://localhost:8000"
  NEXT_PUBLIC_CHATKIT_API_URL: "/api/chat"
  LLM_PROVIDER: "openai"
  OPENAI_DEFAULT_MODEL: "gpt-4o-mini"
  LOG_LEVEL: "info"

# Sensitive credentials (Secret) - empty by default, set via --set or external secrets
secrets:
  DATABASE_URL: ""
  BETTER_AUTH_SECRET: ""
  OPENAI_API_KEY: ""
  CLOUDFLARE_R2_ACCOUNT_ID: ""
  CLOUDFLARE_R2_ACCESS_KEY_ID: ""
  CLOUDFLARE_R2_SECRET_ACCESS_KEY: ""
  CLOUDFLARE_R2_BUCKET_NAME: ""

# Security context
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  fsGroup: 1000
```

## Resource Relationships Summary

```
┌─────────────┐
│  Namespace  │
│  todo-app   │
└──────┬──────┘
       │
       ├─── ConfigMap (todo-config)
       │    ├─> Read by Frontend Deployment
       │    └─> Read by Backend Deployment
       │
       ├─── Secret (todo-secrets)
       │    ├─> Read by Frontend Deployment
       │    └─> Read by Backend Deployment
       │
       ├─── Frontend Deployment
       │    ├─> Manages Frontend Pods
       │    └─> Exposed by Frontend Service
       │
       ├─── Backend Deployment
       │    ├─> Manages Backend Pods
       │    └─> Exposed by Backend Service
       │
       ├─── Frontend Service (NodePort 30300)
       │    └─> Routes to Frontend Pods
       │
       └─── Backend Service (ClusterIP)
            └─> Routes to Backend Pods
```

## External Dependencies

**Not managed by Kubernetes** (external to cluster):

1. **Neon PostgreSQL Database**
   - Connection via DATABASE_URL secret
   - Accessible from Minikube network
   - Shared across all backend pods

2. **Cloudflare R2 Object Storage**
   - Connection via R2 credentials in secrets
   - Accessible from backend pods
   - Shared storage for file uploads

3. **Minikube Docker Daemon**
   - Hosts container images
   - No external registry required

## Validation Rules

**Before deployment**:
1. All Secret values must be non-empty
2. DATABASE_URL must be valid PostgreSQL connection string
3. NodePort 30300 must be available
4. Minikube cluster must have sufficient resources (4 CPU, 8GB RAM recommended)
5. Docker images (todo-frontend:latest, todo-backend:latest) must exist in Minikube daemon

**After deployment**:
1. All pods must pass readiness probes within 120 seconds
2. Frontend must be accessible at `http://<minikube-ip>:30300`
3. Backend must be accessible internally at `http://todo-backend:8000`
4. Health endpoints must return 200 OK status
5. No secrets visible in pod environment inspection
