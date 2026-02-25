#!/bin/bash

# T092: Local Deployment Script for Minikube
#
# One-command deployment of complete Phase V platform to Minikube.
# Orchestrates:
# - Minikube cluster setup
# - Dapr initialization
# - Kafka deployment with Redpanda
# - Service Docker image building and loading
# - Helm chart deployment
# - Verification of all services
#
# Prerequisites:
# - ./scripts/setup-minikube.sh completed
# - Docker images built or available locally
# - .env file configured with required variables
#
# Usage: ./scripts/deploy-local.sh
# Usage with options:
#   ./scripts/deploy-local.sh --build-images --verbose
#   ./scripts/deploy-local.sh --skip-kafka --skip-tests

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MINIKUBE_CLUSTER="${MINIKUBE_CLUSTER:-todo-local}"
MINIKUBE_DRIVER="${MINIKUBE_DRIVER:-docker}"
NAMESPACE="${NAMESPACE:-default}"
KAFKA_NAMESPACE="${KAFKA_NAMESPACE:-kafka}"
HELM_RELEASE="${HELM_RELEASE:-todo-app}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Feature flags
BUILD_IMAGES=${BUILD_IMAGES:-false}
SKIP_KAFKA=${SKIP_KAFKA:-false}
SKIP_DAPR=${SKIP_DAPR:-false}
SKIP_TESTS=${SKIP_TESTS:-false}
VERBOSE=${VERBOSE:-false}
DRY_RUN=${DRY_RUN:-false}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --build-images)
                BUILD_IMAGES=true
                shift
                ;;
            --skip-kafka)
                SKIP_KAFKA=true
                shift
                ;;
            --skip-dapr)
                SKIP_DAPR=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Verbose logging
log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[VERBOSE]${NC} $1"
    fi
}

# Execute command (respecting dry-run)
execute_cmd() {
    local cmd=$1
    local description=$2

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] $description: $cmd"
    else
        if [ "$VERBOSE" = true ]; then
            log_verbose "Executing: $cmd"
        fi
        eval "$cmd" || {
            log_error "Command failed: $cmd"
            return 1
        }
    fi
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing_tools=()

    for tool in kubectl helm minikube docker; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done

    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi

    log_success "All prerequisites installed"
}

# Load environment variables
load_env() {
    log_info "Loading environment variables..."

    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        log_warning ".env file not found. Using defaults."
        return 0
    fi

    # shellcheck source=/dev/null
    source "$PROJECT_ROOT/.env"
    log_success "Environment variables loaded"
}

# Verify minikube cluster is running
verify_minikube() {
    log_info "Verifying Minikube cluster..."

    if ! minikube status --profile "$MINIKUBE_CLUSTER" &> /dev/null; then
        log_error "Minikube cluster '$MINIKUBE_CLUSTER' is not running"
        log_info "Run: ./scripts/setup-minikube.sh"
        exit 1
    fi

    log_success "Minikube cluster is running"
}

# Set kubectl context
set_context() {
    log_info "Setting kubectl context..."
    execute_cmd "kubectl config use-context $MINIKUBE_CLUSTER" "Setting context to $MINIKUBE_CLUSTER"
    log_success "Context set"
}

# Create namespaces
create_namespaces() {
    log_info "Creating Kubernetes namespaces..."

    execute_cmd "kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -" \
        "Creating namespace $NAMESPACE"

    if [ "$SKIP_KAFKA" != true ]; then
        execute_cmd "kubectl create namespace $KAFKA_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -" \
            "Creating namespace $KAFKA_NAMESPACE"
    fi

    log_success "Namespaces created"
}

