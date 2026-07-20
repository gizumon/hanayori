output "project_id" {
  description = "GCP project ID"
  value       = module.global.project_id
}

output "firestore_database_name" {
  description = "Firestore database name (use as FIRESTORE_DATABASE_ID)"
  value       = module.firestore.database_name
}

output "firestore_database_id" {
  description = "Firestore database resource ID"
  value       = module.firestore.database_id
}

output "firestore_location" {
  description = "Firestore database location"
  value       = module.firestore.location
}

output "firebase_auth_domain" {
  description = "Firebase Authentication domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)"
  value       = "${module.global.project_id}.firebaseapp.com"
}

output "firebase_auth_authorized_domains" {
  description = "Authorized domains for Firebase Authentication"
  value       = module.firebase_auth.authorized_domains
}

output "firebase_storage_bucket" {
  description = "Firebase Storage bucket (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)"
  value       = "${module.global.project_id}.firebasestorage.app"
}

output "firebase_messaging_sender_id" {
  description = "Firebase Messaging Sender ID = GCP project number (NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)"
  value       = data.google_project.main.number
}
