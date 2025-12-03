'use server';

import ytdlp from './ytdlp-wrapper';
import { validateUrlString } from '@/lib/validators/url';

const YOUTUBE_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'm.youtube.com',
  'music.youtube.com',
];

export type DownloadState = {
  success: boolean;
  message: string;
  progress?: number;
} | null;

export async function downloadAction(
  prevState: DownloadState,
  formData: FormData,
): Promise<DownloadState> {
  const yturl = formData.get('urlInput');

  if (!yturl || typeof yturl !== 'string') {
    return { success: false, message: 'Please enter a valid URL.' };
  }

  try {
    validateUrlString(yturl, { permittedHosts: YOUTUBE_DOMAINS });

    const output = await ytdlp.downloadAsync(yturl, {
      format: {
        filter: 'audioonly',
        type: 'mp3',
      },
      output: `audio-${Date.now()}.mp3`,
      onProgress: (progress) => {
        console.log('Progress:', progress);
      },
    });

    console.log('Download completed:', output);
    return {
      success: true,
      message: 'Download completed successfully!',
    };
  } catch (error) {
    console.error('Server Action Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return {
      success: false,
      message: `Failed to download: ${errorMessage}`,
    };
  }
}
