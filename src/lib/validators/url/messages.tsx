export const ValidationMessages = {
  EMPTY_INPUT: 'URL cannot be empty.',
  WHITESPACE: 'URL contains leading/trailing whitespace.',
  INVALID_PROTOCOL: (protocol: string) =>
    `Invalid protocol: ${protocol}. Must be http:// or https://`,
  INVALID_PROTOCOL_CUSTOM: (protocol: string, allowed: string[]) =>
    `Invalid protocol: ${protocol}. Must be one of: ${allowed.join(', ')}`,
  CREDENTIALS_NOT_ALLOWED: 'URLs with credentials are not allowed.',
  LOCALHOST_NOT_ALLOWED: 'Localhost URLs are not allowed.',
  BLOCKED_HOST: (hostname: string) => `URL hostname '${hostname}' is not allowed.`,
  VALID: '✅ Valid URL format!',
  PARSE_ERROR: (errorMessage: string) => `❌ Invalid URL format: ${errorMessage}`,
  GENERIC_PARSE_ERROR: '❌ Invalid URL format: Parse error',
} as const;

export type ValidationMessageKey = keyof typeof ValidationMessages;
