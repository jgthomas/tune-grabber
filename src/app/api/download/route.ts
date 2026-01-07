import { NextRequest, NextResponse } from 'next/server';
import { createReadStream, promises as fs } from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import path from 'path';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('file');

  if (!fileName) return new NextResponse('Missing file name', { status: 400 });

  const filePath = path.join('/tmp', path.basename(fileName));

  try {
    await fs.access(filePath);

    const nodeStream = createReadStream(filePath);

    // Convert to Web Stream
    const webStream = Readable.toWeb(nodeStream);

    // 🚀 Cast specifically to BodyInit to resolve the Type Conflict
    const response = new NextResponse(webStream as BodyInit, {
      headers: {
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'application/octet-stream',
      },
    });

    // Handle background cleanup
    finished(nodeStream).then(async () => {
      await fs.unlink(filePath).catch(() => {});
    });

    return response;
  } catch (error) {
    logger.error({ err: error, fileName }, 'File Error in API');

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'File not found',
      },
      { status: 404 },
    );
  }
}
