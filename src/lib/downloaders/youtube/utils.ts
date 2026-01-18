import { VideoInfo, PlaylistInfo } from 'ytdlp-nodejs';

/**
 * Sanitizes a video or playlist title for use as a filename.
 * @param info The video or playlist information object.
 * @returns A sanitized title string.
 */
export function sanitizeTitle(info: string | VideoInfo | PlaylistInfo): string {
  let title = 'untitled';
  if (typeof info === 'string') {
    title = info;
  } else if (info && info.title) {
    title = info.title;
  }

  // Sanitize the filename by removing invalid characters, matching getVideoTitle logic
  return title.trim().replace(/[/\\?%*:|"<>]/g, '-');
}
