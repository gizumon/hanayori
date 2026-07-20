output "service_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_v2_service.main.uri
}

output "service_name" {
  description = "Cloud Run service name"
  value       = google_cloud_run_v2_service.main.name
}

output "service_id" {
  description = "Cloud Run service ID"
  value       = google_cloud_run_v2_service.main.id
}

output "latest_revision" {
  description = "Latest revision name"
  value       = google_cloud_run_v2_service.main.latest_ready_revision
}

output "dns_cname_target" {
  description = "DNS CNAME target for custom domain"
  value       = var.enable_domain_mapping ? google_cloud_run_domain_mapping.main[0].status[0].resource_records[0].rrdata : ""
}
