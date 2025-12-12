variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "tune-grabber"
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "eu-west-2"
}

variable "alert_email" {
  description = "Email address for cost and monitoring alerts"
  type        = string
  # Set this via terraform.tfvars or -var flag
  # Example: terraform apply -var="alert_email=your@email.com"
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 10
}

variable "cost_anomaly_threshold" {
  description = "Dollar amount threshold for cost anomaly alerts"
  type        = number
  default     = 5
}

variable "lambda_cost_threshold" {
  description = "CloudWatch alarm threshold for Lambda costs in USD"
  type        = number
  default     = 5
}

variable "budget_alert_threshold_percent" {
  description = "Percentage of budget to trigger first alert"
  type        = number
  default     = 80
}