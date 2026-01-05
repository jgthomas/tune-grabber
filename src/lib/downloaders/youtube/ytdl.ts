import ytdlp from './ytdlp-wrapper';
import { validateUrlString } from '@/lib/validators/url';

export const YOUTUBE_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'music.youtube.com',
];

export type YtDlResult<T> = { success: true; data: T } | { success: false; message: string };

export async function downloadVideoAndExtractAudioToMp3(
  yturl: string,
  fullPath: string,
): Promise<YtDlResult<unknown>> {
  const validation = validateUrlString(yturl, { permittedHosts: YOUTUBE_DOMAINS });
  if (!validation.isValid) {
    return { success: false, message: validation.message };
  }

  try {
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
    return { success: true, data: output };
  } catch (error) {
    console.error('Download error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

export async function getVideoTitle(yturl: string): Promise<YtDlResult<string>> {
  const validation = validateUrlString(yturl, { permittedHosts: YOUTUBE_DOMAINS });
  if (!validation.isValid) {
    return { success: false, message: validation.message };
  }

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
    const sanitizedTitle = result.trim().replace(/[/\\?%*:|"<>]/g, '-');
    return { success: true, data: sanitizedTitle };
  } catch (error) {
    console.error('Error getting video title:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get video title',
    };
  }
}
