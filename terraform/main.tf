terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# --- 1. ECR Repository ---
resource "aws_ecr_repository" "app" {
  name                 = var.app_name
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# --- 2. IAM Role for App Runner (Execution Role - PULLS IMAGE & LOGS) ---
resource "aws_iam_role" "apprunner_execution" {
  name = "${var.app_name}-apprunner-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "build.apprunner.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "apprunner_execution_policy" {
  role       = aws_iam_role.apprunner_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# --- NEW: IAM Role for App Runner (Instance Role - APPLICATION PERMISSIONS) ---
# This role grants permissions to the application code itself (e.g., S3 access, Secrets Manager)
resource "aws_iam_role" "apprunner_instance" {
  name = "${var.app_name}-apprunner-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        # The same principal is used for the instance role
        Service = "tasks.apprunner.amazonaws.com"
      }
    }]
  })

  # NOTE: Attach policies here (e.g., S3 ReadOnly, SecretsManagerReadWrite) 
  # This example uses no policy for minimum changes, but you must add one if needed.
}

# --- 3. App Runner Auto Scaling Configuration (COST OPTIMIZED) ---
resource "aws_apprunner_auto_scaling_configuration_version" "cost_saver" {
  auto_scaling_configuration_name = "${var.app_name}-cost-saver"

  # FIX: Must be 1 (App Runner does not support 0)
  min_size = 1 

  # Cap maximum instances to prevent unexpected spending
  max_size = var.apprunner_max_size

  # Higher concurrency = fewer instances needed = lower cost
  max_concurrency = var.apprunner_max_concurrency

  tags = {
    Environment   = "production"
    CostOptimized = "true"
  }
}

# --- 4. AWS App Runner Service ---
resource "aws_apprunner_service" "app" {
  service_name = var.app_name

  auto_scaling_configuration_arn = aws_apprunner_auto_scaling_configuration_version.cost_saver.arn

  instance_configuration {
    # *** SMALLEST AVAILABLE INSTANCE (COST OPTIMIZED) ***
    cpu    = var.apprunner_cpu    # 1024 = 1 vCPU (minimum)
    memory = var.apprunner_memory # 2048 = 2 GB (minimum)

    # NEW: Link the instance role to allow application code to access other AWS services
    instance_role_arn = aws_iam_role.apprunner_instance.arn
  }

  source_configuration {
    image_repository {
      image_identifier      = "${aws_ecr_repository.app.repository_url}:${var.image_tag}"
      image_repository_type = "ECR"

      image_configuration {
        port = var.app_port

        runtime_environment_variables = {
          NODE_ENV        = "production"
          HOSTNAME        = "0.0.0.0"
          PORT            = "8080"
          YT_DLP_PATH     = "/usr/local/bin/yt-dlp"
          FFMPEG_PATH     = "/usr/local/bin/ffmpeg"
        }
      }
    }

    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_execution.arn
    }

    # Disable auto-deployments (managed by Terraform)
    auto_deployments_enabled = false
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/api/health"
    interval            = 20
    timeout             = 20
    healthy_threshold   = 1
    unhealthy_threshold = 5
  }

  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}

# --- Outputs ---
output "ecr_repository_url" {
  value       = aws_ecr_repository.app.repository_url
  description = "ECR repository URL for pushing Docker images"
}

output "apprunner_service_url" {
  value       = "https://${aws_apprunner_service.app.service_url}"
  description = "Public URL to access your application on AWS App Runner"
}

output "apprunner_service_id" {
  value       = aws_apprunner_service.app.service_id
  description = "App Runner service ID"
}

output "apprunner_service_arn" {
  value       = aws_apprunner_service.app.arn
  description = "App Runner service ARN"
}