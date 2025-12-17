#!/bin/bash
# --- Configuration ---
AWS_REGION="eu-west-2"
S3_BUCKET_NAME="tune-grabber-terraform-state-77443322"
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

    # 2. ECR Repository Check
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
    
    # 1. ECR Repository Delete/Skip
    if aws ecr describe-repositories --repository-names "$ECR_REPO_NAME" 2>/dev/null; then
        aws ecr delete-repository --repository-name "$ECR_REPO_NAME" --force 2>/dev/null && echo "✅ Deleted ECR Repo"
    else
        echo "✅ ECR Repo already gone. Skipping..."
    fi
    
    # 2. S3 Bucket Delete/Skip (with version purging)
    if aws s3api head-bucket --bucket "$S3_BUCKET_NAME" 2>/dev/null; then
        echo "Cleaning up all versions from S3 bucket..."

        # Remove all versions
        aws s3api delete-objects --bucket "$S3_BUCKET_NAME" \
            --delete "$(aws s3api list-object-versions --bucket "$S3_BUCKET_NAME" --output json --query '{Objects: Versions[].{Key:Key,VersionId:VersionId}}')" 2>/dev/null

        # Remove all delete markers
        aws s3api delete-objects --bucket "$S3_BUCKET_NAME" \
            --delete "$(aws s3api list-object-versions --bucket "$S3_BUCKET_NAME" --output json --query '{Objects: DeleteMarkers[].{Key:Key,VersionId:VersionId}}')" 2>/dev/null

        echo "Deleting bucket..."
        aws s3 rb s3://"$S3_BUCKET_NAME" --force 2>/dev/null && echo "✅ Deleted S3 Bucket"
    else
        echo "✅ S3 Bucket already gone. Skipping..."
    fi
}

if [ "$1" == "create" ]; then
    create_backend;
elif [ "$1" == "destroy" ]; then
    destroy_backend; 
else
    echo "Usage: ./bootstrap.sh [create|destroy]";
fi