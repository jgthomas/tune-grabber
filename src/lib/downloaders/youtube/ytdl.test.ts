import { downloadVideoAndExtractAudioToMp3, YOUTUBE_DOMAINS } from './ytdl';
import ytdlp from '@/lib/downloaders/youtube/ytdlp-wrapper';
import { validateUrlString } from '@/lib/validators/url';
import { logger } from '@/lib/logger';

jest.mock('./ytdlp-wrapper', () => ({
  __esModule: true,
  default: {
    downloadAsync: jest.fn(),
  },
}));

jest.mock('@/lib/validators/url', () => ({
  validateUrlString: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('downloadVideoAndExtractAudioToMp3', () => {
  const validYoutubeUrl = 'https://www.youtube.com/watch?v=abc123';
  const testOutputPath = 'test-audio.mp3';

  beforeEach(() => {
    jest.clearAllMocks();
    (validateUrlString as jest.Mock).mockReturnValue({ isValid: true, message: 'Valid' });
  });

  it('validates the URL, downloads audio as mp3, and reports progress', async () => {
    (ytdlp.downloadAsync as jest.Mock).mockResolvedValue('ok');

    await downloadVideoAndExtractAudioToMp3(validYoutubeUrl, testOutputPath);

    expect(validateUrlString).toHaveBeenCalledWith(validYoutubeUrl, {
      permittedHosts: YOUTUBE_DOMAINS,
    });

    expect(ytdlp.downloadAsync).toHaveBeenCalledWith(
      validYoutubeUrl,
      expect.objectContaining({
        format: {
          filter: 'audioonly',
          type: 'mp3',
        },
        output: 'test-audio.mp3',
        onProgress: expect.any(Function),
      }),
    );

    // Tes the onProgress callback
    const [, options] = (ytdlp.downloadAsync as jest.Mock).mock.calls[0];
    options.onProgress({ percent: 50 });

    expect(logger.debug).toHaveBeenCalledWith({ progress: { percent: 50 } }, 'Download progress');
    expect(logger.info).toHaveBeenCalledWith({ output: 'ok' }, 'Download completed');
  });

  it('propogates an error if validation fails (caller handles it)', async () => {
    (validateUrlString as jest.Mock).mockReturnValue({
      isValid: false,
      message: 'Invalid URL',
    });

    // 🚀 CRITICAL: Use .rejects to catch the error thrown by the function
    await expect(downloadVideoAndExtractAudioToMp3('not-a-url', testOutputPath)).rejects.toThrow(
      'Invalid URL',
    );

    // Verify ytdlp was never called because validation failed first
    expect(ytdlp.downloadAsync).not.toHaveBeenCalled();
  });
});
