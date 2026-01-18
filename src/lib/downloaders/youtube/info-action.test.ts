import { getVideoInfoAction } from './info-action';
import { getVideoInfo } from './ytdl';
import { validateUrlString } from '@/lib/validators/url';

jest.mock('./ytdl', () => ({
  getVideoInfo: jest.fn(),
}));

jest.mock('@/lib/validators/url', () => ({
  validateUrlString: jest.fn(),
}));

describe('getVideoInfoAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (validateUrlString as jest.Mock).mockReturnValue({ isValid: true, message: 'Valid' });
  });

  it('returns an error when URL validation fails', async () => {
    (validateUrlString as jest.Mock).mockReturnValue({
      isValid: false,
      message: 'Invalid URL',
    });

    const result = await getVideoInfoAction('invalid-url');

    expect(result).toEqual({
      error: 'Invalid URL',
    });
    expect(getVideoInfo).not.toHaveBeenCalled();
  });

  it('returns video info when successful', async () => {
    const mockInfo = {
      title: 'Test Video',
      duration: 120,
      thumbnail: 'http://example.com/thumb.jpg',
    };
    (getVideoInfo as jest.Mock).mockResolvedValue(mockInfo);

    const result = await getVideoInfoAction('https://youtube.com/watch?v=123');

    expect(result).toEqual({
      title: 'Test Video',
      duration: 120,
      thumbnail: 'http://example.com/thumb.jpg',
    });
  });

  it('handles missing optional properties gracefully', async () => {
    const mockInfo = {
      title: 'Test Video',
      // no duration or thumbnail
    };
    (getVideoInfo as jest.Mock).mockResolvedValue(mockInfo);

    const result = await getVideoInfoAction('https://youtube.com/watch?v=123');

    expect(result).toEqual({
      title: 'Test Video',
      duration: undefined,
      thumbnail: undefined,
    });
  });

  it('returns error when getVideoInfo throws', async () => {
    (getVideoInfo as jest.Mock).mockRejectedValue(new Error('YTDL Error'));

    const result = await getVideoInfoAction('https://youtube.com/watch?v=123');

    expect(result).toEqual({
      error: 'YTDL Error',
    });
  });

  it('returns generic error when getVideoInfo throws non-Error', async () => {
    (getVideoInfo as jest.Mock).mockRejectedValue('Something went wrong');

    const result = await getVideoInfoAction('https://youtube.com/watch?v=123');

    expect(result).toEqual({
      error: 'Failed to fetch video info',
    });
  });
});
