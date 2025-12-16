terraform {
  backend "s3" {
    # MUST match the bucket name from bootstrap.sh
    bucket         = "tune-grabber-terraform-state-77443322" 
    
    # The name and path of your state file inside the bucket
    key            = "tune-grabber/apprunner.tfstate"
    
    # MUST match the region from bootstrap.sh
    region         = "eu-west-2"
    
    # MUST match the DynamoDB table name from bootstrap.sh
    dynamodb_table = "terraform-state-locking"
    encrypt        = true
  }
}