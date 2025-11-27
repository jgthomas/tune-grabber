export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export interface ValidationOptions {
  allowCredentials?: boolean;
  allowWhitespace?: boolean;
  blockLocalhost?: boolean;
  blockedHosts?: string[];
  additionalProtocols?: string[];
  permittedHosts?: string[];
}
