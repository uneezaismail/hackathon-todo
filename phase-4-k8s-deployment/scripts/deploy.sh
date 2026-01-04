#!/bin/bash

# ==============================================================================
# Phase 4 Kubernetes Deployment Automation Script
# ==============================================================================
# Single-command deployment script for Todo application to Minikube
# Handles all deployment steps: validation, image building, Helm deployment
#
# Usage:
#   ./scripts/deploy.sh
#
# Prerequisites:
#   - Minikube installed and accessible
#   - Helm 3.x installed
#   - Docker installed
#   - kubectl installed
#   - .env file with required secrets
# ==============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ==============================================================================
# Step 1: Prerequisite Validation
# ==============================================================================
log_info "Step 1: Validating prerequisites..."

# Check for required tools
if ! command -v minikube &> /dev/null; then
    log_error "minikube not found. Please install: https://minikube.sigs.k8s.io/docs/start/"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    log_error "helm not found. Please install: https://helm.sh/docs/intro/install/"
    exit 1
fi

if ! command -v docker &> /dev/null; then
    log_error "docker not found. Please install: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    log_error "kubectl not found. Please install: https://kubernetes.io/docs/tasks/tools/"
    exit 1
fi

log_success "All required tools are installed"

# ==============================================================================
# Step 2: Minikube Status Check
# ==============================================================================
log_info "Step 2: Checking Minikube status..."

if ! minikube status &> /dev/null; then
    log_warning "Minikube is not running. Starting Minikube..."
    minikube start --cpus=4 --memory=8192 --disk-size=20g
    log_success "Minikube started successfully"
else
    log_success "Minikube is already running"
fi

# ==============================================================================
# Step 3: Configure Docker Environment
# ==============================================================================
log_info "Step 3: Configuring Docker to use Minikube daemon..."

# Set Docker environment to use Minikube's Docker daemon
eval $(minikube docker-env)
log_success "Docker configured to use Minikube daemon"

# ==============================================================================
# Step 4: Build Docker Images
# ==============================================================================
log_info "Step 4: Building Docker images..."

log_info "Building frontend image..."
docker build -t todo-frontend:latest ./frontend
log_success "Frontend image built successfully"

log_info "Building backend image..."
docker build -t todo-backend:latest ./backend
log_success "Backend image built successfully"

# Verify images exist
docker images | grep todo-frontend
docker images | grep todo-backend

# ==============================================================================
# Step 5: Load Environment Variables
# ==============================================================================
log_info "Step 5: Loading environment variables from .env..."

if [ ! -f .env ]; then
    log_error ".env file not found. Please create it from .env.example"
    log_info "Run: cp .env.example .env"
    log_info "Then edit .env with your actual credentials"
    exit 1
fi

# Source environment variables
set -a  # Automatically export all variables
source .env
set +a

# Validate required environment variables
REQUIRED_VARS=("DATABASE_URL" "BETTER_AUTH_SECRET")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    log_error "Missing required environment variables: ${MISSING_VARS[*]}"
    log_info "Please set these in your .env file"
    exit 1
fi

# Validate at least one LLM provider API key is set
if [ -z "$OPENAI_API_KEY" ] && [ -z "$OPENROUTER_API_KEY" ] && [ -z "$GROQ_API_KEY" ] && [ -z "$GEMINI_API_KEY" ]; then
    log_error "At least one LLM provider API key is required (OPENAI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY)"
    log_info "Please set at least one provider in your .env file"
    exit 1
fi

log_success "All required environment variables are set"

# ==============================================================================
# Step 6: Create Namespace
# ==============================================================================
log_info "Step 6: Creating Kubernetes namespace..."

kubectl create namespace todo-app 2>/dev/null || log_warning "Namespace todo-app already exists"
log_success "Namespace ready"

# ==============================================================================
# Step 7: Deploy with Helm
# ==============================================================================
log_info "Step 7: Deploying application with Helm..."

# Get Minikube IP for NEXT_PUBLIC_* environment variables
MINIKUBE_IP=$(minikube ip)
log_info "Minikube IP: $MINIKUBE_IP"

