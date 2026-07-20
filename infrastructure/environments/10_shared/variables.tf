variable "authorized_domains" {
  description = "Additional authorized domains for Firebase Auth OAuth redirects (Cloud Run URLs, custom domains)"
  type        = list(string)
  default     = []
}

variable "google_oauth_client_id" {
  description = "OAuth 2.0 client ID for Google Sign-In (created manually in GCP Console > APIs & Services > Credentials). Leave empty to disable Google Sign-In."
  type        = string
  default     = ""
}

variable "google_oauth_client_secret" {
  description = "OAuth 2.0 client secret for Google Sign-In"
  type        = string
  sensitive   = true
  default     = ""
}
