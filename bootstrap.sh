#!/bin/bash
# --- Configuration ---
AWS_REGION="eu-west-2"
S3_BUCKET_NAME="tune-grabber-terraform-state-77443322"
DYNAMODB_TABLE_NAME="terraform-state-locking"
ECR_REPO_NAME="tune-grabber"
export AWS_DEFAULT_REGION=$AWS_REGION

create_backend() {
    echo "--- Checking Infrastructure ---"

    # 1. S3 Bucket Check
    if aws s3api head-bucket --bucket "$S3_BUCKET_NAME" 2>/dev/null; then
        echo "✅ S3 Bucket already exists. Skipping..."
    else
        echo "Creating S3 Bucket..."
        aws s3api create-bucket --bucket "$S3_BUCKET_NAME" --region "$AWS_REGION" --create-bucket-configuration LocationConstraint="$AWS_REGION"
        aws s3api put-bucket-versioning --bucket "$S3_BUCKET_NAME" --versioning-configuration Status=Enabled
    fi

    # 2. DynamoDB Table Check
    if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE_NAME" 2>/dev/null; then
        echo "✅ DynamoDB Table already exists. Skipping..."
    else
        echo "Creating DynamoDB Table..."
        aws dynamodb create-table --table-name "$DYNAMODB_TABLE_NAME" \
            --attribute-definitions AttributeName=LockID,AttributeType=S \
            --key-schema AttributeName=LockID,KeyType=HASH \
            --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
    fi

    # 3. ECR Repository Check
    if aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" 2>/dev/null; then
        echo "✅ ECR Repository already exists. Skipping..."
    else
        echo "Creating ECR Repository..."
        aws ecr create-repository --repository-name "$ECR_REPO_NAME" --region "$AWS_REGION"
    fi

    echo ""
    echo "Done! Your backend and ECR are ready."
}

destroy_backend() {
    echo "--- Tearing Down Infrastructure ---"
    
    # ECR
    aws ecr delete-repository --repository-name "$ECR_REPO_NAME" --force 2>/dev/null && echo "Deleted ECR Repo"
    
    # Dynamo
    aws dynamodb delete-table --table-name "$DYNAMODB_TABLE_NAME" 2>/dev/null && echo "Deleted DynamoDB Table"
    
    # S3
    aws s3 rb s3://"$S3_BUCKET_NAME" --force 2>/dev/null && echo "Deleted S3 Bucket"
}

if [ "$1" == "create" ]; then
    create_backend;
elif [ "$1" == "destroy" ]; then
    destroy_backend; 
else
    echo "Usage: ./bootstrap.sh [create|destroy]";
fi