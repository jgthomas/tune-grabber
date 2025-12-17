
# This allows Terraform to "adopt" the ECR repo created by bootstrap.sh
import {
  to = aws_ecr_repository.app
  id = var.app_name
}