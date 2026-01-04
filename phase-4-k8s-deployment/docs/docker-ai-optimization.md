# Docker AI Optimization Guide for Todo App

## Overview

This guide covers AI-powered tools and techniques for optimizing Docker images in the Todo application. Focus areas include image size reduction, multi-stage build optimization, and security scanning.

## Docker AI Tools

### 1. Docker Desktop AI Assistant (Built-in)

Docker Desktop (version 4.29+) includes an AI assistant for container optimization.

**Features**:
- Image analysis and recommendations
- Dockerfile best practices
- Security vulnerability detection
- Build optimization suggestions

**Usage**:
```bash
# Enable AI features in Docker Desktop settings
# Settings > Features > Docker AI

# Analyze Dockerfile
docker scout ai-analyze Dockerfile
```

### 2. Docker Scout (Security & Optimization)

Docker Scout provides AI-powered image analysis for security and optimization.

**Installation**:
```bash
# Docker Scout is built into Docker Desktop 4.17+
# Or install as CLI plugin
docker scout version

# Login to Docker Scout
docker scout auth login
```

**Analyze Todo App Images**:
```bash
# Analyze frontend image
docker scout cves todo-frontend:latest
docker scout recommendations todo-frontend:latest

# Analyze backend image
docker scout cves todo-backend:latest
docker scout recommendations todo-backend:latest
```

### 3. Dive (Image Layer Analysis)

Dive analyzes Docker image layers to identify wasted space.

**Installation**:
```bash
# MacOS
brew install dive

# Linux
wget https://github.com/wagoodman/dive/releases/download/v0.11.0/dive_0.11.0_linux_amd64.deb
sudo apt install ./dive_0.11.0_linux_amd64.deb

# Windows (WSL2)
wget https://github.com/wagoodman/dive/releases/download/v0.11.0/dive_0.11.0_linux_amd64.tar.gz
tar -xzf dive_0.11.0_linux_amd64.tar.gz
sudo mv dive /usr/local/bin/
```

**Analyze Images**:
```bash
# Analyze frontend image
dive todo-frontend:latest

# Analyze backend image
dive todo-backend:latest
```

## Optimization Strategies for Todo App

### Frontend Dockerfile Optimization

**Current Dockerfile Analysis**:
```dockerfile
# Current: phase-4-k8s-deployment/frontend/Dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:22-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1000 -S nodejs && adduser -S nextjs -u 1000 -G nodejs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

**Optimization Recommendations**:

1. **Use .dockerignore** (Already implemented ✅):
```dockerignore
node_modules
.next
.git
*.log
coverage
.env.local
```

2. **Leverage Build Cache**:
```dockerfile
# Separate dependency installation for better caching
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production --prefer-offline
```

3. **Minimize Final Image Size**:
```dockerfile
# Use distroless or minimal base for runner stage
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runner
# Even smaller than alpine (no shell, minimal attack surface)
```

4. **Security Hardening**:
```dockerfile
# Drop capabilities (already done with USER nextjs ✅)
# Use read-only filesystem
FROM node:22-alpine AS runner
# ... existing setup ...
USER nextjs
# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"
```

**Expected Improvements**:
- Current size: ~150-200MB
- Optimized size: ~100-120MB (using distroless)
- Build time: ~2-3 minutes → ~1-2 minutes (better caching)

### Backend Dockerfile Optimization

**Current Dockerfile Analysis**:
```dockerfile
# Current: phase-4-k8s-deployment/backend/Dockerfile
FROM python:3.13-slim AS builder
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-cache

FROM python:3.13-slim AS runner
WORKDIR /app
RUN useradd -m -u 1000 apiuser
COPY --from=builder /app/.venv /app/.venv
COPY . .
USER apiuser
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Optimization Recommendations**:

1. **Use Distroless Python**:
```dockerfile
FROM python:3.13-slim AS builder
# ... build stage ...

# Smaller final image
FROM gcr.io/distroless/python3-debian12:nonroot AS runner
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY --chown=nonroot:nonroot src ./src
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. **Optimize UV Cache**:
```dockerfile
FROM python:3.13-slim AS builder
WORKDIR /app
RUN pip install --no-cache-dir uv
COPY pyproject.toml uv.lock ./
# Use UV cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen
```

3. **Multi-Architecture Builds**:
```dockerfile
# Support ARM64 for Apple Silicon and cloud ARM instances
FROM --platform=$BUILDPLATFORM python:3.13-slim AS builder
ARG TARGETPLATFORM
ARG BUILDPLATFORM
# ... rest of Dockerfile ...
```

4. **Add Healthcheck**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health').getcode() == 200 or exit(1)"
```

**Expected Improvements**:
- Current size: ~200-250MB
- Optimized size: ~120-150MB (using distroless)
- Startup time: Faster with optimized dependencies

## Image Size Reduction Techniques

### 1. Remove Unnecessary Files

**Frontend**:
```dockerignore
# Add to .dockerignore
.git
.github
node_modules
.next
*.md
*.log
coverage
.env*
!.env.example
tests
__tests__
*.test.ts
*.spec.ts
```

