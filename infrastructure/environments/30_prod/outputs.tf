output "service_url" {
  description = "Cloud Run service URL"
  value       = module.cloud_run.service_url
}

output "service_name" {
  description = "Cloud Run service name"
  value       = module.cloud_run.service_name
}

output "dns_cname_target" {
  description = "DNS CNAME target for custom domain"
  value       = module.cloud_run.dns_cname_target
}

output "dns_configuration" {
  description = "DNS configuration instructions for custom domain"
  value = var.custom_domain != "" ? join("\n", [
    "DNS Configuration for ${var.custom_domain}:",
    "  Type: CNAME",
    "  Name: ${var.custom_domain}",
    "  Target: ${module.cloud_run.dns_cname_target}",
    "",
    "For Cloudflare: Set proxy mode to \"DNS only\" (grey cloud) initially,",
    "then switch to \"Proxied\" once the certificate is provisioned.",
  ]) : "No custom domain configured."
}
