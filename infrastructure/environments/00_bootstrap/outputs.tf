output "tfstate_bucket_stg" {
  description = "Terraform state bucket for staging"
  value       = google_storage_bucket.tfstate_stg.name
}

output "tfstate_bucket_prod" {
  description = "Terraform state bucket for production"
  value       = google_storage_bucket.tfstate_prod.name
}

output "tfstate_bucket_shared" {
  description = "Terraform state bucket for shared resources (Firestore, Firebase Auth)"
  value       = google_storage_bucket.tfstate_shared.name
}

output "artifact_registry_url" {
  description = "Artifact Registry Docker repository URL"
  value       = "${local.region}-docker.pkg.dev/${local.project_id}/${google_artifact_registry_repository.docker.repository_id}"
}

output "github_actions_sa_email" {
  description = "GitHub Actions service account email"
  value       = google_service_account.github_actions.email
}

output "github_actions_sa_key" {
  description = "GitHub Actions SA key (base64). Paste into 90_github/terraform.tfvars as gcp_sa_key"
  value       = google_service_account_key.github_actions_key.private_key
  sensitive   = true
}

output "cloud_run_sa_email_stg" {
  description = "Cloud Run service account email for staging"
  value       = google_service_account.cloud_run_stg.email
}

output "cloud_run_sa_email_prod" {
  description = "Cloud Run service account email for production"
  value       = google_service_account.cloud_run_prod.email
}

output "next_steps" {
  description = "Post-bootstrap instructions"
  value       = <<-EOT
    Bootstrap complete! Next steps:

    1. Apply GitHub settings (environments, variables, secrets):
       cd ../90_github
       terraform init -backend-config="bucket=${google_storage_bucket.tfstate_stg.name}"
       terraform apply

       terraform.tfvars に設定が必要なのは github_owner / github_repository / gcp_sa_key のみ。
       (project_id / service_name / region は _global-settings/settings.tf から自動取得)

    2. Create secrets in Secret Manager:
       ./scripts/create-secrets.sh stg
       ./scripts/create-secrets.sh prod

    3. Deploy environments:
       cd ../10_shared && terraform init -backend-config="bucket=${google_storage_bucket.tfstate_shared.name}" && terraform apply
       cd ../20_stg  && terraform init -backend-config="bucket=${google_storage_bucket.tfstate_stg.name}" && terraform apply
       cd ../30_prod && terraform init -backend-config="bucket=${google_storage_bucket.tfstate_prod.name}" && terraform apply
  EOT
}
