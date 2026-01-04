import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readFileSync } from 'fs';
import { config } from '@/lib/config';

// The client automatically picks up credentials from IAM Role or Env Vars
const s3Client = new S3Client({ region: config.aws.region });

const isConfigured = () => !!config.aws.s3BucketName;

export const s3Service = {
  isConfigured,

  async uploadFile(localPath: string, fileName: string, contentType: string = 'audio/mpeg') {
    if (!isConfigured()) return null;

    const fileBuffer = readFileSync(localPath);

    const command = new PutObjectCommand({
      Bucket: config.aws.s3BucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
    });

    return await s3Client.send(command);
  },

  async getDownloadLink(fileName: string, expiresIn: number = 3600) {
    if (!this.isConfigured()) return null;

    const command = new GetObjectCommand({
      Bucket: config.aws.s3BucketName,
      Key: fileName,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  },
};
