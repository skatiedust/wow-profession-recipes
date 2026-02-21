variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "database_name" {
  description = "Name of the PostgreSQL database to create"
  type        = string
}

variable "database_user" {
  description = "Name of the PostgreSQL user to create"
  type        = string
}

variable "database_password" {
  description = "Password for the PostgreSQL user"
  type        = string
  sensitive   = true
}

variable "network_id" {
  description = "VPC network ID for private IP connectivity"
  type        = string
}
