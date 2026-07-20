output "authorized_domains" {
  description = "Authorized domains configured for Firebase Authentication"
  value       = google_identity_platform_config.main.authorized_domains
}
