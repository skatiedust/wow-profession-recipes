terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

locals {
  database_name = "wow_professions"
  database_user = "wow_app"
}

module "networking" {
  source     = "./modules/networking"
  project_id = var.gcp_project_id
  region     = var.gcp_region
}

module "cloud_sql" {
  source            = "./modules/cloud-sql"
  project_id        = var.gcp_project_id
  region            = var.gcp_region
  database_name     = local.database_name
  database_user     = local.database_user
  database_password = var.database_password
  network_id        = module.networking.vpc_id

  depends_on = [module.networking]
}

module "secrets" {
  source             = "./modules/secrets"
  project_id         = var.gcp_project_id
  bnet_client_id     = var.bnet_client_id
  bnet_client_secret = var.bnet_client_secret
  session_secret     = var.session_secret
  database_url       = "postgresql://${local.database_user}:${var.database_password}@${module.cloud_sql.private_ip}:5432/${local.database_name}"
}

module "backend" {
  source                = "./modules/cloud-run"
  project_id            = var.gcp_project_id
  region                = var.gcp_region
  service_name          = "wow-professions-api"
  service_account_email = google_service_account.backend.email
  vpc_connector_id      = module.networking.vpc_connector_id
  cloud_sql_connection  = module.cloud_sql.connection_name

  env_vars = {
    NODE_ENV     = "production"
    FRONTEND_URL = var.frontend_url
  }

  secret_env_vars = {
    DATABASE_URL       = module.secrets.database_url_secret_id
    BNET_CLIENT_ID     = module.secrets.bnet_client_id_secret_id
    BNET_CLIENT_SECRET = module.secrets.bnet_client_secret_secret_id
    SESSION_SECRET     = module.secrets.session_secret_secret_id
  }
}

module "frontend" {
  source               = "./modules/cloud-run"
  project_id           = var.gcp_project_id
  region               = var.gcp_region
  service_name         = "wow-professions-web"
  vpc_connector_id     = null
  cloud_sql_connection = null

  env_vars = {
    BACKEND_URL = module.backend.service_url
  }

  secret_env_vars = {}
}

# --- IAM Bindings ---

# Allow unauthenticated access to both Cloud Run services
resource "google_cloud_run_v2_service_iam_member" "backend_public" {
  project  = var.gcp_project_id
  location = var.gcp_region
  name     = module.backend.service_name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_v2_service_iam_member" "frontend_public" {
  project  = var.gcp_project_id
  location = var.gcp_region
  name     = module.frontend.service_name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Grant the backend Cloud Run service account access to Cloud SQL
resource "google_project_iam_member" "backend_cloudsql_client" {
  project = var.gcp_project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

# Grant the backend Cloud Run service account access to Secret Manager secrets
resource "google_project_iam_member" "backend_secret_accessor" {
  project = var.gcp_project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

# Dedicated service account for the backend Cloud Run service
resource "google_service_account" "backend" {
  project      = var.gcp_project_id
  account_id   = "wow-professions-api"
  display_name = "WoW Professions API Service Account"
}
