import { YtDlp } from 'ytdlp-nodejs';

const YT_DLP_PATH = process.env.YT_DLP_PATH;
const FFMPEG_PATH = process.env.FFMPEG_PATH;

if (!YT_DLP_PATH || !FFMPEG_PATH) {
  throw new Error('YT_DLP_PATH and FFMPEG_PATH environment variables must be set');
}

const ytdlp = new YtDlp({
  binaryPath: YT_DLP_PATH,
  ffmpegPath: FFMPEG_PATH,
});

export default ytdlp;
