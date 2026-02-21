output "bnet_client_id_secret_id" {
  description = "Secret Manager resource ID for Battle.net client ID"
  value       = google_secret_manager_secret.bnet_client_id.secret_id
}

output "bnet_client_secret_secret_id" {
  description = "Secret Manager resource ID for Battle.net client secret"
  value       = google_secret_manager_secret.bnet_client_secret.secret_id
}

output "session_secret_secret_id" {
  description = "Secret Manager resource ID for session secret"
  value       = google_secret_manager_secret.session_secret.secret_id
}

output "database_url_secret_id" {
  description = "Secret Manager resource ID for database URL"
  value       = google_secret_manager_secret.database_url.secret_id
}
