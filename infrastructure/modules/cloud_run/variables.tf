variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "service_name" {
  description = "Service/application name"
  type        = string
}

variable "environment" {
  description = "Environment name (stg, prod)"
  type        = string

  validation {
    condition     = contains(["stg", "prod"], var.environment)
    error_message = "environment must be 'stg' or 'prod'."
  }
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "asia-northeast1"
}

variable "container_image" {
  description = "Docker container image URL"
  type        = string
}

variable "container_port" {
  description = "Container port to expose"
  type        = number
  default     = 8080
}

# -------------------------------------------------------------------
# Resources
# -------------------------------------------------------------------
variable "cpu_limit" {
  description = "CPU limit (e.g. '1', '2', '4')"
  type        = string
  default     = "1"
}

variable "memory_limit" {
  description = "Memory limit (e.g. '512Mi', '1Gi', '2Gi')"
  type        = string
  default     = "512Mi"
}

variable "cpu_throttling" {
  description = "Throttle CPU when request is not being processed"
  type        = bool
  default     = true
}

variable "startup_cpu_boost" {
  description = "Enable additional CPU for startup"
  type        = bool
  default     = false
}

# -------------------------------------------------------------------
# Scaling
# -------------------------------------------------------------------
variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 0
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 10
}

variable "concurrency" {
  description = "Maximum number of concurrent requests per instance"
  type        = number
  default     = 80
}

variable "request_timeout" {
  description = "Request timeout in seconds"
  type        = number
  default     = 300
}

# -------------------------------------------------------------------
# Health Checks
# -------------------------------------------------------------------
variable "health_check_path" {
  description = "Path for health check probes"
  type        = string
  default     = "/health"
}

variable "startup_probe_initial_delay" {
  description = "Initial delay in seconds before startup probe"
  type        = number
  default     = 0
}

# -------------------------------------------------------------------
# IAM & Networking
# -------------------------------------------------------------------
variable "service_account_email" {
  description = "Service account email for Cloud Run"
  type        = string
}

variable "allow_unauthenticated" {
  description = "Allow unauthenticated requests (public access)"
  type        = bool
  default     = true
}

variable "ingress" {
  description = "Ingress traffic setting (INGRESS_TRAFFIC_ALL, INGRESS_TRAFFIC_INTERNAL_ONLY, INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER)"
  type        = string
  default     = "INGRESS_TRAFFIC_ALL"
}

variable "vpc_connector_name" {
  description = "VPC connector name (leave empty to skip VPC)"
  type        = string
  default     = ""
}

variable "vpc_egress" {
  description = "VPC egress setting (ALL_TRAFFIC, PRIVATE_RANGES_ONLY)"
  type        = string
  default     = "PRIVATE_RANGES_ONLY"
}

# -------------------------------------------------------------------
# Environment Variables & Secrets
# -------------------------------------------------------------------
variable "env_vars" {
  description = "Public environment variables as key-value map"
  type        = map(string)
  default     = {}
}

variable "secret_env_vars" {
  description = "Secret Manager environment variables"
  type = map(object({
    secret_name = string
    version     = string
  }))
  default = {}
}

# -------------------------------------------------------------------
# Custom Domain
# -------------------------------------------------------------------
variable "enable_domain_mapping" {
  description = "Enable custom domain mapping"
  type        = bool
  default     = false
}

variable "custom_domain" {
  description = "Custom domain to map (e.g. 'app.example.com')"
  type        = string
  default     = ""
}
