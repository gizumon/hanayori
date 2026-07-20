terraform {
  backend "gcs" {
    bucket = "gizumon-hanayori-tfstate-stg"
    prefix = "terraform/main"
  }
}
