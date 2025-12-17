jest.mock('ytdlp-nodejs', () => ({
  YtDlp: jest.fn().mockImplementation((config) => ({
    config,
  })),
}));

describe('ytdlp config', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules(); // required because env vars are read on import
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('throws if env vars are missing', () => {
    delete process.env.YT_DLP_PATH;
    delete process.env.FFMPEG_PATH;

    expect(() => {
      require('./ytdlp-wrapper');
    }).toThrow('YT_DLP_PATH and FFMPEG_PATH environment variables must be set');
  });

  it('creates YtDlp when env vars are set', () => {
    process.env.YT_DLP_PATH = '/usr/bin/yt-dlp';
    process.env.FFMPEG_PATH = '/usr/bin/ffmpeg';

    const ytdlp = require('./ytdlp-wrapper').default;
    const { YtDlp } = require('ytdlp-nodejs');

    expect(YtDlp).toHaveBeenCalledWith({
      binaryPath: '/usr/bin/yt-dlp',
      ffmpegPath: '/usr/bin/ffmpeg',
    });

    expect(ytdlp).toBeDefined();
  });
});
