import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readFileSync } from 'fs';

// The client automatically picks up credentials from IAM Role or Env Vars
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const isConfigured = () => !!BUCKET_NAME;

export const s3Service = {
  isConfigured,

  async uploadFile(localPath: string, fileName: string, contentType: string = 'audio/mpeg') {
    if (!isConfigured()) return null;

    const fileBuffer = readFileSync(localPath);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
    });

    return await s3Client.send(command);
  },

  async getDownloadLink(fileName: string, expiresIn: number = 3600) {
    if (!this.isConfigured()) return null;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  },
};
