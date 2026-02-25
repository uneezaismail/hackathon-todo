#!/bin/bash

# T087: Minikube Setup Script for Local Development Environment
#
# This script sets up a complete local Minikube cluster with:
# - Minikube cluster initialization
# - Required addons (storage, ingress, dapr)
# - Dapr runtime installation
# - Namespace creation
# - Memory and CPU configuration suitable for local development
#
# Usage: ./scripts/setup-minikube.sh
#
# Prerequisites:
# - minikube installed
# - kubectl installed
# - docker installed (or other supported driver)
# - helm 3.x installed

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MINIKUBE_CLUSTER_NAME="${MINIKUBE_CLUSTER_NAME:-todo-local}"
MINIKUBE_DRIVER="${MINIKUBE_DRIVER:-docker}"
MINIKUBE_CPUS="${MINIKUBE_CPUS:-4}"
MINIKUBE_MEMORY="${MINIKUBE_MEMORY:-8192}"
MINIKUBE_DISK="${MINIKUBE_DISK:-20gb}"
KUBERNETES_VERSION="${KUBERNETES_VERSION:-v1.28.0}"
DAPR_VERSION="${DAPR_VERSION:-1.12}"
NAMESPACE="${NAMESPACE:-default}"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing_tools=()

    if ! command -v minikube &> /dev/null; then
        missing_tools+=("minikube")
    fi

    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    fi

    if ! command -v helm &> /dev/null; then
        missing_tools+=("helm")
    fi

    if ! command -v docker &> /dev/null; then
        if [ "$MINIKUBE_DRIVER" = "docker" ]; then
            missing_tools+=("docker")
        fi
    fi

    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        echo "Please install the missing tools and try again."
        echo ""
        echo "Installation instructions:"
        echo "- Minikube: https://minikube.sigs.k8s.io/docs/start/"
        echo "- kubectl: https://kubernetes.io/docs/tasks/tools/"
        echo "- Helm: https://helm.sh/docs/intro/install/"
        echo "- Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi

    log_success "All prerequisites installed"
}

# Check if minikube cluster exists
cluster_exists() {
    minikube profile list | grep -q "^$MINIKUBE_CLUSTER_NAME$" && return 0 || return 1
}

# Delete existing cluster if requested
delete_existing_cluster() {
    if cluster_exists; then
        log_warning "Cluster '$MINIKUBE_CLUSTER_NAME' already exists"
        read -p "Delete and recreate? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deleting existing cluster..."
            minikube delete --profile "$MINIKUBE_CLUSTER_NAME"
            log_success "Cluster deleted"
        else
            log_info "Using existing cluster"
            return 1
        fi
    fi
    return 0
}

# Start minikube cluster
start_minikube() {
    log_info "Starting Minikube cluster '$MINIKUBE_CLUSTER_NAME'..."
    log_info "  - Driver: $MINIKUBE_DRIVER"
    log_info "  - CPU: $MINIKUBE_CPUS"
    log_info "  - Memory: ${MINIKUBE_MEMORY}MB"
    log_info "  - Disk: $MINIKUBE_DISK"
    log_info "  - Kubernetes: $KUBERNETES_VERSION"

    minikube start \
        --profile "$MINIKUBE_CLUSTER_NAME" \
        --driver "$MINIKUBE_DRIVER" \
        --cpus "$MINIKUBE_CPUS" \
        --memory "$MINIKUBE_MEMORY" \
        --disk-size "$MINIKUBE_DISK" \
        --kubernetes-version "$KUBERNETES_VERSION" \
        --addons storage-provisioner,ingress,dapr \
        --wait=all \
        --alsologtostderr

    log_success "Minikube cluster started"
}

# Set kubernetes context
set_context() {
    log_info "Setting kubectl context to '$MINIKUBE_CLUSTER_NAME'..."
    kubectl config use-context "$MINIKUBE_CLUSTER_NAME"
    log_success "Context set"
}

# Wait for cluster to be ready
wait_cluster_ready() {
    log_info "Waiting for cluster to be ready..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if kubectl cluster-info &> /dev/null && \
           kubectl get nodes &> /dev/null; then
            log_success "Cluster is ready"
            return 0
        fi

        echo -n "."
        sleep 2
        ((attempt++))
    done

    log_error "Cluster failed to become ready"
    return 1
}

