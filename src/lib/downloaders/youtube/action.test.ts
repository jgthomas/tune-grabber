import { downloadAction } from './action';
import ytdlp from '@/lib/downloaders/youtube/ytdlp-wrapper';
import { validateUrlString } from '@/lib/validators/url';

jest.mock('@/lib/downloaders/youtube/ytdlp-wrapper', () => ({
  __esModule: true,
  default: {
    downloadAsync: jest.fn(),
    execAsync: jest.fn(),
  },
}));

jest.mock('@/lib/validators/url', () => ({
  validateUrlString: jest.fn(),
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
    expect(ytdlp.execAsync).not.toHaveBeenCalled();
    expect(ytdlp.downloadAsync).not.toHaveBeenCalled();
  });

  it('downloads audio and returns success state', async () => {
    const formData = new FormData();
    formData.set('urlInput', 'https://www.youtube.com/watch?v=abc123');

    (ytdlp.execAsync as jest.Mock).mockResolvedValue('TestVideoTitle');

    (ytdlp.downloadAsync as jest.Mock).mockResolvedValue('ok');

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

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

    consoleLogSpy.mockRestore();
  });

  it('returns a failure state when ytdl throws an Error', async () => {
    const formData = new FormData();
    formData.set('urlInput', 'https://www.youtube.com/watch?v=fail');

    // Validation passes
    (validateUrlString as jest.Mock).mockReturnValue({ isValid: true });

    (ytdlp.execAsync as jest.Mock).mockImplementation(() => {
      throw new Error('YTDL Error');
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await downloadAction(null, formData);

    expect(result).toEqual({
      success: false,
      message: 'YTDL Error',
    });

    consoleErrorSpy.mockRestore();
  });

  it('returns a generic failure message when a non-Error is thrown', async () => {
    const formData = new FormData();
    formData.set('urlInput', 'https://www.youtube.com/watch?v=abc123');

    // Validation passes
    (validateUrlString as jest.Mock).mockReturnValue({ isValid: true });

    // execAsync return a title
    (ytdlp.execAsync as jest.Mock).mockImplementation(() => {
      throw 'TestVideoTitle';
    });

    // Make downloadAsync throw a string instead of Error
    (ytdlp.downloadAsync as jest.Mock).mockImplementation(() => {
      throw 'boom';
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await downloadAction(null, formData);

    expect(result).toEqual({
      success: false,
      message: 'Failed to get video title',
    });

    consoleErrorSpy.mockRestore();
  });
});
