'use server';

import path from 'path';
import { promises as fs } from 'fs';
import { downloadVideoAndExtractAudioToMp3, getVideoTitle } from './ytdl';
import { s3Service } from '@/lib/aws/s3-service';
import { validateUrlString } from '@/lib/validators/url';
import { logger } from '@/lib/logger';

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

  const validation = validateUrlString(yturl);
  if (!validation.isValid) {
    return { success: false, message: validation.message };
  }

  const tempDir = '/tmp';
  let fullPath = '';

  try {
    let downloadLink = null;

    const title = await getVideoTitle(yturl);
    const fileName = `${title}.mp3`;
    fullPath = path.join(tempDir, fileName);

    await downloadVideoAndExtractAudioToMp3(yturl, fullPath);

    if (s3Service.isConfigured()) {
      logger.info('S3 detected, uploading...');
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
    logger.error({ err: error }, 'Server Action Error');

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return {
      success: false,
      message: `Failed to download: ${errorMessage}`,
    };
  } finally {
    try {
      if (s3Service.isConfigured()) {
        await fs.unlink(fullPath);
        logger.info({ file: fullPath }, 'Cleaned up temporary file');
      }
      logger.info('Running locally so no cleanup needed.');
    } catch (unlinkError) {
      logger.error({ err: unlinkError }, 'Failed to delete temp file');
    }
  }
}
