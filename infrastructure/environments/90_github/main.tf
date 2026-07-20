terraform {
  required_version = ">= 1.5.0"
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

# GITHUB_TOKEN 環境変数、または terraform.tfvars の github_token を使用
provider "github" {
  owner = var.github_owner
  token = var.github_token
}

# -------------------------------------------------------------------
# 共通値 (_global-settings)
# -------------------------------------------------------------------
module "global" {
  source = "../../_global-settings"
}

# -------------------------------------------------------------------
# リポジトリ環境 (GitHub Environments)
# -------------------------------------------------------------------
resource "github_repository_environment" "stg" {
  repository  = var.github_repository
  environment = "stg"
}

resource "github_repository_environment" "prod" {
  repository  = var.github_repository
  environment = "prod"

  dynamic "reviewers" {
    for_each = length(var.prod_reviewer_teams) > 0 || length(var.prod_reviewer_users) > 0 ? [1] : []
    content {
      teams = var.prod_reviewer_teams
      users = var.prod_reviewer_users
    }
  }

  deployment_branch_policy {
    protected_branches     = false
    custom_branch_policies = true
  }
}

# prod 環境は v* タグまたは main ブランチ(workflow_run経由)からのみデプロイ可能
resource "github_repository_environment_deployment_policy" "prod_tags" {
  repository     = var.github_repository
  environment    = github_repository_environment.prod.environment
  branch_pattern = "v*"
}

resource "github_repository_environment_deployment_policy" "prod_main" {
  repository     = var.github_repository
  environment    = github_repository_environment.prod.environment
  branch_pattern = "main"
}

# -------------------------------------------------------------------
# リポジトリレベルの変数 (Actions Variables)
# -------------------------------------------------------------------
resource "github_actions_variable" "gcp_project_id" {
  repository    = var.github_repository
  variable_name = "GCP_PROJECT_ID"
  value         = module.global.project_id
}

resource "github_actions_variable" "gcp_region" {
  repository    = var.github_repository
  variable_name = "GCP_REGION"
  value         = module.global.region
}

resource "github_actions_variable" "artifact_registry_url" {
  repository    = var.github_repository
  variable_name = "ARTIFACT_REGISTRY_URL"
  value         = module.global.artifact_registry_url
}

resource "github_actions_variable" "service_name" {
  repository    = var.github_repository
  variable_name = "SERVICE_NAME"
  value         = module.global.service_name
}

resource "github_actions_variable" "extra" {
  for_each = var.extra_actions_variables

  repository    = var.github_repository
  variable_name = each.key
  value         = each.value
}

# -------------------------------------------------------------------
# リポジトリレベルのシークレット (Actions Secrets)
# -------------------------------------------------------------------
resource "github_actions_secret" "gcp_sa_key" {
  repository      = var.github_repository
  secret_name     = "GCP_SA_KEY"
  plaintext_value = var.gcp_sa_key
}

resource "github_actions_secret" "extra" {
  for_each = var.extra_actions_secrets

  repository      = var.github_repository
  secret_name     = each.key
  plaintext_value = each.value
}

# -------------------------------------------------------------------
# 環境レベルの変数 (stg / prod)
# -------------------------------------------------------------------
resource "github_actions_environment_variable" "stg" {
  for_each = merge(
    { CLOUD_RUN_SA_EMAIL = module.global.cloud_run_sa_stg },
    var.extra_stg_variables,
  )

  repository    = var.github_repository
  environment   = github_repository_environment.stg.environment
  variable_name = each.key
  value         = each.value
}

resource "github_actions_environment_variable" "prod" {
  for_each = merge(
    { CLOUD_RUN_SA_EMAIL = module.global.cloud_run_sa_prod },
    var.extra_prod_variables,
  )

  repository    = var.github_repository
  environment   = github_repository_environment.prod.environment
  variable_name = each.key
  value         = each.value
}

# -------------------------------------------------------------------
# 環境レベルのシークレット (stg / prod)
# -------------------------------------------------------------------
resource "github_actions_environment_secret" "stg" {
  for_each = var.extra_stg_secrets

  repository      = var.github_repository
  environment     = github_repository_environment.stg.environment
  secret_name     = each.key
  plaintext_value = each.value
}

resource "github_actions_environment_secret" "prod" {
  for_each = var.extra_prod_secrets

  repository      = var.github_repository
  environment     = github_repository_environment.prod.environment
  secret_name     = each.key
  plaintext_value = each.value
}
