import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  UpdateCommand,
  GetCommand,
} from '@aws-sdk/lib-dynamodb';
import { config } from '@/lib/config';
import { JobRecord, JobStatus } from '@/lib/types/job';
import { logger } from '@/lib/logger';

const client = new DynamoDBClient({ region: config.aws.region });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = config.aws.dynamodbTableName;

export async function createJob(job: JobRecord) {
  if (!TABLE_NAME) throw new Error('DynamoDB Table Name is not configured');

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: job,
  });

  try {
    await docClient.send(command);
    logger.info({ jobId: job.JobId }, 'Job record created in DynamoDB');
  } catch (error) {
    logger.error({ err: error }, 'Failed to create job record');
    throw error;
  }
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  updates?: Partial<JobRecord>,
) {
  if (!TABLE_NAME) throw new Error('DynamoDB Table Name is not configured');

  let updateExpression = 'set #status = :status';
  const expressionAttributeNames: Record<string, string> = { '#status': 'Status' };
  const expressionAttributeValues: Record<string, unknown> = { ':status': status };

  if (updates) {
    Object.entries(updates).forEach(([key, value]) => {
      updateExpression += `, #${key} = :${key}`;
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    });
  }

  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { JobId: jobId },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  });

  try {
    await docClient.send(command);
    logger.info({ jobId, status }, 'Job status updated');
  } catch (error) {
    logger.error({ err: error }, 'Failed to update job status');
    throw error;
  }
}

export async function getJob(jobId: string): Promise<JobRecord | null> {
  if (!TABLE_NAME) throw new Error('DynamoDB Table Name is not configured');

  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { JobId: jobId },
  });

  try {
    const result = await docClient.send(command);
    return (result.Item as JobRecord) || null;
  } catch (error) {
    logger.error({ err: error }, 'Failed to get job');
    throw error;
  }
}