# Deploy or upgrade Helm release
# Note: For WSL2/Minikube, use localhost URLs since we'll use kubectl port-forward
helm upgrade --install todo-app ./helm/todo-app \
    -f ./helm/todo-app/values-dev.yaml \
    -n todo-app \
    --set secrets.DATABASE_URL="$DATABASE_URL" \
    --set secrets.BETTER_AUTH_SECRET="$BETTER_AUTH_SECRET" \
    --set secrets.OPENAI_API_KEY="$OPENAI_API_KEY" \
    --set secrets.OPENROUTER_API_KEY="$OPENROUTER_API_KEY" \
    --set secrets.GROQ_API_KEY="$GROQ_API_KEY" \
    --set secrets.GEMINI_API_KEY="$GEMINI_API_KEY" \
    --set secrets.CLOUDFLARE_R2_ACCOUNT_ID="$CLOUDFLARE_R2_ACCOUNT_ID" \
    --set secrets.CLOUDFLARE_R2_ACCESS_KEY_ID="$CLOUDFLARE_R2_ACCESS_KEY_ID" \
    --set secrets.CLOUDFLARE_R2_SECRET_ACCESS_KEY="$CLOUDFLARE_R2_SECRET_ACCESS_KEY" \
    --set secrets.CLOUDFLARE_R2_BUCKET_NAME="$CLOUDFLARE_R2_BUCKET_NAME" \
    --set config.BACKEND_URL="http://todo-app-backend:8000" \
    --set config.LLM_PROVIDER="$LLM_PROVIDER" \
    --set config.OPENAI_DEFAULT_MODEL="$OPENAI_DEFAULT_MODEL" \
    --set config.GEMINI_DEFAULT_MODEL="$GEMINI_DEFAULT_MODEL" \
    --set config.GROQ_DEFAULT_MODEL="$GROQ_DEFAULT_MODEL" \
    --set config.OPENROUTER_DEFAULT_MODEL="$OPENROUTER_DEFAULT_MODEL" \
    --wait \
    --timeout=5m

log_success "Helm deployment completed"

# ==============================================================================
# Step 8: Wait for Pods to be Ready
# ==============================================================================
log_info "Step 8: Waiting for pods to be ready (max 120 seconds)..."

if kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=todo-app -n todo-app --timeout=120s; then
    log_success "All pods are ready"
else
    log_error "Pods failed to become ready within timeout"
    log_info "Checking pod status..."
    kubectl get pods -n todo-app
    log_info "Checking pod logs..."
    kubectl logs -n todo-app -l app.kubernetes.io/component=frontend --tail=50
    kubectl logs -n todo-app -l app.kubernetes.io/component=backend --tail=50
    exit 1
fi
# ==============================================================================
# Step 9: Display Access URLs
# ==============================================================================
log_info "Step 9: Deployment complete! Access information:"
echo ""
echo "=================================================="
echo "          TODO APPLICATION DEPLOYED               "
echo "=================================================="
echo ""
echo "🌐 Access Application:"
echo ""
echo "   RECOMMENDED (WSL2/Windows):"
echo "   1. Forward Frontend Port (Keep running in a separate terminal):"
echo "      kubectl port-forward svc/todo-app-frontend 3000:3000 -n todo-app --address 0.0.0.0"
echo ""
echo "   2. Forward Backend Port (Keep running in a separate terminal):"
echo "      kubectl port-forward svc/todo-app-backend 8000:8000 -n todo-app --address 0.0.0.0"
echo ""
echo "   Once forwarding is running:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend:  http://localhost:8000"
echo ""
echo "   Alternative (Linux/Mac):"
echo "   Frontend: http://$(minikube ip):30300"
echo ""
echo "📊 Useful Commands:"
echo "  - View pods:        kubectl get pods -n todo-app"
echo "  - View services:    kubectl get svc -n todo-app"
echo "  - Frontend logs:    kubectl logs -n todo-app -l app.kubernetes.io/component=frontend -f"
echo "  - Backend logs:     kubectl logs -n todo-app -l app.kubernetes.io/component=backend -f"
echo "  - Scale frontend:   kubectl scale deployment -n todo-app todo-app-frontend --replicas=3"
echo ""
echo "🗑️  Uninstall:"
echo "  - helm uninstall todo-app -n todo-app"
echo "  - kubectl delete namespace todo-app"
echo ""
echo "📚 See DEPLOY-GUIDE.md for detailed instructions"
echo "=================================================="

log_success "Deployment automation complete!"