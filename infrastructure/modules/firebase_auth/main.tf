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

locals {
  all_authorized_domains = concat(
    [
      "localhost",
      "${var.project_id}.firebaseapp.com",
      "${var.project_id}.web.app",
    ],
    var.authorized_domains
  )
}

resource "google_identity_platform_config" "main" {
  provider = google-beta
  project  = var.project_id

  sign_in {
    allow_duplicate_emails = false

    email {
      enabled           = var.sign_in_email_enabled
      password_required = true
    }

    anonymous {
      enabled = var.sign_in_anonymous_enabled
    }
  }

  authorized_domains = local.all_authorized_domains

  lifecycle {
    prevent_destroy = true
  }
}

# google_iap_brand/client は組織配下のプロジェクトにしか作成できないため、
# OAuth クライアントは GCP Console で手動作成し、credentials を変数で渡す。
resource "google_identity_platform_default_supported_idp_config" "google" {
  count    = var.google_oauth_client_id != "" ? 1 : 0
  provider = google-beta
  project  = var.project_id

  idp_id        = "google.com"
  client_id     = var.google_oauth_client_id
  client_secret = var.google_oauth_client_secret
  enabled       = true

  depends_on = [google_identity_platform_config.main]
}

# Cloud Run 側は Admin SDK (verifyIdToken / createSessionCookie) で
# Identity Toolkit API を呼ぶため、Workload Identity のサービスアカウントに
# 権限が無いと auth/insufficient-permission で失敗する。
resource "google_project_iam_member" "cloud_run_firebase_auth_admin" {
  for_each = toset(var.cloud_run_service_account_emails)

  project = var.project_id
  role    = "roles/firebaseauth.admin"
  member  = "serviceAccount:${each.value}"
}
