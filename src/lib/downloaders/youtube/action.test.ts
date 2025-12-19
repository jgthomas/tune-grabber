import { downloadAction } from './action';
import ytdlp from '@/lib/downloaders/youtube/ytdlp-wrapper';
import { validateUrlString } from '@/lib/validators/url';
import { url } from 'inspector';

jest.mock('@/lib/downloaders/youtube/ytdlp-wrapper', () => ({
  __esModule: true,
  default: {
    downloadAsync: jest.fn(),
  },
}));

jest.mock('@/lib/validators/url', () => ({
  validateUrlString: jest.fn(),
}));

describe('downloadAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an error when the url is missing', async () => {
    const formData = new FormData();

    const result = await downloadAction(null, formData);

    expect(result).toEqual({
      success: false,
      message: 'Please enter a valid URL.',
    });
  });

  it('downloads audio and returns success state', async () => {
    const formData = new FormData();
    formData.set('urlInput', 'https://www.youtube.com/watch?v=abc123');

    (ytdlp.downloadAsync as jest.Mock).mockResolvedValue('ok');

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await downloadAction(null, formData);

    expect(validateUrlString).toHaveBeenCalledWith('https://www.youtube.com/watch?v=abc123', {
      permittedHosts: [
        'youtube.com',
        'www.youtube.com',
        'youtu.be',
        'm.youtube.com',
        'music.youtube.com',
      ],
    });

    expect(ytdlp.downloadAsync).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=abc123',
      expect.objectContaining({
        format: {
          filter: 'audioonly',
          type: 'mp3',
        },
        output: expect.stringMatching(/^\/tmp\/audio-\d+\.mp3$/),
        onProgress: expect.any(Function),
      }),
    );

    // Execute onProgress to cover it
    const [, options] = (ytdlp.downloadAsync as jest.Mock).mock.calls[0];
    options.onProgress({ percent: 25 });

    expect(result).toEqual({
      success: true,
      message: 'Download finished (Local mode: check /tmp)',
      url: null,
    });

    consoleLogSpy.mockRestore();
  });

  it('returns a failure state when validation throws an Error', async () => {
    const formData = new FormData();
    formData.set('urlInput', 'bad-url');

    (validateUrlString as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid URL');
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await downloadAction(null, formData);

    expect(result).toEqual({
      success: false,
      message: 'Failed to download: Invalid URL',
    });

    consoleErrorSpy.mockRestore();
  });

  it('returns a generic failure message when a non-Error is thrown', async () => {
    const formData = new FormData();
    formData.set('urlInput', 'https://www.youtube.com/watch?v=abc123');

    // Ensure validation passes
    (validateUrlString as jest.Mock).mockImplementation(() => {});

    // Make downloadAsync throw a string instead of Error
    (ytdlp.downloadAsync as jest.Mock).mockImplementation(() => {
      throw 'boom';
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await downloadAction(null, formData);

    expect(result).toEqual({
      success: false,
      message: 'Failed to download: An unexpected error occurred',
    });

    consoleErrorSpy.mockRestore();
  });
});
