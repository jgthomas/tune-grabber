import { VideoInfo, PlaylistInfo } from 'ytdlp-nodejs';

/**
 * Sanitizes a video or playlist title for use as a filename.
 * @param info The video or playlist information object.
 * @returns A sanitized title string.
 */
export function sanitizeTitle(info: VideoInfo | PlaylistInfo): string {
  const title = info.title || 'untitled';
  // Sanitize the filename by removing invalid characters, matching getVideoTitle logic
  return title.trim().replace(/[/\\?%*:|"<>]/g, '-');
}
