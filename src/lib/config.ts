export const config = {
  aws: {
    region: process.env.AWS_REGION,
    s3BucketName: process.env.S3_BUCKET_NAME,
    sqsQueueUrl: process.env.SQS_QUEUE_URL,
    dynamodbTableName: process.env.DYNAMODB_TABLE_NAME,
  },
};
