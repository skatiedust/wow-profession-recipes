#!/usr/bin/env bash
set -euo pipefail

# One-time bootstrap for CI/CD remote state:
#   1. Creates the GCS bucket for Terraform remote state
#   2. Migrates local state to the new backend
#
# Only needed if you're setting up GitHub Actions CI/CD.
# For manual deploys, local state works fine — skip this script.
#
# Prerequisites:
#   - gcloud CLI authenticated (`gcloud auth login`)
#   - GCP project set (`gcloud config set project YOUR_PROJECT_ID`)
#   - backend.tf exists (copy from backend.tf.example and set your bucket name)

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
REGION="${1:-us-central1}"

if [ -z "$PROJECT_ID" ]; then
  echo "Error: No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID"
  exit 1
fi

if [ ! -f backend.tf ]; then
  echo "Error: backend.tf not found."
  echo "Copy backend.tf.example to backend.tf and set your bucket name first."
  exit 1
fi

BUCKET_NAME=$(grep 'bucket' backend.tf | head -1 | sed 's/.*"\(.*\)".*/\1/')
if [ -z "$BUCKET_NAME" ] || [ "$BUCKET_NAME" = "YOUR_BUCKET_NAME-tf-state" ]; then
  echo "Error: Update the bucket name in backend.tf before running this script."
  exit 1
fi

echo "Creating GCS bucket gs://${BUCKET_NAME} in project ${PROJECT_ID}..."
if gcloud storage buckets describe "gs://${BUCKET_NAME}" &>/dev/null; then
  echo "Bucket already exists, skipping creation."
else
  gcloud storage buckets create "gs://${BUCKET_NAME}" \
    --project="${PROJECT_ID}" \
    --location="${REGION}" \
    --uniform-bucket-level-access
  echo "Bucket created."
fi

echo ""
echo "Enabling object versioning for state protection..."
gcloud storage buckets update "gs://${BUCKET_NAME}" --versioning

echo ""
echo "Migrating Terraform state to GCS backend..."
terraform init -migrate-state

echo ""
echo "Bootstrap complete. Terraform state is now stored in gs://${BUCKET_NAME}/terraform/state"
