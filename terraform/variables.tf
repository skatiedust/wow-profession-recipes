variable "gcp_project_id" {
  description = "The GCP project ID to deploy into"
  type        = string
}

variable "gcp_region" {
  description = "The GCP region for all resources"
  type        = string
  default     = "us-central1"
}

variable "bnet_client_id" {
  description = "Battle.net OAuth client ID"
  type        = string
  sensitive   = true
}

variable "bnet_client_secret" {
  description = "Battle.net OAuth client secret"
  type        = string
  sensitive   = true
}

variable "database_password" {
  description = "Password for the Cloud SQL PostgreSQL user"
  type        = string
  sensitive   = true
}

variable "session_secret" {
  description = "Secret used to sign session cookies"
  type        = string
  sensitive   = true
}

variable "frontend_url" {
  description = "URL of the frontend Cloud Run service (set after first deploy, used for CORS and OAuth redirects)"
  type        = string
  default     = ""
}

variable "github_repo" {
  description = "GitHub repository in owner/repo format for Workload Identity Federation (leave empty to skip CI/CD resources)"
  type        = string
  default     = ""
}

variable "addon_artifacts_bucket_name" {
  description = "Optional GCS bucket name for publicly downloadable addon artifacts (leave empty to use a default name based on project ID)"
  type        = string
  default     = ""
}
