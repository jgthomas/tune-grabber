import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from '@aws-sdk/client-sqs';
import { config } from '@/lib/config';
import { JobPayload } from '@/lib/types/job';
import { logger } from '@/lib/logger';

const sqsClient = new SQSClient({ region: config.aws.region });

export async function sendJob(payload: JobPayload) {
  if (!config.aws.sqsQueueUrl) {
    throw new Error('SQS Queue URL is not configured');
  }

  const command = new SendMessageCommand({
    QueueUrl: config.aws.sqsQueueUrl,
    MessageBody: JSON.stringify(payload),
  });

  try {
    const result = await sqsClient.send(command);
    logger.info({ messageId: result.MessageId }, 'Job sent to SQS');
    return result;
  } catch (error) {
    logger.error({ err: error }, 'Failed to send job to SQS');
    throw error;
  }
}

export async function receiveMessages(maxMessages = 1, waitTimeSeconds = 20) {
  if (!config.aws.sqsQueueUrl) {
    throw new Error('SQS Queue URL is not configured');
  }

  const command = new ReceiveMessageCommand({
    QueueUrl: config.aws.sqsQueueUrl,
    MaxNumberOfMessages: maxMessages,
    WaitTimeSeconds: waitTimeSeconds,
  });

  try {
    const response = await sqsClient.send(command);
    return response.Messages || [];
  } catch (error) {
    logger.error({ err: error }, 'Failed to receive messages from SQS');
    throw error;
  }
}

export async function deleteMessage(receiptHandle: string) {
  if (!config.aws.sqsQueueUrl) {
    throw new Error('SQS Queue URL is not configured');
  }

  const command = new DeleteMessageCommand({
    QueueUrl: config.aws.sqsQueueUrl,
    ReceiptHandle: receiptHandle,
  });

  try {
    await sqsClient.send(command);
    logger.info('Message deleted from SQS');
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete message from SQS');
    throw error;
  }
}
