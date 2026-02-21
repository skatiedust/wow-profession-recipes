variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "service_name" {
  description = "Name of the Cloud Run service"
  type        = string
}

variable "image" {
  description = "Container image to deploy. Leave as placeholder; updated by gcloud run deploy --source."
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "vpc_connector_id" {
  description = "Serverless VPC Access connector ID. Set to null if not needed."
  type        = string
  default     = null
}

variable "cloud_sql_connection" {
  description = "Cloud SQL instance connection name. Set to null if not needed."
  type        = string
  default     = null
}

variable "env_vars" {
  description = "Plain-text environment variables to set on the service"
  type        = map(string)
  default     = {}
}

variable "secret_env_vars" {
  description = "Environment variables sourced from Secret Manager. Map of ENV_NAME => secret_id."
  type        = map(string)
  default     = {}
}

variable "max_instances" {
  description = "Maximum number of container instances"
  type        = number
  default     = 2
}

variable "min_instances" {
  description = "Minimum number of container instances (0 = scale to zero)"
  type        = number
  default     = 0
}
