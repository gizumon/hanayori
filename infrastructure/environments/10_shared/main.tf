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

# -------------------------------------------------------------------
# Cloud Storage — 画像アップロード用バケット (署名付き URL 方式)
#
# 画像は POST /api/uploads が発行する署名付き PUT URL でブラウザから直接ここへ
# アップロードされる。オブジェクトは公開読み取り(URL を知っていれば誰でも閲覧)で、
# ゲスト向けお手紙ページからそのまま表示する。STG/PROD は同一バケットを共有し、
# アプリ側で uploads/{dev|stg|prod}/ のフォルダプレフィックスで環境を分離する。
# -------------------------------------------------------------------
locals {
  uploads_bucket_name = "${module.global.project_id}-uploads"

  # ローカル開発で Cloud Run SA(stg)を impersonate して署名するユーザー。
  # 各開発者の Google アカウントを "user:<email>" 形式で追記する。
  storage_signer_developers = [
    "user:a.g0430t.s@gmail.com",
  ]

  cloud_run_sas = {
    stg = {
      email = module.global.cloud_run_sa_stg
      id    = "projects/${module.global.project_id}/serviceAccounts/${module.global.cloud_run_sa_stg}"
    }
    prod = {
      email = module.global.cloud_run_sa_prod
      id    = "projects/${module.global.project_id}/serviceAccounts/${module.global.cloud_run_sa_prod}"
    }
  }
}

resource "google_storage_bucket" "uploads" {
  project                     = module.global.project_id
  name                        = local.uploads_bucket_name
  location                    = module.global.region
  uniform_bucket_level_access = true
  # 公開読み取りを許可するため public access prevention は継承(=無効)にする。
  public_access_prevention = "inherited"
  force_destroy            = false

  # ブラウザからの直接 PUT を許可する。署名付き URL 自体が書き込みの認証ゲートなので、
  # origin は広めに許可してもアップロード権限は弱まらない(署名なしでは書けない)。
  cors {
    origin          = ["*"]
    method          = ["PUT", "GET"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }

  labels = {
    service    = module.global.service_name
    managed_by = "terraform"
  }
}

# オブジェクトを公開読み取りにする(URL を知っていれば誰でも閲覧可能)。
resource "google_storage_bucket_iam_member" "uploads_public_read" {
  bucket = google_storage_bucket.uploads.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# 署名付き URL が付与する書き込み権限の源。Cloud Run SA にバケット単位で objectAdmin。
resource "google_storage_bucket_iam_member" "uploads_writer" {
  for_each = local.cloud_run_sas

  bucket = google_storage_bucket.uploads.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${each.value.email}"
}

# V4 署名は秘密鍵を持たない Cloud Run 上では IAM signBlob で行う。そのため
# SA 自身に tokenCreator を付け、自分自身に署名を依頼できるようにする。
resource "google_service_account_iam_member" "cloud_run_self_sign" {
  for_each = local.cloud_run_sas

  service_account_id = each.value.id
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${each.value.email}"
}

# ローカル開発者が stg SA を impersonate して署名できるよう tokenCreator を付与。
# これで `gcloud auth application-default login --impersonate-service-account=<stg SA>`
# のみでローカルでも署名付き URL を発行できる。
resource "google_service_account_iam_member" "developers_impersonate_stg" {
  for_each = toset(local.storage_signer_developers)

  service_account_id = local.cloud_run_sas.stg.id
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = each.value
}
