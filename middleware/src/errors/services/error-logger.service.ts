import { Logger } from '@nestjs/common';
import { ErrorLogEntry, ErrorContext } from '../interfaces/error.interface';
import { ErrorCode } from '../constants/error-codes';

/**
 * Default sensitive headers to redact
 */
const DEFAULT_SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'x-api-key',
  'x-auth-token',
  'x-access-token',
];

/**
 * Default sensitive body fields to redact
 */
const DEFAULT_SENSITIVE_FIELDS = [
  'password',
  'confirmPassword',
  'oldPassword',
  'newPassword',
  'secret',
  'token',
  'apiKey',
  'accessToken',
  'refreshToken',
  'creditCard',
  'cvv',
  'ssn',
];

export interface ErrorLoggerOptions {
  sensitiveHeaders?: string[];
  sensitiveFields?: string[];
}

/**
 * Service for logging errors with context
 */
export class ErrorLoggerService {
  private readonly logger = new Logger('ErrorHandler');
  private readonly sensitiveHeaders: Set<string>;
  private readonly sensitiveFields: Set<string>;

  constructor(options: ErrorLoggerOptions = {}) {
    this.sensitiveHeaders = new Set(
      (options.sensitiveHeaders ?? DEFAULT_SENSITIVE_HEADERS).map((h) =>
        h.toLowerCase(),
      ),
    );
    this.sensitiveFields = new Set(
      options.sensitiveFields ?? DEFAULT_SENSITIVE_FIELDS,
    );
  }

  /**
   * Log an error with full context
   */
  logError(entry: ErrorLogEntry): void {
    const sanitizedEntry = this.sanitizeLogEntry(entry);
    const logMessage = this.formatLogMessage(sanitizedEntry);

    if (entry.level === 'warn') {
      this.logger.warn(logMessage);
    } else {
      this.logger.error(logMessage);
    }

    // Log stack trace separately for better readability
    if (entry.stack) {
      this.logger.debug(`Stack trace for ${entry.context.correlationId}:\n${entry.stack}`);
    }
  }

  /**
   * Create an error log entry
   */
  createLogEntry(
    error: Error | unknown,
    context: ErrorContext,
    statusCode: number,
    errorCode: ErrorCode | string,
    message: string,
  ): ErrorLogEntry {
    const isClientError = statusCode >= 400 && statusCode < 500;

    return {
      timestamp: new Date().toISOString(),
      level: isClientError ? 'warn' : 'error',
      errorCode,
      message,
      statusCode,
      context: this.sanitizeContext(context),
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined,
    };
  }

  /**
   * Sanitize log entry to remove sensitive information
   */
  private sanitizeLogEntry(entry: ErrorLogEntry): ErrorLogEntry {
    return {
      ...entry,
      context: this.sanitizeContext(entry.context),
    };
  }

  /**
   * Sanitize error context
   */
  private sanitizeContext(context: ErrorContext): ErrorContext {
    return {
      ...context,
      headers: context.headers
        ? this.redactSensitiveHeaders(context.headers)
        : undefined,
      body: context.body ? this.redactSensitiveFields(context.body) : undefined,
    };
  }

  /**
   * Redact sensitive headers
   */
  private redactSensitiveHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
    const redacted: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
      if (this.sensitiveHeaders.has(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Redact sensitive fields in body
   */
  private redactSensitiveFields(body: unknown): unknown {
    if (!body || typeof body !== 'object') {
      return body;
    }

    if (Array.isArray(body)) {
      return body.map((item) => this.redactSensitiveFields(item));
    }

    const redacted: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (this.sensitiveFields.has(key)) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        redacted[key] = this.redactSensitiveFields(value);
      } else {
        redacted[key] = value;
      }
    }

    return redacted;
  }

  /**
   * Format log message for output
   */
  private formatLogMessage(entry: ErrorLogEntry): string {
    const parts = [
      `[${entry.errorCode}]`,
      `${entry.context.method} ${entry.context.path}`,
      `Status: ${entry.statusCode}`,
      `CorrelationId: ${entry.context.correlationId}`,
      `Message: ${entry.message}`,
    ];

    if (entry.context.userId) {
      parts.push(`UserId: ${entry.context.userId}`);
    }

    if (entry.context.ip) {
      parts.push(`IP: ${entry.context.ip}`);
    }

    return parts.join(' | ');
  }
}
