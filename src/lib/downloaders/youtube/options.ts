import { logger } from '@/lib/logger';

export type AudioFormat = 'mp3' | 'aac' | 'flac' | 'm4a' | 'opus' | 'vorbis' | 'wav';

const progressTracker = (progress: unknown) => {
  logger.debug({ progress }, 'Download progress');
};

export const getAudioDownloadOptions = (fullPath: string, format: AudioFormat = 'mp3') =>
  ({
    format: {
      filter: 'audioonly',
      type: format,
    },
    output: fullPath,
    onProgress: progressTracker,
  }) as const;
