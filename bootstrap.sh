#!/bin/bash
#
# Script to create and tear down the Terraform S3 Backend and DynamoDB Lock Table.
#

# --- Configuration Variables ---
AWS_REGION="eu-west-2"
S3_BUCKET_NAME="tune-grabber-terraform-state-77443322"
DYNAMODB_TABLE_NAME="terraform-state-locking"
# --- End Configuration ---

# Ensure AWS Region is set for the script
export AWS_DEFAULT_REGION=$AWS_REGION

# --- Function to Create Resources (Bootstrap) ---
create_backend() {
    echo "--- Phase 1: Creating S3 State Bucket: $S3_BUCKET_NAME ---"
    
    # Create the S3 bucket
    # The --create-bucket-configuration is needed for all regions except us-east-1
    aws s3api create-bucket \
        --bucket $S3_BUCKET_NAME \
        --region $AWS_REGION \
        --create-bucket-configuration LocationConstraint=$AWS_REGION

    # Enable Versioning (CRITICAL for state safety)
    aws s3api put-bucket-versioning \
        --bucket $S3_BUCKET_NAME \
        --versioning-configuration Status=Enabled
    
    echo "S3 Bucket created and Versioning Enabled."

    echo "--- Phase 2: Creating DynamoDB Lock Table: $DYNAMODB_TABLE_NAME ---"
    
    # Create the DynamoDB table for state locking
    aws dynamodb create-table \
        --table-name $DYNAMODB_TABLE_NAME \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

    echo "DynamoDB table created."
    echo ""
    echo "****************************************************************"
    echo "SUCCESS: Backend resources created. You can now run 'terraform init' in your project."
    echo "****************************************************************"
}

# --- Function to Tear Down Resources (Cleanup) ---
destroy_backend() {
    echo "--- Phase 3: Deleting DynamoDB Lock Table: $DYNAMODB_TABLE_NAME ---"
    aws dynamodb delete-table \
        --table-name $DYNAMODB_TABLE_NAME

    echo "DynamoDB table deleted."
    
    echo "--- Phase 4: Deleting S3 State Bucket: $S3_BUCKET_NAME ---"
    # IMPORTANT: The 'rb' (remove bucket) command with --force deletes all objects, 
    # all versions, and then the bucket itself. This is necessary because we enabled versioning.
    aws s3 rb s3://$S3_BUCKET_NAME --force

    echo "S3 Bucket and all contents deleted."
    echo ""
    echo "CLEANUP COMPLETE: The backend infrastructure has been torn down."
}

# --- Execution ---
if [ "$1" == "create" ]; then
    create_backend
elif [ "$1" == "destroy" ]; then
    destroy_backend
else
    echo "Usage: ./bootstrap.sh [create | destroy]"
fi