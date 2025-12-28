/**
 * @jest-environment node
 */
import { GET, dynamic } from './route';

describe('GET /api/download', () => {
  it('should return 400 if file param is missing', async () => {
    // Pass a minimal object with the url property instead of constructing NextRequest
    // This mirrors the health route tests which call GET() directly.
    const mockReq = {
      url: 'http://localhost/api/download',
    } as unknown as import('next/server').NextRequest;
    const res = await GET(mockReq);
    expect(res.status).toBe(400);
  });

  it('should export dynamic as force-dynamic', () => {
    expect(dynamic).toBe('force-dynamic');
  });
});
