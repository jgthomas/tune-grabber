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

variable "image_tag" {
  description = "Docker image tag to deploy (e.g., git SHA)"
  type        = string
  default     = "latest"
}

variable "app_port" {
  description = "Port your application listens on"
  type        = number
  default     = 8080
}

# --- App Runner Cost Optimization Variables ---

variable "apprunner_cpu" {
  description = "App Runner CPU units (1024 = 1 vCPU, minimum for cost savings)"
  type        = string
  default     = "1024"
}

variable "apprunner_memory" {
  description = "App Runner memory in MB (2048 = 2 GB, minimum required)"
  type        = string
  default     = "2048"
}

variable "apprunner_max_size" {
  description = "Maximum number of instances to scale to (caps costs during traffic spikes)"
  type        = number
  default     = 5
}

variable "apprunner_max_concurrency" {
  description = "Max concurrent requests per instance (higher = fewer instances = lower cost)"
  type        = number
  default     = 100
}

# --- Cost Monitoring Variables ---

variable "alert_email" {
  description = "Email address for cost and monitoring alerts"
  type        = string
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 20
}

variable "cost_anomaly_threshold" {
  description = "Dollar amount threshold for cost anomaly alerts"
  type        = number
  default     = 10
}

variable "budget_alert_threshold_percent" {
  description = "Percentage of budget to trigger first alert"
  type        = number
  default     = 80
}