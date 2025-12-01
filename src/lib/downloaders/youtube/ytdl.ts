import { YtDlp } from 'ytdlp-nodejs';
import { validateUrlString } from '@/lib/validators/url';

const YOUTUBE_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'music.youtube.com',
];

const YT_DLP_PATH = process.env.YT_DLP_PATH;
const FFMPEG_PATH = process.env.FFMPEG_PATH;

if (!YT_DLP_PATH || !FFMPEG_PATH) {
  throw new Error('YT_DLP_PATH and FFMPEG_PATH environment variables must be set');
}

const ytdlp = new YtDlp({
  binaryPath: YT_DLP_PATH,
  ffmpegPath: FFMPEG_PATH,
});

export async function downloadVideoAndExtractAudioToMp3(yturl: string) {
  try {
    validateUrlString(yturl, { permittedHosts: YOUTUBE_DOMAINS });

    const output = await ytdlp.downloadAsync(yturl, {
      format: {
        filter: 'audioonly',
        type: 'mp3',
      },
      output: 'test-audio.mp3',
      onProgress: (progress) => {
        console.log(progress);
      },
    });
    console.log('Download completed:', output);
  } catch (error) {
    console.error('Error:', error);
  }
}
