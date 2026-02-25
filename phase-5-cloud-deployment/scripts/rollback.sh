#!/bin/bash
# Rollback Script (T085)
# Rollback Helm deployments and infrastructure changes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
TERRAFORM_DIR="./terraform/aks"
NAMESPACE="${NAMESPACE:-todo}"
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

show_usage() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  --helm-only         Rollback only Helm release (no infrastructure changes)"
    echo "  --revision N        Rollback to specific Helm revision (default: previous)"
    echo "  --infrastructure    Rollback infrastructure only (Terraform destroy - DESTRUCTIVE)"
    echo "  --full              Full rollback (Helm + Infrastructure) - DESTRUCTIVE"
    echo "  --dry-run           Show what would be done without making changes"
    echo "  -h, --help          Show this help message"
    exit 0
}

# Parse arguments
HELM_ONLY=false
INFRASTRUCTURE_ONLY=false
FULL_ROLLBACK=false
DRY_RUN=false
REVISION="previous"

while [[ $# -gt 0 ]]; do
    case $1 in
        --helm-only)
            HELM_ONLY=true
            shift
            ;;
        --revision)
            REVISION="$2"
            shift 2
            ;;
        --infrastructure)
            INFRASTRUCTURE_ONLY=true
            shift
            ;;
        --full)
            FULL_ROLLBACK=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            show_usage
            ;;
        *)
            log_error "Unknown option: $1"
            ;;
    esac
done

# Default to Helm-only rollback
if [ "$INFRASTRUCTURE_ONLY" = false ] && [ "$FULL_ROLLBACK" = false ]; then
    HELM_ONLY=true
fi

# Validate prerequisites
log_info "Validating prerequisites..."
command -v kubectl >/dev/null 2>&1 || log_error "kubectl not installed"
command -v helm >/dev/null 2>&1 || log_error "Helm not installed"
if [ "$INFRASTRUCTURE_ONLY" = true ] || [ "$FULL_ROLLBACK" = true ]; then
    command -v terraform >/dev/null 2>&1 || log_error "Terraform not installed"
fi
log_success "Prerequisites validated"

# Confirm destructive operations
if [ "$DRY_RUN" = false ]; then
    if [ "$INFRASTRUCTURE_ONLY" = true ] || [ "$FULL_ROLLBACK" = true ]; then
        log_warning "This will destroy cloud infrastructure and is NOT reversible!"
        read -p "Type 'destroy' to confirm: " -r
        if [[ ! $REPLY == "destroy" ]]; then
            log_warning "Rollback cancelled"
            exit 0
        fi
    fi
fi

# Step 1: Helm Rollback
if [ "$HELM_ONLY" = true ] || [ "$FULL_ROLLBACK" = true ]; then
    log_info "Rolling back Helm release..."

    # Show available revisions
    log_info "Available revisions:"
    helm history todo-app -n "$NAMESPACE" || log_warning "Cannot get release history"

    if [ "$REVISION" = "previous" ]; then
        # Find previous revision
        CURRENT=$(helm history todo-app -n "$NAMESPACE" | tail -1 | awk '{print $1}')
        if [ -z "$CURRENT" ]; then
            log_error "Cannot determine current revision"
        fi
        REVISION=$((CURRENT - 1))
        if [ $REVISION -lt 1 ]; then
            log_error "No previous revision available"
        fi
    fi

    log_info "Rollback to revision: $REVISION"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Would rollback to revision $REVISION"
        helm rollback todo-app "$REVISION" -n "$NAMESPACE" --dry-run
    else
        helm rollback todo-app "$REVISION" -n "$NAMESPACE" || log_error "Helm rollback failed"
        log_success "Helm release rolled back"

        # Wait for rollback to complete
        log_info "Waiting for rollback to complete..."
        kubectl rollout status deployment -n "$NAMESPACE" --timeout=10m || log_warning "Some deployments may not be ready"
    fi
fi

# Step 2: Infrastructure Rollback
if [ "$INFRASTRUCTURE_ONLY" = true ] || [ "$FULL_ROLLBACK" = true ]; then
    log_info "Rolling back infrastructure..."
    cd "$TERRAFORM_DIR" || log_error "Cannot access $TERRAFORM_DIR"

    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY-RUN] Terraform destroy plan:"
        terraform plan -destroy -var-file="terraform.tfvars" -no-color | head -50
        echo "..."
    else
        log_warning "This will destroy all Azure resources!"
        read -p "Type 'yes' to confirm infrastructure destruction: " -r
        if [[ ! $REPLY == "yes" ]]; then
            log_warning "Infrastructure rollback cancelled"
            cd - || exit 1
            exit 0
        fi

        log_info "Destroying infrastructure..."
        terraform destroy -var-file="terraform.tfvars" -auto-approve || log_error "Terraform destroy failed"
        log_success "Infrastructure destroyed"
    fi

    cd - || exit 1
fi

# Final status
log_success "Rollback complete!"

if [ "$DRY_RUN" = true ]; then
    echo ""
    log_info "This was a dry-run. No changes were made."
    echo "Re-run without --dry-run to apply changes."
fi

if [ "$HELM_ONLY" = true ]; then
    echo ""
    log_info "To verify rollback:"
    echo "1. Check deployment status: kubectl get deployments -n $NAMESPACE"
    echo "2. View logs: kubectl logs -f deployment/backend -n $NAMESPACE"
    echo "3. Check release history: helm history todo-app -n $NAMESPACE"
fi
