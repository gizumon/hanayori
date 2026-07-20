terraform {
  required_version = ">= 1.5.0"
}

# -------------------------------------------------------------------
# 環境共通の計算済みローカル変数
#
# 各 environment から以下のように呼び出す:
#   module "global" {
#     source = "../../_global-settings"
#   }
#   # 利用例: module.global.artifact_registry_url
# -------------------------------------------------------------------

locals {
  # -------------------------------------------------------------------
  # Artifact Registry
  # -------------------------------------------------------------------
  artifact_registry_repo = "${local.service_name}-docker"
  artifact_registry_url  = "${local.region}-docker.pkg.dev/${local.project_id}/${local.artifact_registry_repo}"

  # -------------------------------------------------------------------
  # Service Account メール (00_bootstrap で作成済み)
  # -------------------------------------------------------------------
  cloud_run_sa_stg  = "${local.service_name}-run-stg@${local.project_id}.iam.gserviceaccount.com"
  cloud_run_sa_prod = "${local.service_name}-run-prod@${local.project_id}.iam.gserviceaccount.com"

  # -------------------------------------------------------------------
  # Terraform State バケット名 (00_bootstrap で作成済み)
  # -------------------------------------------------------------------
  tfstate_bucket_stg    = "${local.project_id}-tfstate-stg"
  tfstate_bucket_prod   = "${local.project_id}-tfstate-prod"
  tfstate_bucket_shared = "${local.project_id}-tfstate-shared"

  # -------------------------------------------------------------------
  # 共通ラベル
  # -------------------------------------------------------------------
  common_labels = {
    service    = local.service_name
    managed_by = "terraform"
  }

  labels_stg  = merge(local.common_labels, { environment = "stg" })
  labels_prod = merge(local.common_labels, { environment = "prod" })

  # -------------------------------------------------------------------
  # リージョン一覧
  # -------------------------------------------------------------------
  regions = {
    tokyo = "asia-northeast1"
    osaka = "asia-northeast2"
  }
}
