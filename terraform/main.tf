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

# --- 2. IAM Roles ---
#
# --- App Runner (Execution Role - PULLS IMAGE & LOGS) ---
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

# --- App Runner (Instance Role - APPLICATION PERMISSIONS) ---
# This role grants permissions to the application code itself (e.g., S3 access, Secrets Manager)
resource "aws_iam_role" "apprunner_instance" {
  name = "${var.app_name}-apprunner-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "tasks.apprunner.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_policy" "app_s3_access" {
  name        = "${var.app_name}-s3-access"
  description = "Allows App Runner to upload and generate links for S3"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.media.arn,
          "${aws_s3_bucket.media.arn}/*"
        ]
      }
    ]
  })
}
resource "aws_iam_role_policy_attachment" "attach_s3_access" {
  role       = aws_iam_role.apprunner_instance.name
  policy_arn = aws_iam_policy.app_s3_access.arn
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
          NODE_ENV            = "production"
          HOSTNAME            = "0.0.0.0"
          PORT                = "8080"
          YT_DLP_PATH         = "/usr/local/bin/yt-dlp"
          FFMPEG_PATH         = "/usr/bin/ffmpeg"
          S3_BUCKET_NAME      = aws_s3_bucket.media.id
          AWS_REGION          = var.aws_region
          SQS_QUEUE_URL       = aws_sqs_queue.jobs.url
          DYNAMODB_TABLE_NAME = aws_dynamodb_table.jobs.name
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

# --- 5. S3 Bucket for Media Storage ---
resource "aws_s3_bucket" "media" {
  bucket        = "${var.app_name}-media-storage-${random_id.bucket_suffix.hex}"
  force_destroy = true # Allows terraform destroy to work even if files exist

  tags = {
    Name        = "Media Storage"
    Environment = "production"
  }
}

# Generate a unique suffix because S3 names must be globally unique
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Block all public access (Crucial for security)
resource "aws_s3_bucket_public_access_block" "media_privacy" {
  bucket                  = aws_s3_bucket.media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Auto-delete files after 24 hours to save money
resource "aws_s3_bucket_lifecycle_configuration" "media_cleanup" {
  bucket = aws_s3_bucket.media.id

  rule {
    id     = "auto-delete-temp-files"
    status = "Enabled"

    # Explicitly apply to all objects in the bucket
        filter {}
    
        expiration {
          days = 1
        }
      }
    }
    
    # --- 6. SQS Queue for Async Jobs ---
    resource "aws_sqs_queue" "jobs" {
      name                       = "${var.app_name}-jobs"
      delay_seconds              = 0
      max_message_size           = 262144 # 256 KB
      message_retention_seconds  = 345600 # 4 days
      receive_wait_time_seconds  = 20     # Long polling
      visibility_timeout_seconds = 300    # 5 minutes for processing time
    }
    
    # --- 7. DynamoDB Table for Job Status ---
    resource "aws_dynamodb_table" "jobs" {
      name         = "${var.app_name}-status"
      billing_mode = "PAY_PER_REQUEST" # Serverless billing
      hash_key     = "JobId"
    
      attribute {
        name = "JobId"
        type = "S"
      }
    
      ttl {
        attribute_name = "TTL"
        enabled        = true
      }
    
      tags = {
        Environment = "production"
        ManagedBy   = "terraform"
      }
    }
    
    # --- 8. IAM Policy Updates for Async Architecture ---
    resource "aws_iam_policy" "app_async_access" {
      name        = "${var.app_name}-async-access"
      description = "Allows App Runner to access SQS and DynamoDB"
    
      policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Action = [
              "sqs:SendMessage",
              "sqs:GetQueueUrl",
              "sqs:GetQueueAttributes"
            ]
            Resource = aws_sqs_queue.jobs.arn
          },
          {
            Effect = "Allow"
            Action = [
              "dynamodb:PutItem",
              "dynamodb:GetItem",
              "dynamodb:UpdateItem"
            ]
            Resource = aws_dynamodb_table.jobs.arn
          }
        ]
      })
    }
    
    resource "aws_iam_role_policy_attachment" "attach_async_access" {
      role       = aws_iam_role.apprunner_instance.name
      policy_arn = aws_iam_policy.app_async_access.arn
    }
    
    # --- 9. Local Worker IAM User (For your local machine) ---
    resource "aws_iam_user" "local_worker" {
      name = "${var.app_name}-local-worker"
    }
    
    resource "aws_iam_access_key" "local_worker_key" {
      user = aws_iam_user.local_worker.name
    }
    
    resource "aws_iam_policy" "worker_access" {
      name        = "${var.app_name}-worker-access"
      description = "Allows local worker to process jobs"
    
      policy = jsonencode({
        Version = "2012-10-17"
        Statement = [
          {
            Effect = "Allow"
            Action = [
              "sqs:ReceiveMessage",
              "sqs:DeleteMessage",
              "sqs:GetQueueAttributes"
            ]
            Resource = aws_sqs_queue.jobs.arn
          },
          {
            Effect = "Allow"
            Action = [
              "dynamodb:UpdateItem",
              "dynamodb:GetItem"
            ]
            Resource = aws_dynamodb_table.jobs.arn
          },
          {
            Effect = "Allow"
            Action = [
              "s3:PutObject"
            ]
            Resource = "${aws_s3_bucket.media.arn}/*"
          }
        ]
      })
    }
    
    resource "aws_iam_user_policy_attachment" "attach_worker_access" {
      user       = aws_iam_user.local_worker.name
      policy_arn = aws_iam_policy.worker_access.arn
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
    
    output "s3_bucket_name" {
      value       = aws_s3_bucket.media.id
      description = "S3 bucket to store media downloads"
    }
    
    output "sqs_queue_url" {
      value       = aws_sqs_queue.jobs.url
      description = "URL of the SQS job queue"
    }
    
    output "dynamodb_table_name" {
      value       = aws_dynamodb_table.jobs.name
      description = "Name of the DynamoDB status table"
    }
    
    output "local_worker_access_key_id" {
      value       = aws_iam_access_key.local_worker_key.id
      description = "Access Key ID for local worker"
      sensitive   = true
    }
    
    output "local_worker_secret_access_key" {
      value       = aws_iam_access_key.local_worker_key.secret
      description = "Secret Access Key for local worker"
      sensitive   = true
    }
    