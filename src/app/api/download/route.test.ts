/**
 * @jest-environment node
 */
import { GET, dynamic } from './route';
import { NextRequest } from 'next/server';
import fs from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

// Mock fs
jest.mock('fs', () => ({
  createReadStream: jest.fn(),
  promises: {
    access: jest.fn(),
    unlink: jest.fn(),
  },
}));

// Mock stream
jest.mock('stream', () => {
  const actual = jest.requireActual('stream');
  return {
    ...actual,
    Readable: {
      ...actual.Readable,
      toWeb: jest.fn(),
    },
  };
});

// Mock stream/promises
jest.mock('stream/promises', () => ({
  finished: jest.fn(),
}));

describe('GET /api/download', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should return 400 if file param is missing', async () => {
    const mockReq = {
      url: 'http://localhost/api/download',
    } as unknown as NextRequest;
    const res = await GET(mockReq);
    expect(res.status).toBe(400);
  });

  it('should return 404 if file does not exist', async () => {
    // Mock fs.access to fail
    (fs.promises.access as jest.Mock).mockRejectedValue(new Error('File not found'));
    // Suppress console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const mockReq = {
      url: 'http://localhost/api/download?file=test.mp3',
    } as unknown as NextRequest;
    const res = await GET(mockReq);

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toBe('File not found');

    expect(consoleSpy).toHaveBeenCalledWith('File Error:', expect.any(Error));
  });

  it('should return 200 and file stream if file exists', async () => {
    // Mock fs.access to succeed
    (fs.promises.access as jest.Mock).mockResolvedValue(undefined);

    // Mock createReadStream
    const mockNodeStream = { pipe: jest.fn(), on: jest.fn() };
    (fs.createReadStream as jest.Mock).mockReturnValue(mockNodeStream);

    // Mock Readable.toWeb
    const mockWebStream = new ReadableStream();
    (Readable.toWeb as jest.Mock).mockReturnValue(mockWebStream);

    // Mock finished to resolve immediately
    (finished as jest.Mock).mockResolvedValue(undefined);

    // Mock unlink to resolve (return a Promise)
    (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);

    const mockReq = {
      url: 'http://localhost/api/download?file=test.mp3',
    } as unknown as NextRequest;
    const res = await GET(mockReq);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="test.mp3"');
    expect(res.headers.get('Content-Type')).toBe('application/octet-stream');

    // Verify cleanup logic
    expect(finished).toHaveBeenCalledWith(mockNodeStream);
    // Note: We can't easily await the promise chain inside the component from here without more complex mocking,
    // but we can ensure 'finished' was called.
    // To verify unlink is called, we'd need to wait for the promise returned by finished().then(...)
    // causing a small race condition in test if we check immediately.
    // However, since we mocked finished to resolve immediately, the .then() callback is microtask'd.

    // Force microtasks to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fs.promises.unlink).toHaveBeenCalledWith(expect.stringContaining('test.mp3'));
  });

  it('should handle cleanup error gracefully', async () => {
    (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
    const mockNodeStream = { pipe: jest.fn(), on: jest.fn() };
    (fs.createReadStream as jest.Mock).mockReturnValue(mockNodeStream);
    (Readable.toWeb as jest.Mock).mockReturnValue(new ReadableStream());
    (finished as jest.Mock).mockResolvedValue(undefined);

    // Mock unlink to fail
    (fs.promises.unlink as jest.Mock).mockRejectedValue(new Error('Delete failed'));

    const mockReq = {
      url: 'http://localhost/api/download?file=test.mp3',
    } as unknown as NextRequest;

    await GET(mockReq);

    // Force microtasks
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fs.promises.unlink).toHaveBeenCalled();
    // Should not throw
  });

  it('should export dynamic as force-dynamic', () => {
    expect(dynamic).toBe('force-dynamic');
  });
});
