import ytdlp from './ytdlp-wrapper';
import { validateUrlString } from '@/lib/validators/url';
import { logger } from '@/lib/logger';
import { getMp3DownloadOptions } from './options';

export const YOUTUBE_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'music.youtube.com',
];

export async function downloadVideoAndExtractAudioToMp3(yturl: string, fullPath: string) {
  const validation = validateUrlString(yturl, { permittedHosts: YOUTUBE_DOMAINS });
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  const output = await ytdlp.downloadAsync(yturl, getMp3DownloadOptions(fullPath));

  logger.info({ output }, 'Download completed');

  return output;
}

export async function getVideoTitle(yturl: string): Promise<string> {
  const validation = validateUrlString(yturl, { permittedHosts: YOUTUBE_DOMAINS });
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  try {
    const result = await ytdlp.execAsync(yturl, {
      print: '%(title)s',
      noDownload: true,
      onData: (data) => {
        logger.debug({ data }, 'Raw title data');
      },
    });

    logger.info({ result }, 'Title result');

    // Sanitize the filename by removing invalid characters
    return result.trim().replace(/[/\\?%*:|"<>]/g, '-');
  } catch (error) {
    logger.error({ err: error }, 'Error getting video title');
    throw error;
  }
}