**Backend**:
```dockerignore
# Add to .dockerignore
.git
__pycache__
*.pyc
.pytest_cache
.venv
venv
tests
*.md
*.log
.env*
!.env.example
alembic/versions/*.pyc
```

### 2. Use Specific Base Images

```dockerfile
# ❌ Bad: Generic base image
FROM ubuntu:22.04

# ✅ Good: Specific language base
FROM python:3.13-slim

# ✅ Better: Distroless (smallest, most secure)
FROM gcr.io/distroless/python3-debian12:nonroot
```

### 3. Combine RUN Commands

```dockerfile
# ❌ Bad: Multiple layers
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get clean

# ✅ Good: Single layer
RUN apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*
```

### 4. Use Build-time Arguments

```dockerfile
ARG NODE_ENV=production
ARG PYTHON_VERSION=3.13

FROM python:${PYTHON_VERSION}-slim
ENV NODE_ENV=${NODE_ENV}
```

## Security Scanning with Docker Scout

### Scan for Vulnerabilities

```bash
# Scan frontend image
docker scout cves todo-frontend:latest

# Get detailed CVE report
docker scout cves --format json --output frontend-cves.json todo-frontend:latest

# Scan backend image
docker scout cves todo-backend:latest

# Compare with base image
docker scout compare --to node:22-alpine todo-frontend:latest
```

### Analyze Recommendations

```bash
# Get optimization recommendations
docker scout recommendations todo-frontend:latest

# Expected output:
# - Update base image to latest patch version
# - Remove unused dependencies
# - Fix known vulnerabilities
# - Optimize layer structure
```

### Generate SBOM (Software Bill of Materials)

```bash
# Generate SBOM for frontend
docker scout sbom todo-frontend:latest > frontend-sbom.json

# Generate SBOM for backend
docker scout sbom todo-backend:latest > backend-sbom.json
```

## Build Optimization

### Use BuildKit Features

```bash
# Enable BuildKit (default in Docker 23.0+)
export DOCKER_BUILDKIT=1

# Build with cache mount
docker build \
  --cache-from=todo-frontend:latest \
  --build-arg BUILDKIT_INLINE_CACHE=1 \
  -t todo-frontend:latest \
  ./frontend

# Multi-platform build
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t todo-frontend:latest \
  ./frontend
```

### Optimize Build Context

```bash
# Check build context size
docker build --no-cache --progress=plain -t todo-frontend:latest ./frontend 2>&1 | grep "transferring context"

# Expected: < 10MB after .dockerignore optimization
```

### Parallel Builds

```bash
# Build both images in parallel
docker compose build --parallel

# Or manually
docker build -t todo-frontend:latest ./frontend &
docker build -t todo-backend:latest ./backend &
wait
```

## Automated Optimization Pipeline

### Pre-commit Hook for Dockerfile Linting

```bash
# Install hadolint (Dockerfile linter)
brew install hadolint  # MacOS
sudo apt install hadolint  # Linux

# Lint Dockerfiles
hadolint frontend/Dockerfile
hadolint backend/Dockerfile

# Add to .git/hooks/pre-commit
#!/bin/bash
hadolint frontend/Dockerfile || exit 1
hadolint backend/Dockerfile || exit 1
```

### CI/CD Integration (GitHub Actions Example)

```yaml
# .github/workflows/docker-optimize.yml
name: Docker Image Optimization

on: [push, pull_request]

jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build images
        run: |
          docker build -t todo-frontend:latest ./frontend
          docker build -t todo-backend:latest ./backend

      - name: Scan with Docker Scout
        run: |
          docker scout cves todo-frontend:latest
          docker scout cves todo-backend:latest

      - name: Analyze with Dive
        run: |
          docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            wagoodman/dive:latest todo-frontend:latest --ci
```

## Monitoring Image Metrics

### Track Image Size Over Time

```bash
# Get current image sizes
docker images | grep todo-

# Expected output:
# todo-frontend   latest   abc123   5 minutes ago   120MB
# todo-backend    latest   def456   5 minutes ago   150MB
```

### Build Performance Metrics

```bash
# Time the build
time docker build -t todo-frontend:latest ./frontend

# Expected: < 2 minutes for cached builds
```

## Best Practices Checklist

- [x] Use multi-stage builds (Frontend & Backend)
- [x] Use .dockerignore files (Frontend & Backend)
- [x] Run as non-root user (nextjs UID 1000, apiuser UID 1000)
- [ ] Add HEALTHCHECK instructions (Recommended)
- [x] Use specific base image versions (node:22-alpine, python:3.13-slim)
- [ ] Minimize RUN layers (Can be improved)
- [x] Copy only necessary files (Using standalone output for Next.js)
- [ ] Use distroless images for production (Advanced optimization)
- [ ] Implement cache mounts (BuildKit feature)
- [ ] Scan for vulnerabilities regularly (With Docker Scout)

## Resources

- **Docker Scout**: https://docs.docker.com/scout/
- **Dive Tool**: https://github.com/wagoodman/dive
- **Hadolint**: https://github.com/hadolint/hadolint
- **Distroless Images**: https://github.com/GoogleContainerTools/distroless
- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/
- **BuildKit Documentation**: https://docs.docker.com/build/buildkit/
