output "database_name" {
  description = "Firestore database name"
  value       = google_firestore_database.main.name
}

output "database_id" {
  description = "Firestore database resource ID"
  value       = google_firestore_database.main.id
}

output "location" {
  description = "Firestore database location"
  value       = google_firestore_database.main.location_id
}