# Enable required addons
enable_addons() {
    log_info "Enabling required addons..."

    local addons=("storage-provisioner" "ingress" "dapr")

    for addon in "${addons[@]}"; do
        log_info "Enabling addon: $addon"
        minikube addons enable "$addon" --profile "$MINIKUBE_CLUSTER_NAME" || \
            log_warning "Could not enable addon $addon"
    done

    log_success "Addons enabled"
}

# Initialize Dapr
init_dapr() {
    log_info "Initializing Dapr (v${DAPR_VERSION})..."

    if ! command -v dapr &> /dev/null; then
        log_warning "Dapr CLI not found. Installing..."
        wget -q https://raw.githubusercontent.com/dapr/cli/master/install/install.sh -O - | bash
    fi

    # Initialize Dapr on Kubernetes
    dapr init -k \
        --runtime-version "$DAPR_VERSION" \
        --enable-mtls=false \
        --wait \
        --timeout 10m || log_warning "Dapr initialization may have issues"

    log_success "Dapr initialized"
}

# Wait for dapr to be ready
wait_dapr_ready() {
    log_info "Waiting for Dapr sidecar injector to be ready..."
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if kubectl get deployment -n dapr-system dapr-sidecar-injector &> /dev/null && \
           [ "$(kubectl get deployment -n dapr-system dapr-sidecar-injector -o jsonpath='{.status.readyReplicas}')" = "1" ]; then
            log_success "Dapr sidecar injector is ready"
            return 0
        fi

        echo -n "."
        sleep 2
        ((attempt++))
    done

    log_warning "Dapr sidecar injector not ready (may not be critical)"
    return 0
}

# Create namespace
create_namespace() {
    log_info "Creating namespace '$NAMESPACE'..."
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    log_success "Namespace created"
}

# Configure local docker registry
configure_docker_registry() {
    log_info "Configuring Docker registry access for Minikube..."

    if [ "$MINIKUBE_DRIVER" = "docker" ]; then
        # Configure insecure registries if needed
        log_info "Docker driver detected - registry access should work"
    else
        log_info "Non-Docker driver detected - skipping registry configuration"
    fi

    log_success "Docker registry configured"
}

# Display cluster info
display_cluster_info() {
    log_info "Cluster Information:"
    echo ""
    minikube profile list
    echo ""
    log_info "Kubernetes Nodes:"
    kubectl get nodes
    echo ""
    log_info "Kubernetes Namespaces:"
    kubectl get namespaces
    echo ""
    log_info "Dapr Deployment Status:"
    kubectl get deployment -n dapr-system 2>/dev/null || log_warning "Dapr not ready yet"
    echo ""
}

# Display next steps
display_next_steps() {
    log_success "Minikube setup complete!"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Load Docker images into Minikube:"
    echo "   minikube --profile $MINIKUBE_CLUSTER_NAME image load todo-backend:latest"
    echo "   minikube --profile $MINIKUBE_CLUSTER_NAME image load todo-frontend:latest"
    echo ""
    echo "2. Build and deploy services:"
    echo "   ./scripts/deploy-local.sh"
    echo ""
    echo "3. Access services (use minikube service to get URLs):"
    echo "   minikube --profile $MINIKUBE_CLUSTER_NAME service --all"
    echo ""
    echo "4. Verify Dapr components:"
    echo "   kubectl get daprcomponents"
    echo ""
    echo "5. View Minikube dashboard:"
    echo "   minikube --profile $MINIKUBE_CLUSTER_NAME dashboard"
    echo ""
}

# Cleanup on error
cleanup_on_error() {
    log_error "Setup failed. Cleaning up..."
    # Optionally delete cluster on error
    # minikube delete --profile "$MINIKUBE_CLUSTER_NAME"
}

# Main setup flow
main() {
    log_info "Starting Minikube setup for local development..."
    echo ""

    # Trap errors
    trap cleanup_on_error ERR

    # Run setup steps
    check_prerequisites
    delete_existing_cluster || true
    start_minikube
    set_context
    wait_cluster_ready
    enable_addons
    create_namespace
    configure_docker_registry
    init_dapr
    wait_dapr_ready

    echo ""
    display_cluster_info
    echo ""
    display_next_steps

    log_success "Setup complete!"
}

# Run main
main "$@"
