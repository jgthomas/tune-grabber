import { logger } from '@/lib/logger';

export const getMp3DownloadOptions = (fullPath: string) =>
  ({
    format: {
      filter: 'audioonly',
      type: 'mp3',
    },
    output: fullPath,
    onProgress: (progress: unknown) => {
      logger.debug({ progress }, 'Download progress');
    },
  }) as const;
