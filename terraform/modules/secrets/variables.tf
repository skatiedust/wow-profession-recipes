variable "project_id" {
  description = "GCP project ID"
  type        = string
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

variable "session_secret" {
  description = "Secret used to sign session cookies"
  type        = string
  sensitive   = true
}

variable "database_url" {
  description = "PostgreSQL connection string"
  type        = string
  sensitive   = true
}
