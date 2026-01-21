import path from 'path';
import { promises as fs } from 'fs';
import { receiveMessages, deleteMessage } from '@/lib/aws/sqs';
import { updateJobStatus } from '@/lib/aws/dynamo';
import { downloadVideoAndExtractAudioToMp3 } from '@/lib/downloaders/youtube/ytdl';
import { s3Service } from '@/lib/aws/s3-service';
import { logger } from '@/lib/logger';
import { JobPayload } from '@/lib/types/job';
import { sanitizeTitle } from '@/lib/downloaders/youtube/utils';

// Ensure /tmp exists (or use OS temp dir)
const TEMP_DIR = '/tmp';

async function processJob(messageBody: string, receiptHandle: string) {
  let payload: JobPayload;

  try {
    payload = JSON.parse(messageBody);
  } catch (e) {
    logger.error({ err: e, body: messageBody }, 'Failed to parse message body');
    // Delete malformed message so it doesn't block the queue
    await deleteMessage(receiptHandle);
    return;
  }

  const { jobId, url, title } = payload;
  logger.info({ jobId, url }, 'Processing job');

  try {
    await updateJobStatus(jobId, 'PROCESSING');

    const sanitizedTitle = sanitizeTitle(title);
    const fileName = `${sanitizedTitle}.mp3`;
    const fullPath = path.join(TEMP_DIR, fileName);

    // 1. Download locally
    await downloadVideoAndExtractAudioToMp3(url, fullPath);

    // 2. Upload to S3
    await s3Service.uploadFile(fullPath, fileName);

    // 3. Update Status
    await updateJobStatus(jobId, 'COMPLETED', { S3Key: fileName });

    // 4. Cleanup
    await fs.unlink(fullPath);
    await deleteMessage(receiptHandle);

    logger.info({ jobId }, 'Job completed successfully');
  } catch (error) {
    logger.error({ err: error, jobId }, 'Job failed');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateJobStatus(jobId, 'FAILED', { ErrorMessage: errorMessage });
    // Note: We might NOT want to delete the message immediately if we want DLQ logic,
    // but for now, let's assume we don't want to retry endlessly in this simple worker.
    // Or we rely on SQS visibility timeout to retry.
    // Let's rely on visibility timeout for retries, but if it fails too many times it goes to DLQ (if configured).
    // For this prototype, I'll delete it to avoid loops if the error is deterministic.
    await deleteMessage(receiptHandle);
  }
}

async function startWorker() {
  logger.info('Worker started. Polling for jobs...');

  while (true) {
    try {
      const messages = await receiveMessages(1, 20); // Long polling 20s

      if (messages.length === 0) {
        continue;
      }

      for (const message of messages) {
        if (message.Body && message.ReceiptHandle) {
          await processJob(message.Body, message.ReceiptHandle);
        }
      }
    } catch (error) {
      logger.error({ err: error }, 'Worker polling error');
      // Wait a bit before retrying to avoid tight loop on network failure
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Start the worker if this file is executed directly
if (require.main === module) {
  startWorker().catch((err) => {
    logger.fatal({ err }, 'Worker crashed');
    process.exit(1);
  });
}
