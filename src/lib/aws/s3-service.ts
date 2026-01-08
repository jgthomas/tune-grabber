import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readFileSync } from 'fs';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

// The client automatically picks up credentials from IAM Role or Env Vars
const s3Client = new S3Client({ region: config.aws.region });

const isConfigured = () => !!config.aws.s3BucketName;

export const s3Service = {
  isConfigured,

  async uploadFile(localPath: string, fileName: string, contentType: string = 'audio/mpeg') {
    if (!isConfigured()) {
      logger.warn('Attempted S3 upload but service is not configured');
      return null;
    }

    logger.info({ fileName, bucket: config.aws.s3BucketName }, 'Starting S3 upload');

    const fileBuffer = readFileSync(localPath);

    const command = new PutObjectCommand({
      Bucket: config.aws.s3BucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
    });

    const result = await s3Client.send(command);
    logger.debug({ fileName }, 'S3 upload completed');
    return result;
  },

  async getDownloadLink(fileName: string, expiresIn: number = 3600) {
    if (!this.isConfigured()) {
      logger.warn('Attempted to get S3 link but service is not configured');
      return null;
    }

    const command = new GetObjectCommand({
      Bucket: config.aws.s3BucketName,
      Key: fileName,
    });

    logger.info({ fileName }, 'Generating presigned URL');
    return await getSignedUrl(s3Client, command, { expiresIn });
  },
};
