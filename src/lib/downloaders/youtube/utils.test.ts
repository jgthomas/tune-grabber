import { sanitizeTitle } from './utils';
import { VideoInfo, PlaylistInfo } from 'ytdlp-nodejs';

describe('sanitizeTitle', () => {
  it('should return the string input if it is valid', () => {
    const input = 'My Video Title';
    const result = sanitizeTitle(input);
    expect(result).toBe('My Video Title');
  });

  it('should extract title from VideoInfo object', () => {
    const info = {
      id: '123',
      title: 'My Video Title',
      uploader: 'test',
      upload_date: '20230101',
      duration: 100,
      view_count: 100,
      like_count: 10,
      comment_count: 1,
      channel_id: '123',
      thumbnail: 'url',
      webpage_url: 'url',
      description: 'desc',
      extractor: 'youtube',
      extractor_key: 'Youtube',
    } as VideoInfo;
    const result = sanitizeTitle(info);
    expect(result).toBe('My Video Title');
  });

  it('should extract title from PlaylistInfo object', () => {
    const info = {
      id: '123',
      title: 'My Playlist Title',
      uploader: 'test',
      webpage_url: 'url',
      extractor: 'youtube',
      extractor_key: 'Youtube',
      entries: [],
      availability: 'public',
    } as unknown as PlaylistInfo;
    const result = sanitizeTitle(info);
    expect(result).toBe('My Playlist Title');
  });

  it('should fallback to "untitled" if input is undefined/null (though types say not possible, runtime might)', () => {
    // @ts-expect-error: Testing runtime resilience
    const result = sanitizeTitle(null);
    expect(result).toBe('untitled');
  });

  it('should fallback to "untitled" if object has no title', () => {
    // @ts-expect-error: Testing partial object
    const result = sanitizeTitle({});
    expect(result).toBe('untitled');
  });

  it('should sanitize invalid characters', () => {
    const input = 'My/Video\\Title?Is%Cool*:|"<>"';
    const result = sanitizeTitle(input);
    expect(result).toBe('My-Video-Title-Is-Cool-------');
  });

  it('should trim whitespace', () => {
    const input = '  My Video Title  ';
    const result = sanitizeTitle(input);
    expect(result).toBe('My Video Title');
  });
});
