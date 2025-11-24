import type { ValidationResult, ValidationOptions } from './types';
import { ValidationMessages } from './messages';

const DEFAULT_ALLOWED_PROTOCOLS = ['http:', 'https:'] as const;
const DEFAULT_DANGEROUS_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'] as const;

export function validateUrlString(
  input: string,
  options: ValidationOptions = {},
): ValidationResult {
  const {
    allowCredentials = false,
    allowWhitespace = false,
    blockLocalhost = true,
    blockedHosts = [],
    additionalProtocols = [],
  } = options;

  if (!input) {
    return { isValid: false, message: ValidationMessages.EMPTY_INPUT };
  }

  if (!allowWhitespace) {
    const trimmed = input.trim();
    if (trimmed !== input) {
      return { isValid: false, message: ValidationMessages.WHITESPACE };
    }
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(input);
  } catch (error) {
    return {
      isValid: false,
      message:
        error instanceof Error
          ? ValidationMessages.PARSE_ERROR(error.message)
          : ValidationMessages.GENERIC_PARSE_ERROR,
    };
  }

  const allowedProtocols: string[] = [...DEFAULT_ALLOWED_PROTOCOLS, ...additionalProtocols];

  if (!allowedProtocols.includes(parsedUrl.protocol)) {
    return {
      isValid: false,
      message:
        additionalProtocols.length > 0
          ? ValidationMessages.INVALID_PROTOCOL_CUSTOM(parsedUrl.protocol, allowedProtocols)
          : ValidationMessages.INVALID_PROTOCOL(parsedUrl.protocol),
    };
  }

  if (!parsedUrl.hostname) {
    return { isValid: false, message: ValidationMessages.NO_HOSTNAME };
  }

  if (!allowCredentials && (parsedUrl.username || parsedUrl.password)) {
    return {
      isValid: false,
      message: ValidationMessages.CREDENTIALS_NOT_ALLOWED,
    };
  }

  if (blockLocalhost) {
    const hostname = parsedUrl.hostname.toLowerCase();
    const isDangerous = DEFAULT_DANGEROUS_HOSTS.some(
      (dangerousHost) => hostname === dangerousHost.toLowerCase(),
    );

    if (isDangerous) {
      return {
        isValid: false,
        message: ValidationMessages.LOCALHOST_NOT_ALLOWED,
      };
    }
  }

  if (blockedHosts.length > 0) {
    const hostname = parsedUrl.hostname.toLowerCase();
    const isBlocked = blockedHosts.some((blockedHost) => hostname === blockedHost.toLowerCase());

    if (isBlocked) {
      return {
        isValid: false,
        message: ValidationMessages.BLOCKED_HOST(parsedUrl.hostname),
      };
    }
  }

  return { isValid: true, message: ValidationMessages.VALID };
}

export function validateUrlStringStrict(input: string): ValidationResult {
  const result = validateUrlString(input, {
    allowCredentials: false,
    allowWhitespace: false,
    blockLocalhost: true,
  });

  if (!result.isValid) {
    return result;
  }

  const parsedUrl = new URL(input);

  if (parsedUrl.protocol !== 'https:') {
    return {
      isValid: false,
      message: ValidationMessages.INVALID_PROTOCOL('http:') + ' (HTTPS required)',
    };
  }

  return result;
}
