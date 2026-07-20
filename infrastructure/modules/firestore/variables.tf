variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "cloud_run_service_account_emails" {
  description = "Cloud Run service account emails to grant Firestore access (stg and/or prod)"
  type        = list(string)
  default     = []
}

variable "location" {
  description = "Firestore location (asia-northeast1, asia1, nam5, eur3)"
  type        = string
  default     = "asia-northeast1"
}

variable "delete_protection" {
  description = "Enable GCP-level delete protection on the Firestore database"
  type        = bool
  default     = true
}

variable "deletion_policy" {
  description = "Terraform destruction behavior: DELETE or ABANDON (ABANDON is safer for prod)"
  type        = string
  default     = "ABANDON"

  validation {
    condition     = contains(["DELETE", "ABANDON"], var.deletion_policy)
    error_message = "deletion_policy must be DELETE or ABANDON."
  }
}
