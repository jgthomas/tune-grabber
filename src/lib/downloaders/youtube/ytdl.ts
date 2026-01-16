import { VideoInfo, PlaylistInfo, YtDlp } from 'ytdlp-nodejs';
import ytdlp from './ytdlp-wrapper';
import { validateUrlString } from '@/lib/validators/url';
import { logger } from '@/lib/logger';
import { getAudioDownloadOptions } from './options';

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

  const output = await ytdlp.downloadAsync(yturl, getAudioDownloadOptions(fullPath));

  logger.info({ output }, 'Download completed');

  return output;
}

type InfoOptions = Parameters<YtDlp['getInfoAsync']>[1];

export async function getVideoInfo(
  yturl: string,
  options?: InfoOptions,
): Promise<VideoInfo | PlaylistInfo> {
  const validation = validateUrlString(yturl, { permittedHosts: YOUTUBE_DOMAINS });
  if (!validation.isValid) {
    throw new Error(validation.message);
  }

  try {
    const result = await ytdlp.getInfoAsync(yturl, options);
    logger.info({ result }, 'Video info result');
    return result;
  } catch (error) {
    logger.error({ err: error }, 'Error getting video info');
    throw error;
  }
}
