import { ErrorCode } from '../constants/error-codes';

/**
 * Validation error detail for field-specific errors
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
  constraints?: Record<string, string>;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  details?: ValidationErrorDetail[];
  correlationId: string;
  timestamp: string;
  path: string;
}

/**
 * Extended error response for development environment
 */
export interface DevErrorResponse extends ErrorResponse {
  stack?: string;
  context?: Record<string, unknown>;
  cause?: string;
}

/**
 * Error context for logging
 */
export interface ErrorContext {
  correlationId: string;
  path: string;
  method: string;
  ip?: string;
  userId?: string;
  userAgent?: string;
  body?: unknown;
  query?: unknown;
  params?: unknown;
  headers?: Record<string, string>;
}

/**
 * Error log entry structure
 */
export interface ErrorLogEntry {
  timestamp: string;
  level: 'error' | 'warn';
  errorCode: ErrorCode | string;
  message: string;
  statusCode: number;
  context: ErrorContext;
  stack?: string;
  cause?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for error handling
 */
export interface ErrorHandlingConfig {
  /** Environment: 'development' | 'production' | 'test' */
  environment: string;
  /** Include stack traces in response (only in development) */
  includeStackTrace?: boolean;
  /** Log all errors */
  logErrors?: boolean;
  /** Sensitive headers to redact from logs */
  sensitiveHeaders?: string[];
  /** Sensitive body fields to redact from logs */
  sensitiveFields?: string[];
  /** Custom error messages for localization */
  customMessages?: Partial<Record<ErrorCode, string>>;
}
