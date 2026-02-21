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
