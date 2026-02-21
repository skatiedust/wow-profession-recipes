output "vpc_id" {
  description = "The ID of the VPC network"
  value       = google_compute_network.vpc.id
}

output "vpc_connector_id" {
  description = "The ID of the Serverless VPC Access connector"
  value       = google_vpc_access_connector.connector.id
}

output "subnet_id" {
  description = "The ID of the subnet"
  value       = google_compute_subnetwork.subnet.id
}
