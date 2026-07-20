terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# project / region は _global-settings/settings.tf で定義。
# GCP リソースには全て project = local.project_id を明示しているため問題ない。
provider "google" {}

# -------------------------------------------------------------------
# 共通設定 (_global-settings)
# -------------------------------------------------------------------
module "settings" {
  source = "../../_global-settings"
}

locals {
  project_id   = module.settings.project_id
  service_name = module.settings.service_name
  region       = module.settings.region

  required_apis = [
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "secretmanager.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "firestore.googleapis.com",
    "identitytoolkit.googleapis.com",
  ]
}

# -------------------------------------------------------------------
# GCP APIs
# -------------------------------------------------------------------
resource "google_project_service" "apis" {
  for_each = toset(local.required_apis)

  project            = local.project_id
  service            = each.value
  disable_on_destroy = false
}

# -------------------------------------------------------------------
# Terraform State Buckets
# -------------------------------------------------------------------
resource "google_storage_bucket" "tfstate_stg" {
  name                        = "${local.project_id}-tfstate-stg"
  project                     = local.project_id
  location                    = local.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition { num_newer_versions = 3 }
    action { type = "Delete" }
  }
  lifecycle_rule {
    condition { days_since_noncurrent_time = 30 }
    action { type = "Delete" }
  }

  labels = { managed_by = "terraform" }
}

resource "google_storage_bucket" "tfstate_prod" {
  name                        = "${local.project_id}-tfstate-prod"
  project                     = local.project_id
  location                    = local.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition { num_newer_versions = 5 }
    action { type = "Delete" }
  }
  lifecycle_rule {
    condition { days_since_noncurrent_time = 365 }
    action { type = "Delete" }
  }

  labels = { managed_by = "terraform" }
}

resource "google_storage_bucket" "tfstate_shared" {
  name                        = "${local.project_id}-tfstate-shared"
  project                     = local.project_id
  location                    = local.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition { num_newer_versions = 5 }
    action { type = "Delete" }
  }
  lifecycle_rule {
    condition { days_since_noncurrent_time = 365 }
    action { type = "Delete" }
  }

  labels = { managed_by = "terraform" }
}

# -------------------------------------------------------------------
# Artifact Registry
# -------------------------------------------------------------------
resource "google_artifact_registry_repository" "docker" {
  depends_on = [google_project_service.apis]

  project       = local.project_id
  location      = local.region
  repository_id = "${local.service_name}-docker"
  format        = "DOCKER"
  description   = "Docker images for ${local.service_name}"

  labels = {
    managed_by = "terraform"
    service    = local.service_name
  }
}

# -------------------------------------------------------------------
# GitHub Actions Service Account
# -------------------------------------------------------------------
resource "google_service_account" "github_actions" {
  project      = local.project_id
  account_id   = "${local.service_name}-github-actions"
  display_name = "GitHub Actions CI/CD - ${local.service_name}"
}

resource "google_project_iam_member" "github_actions_artifact_writer" {
  project = local.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "github_actions_run_admin" {
  project = local.project_id
  role    = "roles/run.admin"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "github_actions_storage_viewer" {
  project = local.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_project_iam_member" "github_actions_secret_accessor" {
  project = local.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_service_account_iam_member" "github_actions_sa_user_stg" {
  service_account_id = google_service_account.cloud_run_stg.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_service_account_iam_member" "github_actions_sa_user_prod" {
  service_account_id = google_service_account.cloud_run_prod.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.github_actions.email}"
}

resource "google_service_account_key" "github_actions_key" {
  service_account_id = google_service_account.github_actions.name
}

# -------------------------------------------------------------------
# Cloud Run Service Accounts (per environment)
# -------------------------------------------------------------------
resource "google_service_account" "cloud_run_stg" {
  project      = local.project_id
  account_id   = "${local.service_name}-run-stg"
  display_name = "Cloud Run Service Account - ${local.service_name} (stg)"
}

resource "google_service_account" "cloud_run_prod" {
  project      = local.project_id
  account_id   = "${local.service_name}-run-prod"
  display_name = "Cloud Run Service Account - ${local.service_name} (prod)"
}

resource "google_project_iam_member" "cloud_run_stg_secret_accessor" {
  project = local.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_stg.email}"
}

resource "google_project_iam_member" "cloud_run_prod_secret_accessor" {
  project = local.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_prod.email}"
}
