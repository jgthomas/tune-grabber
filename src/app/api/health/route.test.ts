/**
 * @jest-environment node
 */
import { GET } from './route';

describe('GET /api/health', () => {
  it('should return status ok and a timestamp', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe('ok');
    expect(typeof json.timestamp).toBe('string');
    expect(new Date(json.timestamp).toString()).not.toBe('Invalid Date');
  });
});
