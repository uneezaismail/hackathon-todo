# Azure Container Registry (T071)
# Stores Docker images for AKS deployment

resource "azurerm_container_registry" "todo_acr" {
  name                = "${replace(var.environment, "-", "")}todoacr${random_string.acr_suffix.result}"
  resource_group_name = azurerm_resource_group.todo_rg.name
  location            = azurerm_resource_group.todo_rg.location
  sku                 = "Basic"
  admin_enabled       = true

  tags = {
    environment = var.environment
    project     = var.project_name
  }
}

# Generate unique suffix for ACR name (must be globally unique)
resource "random_string" "acr_suffix" {
  length  = 4
  special = false
  upper   = false
}

# Role assignment: AKS can pull from ACR
resource "azurerm_role_assignment" "aks_acr_pull" {
  scope              = azurerm_container_registry.todo_acr.id
  role_definition_name = "AcrPull"
  principal_id       = azurerm_kubernetes_cluster.todo_aks.kubelet_identity[0].object_id
}

# Output ACR admin credentials for CI/CD
output "acr_login_server" {
  description = "ACR login server URL"
  value       = azurerm_container_registry.todo_acr.login_server
}

output "acr_admin_username" {
  description = "ACR admin username"
  value       = azurerm_container_registry.todo_acr.admin_username
  sensitive   = true
}

output "acr_admin_password" {
  description = "ACR admin password"
  value       = azurerm_container_registry.todo_acr.admin_password
  sensitive   = true
}
