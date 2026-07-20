variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "sign_in_email_enabled" {
  description = "Enable email/password sign-in"
  type        = bool
  default     = true
}

variable "sign_in_anonymous_enabled" {
  description = "Enable anonymous sign-in"
  type        = bool
  default     = false
}

variable "authorized_domains" {
  description = "Additional authorized domains for OAuth redirects (e.g. Cloud Run URLs, custom domains)"
  type        = list(string)
  default     = []
}

variable "google_oauth_client_id" {
  description = "OAuth 2.0 client ID for Google Sign-In (created manually in GCP Console > APIs & Services > Credentials)"
  type        = string
  default     = ""
}

variable "google_oauth_client_secret" {
  description = "OAuth 2.0 client secret for Google Sign-In"
  type        = string
  sensitive   = true
  default     = ""
}
