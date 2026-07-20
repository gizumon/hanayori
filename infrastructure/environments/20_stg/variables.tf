variable "container_image" {
  description = "Docker container image URL"
  type        = string
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 8080
}

variable "health_check_path" {
  description = "Health check endpoint path"
  type        = string
  default     = "/"
}

variable "custom_domain" {
  description = "Custom domain (leave empty to disable, e.g. 'stg.example.com')"
  type        = string
  default     = ""
}

variable "env_vars" {
  description = "Public environment variables"
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
