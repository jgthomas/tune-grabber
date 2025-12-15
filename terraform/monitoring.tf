# SNS Topic for cost alerts
resource "aws_sns_topic" "cost_alerts" {
  name = "${var.app_name}-cost-alerts"
}

# SNS Topic Subscription (email)
resource "aws_sns_topic_subscription" "cost_alerts_email" {
  topic_arn = aws_sns_topic.cost_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# Cost Anomaly Monitor
resource "aws_ce_anomaly_monitor" "app_monitor" {
  name              = "${var.app_name}-cost-monitor"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
}

# Cost Anomaly Subscription
resource "aws_ce_anomaly_subscription" "app_subscription" {
  name      = "${var.app_name}-cost-alerts"
  # FIX/IMPROVEMENT: Set to IMMEDIATE for faster detection of spikes
  frequency = "IMMEDIATE" 

  monitor_arn_list = [
    aws_ce_anomaly_monitor.app_monitor.arn,
  ]

  subscriber {
    type    = "SNS"
    address = aws_sns_topic.cost_alerts.arn
  }

  threshold_expression {
    dimension {
      key           = "ANOMALY_TOTAL_IMPACT_ABSOLUTE"
      values        = [tostring(var.cost_anomaly_threshold)]
      match_options = ["GREATER_THAN_OR_EQUAL"]
    }
  }
}

# Budget Alert (fixed monthly limit)
resource "aws_budgets_budget" "monthly" {
  name              = "${var.app_name}-monthly-budget"
  budget_type       = "COST"
  limit_amount      = tostring(var.monthly_budget_limit)
  limit_unit        = "USD"
  time_period_start = "2025-12-01_00:00"
  time_unit         = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = var.budget_alert_threshold_percent
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.cost_alerts.arn]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_sns_topic_arns  = [aws_sns_topic.cost_alerts.arn]
  }

  # REMOVED: The cost_filter block is completely removed here.
  # This makes the budget monitor ALL costs in the AWS account.
}

# Outputs
output "sns_topic_arn" {
  value       = aws_sns_topic.cost_alerts.arn
  description = "SNS topic ARN for cost alerts"
}

output "cost_monitoring_setup" {
  value = <<-EOT
    Cost Monitoring Configured:
    - Scope: ALL ACCOUNT COSTS
    - Monthly Budget: ${var.monthly_budget_limit}
    - Alert at ${var.budget_alert_threshold_percent}% of budget
    - Cost Anomaly Threshold: ${var.cost_anomaly_threshold}
    - Alert Email: ${var.alert_email}
    
    ⚠️  Check your email (${var.alert_email}) to confirm SNS subscription!
    ⚠️  SNS Topic ARN: ${aws_sns_topic.cost_alerts.arn}
  EOT
  description = "Cost monitoring configuration summary"
}