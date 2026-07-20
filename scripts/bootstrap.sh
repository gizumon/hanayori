#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# Bootstrap script: initializes GCP project resources via Terraform
# Usage: ./scripts/bootstrap.sh <project_id> [service_name] [region]
# -------------------------------------------------------------------

PROJECT_ID="${1:?Usage: $0 <project_id> [service_name] [region]}"
SERVICE_NAME="${2:-myapp}"
REGION="${3:-asia-northeast1}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BOOTSTRAP_DIR="${SCRIPT_DIR}/../infrastructure/environments/00_bootstrap"

echo "============================================"
echo "GCP Boilerplate Bootstrap"
echo "============================================"
echo "Project ID:   ${PROJECT_ID}"
echo "Service Name: ${SERVICE_NAME}"
echo "Region:       ${REGION}"
echo "============================================"
echo ""

# Verify gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q "@"; then
  echo "ERROR: No active gcloud account found. Run: gcloud auth login"
  exit 1
fi

# Verify terraform is available
if ! command -v terraform &>/dev/null; then
  echo "ERROR: terraform not found. Install from https://developer.hashicorp.com/terraform/install"
  exit 1
fi

# Set the active project
gcloud config set project "${PROJECT_ID}"

echo "Initializing Terraform (local state)..."
cd "${BOOTSTRAP_DIR}"
terraform init

echo ""
echo "Planning bootstrap resources..."
terraform plan

echo ""
read -p "Apply bootstrap? (yes/no): " CONFIRM
if [[ "${CONFIRM}" != "yes" ]]; then
  echo "Aborted."
  exit 0
fi

terraform apply -auto-approve

STG_BUCKET="$(terraform output -raw tfstate_bucket_stg)"
PROD_BUCKET="$(terraform output -raw tfstate_bucket_prod)"
SHARED_BUCKET="$(terraform output -raw tfstate_bucket_shared)"
SA_KEY="$(terraform output -raw github_actions_sa_key)"

echo ""
echo "============================================"
echo "Bootstrap complete!"
echo "============================================"
echo ""
echo "State buckets:"
echo "  Shared:  ${SHARED_BUCKET}"
echo "  Staging: ${STG_BUCKET}"
echo "  Prod:    ${PROD_BUCKET}"
echo ""
echo "Artifact Registry:"
echo "  $(terraform output -raw artifact_registry_url)"
echo ""
echo "GitHub Actions SA:"
echo "  $(terraform output -raw github_actions_sa_email)"
echo ""
echo "============================================"
echo "Next: Apply GitHub settings"
echo "============================================"

GITHUB_DIR="${SCRIPT_DIR}/../infrastructure/environments/90_github"
if [[ ! -f "${GITHUB_DIR}/terraform.tfvars" ]]; then
  cp "${GITHUB_DIR}/terraform.tfvars.example" "${GITHUB_DIR}/terraform.tfvars"
  sed -i.bak "s/your-github-org-or-user/${PROJECT_ID}/g" "${GITHUB_DIR}/terraform.tfvars"
  sed -i.bak "s|gcp_sa_key = \"base64-encoded-sa-key\"|gcp_sa_key = \"${SA_KEY}\"|" "${GITHUB_DIR}/terraform.tfvars"
  rm -f "${GITHUB_DIR}/terraform.tfvars.bak"
  echo ""
  echo "Created 90_github/terraform.tfvars — fill in github_owner and github_repository, then run:"
  echo "  cd infrastructure/environments/90_github"
  echo "  terraform init -backend-config=\"bucket=${STG_BUCKET}\""
  echo "  terraform apply"
fi

echo ""
terraform output -raw next_steps
