resource "google_secret_manager_secret" "bnet_client_id" {
  project   = var.project_id
  secret_id = "bnet-client-id"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "bnet_client_id" {
  secret      = google_secret_manager_secret.bnet_client_id.id
  secret_data = var.bnet_client_id
}

resource "google_secret_manager_secret" "bnet_client_secret" {
  project   = var.project_id
  secret_id = "bnet-client-secret"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "bnet_client_secret" {
  secret      = google_secret_manager_secret.bnet_client_secret.id
  secret_data = var.bnet_client_secret
}

resource "google_secret_manager_secret" "session_secret" {
  project   = var.project_id
  secret_id = "session-secret"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "session_secret" {
  secret      = google_secret_manager_secret.session_secret.id
  secret_data = var.session_secret
}

resource "google_secret_manager_secret" "database_url" {
  project   = var.project_id
  secret_id = "database-url"

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "database_url" {
  secret      = google_secret_manager_secret.database_url.id
  secret_data = var.database_url
}
