terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

module "global" {
  source = "../../_global-settings"
}

provider "google" {
  project = module.global.project_id
}

provider "google-beta" {
  project               = module.global.project_id
  user_project_override = true
  billing_project       = module.global.project_id
}

data "google_project" "main" {
  project_id = module.global.project_id
}

# -------------------------------------------------------------------
# Firestore (default database, shared between stg and prod)
#
# (default) DB のみ Firestore 無料枠 (読取 50K/日, 書込 20K/日, 1GB) 対象。
# STG/PROD は同一 GCP プロジェクトのため 1 つの DB を共有する。
# アプリ側でコレクションプレフィックスで環境を区別すること。
# -------------------------------------------------------------------
module "firestore" {
  source = "../../modules/firestore"

  project_id = module.global.project_id

  cloud_run_service_account_emails = [
    module.global.cloud_run_sa_stg,
    module.global.cloud_run_sa_prod,
  ]

  location          = module.global.region
  delete_protection = true
  deletion_policy   = "ABANDON"
}

# -------------------------------------------------------------------
# Firebase Authentication (Identity Platform)
#
# google_identity_platform_config はプロジェクトに 1 つのみ存在できる。
# STG/PROD 共通の認証設定をここで管理する。
# authorized_domains に Cloud Run URL やカスタムドメインを追加すること。
#
# Google Sign-In を使う場合は GCP Console で OAuth クライアントを手動作成し、
# google_oauth_client_id / google_oauth_client_secret を terraform.tfvars に設定する
# (未設定なら Google Sign-In は無効のまま Email/匿名サインインのみ有効になる)。
# -------------------------------------------------------------------
module "firebase_auth" {
  source = "../../modules/firebase_auth"

  project_id = module.global.project_id

  sign_in_email_enabled     = true
  sign_in_anonymous_enabled = true
  authorized_domains        = var.authorized_domains

  google_oauth_client_id     = var.google_oauth_client_id
  google_oauth_client_secret = var.google_oauth_client_secret

  cloud_run_service_account_emails = [
    module.global.cloud_run_sa_stg,
    module.global.cloud_run_sa_prod,
  ]
}
