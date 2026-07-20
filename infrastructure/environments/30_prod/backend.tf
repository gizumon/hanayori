terraform {
  backend "gcs" {
    bucket = "gizumon-hanayori-tfstate-prod"
    prefix = "terraform/main"
  }
}
