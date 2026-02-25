# Azure Provider Variables
variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
}

# General Configuration
variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name for resource naming and tagging"
  type        = string
  default     = "todo-app"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "East US"
}

# Resource Group Configuration
variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "todo-rg"
}

# AKS Cluster Configuration (T068)
variable "cluster_name" {
  description = "Name of the AKS cluster"
  type        = string
  default     = "todo-aks"
}

variable "dns_prefix" {
  description = "DNS prefix for AKS cluster"
  type        = string
  default     = "todoaks"
}

variable "kubernetes_version" {
  description = "Kubernetes version for AKS"
  type        = string
  default     = "1.28"
}

variable "node_count" {
  description = "Initial number of nodes in the default node pool"
  type        = number
  default     = 2
}

variable "vm_size" {
  description = "VM size for AKS nodes"
  type        = string
  default     = "Standard_B2s" # 2 vCPUs, 4GB RAM
}

variable "os_disk_size_gb" {
  description = "OS disk size for AKS nodes (GB)"
  type        = number
  default     = 30
}

# Network Configuration (T068)
variable "service_cidr" {
  description = "Kubernetes service CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "dns_service_ip" {
  description = "DNS service IP within the service CIDR"
  type        = string
  default     = "10.0.0.10"
}

# Container Registry Configuration (T071)
variable "registry_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = "todoappregistry"
}

variable "registry_sku" {
  description = "SKU for Container Registry (Basic, Standard, Premium)"
  type        = string
  default     = "Standard"
}

# Kubernetes Configuration
variable "namespace" {
  description = "Kubernetes namespace for applications"
  type        = string
  default     = "default"
}

# Dapr Configuration (T073)
variable "dapr_version" {
  description = "Dapr Helm chart version"
  type        = string
  default     = "1.12.0"
}

variable "dapr_log_level" {
  description = "Dapr log level (debug, info, warn, error)"
  type        = string
  default     = "info"
}

# Application Configuration
variable "app_replicas_backend" {
  description = "Number of replicas for backend service"
  type        = number
  default     = 2
}

variable "app_replicas_frontend" {
  description = "Number of replicas for frontend service"
  type        = number
  default     = 2
}

# Storage Configuration
variable "postgres_enabled" {
  description = "Enable PostgreSQL deployment"
  type        = bool
  default     = true
}

variable "kafka_enabled" {
  description = "Enable Kafka deployment"
  type        = bool
  default     = true
}

# Monitoring Configuration
variable "enable_monitoring" {
  description = "Enable monitoring stack (Prometheus, Grafana)"
  type        = bool
  default     = true
}

# Tags
variable "additional_tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}
