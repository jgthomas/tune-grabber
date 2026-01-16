import { downloadAction } from './action';
import ytdlp from '@/lib/downloaders/youtube/ytdlp-wrapper';
import { validateUrlString } from '@/lib/validators/url';
import { logger } from '@/lib/logger';

jest.mock('@/lib/downloaders/youtube/ytdlp-wrapper', () => ({
  __esModule: true,
  default: {
    downloadAsync: jest.fn(),
    execAsync: jest.fn(),
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
    debug: jest.fn(),
  },
}));

describe('downloadAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock behavior: valid URL
    (validateUrlString as jest.Mock).mockReturnValue({ isValid: true, message: 'Valid' });
  });

  it('returns an error when the url is missing', async () => {
    const formData = new FormData();

    const result = await downloadAction(null, formData);

    expect(result).toEqual({
      success: false,
      message: 'Please enter a valid URL.',
    });
  });

  it('returns an error when general URL validation fails', async () => {
    const formData = new FormData();
    formData.set('urlInput', 'invalid-url');

    (validateUrlString as jest.Mock).mockReturnValue({
      isValid: false,
      message: 'Invalid URL format',
    });

    const result = await downloadAction(null, formData);

    expect(result).toEqual({
      success: false,
      message: 'Invalid URL format',
    });
    // Should verify ytdlp was NOT called
    expect(ytdlp.getInfoAsync).not.toHaveBeenCalled();
    expect(ytdlp.downloadAsync).not.toHaveBeenCalled();
  });

  it('downloads audio and returns success state', async () => {
    const formData = new FormData();
    formData.set('urlInput', 'https://www.youtube.com/watch?v=abc123');

    (ytdlp.getInfoAsync as jest.Mock).mockResolvedValue({ title: 'TestVideoTitle' });

    (ytdlp.downloadAsync as jest.Mock).mockResolvedValue('ok');

    const result = await downloadAction(null, formData);

    // It is called first with just the URL (in action.ts)
    expect(validateUrlString).toHaveBeenNthCalledWith(1, 'https://www.youtube.com/watch?v=abc123');

    // It is called again inside getVideoTitle/downloadVideo (in ytdl.ts) with options
    // We can check that too if we want, but checking the first one confirms our change.

    expect(ytdlp.downloadAsync).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=abc123',
      expect.objectContaining({
        format: {
          filter: 'audioonly',
          type: 'mp3',
        },
        output: expect.stringMatching(/^\/tmp\/TestVideoTitle\.mp3$/),
        onProgress: expect.any(Function),
      }),
    );

    // Execute onProgress to cover it
    const [, options] = (ytdlp.downloadAsync as jest.Mock).mock.calls[0];
    options.onProgress({ percent: 25 });

    expect(result).toEqual({
      success: true,
      message: 'Download finished (Local mode: check /tmp)',
      url: expect.stringMatching(/^\/api\/download\?file=/),
    });
  });

  it('returns a failure state when ytdl throws an Error', async () => {
    const formData = new FormData();
    formData.set('urlInput', 'https://www.youtube.com/watch?v=fail');

    // Validation passes
    (validateUrlString as jest.Mock).mockReturnValue({ isValid: true });

    (ytdlp.getInfoAsync as jest.Mock).mockImplementation(() => {
      throw new Error('YTDL Error');
    });

    const result = await downloadAction(null, formData);

    expect(result).toEqual({
      success: false,
      message: 'Failed to download: YTDL Error',
    });

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Server Action Error',
    );
  });

  it('returns a generic failure message when a non-Error is thrown', async () => {
    const formData = new FormData();
    formData.set('urlInput', 'https://www.youtube.com/watch?v=abc123');

    // Validation passes
    (validateUrlString as jest.Mock).mockReturnValue({ isValid: true });

    // getInfoAsync throws
    (ytdlp.getInfoAsync as jest.Mock).mockImplementation(() => {
      throw 'boom';
    });

    const result = await downloadAction(null, formData);

    expect(result).toEqual({
      success: false,
      message: 'Failed to download: An unexpected error occurred',
    });

    expect(logger.error).toHaveBeenCalled();
  });
});
