terraform {
  backend "gcs" {
    bucket = "gizumon-hanayori-tfstate-shared"
    prefix = "terraform/state"
  }
}
