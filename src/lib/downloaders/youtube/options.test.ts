import { getAudioDownloadOptions } from './options';
import { logger } from '@/lib/logger';

jest.mock('@/lib/logger', () => ({
  logger: {
    debug: jest.fn(),
  },
}));

describe('getAudioDownloadOptions', () => {
  const mockPath = '/tmp/test-output';

  it('should return default options for mp3 when no format is provided', () => {
    const options = getAudioDownloadOptions(mockPath);

    expect(options).toEqual(
      expect.objectContaining({
        format: {
          filter: 'audioonly',
          type: 'mp3',
        },
        output: mockPath,
      }),
    );
  });

  it('should return options for the specified format', () => {
    const options = getAudioDownloadOptions(mockPath, 'aac');

    expect(options).toEqual(
      expect.objectContaining({
        format: {
          filter: 'audioonly',
          type: 'aac',
        },
        output: mockPath,
      }),
    );
  });

  it('should call logger.debug in onProgress callback', () => {
    const options = getAudioDownloadOptions(mockPath);
    const mockProgress = { percent: 50 };

    options.onProgress(mockProgress);

    expect(logger.debug).toHaveBeenCalledWith({ progress: mockProgress }, 'Download progress');
  });
});
