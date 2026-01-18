'use server';

import { getVideoInfo } from './ytdl';
import { validateUrlString } from '@/lib/validators/url';

export type VideoInfoResult = {
  title?: string;
  duration?: number; // duration in seconds
  thumbnail?: string;
  error?: string;
};

export async function getVideoInfoAction(url: string): Promise<VideoInfoResult> {
  const validation = validateUrlString(url);
  if (!validation.isValid) {
    return { error: validation.message };
  }

  try {
    const info = await getVideoInfo(url);
    // Determine if it's a playlist or single video.
    // ytdlp-nodejs types: VideoInfo has 'duration', PlaylistInfo does not directly have 'duration' usually.
    // For simplicity, we assume we might get either, but we just try to extract title and duration.
    // If it's a playlist, duration might not be available or might be sum.

    // Cast to a type that includes the properties we're looking for to satisfy the linter
    // while acknowledging we're accessing properties that might not exist on all union members
    const infoWithProps = info as { title?: string; duration?: number; thumbnail?: string };

    return {
      title: infoWithProps.title,
      duration: infoWithProps.duration,
      thumbnail: infoWithProps.thumbnail,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to fetch video info' };
  }
}
