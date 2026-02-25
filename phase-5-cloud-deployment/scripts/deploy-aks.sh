#!/bin/bash
# AKS Deployment Script (T084)
# Provisions infrastructure and deploys to Azure AKS

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
TERRAFORM_DIR="./terraform/aks"
HELM_CHART="./helm/todo-app"
NAMESPACE="todo"
ENVIRONMENT="${ENVIRONMENT:-prod}"

log_info() {
    echo -e "${BLUE}==> $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Step 1: Validate prerequisites
log_info "Validating prerequisites..."
command -v terraform >/dev/null 2>&1 || log_error "Terraform not installed"
command -v kubectl >/dev/null 2>&1 || log_error "kubectl not installed"
command -v helm >/dev/null 2>&1 || log_error "Helm not installed"
command -v az >/dev/null 2>&1 || log_error "Azure CLI not installed"
log_success "All tools installed"

# Step 2: Validate Terraform
log_info "Validating Terraform configuration..."
cd "$TERRAFORM_DIR" || log_error "Cannot access $TERRAFORM_DIR"
terraform validate || log_error "Terraform validation failed"
terraform fmt -check -recursive || log_warning "Terraform formatting issues (run: terraform fmt -recursive)"
log_success "Terraform validation passed"

# Step 3: Terraform Plan
log_info "Planning infrastructure changes..."
terraform plan -var-file="terraform.tfvars" -out=tfplan -no-color || log_error "Terraform plan failed"
log_success "Terraform plan complete"

# Step 4: Terraform Apply
log_info "Applying infrastructure changes..."
echo "TERRAFORM PLAN OUTPUT:"
terraform show tfplan -no-color | head -50
echo "..."
read -p "Do you want to apply these changes? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_warning "Deployment cancelled"
    rm -f tfplan
    exit 0
fi

terraform apply tfplan || log_error "Terraform apply failed"
rm -f tfplan
log_success "Infrastructure provisioned"

# Step 5: Get Kubernetes credentials
log_info "Configuring kubectl credentials..."
az aks get-credentials \
    --resource-group "$(terraform output -raw resource_group_name)" \
    --name "$(terraform output -raw cluster_name)" \
    --overwrite-existing || log_error "Failed to get AKS credentials"
log_success "kubectl configured"

# Step 6: Create namespace
log_info "Creating Kubernetes namespace..."
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f - || log_error "Failed to create namespace"
kubectl label namespace "$NAMESPACE" "environment=$ENVIRONMENT" --overwrite || true
log_success "Namespace created"

# Step 7: Verify cluster connectivity
log_info "Verifying cluster connectivity..."
kubectl get nodes || log_error "Cannot connect to Kubernetes cluster"
log_success "Cluster connectivity verified"

# Step 8: Install Dapr
log_info "Checking Dapr installation..."
if ! kubectl get namespace dapr-system >/dev/null 2>&1; then
    log_info "Installing Dapr..."
    dapr init -k --runtime-version 1.12 --enable-mtls=true || log_error "Dapr initialization failed"
    log_success "Dapr installed"
else
    log_success "Dapr already installed"
fi

# Step 9: Install monitoring stack
log_info "Installing Prometheus stack..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
helm repo update
helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --create-namespace \
    --version 48.3.1 \
    --set prometheus.prometheusSpec.retention=15d \
    --set grafana.adminPassword="$(openssl rand -base64 12)" \
    || log_error "Prometheus installation failed"
log_success "Monitoring stack installed"

# Step 10: Create Dapr components
log_info "Applying Dapr components..."
kubectl apply -f ../dapr/components/ -n "$NAMESPACE" || log_error "Failed to apply Dapr components"
log_success "Dapr components applied"

# Step 11: Helm chart validation
log_info "Validating Helm chart..."
cd - || exit 1
helm lint "$HELM_CHART" || log_error "Helm lint failed"
log_success "Helm chart validated"

# Step 12: Helm deployment
log_info "Deploying application with Helm..."
helm upgrade --install todo-app "$HELM_CHART" \
    --namespace "$NAMESPACE" \
    --values "$HELM_CHART/values.yaml" \
    --values "$HELM_CHART/values-aks.yaml" \
    --set global.domain="todo-app.example.com" \
    --wait \
    --timeout 10m \
    || log_error "Helm deployment failed"
log_success "Application deployed"

# Step 13: Wait for deployments
log_info "Waiting for deployments to become ready..."
kubectl rollout status deployment -n "$NAMESPACE" --timeout=10m || log_error "Deployments not ready"
log_success "All deployments ready"

# Step 14: Verify services
log_info "Verifying services..."
kubectl get svc -n "$NAMESPACE" || log_error "Failed to get services"
log_success "Services verified"

# Step 15: Smoke tests
log_info "Running smoke tests..."
if command -v pytest >/dev/null 2>&1; then
    pytest tests/e2e/test_smoke.py -v --timeout=300 || log_warning "Some smoke tests failed"
    log_success "Smoke tests completed"
else
    log_warning "pytest not installed, skipping smoke tests"
fi

# Final output
log_success "Deployment complete!"
echo ""
log_info "Next steps:"
echo "1. Get backend URL: kubectl port-forward svc/backend 8000:8000 -n $NAMESPACE"
echo "2. Get frontend URL: kubectl port-forward svc/frontend 3000:3000 -n $NAMESPACE"
echo "3. View logs: kubectl logs -f deployment/backend -n $NAMESPACE"
echo "4. Check Prometheus: kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090"
echo "5. Check Grafana: kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80"
