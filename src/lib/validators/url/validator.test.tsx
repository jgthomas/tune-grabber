import { validateUrlString, validateUrlStringStrict } from './validator';
import { ValidationMessages } from './messages';

describe('validateUrlString', () => {
  describe('empty input', () => {
    it('should reject empty string', () => {
      const result = validateUrlString('');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.EMPTY_INPUT);
    });
  });

  describe('whitespace', () => {
    it('should reject leading whitespace', () => {
      const result = validateUrlString('  https://example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.WHITESPACE);
    });

    it('should reject trailing whitespace', () => {
      const result = validateUrlString('https://example.com  ');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.WHITESPACE);
    });

    it('should allow whitespace when enabled', () => {
      const result = validateUrlString('  https://example.com  ', {
        allowWhitespace: true,
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('protocols', () => {
    it('should reject javascript: protocol', () => {
      const result = validateUrlString('javascript:alert(1)');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.INVALID_PROTOCOL('javascript:'));
    });

    it('should reject data: protocol', () => {
      const result = validateUrlString('data:text/html,<script>alert(1)</script>');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.INVALID_PROTOCOL('data:'));
    });

    it('should reject file: protocol', () => {
      const result = validateUrlString('file:///etc/passwd');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.INVALID_PROTOCOL('file:'));
    });

    it('should accept http:', () => {
      const result = validateUrlString('http://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept https:', () => {
      const result = validateUrlString('https://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should allow custom protocols', () => {
      const result = validateUrlString('ftp://ftp.example.com', {
        additionalProtocols: ['ftp:'],
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject custom protocol not in allowed list', () => {
      const result = validateUrlString('ftp://ftp.example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.INVALID_PROTOCOL('ftp:'));
    });

    it('should show custom protocol error message when additionalProtocols is set but protocol is not allowed', () => {
      const result = validateUrlString('sftp://sftp.example.com', {
        additionalProtocols: ['ftp:'],
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(
        ValidationMessages.INVALID_PROTOCOL_CUSTOM('sftp:', ['http:', 'https:', 'ftp:']),
      );
    });
  });

  describe('hostname', () => {
    it('should reject http://', () => {
      const result = validateUrlString('http://');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid URL format');
    });

    it('should accept valid hostname', () => {
      const result = validateUrlString('https://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept www', () => {
      const result = validateUrlString('https://www.example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept subdomain', () => {
      const result = validateUrlString('https://www.subdomain.example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept IP address', () => {
      const result = validateUrlString('https://192.168.1.1');
      expect(result.isValid).toBe(true);
    });
  });

  describe('credentials', () => {
    it('should reject username', () => {
      const result = validateUrlString('https://user@example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.CREDENTIALS_NOT_ALLOWED);
    });

    it('should reject username and password', () => {
      const result = validateUrlString('https://user:pass@example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.CREDENTIALS_NOT_ALLOWED);
    });

    it('should allow when enabled', () => {
      const result = validateUrlString('https://user:pass@example.com', {
        allowCredentials: true,
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject credentials when username is present and allowCredentials is false', () => {
      const result = validateUrlString('https://username@example.com', {
        allowCredentials: false,
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.CREDENTIALS_NOT_ALLOWED);
    });

    it('should reject credentials when password is present and allowCredentials is false', () => {
      const result = validateUrlString('https://user:password@example.com', {
        allowCredentials: false,
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.CREDENTIALS_NOT_ALLOWED);
    });
  });

  describe('localhost blocking', () => {
    it('should reject localhost', () => {
      const result = validateUrlString('http://localhost');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.LOCALHOST_NOT_ALLOWED);
    });

    it('should reject 127.0.0.1', () => {
      const result = validateUrlString('http://127.0.0.1');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.LOCALHOST_NOT_ALLOWED);
    });

    it('should reject 0.0.0.0', () => {
      const result = validateUrlString('http://0.0.0.0');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.LOCALHOST_NOT_ALLOWED);
    });

    it('should reject [::1]', () => {
      const result = validateUrlString('http://[::1]');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.LOCALHOST_NOT_ALLOWED);
    });

    it('should be case-insensitive', () => {
      const result = validateUrlString('http://LOCALHOST');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe(ValidationMessages.LOCALHOST_NOT_ALLOWED);
    });

    it('should allow when disabled', () => {
      const result = validateUrlString('http://localhost:3000', {
        blockLocalhost: false,
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('custom blocked hosts', () => {
    it('should block custom hostname', () => {
      const result = validateUrlString('https://internal.company.com', {
        blockedHosts: ['internal.company.com'],
      });
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('internal.company.com');
    });

    it('should be case-insensitive', () => {
      const result = validateUrlString('https://INTERNAL.COMPANY.COM', {
        blockedHosts: ['internal.company.com'],
      });
      expect(result.isValid).toBe(false);
    });

    it('should allow non-blocked hosts', () => {
      const result = validateUrlString('https://example.com', {
        blockedHosts: ['internal.company.com'],
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe('valid URLs', () => {
    it('should accept HTTP URL', () => {
      const result = validateUrlString('http://example.com');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe(ValidationMessages.VALID);
    });

    it('should accept HTTPS URL', () => {
      const result = validateUrlString('https://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept URL with path', () => {
      const result = validateUrlString('https://example.com/path/to/resource');
      expect(result.isValid).toBe(true);
    });

    it('should accept URL with query params', () => {
      const result = validateUrlString('https://example.com?foo=bar&baz=qux');
      expect(result.isValid).toBe(true);
    });

    it('should accept URL with hash', () => {
      const result = validateUrlString('https://example.com#section');
      expect(result.isValid).toBe(true);
    });

    it('should accept URL with port', () => {
      const result = validateUrlString('https://example.com:8080');
      expect(result.isValid).toBe(true);
    });

    it('should accept internationalized domains', () => {
      const result = validateUrlString('https://münchen.de');
      expect(result.isValid).toBe(true);
    });
  });

  describe('malformed URLs', () => {
    it('should reject invalid URL format and return parse error', () => {
      const result = validateUrlString('ht!tp://bad-url');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid URL format');
    });

    it('should reject random text', () => {
      const result = validateUrlString('not a url at all');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid URL format');
    });

    it('should reject missing protocol', () => {
      const result = validateUrlString('example.com');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Invalid URL format');
    });
  });
});

describe('validateUrlStringStrict', () => {
  it('should reject HTTP (requires HTTPS)', () => {
    const result = validateUrlStringStrict('http://example.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('HTTPS required');
  });

  it('should accept HTTPS', () => {
    const result = validateUrlStringStrict('https://example.com');
    expect(result.isValid).toBe(true);
  });

  it('should reject localhost', () => {
    const result = validateUrlStringStrict('https://localhost:3000');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe(ValidationMessages.LOCALHOST_NOT_ALLOWED);
  });

  it('should reject credentials', () => {
    const result = validateUrlStringStrict('https://user:pass@example.com');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe(ValidationMessages.CREDENTIALS_NOT_ALLOWED);
  });
});
