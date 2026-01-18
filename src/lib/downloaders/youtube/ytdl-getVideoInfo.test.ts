import { getVideoInfo, YOUTUBE_DOMAINS, type InfoOptions } from './ytdl';
import ytdlp from '@/lib/downloaders/youtube/ytdlp-wrapper';
import { validateUrlString } from '@/lib/validators/url';
import { logger } from '@/lib/logger';

jest.mock('./ytdlp-wrapper', () => ({
  __esModule: true,
  default: {
    getInfoAsync: jest.fn(),
  },
}));

jest.mock('@/lib/validators/url', () => ({
  validateUrlString: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('getVideoInfo', () => {
  const validYoutubeUrl = 'https://www.youtube.com/watch?v=abc123';

  beforeEach(() => {
    jest.clearAllMocks();
    (validateUrlString as jest.Mock).mockReturnValue({ isValid: true, message: 'Valid' });
  });

  it('validates the URL and fetches video info successfully', async () => {
    const mockInfo = { title: 'Test Video' };
    (ytdlp.getInfoAsync as jest.Mock).mockResolvedValue(mockInfo);

    const result = await getVideoInfo(validYoutubeUrl);

    expect(validateUrlString).toHaveBeenCalledWith(validYoutubeUrl, {
      permittedHosts: YOUTUBE_DOMAINS,
    });
    expect(ytdlp.getInfoAsync).toHaveBeenCalledWith(validYoutubeUrl, undefined);
    expect(logger.info).toHaveBeenCalledWith({ result: mockInfo }, 'Video info result');
    expect(result).toEqual(mockInfo);
  });

  it('passes options to getInfoAsync', async () => {
    const mockInfo = { title: 'Test Video' };

    // We cast to InfoOptions to verify the object is passed through to the wrapper.
    const options = { someOption: true } as InfoOptions;

    (ytdlp.getInfoAsync as jest.Mock).mockResolvedValue(mockInfo);

    await getVideoInfo(validYoutubeUrl, options);

    expect(ytdlp.getInfoAsync).toHaveBeenCalledWith(validYoutubeUrl, options);
  });
  it('throws an error if URL validation fails', async () => {
    (validateUrlString as jest.Mock).mockReturnValue({
      isValid: false,
      message: 'Invalid URL',
    });

    await expect(getVideoInfo('invalid-url')).rejects.toThrow('Invalid URL');
    expect(ytdlp.getInfoAsync).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('logs and rethrows error if fetching info fails', async () => {
    const error = new Error('Fetch failed');
    (ytdlp.getInfoAsync as jest.Mock).mockRejectedValue(error);

    await expect(getVideoInfo(validYoutubeUrl)).rejects.toThrow('Fetch failed');
    expect(logger.error).toHaveBeenCalledWith({ err: error }, 'Error getting video info');
  });
});