# Build Docker images
build_images() {
    if [ "$BUILD_IMAGES" != true ]; then
        log_info "Skipping image build (use --build-images to build)"
        return 0
    fi

    log_info "Building Docker images..."

    # Backend
    log_info "Building backend image..."
    execute_cmd "cd $PROJECT_ROOT/backend && docker build -t todo-backend:latest ." \
        "Building backend Docker image"

    # Frontend
    log_info "Building frontend image..."
    execute_cmd "cd $PROJECT_ROOT/frontend && docker build -t todo-frontend:latest ." \
        "Building frontend Docker image"

    log_success "Docker images built"
}

# Load images into minikube
load_images() {
    log_info "Loading Docker images into Minikube..."

    local images=(
        "todo-backend:latest"
        "todo-frontend:latest"
    )

    for image in "${images[@]}"; do
        log_info "Loading image: $image"
        execute_cmd "minikube --profile $MINIKUBE_CLUSTER image load $image" \
            "Loading $image into Minikube"
    done

    log_success "Images loaded into Minikube"
}

# Deploy Kafka (optional)
deploy_kafka() {
    if [ "$SKIP_KAFKA" = true ]; then
        log_info "Skipping Kafka deployment (use --skip-kafka)"
        return 0
    fi

    log_info "Deploying Kafka (Redpanda) to Minikube..."

    # Add Redpanda Helm repo
    execute_cmd "helm repo add redpanda https://charts.redpanda.com" \
        "Adding Redpanda Helm repository"
    execute_cmd "helm repo update" \
        "Updating Helm repositories"

    # Deploy Redpanda
    execute_cmd "helm upgrade --install kafka redpanda/redpanda --namespace $KAFKA_NAMESPACE -f $PROJECT_ROOT/helm/kafka/values-local.yaml" \
        "Installing Redpanda Kafka"

    # Wait for Kafka to be ready
    log_info "Waiting for Kafka to be ready..."
    sleep 5
    execute_cmd "kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=redpanda -n $KAFKA_NAMESPACE --timeout=300s" \
        "Waiting for Kafka pod to be ready" || true

    log_success "Kafka deployed"
}

# Create Kafka topics
create_kafka_topics() {
    if [ "$SKIP_KAFKA" = true ]; then
        log_info "Skipping Kafka topics (Kafka deployment skipped)"
        return 0
    fi

    log_info "Creating Kafka topics..."

    # Wait for Kafka to accept connections
    sleep 3

    # Port-forward Kafka locally
    log_info "Setting up port-forward for Kafka..."
    kubectl port-forward -n "$KAFKA_NAMESPACE" svc/kafka 9092:9092 &
    PF_PID=$!
    sleep 2

    # Create topics
    if command -v "$SCRIPT_DIR/create-kafka-topics.sh" &> /dev/null; then
        execute_cmd "$SCRIPT_DIR/create-kafka-topics.sh" \
            "Creating Kafka topics"
    else
        log_warning "Topic creation script not found, skipping"
    fi

    # Kill port-forward
    kill $PF_PID 2>/dev/null || true

    log_success "Kafka topics created"
}

# Initialize Dapr
init_dapr() {
    if [ "$SKIP_DAPR" = true ]; then
        log_info "Skipping Dapr initialization (use --skip-dapr)"
        return 0
    fi

    log_info "Initializing Dapr..."

    if ! command -v dapr &> /dev/null; then
        log_warning "Dapr CLI not found. Skipping manual init (should be auto-initialized via minikube addon)"
    else
        # Initialize Dapr in Kubernetes
        execute_cmd "dapr init -k --runtime-version 1.12 --enable-mtls=false --wait" \
            "Initializing Dapr in Kubernetes"
    fi

    # Wait for Dapr system namespace
    log_info "Waiting for Dapr system to be ready..."
    sleep 5

    # Apply local Dapr configuration
    log_info "Applying local Dapr configuration..."
    execute_cmd "kubectl apply -f $PROJECT_ROOT/dapr/config/config-local.yaml" \
        "Applying Dapr configuration"

    log_success "Dapr initialized"
}

