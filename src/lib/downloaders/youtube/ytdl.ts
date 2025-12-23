import ytdlp from './ytdlp-wrapper';
import { validateUrlString } from '@/lib/validators/url';

export const YOUTUBE_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'music.youtube.com',
];

export async function downloadVideoAndExtractAudioToMp3(yturl: string, fullPath: string) {
  validateUrlString(yturl, { permittedHosts: YOUTUBE_DOMAINS });

  const output = await ytdlp.downloadAsync(yturl, {
    format: {
      filter: 'audioonly',
      type: 'mp3',
    },
    output: fullPath,
    onProgress: (progress) => {
      console.log(progress);
    },
  });

  console.log('Download completed:', output);

  return output;
}
