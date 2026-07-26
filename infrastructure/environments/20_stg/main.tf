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
# provider のフォールバックは gcloud config のアクティブプロジェクト。
# 全リソースに project = module.global.project_id を明示しているため問題ない。
provider "google" {}

# -------------------------------------------------------------------
# 共通値 (_global-settings)
# -------------------------------------------------------------------
module "global" {
  source = "../../_global-settings"
}

# -------------------------------------------------------------------
# 共有リソース (10_shared) の接続情報を読み込む
# -------------------------------------------------------------------
data "terraform_remote_state" "shared" {
  backend = "gcs"
  config = {
    bucket = "gizumon-hanayori-tfstate-shared"
    prefix = "terraform/state"
  }
}

locals {
  shared_env_vars = {
    GCP_PROJECT_ID                           = data.terraform_remote_state.shared.outputs.project_id
    FIRESTORE_DATABASE_ID                    = data.terraform_remote_state.shared.outputs.firestore_database_name
    NEXT_PUBLIC_FIREBASE_PROJECT_ID          = data.terraform_remote_state.shared.outputs.project_id
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN         = data.terraform_remote_state.shared.outputs.firebase_auth_domain
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET      = data.terraform_remote_state.shared.outputs.firebase_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = data.terraform_remote_state.shared.outputs.firebase_messaging_sender_id
    STORAGE_UPLOADS_BUCKET                   = data.terraform_remote_state.shared.outputs.uploads_bucket
  }
}

# -------------------------------------------------------------------
# Cloud Run
# -------------------------------------------------------------------
module "cloud_run" {
  source = "../../modules/cloud_run"

  project_id   = module.global.project_id
  service_name = module.global.service_name
  environment  = "stg"
  region       = module.global.region

  container_image       = var.container_image
  container_port        = var.container_port
  service_account_email = module.global.cloud_run_sa_stg

  cpu_limit         = "1"
  memory_limit      = "256Mi"
  cpu_throttling    = true
  startup_cpu_boost = false

  min_instances = 0
  max_instances = 3
  concurrency   = 80

  health_check_path = var.health_check_path

  allow_unauthenticated = true

  env_vars        = merge(local.shared_env_vars, var.env_vars)
  secret_env_vars = var.secret_env_vars

  enable_domain_mapping = var.custom_domain != ""
  custom_domain         = var.custom_domain
}

# -------------------------------------------------------------------
# Secret Manager - Cloud Run SA にアクセス権付与
# secret_env_vars に設定した全シークレットに自動付与
# -------------------------------------------------------------------
resource "google_secret_manager_secret_iam_member" "cloud_run_secret_access" {
  for_each = var.secret_env_vars

  project   = module.global.project_id
  secret_id = each.value.secret_name
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${module.global.cloud_run_sa_stg}"
}