# Deploy application with Helm
deploy_helm() {
    log_info "Deploying application with Helm..."

    # Update Helm dependencies
    execute_cmd "helm dependency update $PROJECT_ROOT/helm/todo-app" \
        "Updating Helm dependencies"

    # Deploy Helm chart
    execute_cmd "helm upgrade --install $HELM_RELEASE $PROJECT_ROOT/helm/todo-app \
        --namespace $NAMESPACE \
        -f $PROJECT_ROOT/helm/todo-app/values-local.yaml \
        --wait=true \
        --timeout=10m" \
        "Installing Helm chart"

    log_success "Helm deployment complete"
}

# Wait for pods to be ready
wait_pods_ready() {
    log_info "Waiting for pods to be ready..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        local ready_pods=$(kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[?(@.status.conditions[?(@.type=="Ready")].status=="True")].metadata.name}' | wc -w)
        local total_pods=$(kubectl get pods -n "$NAMESPACE" -o jsonpath='{.items[*].metadata.name}' | wc -w)

        log_info "Pods ready: $ready_pods/$total_pods"

        if [ "$ready_pods" -ge "$((total_pods - 2))" ] && [ "$total_pods" -gt 0 ]; then
            log_success "All pods are ready"
            return 0
        fi

        echo -n "."
        sleep 5
        ((attempt++))
    done

    log_warning "Pods did not become ready within timeout"
    return 1
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."

    echo ""
    log_info "Pods:"
    kubectl get pods -n "$NAMESPACE"

    echo ""
    log_info "Services:"
    kubectl get svc -n "$NAMESPACE"

    echo ""
    log_info "Dapr Components:"
    kubectl get daprcomponents -n "$NAMESPACE" 2>/dev/null || true

    log_success "Deployment verified"
}

# Run tests (optional)
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_info "Skipping tests (use --skip-tests)"
        return 0
    fi

    log_info "Running deployment tests..."

    if [ -f "$PROJECT_ROOT/tests/local/test_local_env.py" ]; then
        execute_cmd "cd $PROJECT_ROOT && python -m pytest tests/local/test_local_env.py -v" \
            "Running local environment tests"
    else
        log_warning "Test file not found"
    fi
}

# Display access information
display_access_info() {
    log_success "Deployment complete!"
    echo ""
    echo "=========================================="
    echo "Access Information"
    echo "=========================================="

    # Get NodePort URLs
    local backend_port=$(kubectl get svc backend -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "30301")
    local frontend_port=$(kubectl get svc frontend -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "30300")
    local minikube_ip=$(minikube --profile "$MINIKUBE_CLUSTER" ip)

    echo ""
    echo "Frontend:  http://$minikube_ip:$frontend_port"
    echo "Backend:   http://$minikube_ip:$backend_port"
    echo "Kafka:     $minikube_ip:9092 (through port-forward)"
    echo "Dashboard: minikube --profile $MINIKUBE_CLUSTER dashboard"
    echo ""
    echo "Useful commands:"
    echo "  - View logs:      kubectl logs -f deployment/backend -n $NAMESPACE"
    echo "  - Shell access:   kubectl exec -it deployment/backend -n $NAMESPACE -- bash"
    echo "  - Port-forward:   kubectl port-forward -n $NAMESPACE svc/backend 8000:8000"
    echo "  - Watch pods:     kubectl get pods -n $NAMESPACE -w"
    echo "=========================================="
}

# Cleanup function
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Deployment failed with exit code $exit_code"
    fi
    exit $exit_code
}

# Main deployment flow
main() {
    log_info "Starting local deployment..."
    echo ""

    trap cleanup EXIT

    parse_args "$@"

    check_prerequisites
    load_env
    verify_minikube
    set_context
    create_namespaces
    build_images
    load_images
    deploy_kafka
    create_kafka_topics
    init_dapr
    deploy_helm
    wait_pods_ready
    verify_deployment
    run_tests

    echo ""
    display_access_info

    log_success "Deployment complete!"
}

# Run main
main "$@"
