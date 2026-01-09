import { logger } from '@/lib/logger';

const progressTracker = (progress: unknown) => {
  logger.debug({ progress }, 'Download progress');
};

export const getMp3DownloadOptions = (fullPath: string) =>
  ({
    format: {
      filter: 'audioonly',
      type: 'mp3',
    },
    output: fullPath,
    onProgress: progressTracker,
  }) as const;
