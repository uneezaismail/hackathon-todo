terraform {
  required_version = ">= 1.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = ">= 2.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Resource Group (T068)
resource "azurerm_resource_group" "todo_rg" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    environment = var.environment
    project     = var.project_name
    terraform   = "true"
  }
}

# AKS Cluster (T068)
resource "azurerm_kubernetes_cluster" "todo_aks" {
  name                = var.cluster_name
  location            = azurerm_resource_group.todo_rg.location
  resource_group_name = azurerm_resource_group.todo_rg.name
  dns_prefix          = var.dns_prefix
  kubernetes_version  = var.kubernetes_version

  default_node_pool {
    name            = "default"
    node_count      = var.node_count
    vm_size         = var.vm_size
    os_disk_size_gb = var.os_disk_size_gb

    tags = {
      environment = var.environment
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin = "azure"
    service_cidr   = var.service_cidr
    dns_service_ip = var.dns_service_ip
  }

  tags = {
    environment = var.environment
    project     = var.project_name
  }
}

# Container Registry (T071)
resource "azurerm_container_registry" "acr" {
  name                = var.registry_name
  resource_group_name = azurerm_resource_group.todo_rg.name
  location            = azurerm_resource_group.todo_rg.location
  sku                 = var.registry_sku

  admin_enabled = false

  tags = {
    environment = var.environment
    project     = var.project_name
  }
}

# Role assignment for AKS to pull from ACR
resource "azurerm_role_assignment" "aks_acr" {
  scope              = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id       = azurerm_kubernetes_cluster.todo_aks.kubelet_identity[0].object_id
}

# Kubernetes Provider Configuration
provider "kubernetes" {
  host                   = azurerm_kubernetes_cluster.todo_aks.kube_config[0].host
  client_certificate     = base64decode(azurerm_kubernetes_cluster.todo_aks.kube_config[0].client_certificate)
  client_key             = base64decode(azurerm_kubernetes_cluster.todo_aks.kube_config[0].client_key)
  cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.todo_aks.kube_config[0].cluster_ca_certificate)
}

# Helm Provider Configuration
provider "helm" {
  kubernetes {
    host                   = azurerm_kubernetes_cluster.todo_aks.kube_config[0].host
    client_certificate     = base64decode(azurerm_kubernetes_cluster.todo_aks.kube_config[0].client_certificate)
    client_key             = base64decode(azurerm_kubernetes_cluster.todo_aks.kube_config[0].client_key)
    cluster_ca_certificate = base64decode(azurerm_kubernetes_cluster.todo_aks.kube_config[0].cluster_ca_certificate)
  }
}

# Create namespace
resource "kubernetes_namespace" "todo" {
  metadata {
    name = var.namespace
  }

  depends_on = [azurerm_kubernetes_cluster.todo_aks]
}

# Dapr Namespace
resource "kubernetes_namespace" "dapr_system" {
  metadata {
    name = "dapr-system"
  }

  depends_on = [azurerm_kubernetes_cluster.todo_aks]
}

# Install Dapr via Helm (T073)
resource "helm_release" "dapr" {
  name             = "dapr"
  repository       = "https://dapr.github.io/helm-charts/"
  chart            = "dapr"
  namespace        = kubernetes_namespace.dapr_system.metadata[0].name
  version          = var.dapr_version
  create_namespace = false

  set {
    name  = "global.logLevel"
    value = var.dapr_log_level
  }

  set {
    name  = "dapr_operator.serviceAccount.annotations.azure\\.workload\\.identity/client-id"
    value = azurerm_kubernetes_cluster.todo_aks.kubelet_identity[0].object_id
  }

  depends_on = [
    kubernetes_namespace.dapr_system,
    azurerm_kubernetes_cluster.todo_aks
  ]
}

# Output kubeconfig for local access
resource "local_file" "kubeconfig" {
  filename              = "${path.module}/kubeconfig.yaml"
  content               = azurerm_kubernetes_cluster.todo_aks.kube_config_raw
  file_permission       = "0600"
  directory_permission  = "0700"
}
