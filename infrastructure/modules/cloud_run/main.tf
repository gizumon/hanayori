terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# -------------------------------------------------------------------
# Cloud Run Service
# -------------------------------------------------------------------
resource "google_cloud_run_v2_service" "main" {
  name     = "${var.service_name}-${var.environment}"
  location = var.region
  project  = var.project_id

  ingress = var.ingress

  template {
    service_account = var.service_account_email

    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }

    dynamic "volumes" {
      for_each = var.vpc_connector_name != "" ? [1] : []
      content {
        name = "vpc-access"
        cloud_sql_instance {
          instances = []
        }
      }
    }

    dynamic "vpc_access" {
      for_each = var.vpc_connector_name != "" ? [1] : []
      content {
        connector = "projects/${var.project_id}/locations/${var.region}/connectors/${var.vpc_connector_name}"
        egress    = var.vpc_egress
      }
    }

    containers {
      image = var.container_image

      resources {
        limits = {
          cpu    = var.cpu_limit
          memory = var.memory_limit
        }
        cpu_idle          = var.cpu_throttling
        startup_cpu_boost = var.startup_cpu_boost
      }

      dynamic "env" {
        for_each = var.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = var.secret_env_vars
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value.secret_name
              version = env.value.version
            }
          }
        }
      }

      ports {
        container_port = var.container_port
      }

      startup_probe {
        http_get {
          path = var.health_check_path
          port = var.container_port
        }
        initial_delay_seconds = var.startup_probe_initial_delay
        timeout_seconds       = 3
        period_seconds        = 10
        failure_threshold     = 10
      }

      liveness_probe {
        http_get {
          path = var.health_check_path
          port = var.container_port
        }
        timeout_seconds   = 1
        period_seconds    = 10
        failure_threshold = 3
      }
    }

    max_instance_request_concurrency = var.concurrency
    timeout                          = "${var.request_timeout}s"

    labels = {
      environment = var.environment
      service     = var.service_name
      managed_by  = "terraform"
    }
  }

  labels = {
    environment = var.environment
    service     = var.service_name
    managed_by  = "terraform"
  }

  lifecycle {
    ignore_changes = [
      template[0].containers[0].image,
      client,
      client_version,
    ]
  }
}

# -------------------------------------------------------------------
# IAM - Public Access
# -------------------------------------------------------------------
resource "google_cloud_run_v2_service_iam_member" "public" {
  count = var.allow_unauthenticated ? 1 : 0

  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.main.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# -------------------------------------------------------------------
# Domain Mapping (v1 API - still required for custom domains)
# -------------------------------------------------------------------
resource "google_cloud_run_domain_mapping" "main" {
  count = var.enable_domain_mapping ? 1 : 0

  project  = var.project_id
  location = var.region
  name     = var.custom_domain

  metadata {
    namespace = var.project_id
    labels = {
      environment = var.environment
      service     = var.service_name
      managed_by  = "terraform"
    }
  }

  spec {
    route_name = google_cloud_run_v2_service.main.name
  }

  lifecycle {
    prevent_destroy = true
    ignore_changes = [
      metadata[0].annotations,
      metadata[0].labels,
    ]
  }
}
