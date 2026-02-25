# Terraform Infrastructure

Infrastructure as Code for Phase V cloud deployment.

## Directory Structure

```
terraform/
└── aks/                  # Azure Kubernetes Service
    ├── main.tf          # AKS cluster, node pools
    ├── variables.tf     # Input variables
    ├── outputs.tf       # Output values
    └── terraform.tfvars.example  # Example configuration
```

## Azure AKS Deployment

### Prerequisites

1. Azure CLI installed and configured
2. Terraform 1.5+ installed
3. Azure subscription with AKS permissions

### Quick Start

```bash
cd terraform/aks

# Initialize Terraform
terraform init

# Review plan
terraform plan -var-file="terraform.tfvars"

# Apply infrastructure
terraform apply -var-file="terraform.tfvars"

# Get kubeconfig
az aks get-credentials --resource-group todo-rg --name todo-aks-cluster
```

### Configuration

Create `terraform.tfvars` from example:

```hcl
resource_group_name = "todo-rg"
location           = "eastus"
cluster_name       = "todo-aks-cluster"
node_count         = 2
node_size          = "Standard_B2s"
kubernetes_version = "1.28"
```

### Post-Deployment

After AKS is provisioned:

1. Install Dapr: `dapr init -k --runtime-version 1.12`
2. Apply Dapr components: `kubectl apply -f ../dapr/components/`
3. Deploy application: `helm install todo-app ../helm/todo-app/`
