# AKS Cluster Outputs (T070)

output "resource_group_name" {
  description = "Name of the Azure Resource Group"
  value       = azurerm_resource_group.todo_rg.name
}

output "resource_group_id" {
  description = "ID of the Azure Resource Group"
  value       = azurerm_resource_group.todo_rg.id
}

output "cluster_id" {
  description = "AKS Cluster ID"
  value       = azurerm_kubernetes_cluster.todo_aks.id
}

output "cluster_name" {
  description = "AKS Cluster Name"
  value       = azurerm_kubernetes_cluster.todo_aks.name
}

output "cluster_version" {
  description = "Kubernetes version of the cluster"
  value       = azurerm_kubernetes_cluster.todo_aks.kubernetes_version
}

output "cluster_endpoint" {
  description = "Kubernetes API server endpoint"
  value       = azurerm_kubernetes_cluster.todo_aks.kube_config[0].host
  sensitive   = false
}

output "cluster_ca_certificate" {
  description = "Base64 encoded cluster CA certificate"
  value       = azurerm_kubernetes_cluster.todo_aks.kube_config[0].cluster_ca_certificate
  sensitive   = true
}

output "kube_config" {
  description = "Raw Kubernetes config YAML"
  value       = azurerm_kubernetes_cluster.todo_aks.kube_config_raw
  sensitive   = true
}

output "kube_config_path" {
  description = "Path to downloaded kubeconfig file"
  value       = local_file.kubeconfig.filename
}

output "kubelet_identity" {
  description = "Kubelet managed identity"
  value = {
    client_id = azurerm_kubernetes_cluster.todo_aks.kubelet_identity[0].client_id
    object_id = azurerm_kubernetes_cluster.todo_aks.kubelet_identity[0].object_id
  }
}

# Container Registry Outputs (T071)

output "registry_id" {
  description = "Container Registry ID"
  value       = azurerm_container_registry.acr.id
}

output "registry_name" {
  description = "Container Registry Name"
  value       = azurerm_container_registry.acr.name
}

output "registry_login_server" {
  description = "Container Registry login server URL"
  value       = azurerm_container_registry.acr.login_server
}

output "registry_admin_username" {
  description = "Container Registry admin username (if enabled)"
  value       = azurerm_container_registry.acr.admin_username
  sensitive   = true
}

output "registry_admin_password" {
  description = "Container Registry admin password (if enabled)"
  value       = azurerm_container_registry.acr.admin_password
  sensitive   = true
}

# Connection Information

output "configure_kubectl" {
  description = "Command to configure kubectl"
  value       = "az aks get-credentials --resource-group ${azurerm_resource_group.todo_rg.name} --name ${azurerm_kubernetes_cluster.todo_aks.name}"
}

output "configure_helm" {
  description = "Instructions to configure Helm"
  value       = "kubectl config use-context ${azurerm_kubernetes_cluster.todo_aks.name}"
}

output "dapr_init_command" {
  description = "Command to initialize Dapr on the cluster"
  value       = "dapr init -k --runtime-version ${var.dapr_version}"
}

# Node Pool Information

output "node_pool_count" {
  description = "Number of nodes in default pool"
  value       = azurerm_kubernetes_cluster.todo_aks.default_node_pool[0].node_count
}

output "node_pool_vm_size" {
  description = "VM size of nodes in default pool"
  value       = azurerm_kubernetes_cluster.todo_aks.default_node_pool[0].vm_size
}

# Namespace Information

output "application_namespace" {
  description = "Kubernetes namespace for applications"
  value       = kubernetes_namespace.todo.metadata[0].name
}

output "dapr_namespace" {
  description = "Kubernetes namespace for Dapr"
  value       = kubernetes_namespace.dapr_system.metadata[0].name
}

# Deployment Instructions

output "next_steps" {
  description = "Next steps to deploy applications"
  value = <<-EOT
    1. Configure kubectl:
       ${azurerm_resource_group.todo_rg.name}
       az aks get-credentials --resource-group ${azurerm_resource_group.todo_rg.name} --name ${azurerm_kubernetes_cluster.todo_aks.name}

    2. Verify cluster access:
       kubectl get nodes

    3. Deploy applications with Helm:
       helm install todo-app ../helm/todo-app -f ../helm/todo-app/values-aks.yaml -n ${kubernetes_namespace.todo.metadata[0].name}

    4. Check deployment status:
       kubectl get pods -n ${kubernetes_namespace.todo.metadata[0].name}
  EOT
}
