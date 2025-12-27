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

export async function getVideoTitle(yturl: string): Promise<string> {
  validateUrlString(yturl, { permittedHosts: YOUTUBE_DOMAINS });

  try {
    const result = await ytdlp.execAsync(yturl, {
      print: '%(title)s',
      noDownload: true,
      onData: (data) => {
        console.log('Raw data:', data);
      },
    });

    console.log('Title result:', result);

    // Sanitize the filename by removing invalid characters
    return result.trim().replace(/[/\\?%*:|"<>]/g, '-');
  } catch (error) {
    console.error('Error getting video title:', error);
    throw error;
  }
}
