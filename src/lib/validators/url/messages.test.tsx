import { ValidationMessages } from './messages';

describe('ValidationMessages', () => {
  describe('static messages', () => {
    it('should have all expected messages', () => {
      expect(ValidationMessages.EMPTY_INPUT).toBeDefined();
      expect(ValidationMessages.WHITESPACE).toBeDefined();
      expect(ValidationMessages.CREDENTIALS_NOT_ALLOWED).toBeDefined();
      expect(ValidationMessages.LOCALHOST_NOT_ALLOWED).toBeDefined();
      expect(ValidationMessages.VALID).toBeDefined();
      expect(ValidationMessages.GENERIC_PARSE_ERROR).toBeDefined();
    });
  });

  describe('dynamic messages', () => {
    it('INVALID_PROTOCOL should include protocol', () => {
      const message = ValidationMessages.INVALID_PROTOCOL('javascript:');
      expect(message).toContain('javascript:');
      expect(message).toContain('http://');
      expect(message).toContain('https://');
    });

    it('INVALID_PROTOCOL_CUSTOM should include all protocols', () => {
      const message = ValidationMessages.INVALID_PROTOCOL_CUSTOM('ftp:', [
        'http:',
        'https:',
        'ws:',
      ]);
      expect(message).toContain('ftp:');
      expect(message).toContain('http:');
      expect(message).toContain('https:');
      expect(message).toContain('ws:');
    });

    it('BLOCKED_HOST should include hostname', () => {
      const message = ValidationMessages.BLOCKED_HOST('internal.company.com');
      expect(message).toContain('internal.company.com');
    });

    it('PARSE_ERROR should include error message', () => {
      const message = ValidationMessages.PARSE_ERROR('Invalid URL');
      expect(message).toContain('Invalid URL');
    });

    it('NOT_IN_PERMITTED_HOSTS should include hostname', () => {
      const message = ValidationMessages.NOT_IN_PERMITTED_HOSTS('notallowed.com');
      expect(message).toContain('notallowed.com');
      expect(message).toContain('not in the list of permitted hosts');
    });

    it('NOT_IN_PERMITTED_HOSTS should format correctly for different hostnames', () => {
      const hostnames = ['foo.com', 'bar.org', 'baz.net'];
      hostnames.forEach((host) => {
        const message = ValidationMessages.NOT_IN_PERMITTED_HOSTS(host);
        expect(message).toContain(host);
        expect(message).toMatch(/is not in the list of permitted hosts/);
      });
    });
  });

  describe('uniqueness', () => {
    it('should have unique static messages', () => {
      const messages = [
        ValidationMessages.EMPTY_INPUT,
        ValidationMessages.WHITESPACE,
        ValidationMessages.CREDENTIALS_NOT_ALLOWED,
        ValidationMessages.LOCALHOST_NOT_ALLOWED,
        ValidationMessages.VALID,
        ValidationMessages.GENERIC_PARSE_ERROR,
      ];

      const uniqueMessages = new Set(messages);
      expect(uniqueMessages.size).toBe(messages.length);
    });
  });
});
