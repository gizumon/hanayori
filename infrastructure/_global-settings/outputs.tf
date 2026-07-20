output "project_id" {
  description = "GCP project ID"
  value       = local.project_id
}

output "service_name" {
  description = "Service name used as resource name prefix"
  value       = local.service_name
}

output "region" {
  description = "GCP region for deployments"
  value       = local.region
}

output "artifact_registry_url" {
  description = "Full Artifact Registry Docker repository URL"
  value       = local.artifact_registry_url
}

output "cloud_run_sa_stg" {
  description = "Cloud Run service account email for staging"
  value       = local.cloud_run_sa_stg
}

output "cloud_run_sa_prod" {
  description = "Cloud Run service account email for production"
  value       = local.cloud_run_sa_prod
}

output "tfstate_bucket_stg" {
  description = "Terraform state bucket name for staging"
  value       = local.tfstate_bucket_stg
}

output "tfstate_bucket_prod" {
  description = "Terraform state bucket name for production"
  value       = local.tfstate_bucket_prod
}

output "tfstate_bucket_shared" {
  description = "Terraform state bucket name for shared resources"
  value       = local.tfstate_bucket_shared
}

output "common_labels" {
  description = "Common resource labels"
  value       = local.common_labels
}

output "labels_stg" {
  description = "Labels for staging resources"
  value       = local.labels_stg
}

output "labels_prod" {
  description = "Labels for production resources"
  value       = local.labels_prod
}

output "regions" {
  description = "Named GCP regions"
  value       = local.regions
}
