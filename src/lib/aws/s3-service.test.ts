import { s3Service } from './s3-service';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import { config } from '@/lib/config';

// Mock Config
jest.mock('@/lib/config', () => ({
  config: {
    aws: {
      region: 'us-east-1',
      s3BucketName: 'test-bucket',
    },
  },
}));

// Mock Dependencies
jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn();
  const S3ClientMock = jest.fn(() => ({
    send: mockSend,
  }));
  // Attach the mockSend to the S3Client mock so we can access it in tests
  // @ts-expect-error - Attaching custom property to mock
  S3ClientMock.__mockSend = mockSend;

  return {
    S3Client: S3ClientMock,
    PutObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

// Access the shared mockSend
const mockSend = require('@aws-sdk/client-s3').S3Client.__mockSend as jest.Mock;

describe('s3Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockReset();
    // Reset config to default "configured" state
    config.aws.s3BucketName = 'test-bucket';
  });

  describe('isConfigured', () => {
    it('should return true if s3BucketName is set', () => {
      config.aws.s3BucketName = 'test-bucket';
      expect(s3Service.isConfigured()).toBe(true);
    });

    it('should return false if s3BucketName is missing', () => {
      config.aws.s3BucketName = undefined;
      expect(s3Service.isConfigured()).toBe(false);
    });
  });

  describe('uploadFile', () => {
    it('should return null if not configured', async () => {
      config.aws.s3BucketName = undefined;
      const result = await s3Service.uploadFile('path/to/file', 'file.mp3');
      expect(result).toBeNull();
      expect(fs.readFileSync).not.toHaveBeenCalled();
    });

    it('should read file and upload to S3 if configured', async () => {
      const mockBuffer = Buffer.from('file content');
      (fs.readFileSync as jest.Mock).mockReturnValue(mockBuffer);

      mockSend.mockResolvedValue({ ETag: 'some-etag' });

      const result = await s3Service.uploadFile('path/to/file', 'file.mp3');

      expect(fs.readFileSync).toHaveBeenCalledWith('path/to/file');
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'file.mp3',
        Body: mockBuffer,
        ContentType: 'audio/mpeg',
      });

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand));
      expect(result).toEqual({ ETag: 'some-etag' });
    });

    it('should use default content type if not provided', async () => {
      const mockBuffer = Buffer.from('content');
      (fs.readFileSync as jest.Mock).mockReturnValue(mockBuffer);
      mockSend.mockResolvedValue({});

      await s3Service.uploadFile('path', 'file.mp3');

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'audio/mpeg',
        }),
      );
    });

    it('should allow custom content type', async () => {
      const mockBuffer = Buffer.from('content');
      (fs.readFileSync as jest.Mock).mockReturnValue(mockBuffer);
      mockSend.mockResolvedValue({});

      await s3Service.uploadFile('path', 'file.txt', 'text/plain');

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          ContentType: 'text/plain',
        }),
      );
    });
  });

  describe('getDownloadLink', () => {
    it('should return null if not configured', async () => {
      config.aws.s3BucketName = undefined;
      const result = await s3Service.getDownloadLink('file.mp3');
      expect(result).toBeNull();
      expect(getSignedUrl).not.toHaveBeenCalled();
    });

    it('should generate a signed URL if configured', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('https://s3.aws.com/signed-url');

      const result = await s3Service.getDownloadLink('file.mp3');

      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'file.mp3',
      });
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(Object), // The s3Client instance
        expect.any(GetObjectCommand),
        { expiresIn: 3600 },
      );
      expect(result).toBe('https://s3.aws.com/signed-url');
    });

    it('should pass custom expiresIn value', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('url');

      await s3Service.getDownloadLink('file.mp3', 60);

      expect(getSignedUrl).toHaveBeenCalledWith(expect.any(Object), expect.any(GetObjectCommand), {
        expiresIn: 60,
      });
    });
  });
});
