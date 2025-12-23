'use server';

import path from 'path';
import { promises as fs } from 'fs';
import { downloadVideoAndExtractAudioToMp3 } from './ytdl';
import { s3Service } from '@/lib/aws/s3-service';

export type DownloadState = {
  success: boolean;
  message: string;
  progress?: number;
  url?: string | null;
} | null;

export async function downloadAction(
  prevState: DownloadState,
  formData: FormData,
): Promise<DownloadState> {
  const yturl = formData.get('urlInput');

  if (!yturl || typeof yturl !== 'string') {
    return { success: false, message: 'Please enter a valid URL.' };
  }

  const fileName = `audio-${Date.now()}.mp3`;
  const tempDir = '/tmp';
  const fullPath = path.join(tempDir, fileName);

  try {
    let downloadLink = null;

    await downloadVideoAndExtractAudioToMp3(yturl, fullPath);

    if (s3Service.isConfigured()) {
      console.log('S3 detected, uploading...');
      await s3Service.uploadFile(fullPath, fileName);
      downloadLink = await s3Service.getDownloadLink(fileName);
    } else {
      downloadLink = `/api/download?file=${fileName}`;
    }

    return {
      success: true,
      message: s3Service.isConfigured()
        ? 'File ready!'
        : 'Download finished (Local mode: check /tmp)',
      url: downloadLink,
    };
  } catch (error) {
    console.error('Server Action Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return {
      success: false,
      message: `Failed to download: ${errorMessage}`,
    };
  } finally {
    try {
      if (s3Service.isConfigured()) {
        await fs.unlink(fullPath);
        console.log(`Cleaned up temporary file: ${fullPath}`);
      }
      console.log('Running locally so no cleanup needed.');
    } catch (unlinkError) {
      console.error('Failed to delete temp file:', unlinkError);
    }
  }
}
