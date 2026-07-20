#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# Manual deploy script (use GitHub Actions for CI/CD)
# Usage: ./scripts/deploy.sh <env> [image_tag]
#   env       : stg or prod
#   image_tag : Docker image tag (default: git commit SHA)
# -------------------------------------------------------------------

ENV="${1:?Usage: $0 <stg|prod> [image_tag]}"
IMAGE_TAG="${2:-$(git rev-parse --short HEAD)}"

if [[ "${ENV}" != "stg" && "${ENV}" != "prod" ]]; then
  echo "ERROR: env must be 'stg' or 'prod'"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}/.."
INFRA_DIR="${PROJECT_ROOT}/infrastructure"

ENV_DIR_NAME="20_stg"
[[ "${ENV}" == "prod" ]] && ENV_DIR_NAME="30_prod"

PROJECT_ID="$(gcloud config get-value project 2>/dev/null)"
REGION="${GCP_REGION:-asia-northeast1}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "ERROR: No active GCP project. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

# Derive service name from bootstrap tfvars if available
SERVICE_NAME="myapp"
if [[ -f "${INFRA_DIR}/environments/00_bootstrap/terraform.tfvars" ]]; then
  SERVICE_NAME="$(grep 'service_name' "${INFRA_DIR}/environments/00_bootstrap/terraform.tfvars" | cut -d'"' -f2)"
fi

ARTIFACT_REGISTRY="${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE_NAME}-docker"
IMAGE_URL="${ARTIFACT_REGISTRY}/${SERVICE_NAME}:${IMAGE_TAG}"

echo "============================================"
echo "Deploy to ${ENV}"
echo "============================================"
echo "Project: ${PROJECT_ID}"
echo "Service: ${SERVICE_NAME}-${ENV}"
echo "Image:   ${IMAGE_URL}"
echo "============================================"
echo ""

# Build and push
echo "Building Docker image..."
docker build \
  --platform linux/amd64 \
  --tag "${IMAGE_URL}" \
  --tag "${ARTIFACT_REGISTRY}/${SERVICE_NAME}:${ENV}-latest" \
  "${PROJECT_ROOT}"

echo "Pushing image to Artifact Registry..."
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet
docker push "${IMAGE_URL}"
docker push "${ARTIFACT_REGISTRY}/${SERVICE_NAME}:${ENV}-latest"

# Deploy via Terraform
ENV_DIR="${INFRA_DIR}/environments/${ENV_DIR_NAME}"
if [[ ! -f "${ENV_DIR}/terraform.tfvars" ]]; then
  echo "ERROR: ${ENV_DIR}/terraform.tfvars not found."
  echo "Copy terraform.tfvars.example and fill in your values."
  exit 1
fi

echo ""
echo "Deploying with Terraform..."
cd "${ENV_DIR}"
terraform init -backend-config="bucket=${PROJECT_ID}-tfstate-${ENV}" -reconfigure
terraform apply \
  -var="container_image=${IMAGE_URL}" \
  -auto-approve

echo ""
echo "============================================"
echo "Deployment complete!"
echo "Service URL: $(terraform output -raw service_url)"
echo "============================================"
