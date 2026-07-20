output "stg_environment_name" {
  description = "GitHub environment name for staging"
  value       = github_repository_environment.stg.environment
}

output "prod_environment_name" {
  description = "GitHub environment name for production"
  value       = github_repository_environment.prod.environment
}

output "actions_variables" {
  description = "Repository-level Actions variables set"
  value = {
    GCP_PROJECT_ID        = github_actions_variable.gcp_project_id.value
    GCP_REGION            = github_actions_variable.gcp_region.value
    ARTIFACT_REGISTRY_URL = github_actions_variable.artifact_registry_url.value
    SERVICE_NAME          = github_actions_variable.service_name.value
  }
}
