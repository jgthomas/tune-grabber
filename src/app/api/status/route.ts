import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/aws/dynamo';
import { s3Service } from '@/lib/aws/s3-service';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ success: false, message: 'Missing Job ID' }, { status: 400 });
  }

  try {
    const job = await getJob(jobId);

    if (!job) {
      return NextResponse.json({ success: false, message: 'Job not found' }, { status: 404 });
    }

    let downloadUrl = null;
    if (job.Status === 'COMPLETED' && job.S3Key) {
      downloadUrl = await s3Service.getDownloadLink(job.S3Key);
    }

    return NextResponse.json({
      success: true,
      status: job.Status,
      downloadUrl,
      error: job.ErrorMessage,
    });
  } catch (error) {
    logger.error({ err: error, jobId }, 'Failed to check job status');
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
