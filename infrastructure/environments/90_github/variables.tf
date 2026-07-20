# -------------------------------------------------------------------
# GitHub
# -------------------------------------------------------------------
variable "github_owner" {
  description = "GitHub organization or username"
  type        = string
}

variable "github_repository" {
  description = "GitHub repository name (without owner prefix)"
  type        = string
}

variable "github_token" {
  description = "GitHub personal access token (or set GITHUB_TOKEN env var)"
  type        = string
  sensitive   = true
  default     = null
}

# -------------------------------------------------------------------
# GCP SA Key (00_bootstrap output → GCP_SA_KEY secret の値)
# -------------------------------------------------------------------
variable "gcp_sa_key" {
  description = "GitHub Actions service account key (base64). From: terraform output -raw github_actions_sa_key"
  type        = string
  sensitive   = true
}

# -------------------------------------------------------------------
# prod 環境のデプロイ承認者 (任意)
# -------------------------------------------------------------------
variable "prod_reviewer_teams" {
  description = "GitHub team node IDs that can approve prod deployments"
  type        = list(number)
  default     = []
}

variable "prod_reviewer_users" {
  description = "GitHub user node IDs that can approve prod deployments"
  type        = list(number)
  default     = []
}

# -------------------------------------------------------------------
# 追加の Variables / Secrets
# -------------------------------------------------------------------
variable "extra_actions_variables" {
  description = "Additional repository-level Actions variables"
  type        = map(string)
  default     = {}
}

variable "extra_actions_secrets" {
  description = "Additional repository-level Actions secrets"
  type        = map(string)
  default     = {}
}

variable "extra_stg_variables" {
  description = "Additional stg environment variables"
  type        = map(string)
  default     = {}
}

variable "extra_prod_variables" {
  description = "Additional prod environment variables"
  type        = map(string)
  default     = {}
}

variable "extra_stg_secrets" {
  description = "Additional stg environment secrets"
  type        = map(string)
  default     = {}
}

variable "extra_prod_secrets" {
  description = "Additional prod environment secrets"
  type        = map(string)
  default     = {}
}
