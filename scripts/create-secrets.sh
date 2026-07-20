#!/usr/bin/env bash
set -euo pipefail

# -------------------------------------------------------------------
# Creates GCP Secret Manager secrets from a .env file
# Usage: ./scripts/create-secrets.sh <env> [env_file]
#   env      : stg or prod
#   env_file : path to .env file (default: .env.<env>)
# -------------------------------------------------------------------

ENV="${1:?Usage: $0 <stg|prod> [env_file]}"
ENV_FILE="${2:-.env.${ENV}}"

if [[ "${ENV}" != "stg" && "${ENV}" != "prod" ]]; then
  echo "ERROR: env must be 'stg' or 'prod'"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "ERROR: env file not found: ${ENV_FILE}"
  echo "Create it with your secrets, one per line: KEY=value"
  exit 1
fi

PROJECT_ID="$(gcloud config get-value project 2>/dev/null)"
if [[ -z "${PROJECT_ID}" ]]; then
  echo "ERROR: No active GCP project. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

echo "Creating secrets for environment: ${ENV}"
echo "Project: ${PROJECT_ID}"
echo "Source:  ${ENV_FILE}"
echo ""

created=0
updated=0

while IFS= read -r line || [[ -n "${line}" ]]; do
  # Skip comments and empty lines
  [[ "${line}" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue

  KEY="${line%%=*}"
  VALUE="${line#*=}"

  # Skip keys that start with # or are empty
  [[ -z "${KEY}" ]] && continue

  SECRET_NAME="${ENV}-$(echo "${KEY}" | tr '[:upper:]_' '[:lower:]-')"

  if gcloud secrets describe "${SECRET_NAME}" --project="${PROJECT_ID}" &>/dev/null; then
    printf '%s' "${VALUE}" | gcloud secrets versions add "${SECRET_NAME}" \
      --project="${PROJECT_ID}" \
      --data-file=- \
      --quiet
    echo "  Updated: ${SECRET_NAME}"
    ((updated++))
  else
    printf '%s' "${VALUE}" | gcloud secrets create "${SECRET_NAME}" \
      --project="${PROJECT_ID}" \
      --replication-policy="automatic" \
      --data-file=- \
      --quiet
    echo "  Created: ${SECRET_NAME}"
    ((created++))
  fi
done < "${ENV_FILE}"

echo ""
echo "Done! Created: ${created}, Updated: ${updated}"
echo ""
echo "Reference in terraform.tfvars:"
echo "secret_env_vars = {"
while IFS= read -r line || [[ -n "${line}" ]]; do
  [[ "${line}" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${line// }" ]] && continue
  KEY="${line%%=*}"
  [[ -z "${KEY}" ]] && continue
  SECRET_NAME="${ENV}-$(echo "${KEY}" | tr '[:upper:]_' '[:lower:]-')"
  echo "  ${KEY} = {"
  echo "    secret_name = \"${SECRET_NAME}\""
  echo "    version     = \"latest\""
  echo "  }"
done < "${ENV_FILE}"
echo "}"
