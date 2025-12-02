import ytdlp from './ytdlp-wrapper';
import { validateUrlString } from '@/lib/validators/url';

const YOUTUBE_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'music.youtube.com',
];

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
