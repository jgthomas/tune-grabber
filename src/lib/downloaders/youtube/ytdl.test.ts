import { downloadVideoAndExtractAudioToMp3, YOUTUBE_DOMAINS } from './ytdl';
import ytdlp from '@/lib/downloaders/youtube/ytdlp-wrapper';
import { validateUrlString } from '@/lib/validators/url';

jest.mock('./ytdlp-wrapper', () => ({
  __esModule: true,
  default: {
    downloadAsync: jest.fn(),
  },
}));

jest.mock('@/lib/validators/url', () => ({
  validateUrlString: jest.fn(),
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

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await downloadVideoAndExtractAudioToMp3(validYoutubeUrl, testOutputPath);

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

    expect(consoleLogSpy).toHaveBeenCalled();
    expect(result).toEqual({ success: true, data: 'ok' });

    consoleLogSpy.mockRestore();
  });

  it('returns failure object if validation fails', async () => {
    (validateUrlString as jest.Mock).mockReturnValue({
      isValid: false,
      message: 'Invalid URL',
    });

    const result = await downloadVideoAndExtractAudioToMp3('not-a-url', testOutputPath);

    expect(result).toEqual({ success: false, message: 'Invalid URL' });

    // Verify ytdlp was never called because validation failed first
    expect(ytdlp.downloadAsync).not.toHaveBeenCalled();
  });

  it('returns failure object if download throws', async () => {
    (ytdlp.downloadAsync as jest.Mock).mockRejectedValue(new Error('Download failed'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await downloadVideoAndExtractAudioToMp3(validYoutubeUrl, testOutputPath);

    expect(result).toEqual({ success: false, message: 'Download failed' });
    consoleErrorSpy.mockRestore();
  });
});
