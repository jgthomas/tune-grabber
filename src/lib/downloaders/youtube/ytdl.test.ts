import { downloadVideoAndExtractAudioToMp3 } from './ytdl';
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates the URL, downloads audio as mp3, and reports progress', async () => {
    (ytdlp.downloadAsync as jest.Mock).mockResolvedValue('ok');

    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await downloadVideoAndExtractAudioToMp3(validYoutubeUrl);

    expect(validateUrlString).toHaveBeenCalledWith(validYoutubeUrl, {
      permittedHosts: [
        'youtube.com',
        'www.youtube.com',
        'youtu.be',
        'm.youtube.com',
        'music.youtube.com',
      ],
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

    consoleLogSpy.mockRestore();
  });

  it('logs an error if validation throws', async () => {
    const error = new Error('Invalid URL');
    (validateUrlString as jest.Mock).mockImplementation(() => {
      throw error;
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await downloadVideoAndExtractAudioToMp3('not-a-url');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error:', error);

    consoleErrorSpy.mockRestore();
  });
});
