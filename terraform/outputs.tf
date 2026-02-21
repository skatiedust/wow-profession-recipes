output "frontend_url" {
  description = "Public URL of the frontend Cloud Run service"
  value       = module.frontend.service_url
}

output "backend_url" {
  description = "Public URL of the backend API Cloud Run service"
  value       = module.backend.service_url
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL instance connection name (project:region:instance)"
  value       = module.cloud_sql.connection_name
}

output "workload_identity_provider" {
  description = "Full resource name of the WIF provider (needed for GitHub Actions secret)"
  value       = var.github_repo != "" ? module.github_oidc[0].workload_identity_provider : null
}

output "github_actions_service_account" {
  description = "Email of the GitHub Actions service account (needed for GitHub Actions secret)"
  value       = var.github_repo != "" ? module.github_oidc[0].service_account_email : null
}
