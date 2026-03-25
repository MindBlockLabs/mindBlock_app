import { HttpException, HttpStatus } from '@nestjs/common';
import { AppErrorCode } from './error-codes.enum';

/**
 * Optional per-field validation detail included in 400 responses.
 */
export interface ErrorDetail {
  field?: string;
  message: string;
  value?: unknown;
}

/**
 * Metadata passed when constructing an AppException.
 */
export interface AppExceptionOptions {
  /** Machine-readable error code for frontend programmatic handling. */
  errorCode: AppErrorCode;
  /** HTTP status to send. Defaults to 500. */
  status?: HttpStatus;
  /** Human-readable message (may be overridden in production). */
  message?: string;
  /** Field-level validation details (visible to clients). */
  details?: ErrorDetail[];
  /** i18n translation key for localisation support. */
  i18nKey?: string;
  /** Extra context attached to logging ONLY – never sent to the client. */
  context?: Record<string, unknown>;
}

/**
 * Base typed exception.
 *
 * Throw any subclass (or this directly) and the `AllExceptionsFilter`
 * will format the response consistently.
 */
export class AppException extends HttpException {
  readonly errorCode: AppErrorCode;
  readonly details: ErrorDetail[] | undefined;
  readonly i18nKey: string | undefined;
  /** Private metadata for the logger — never serialised to the response. */
  readonly logContext: Record<string, unknown> | undefined;

  constructor(options: AppExceptionOptions) {
    const status = options.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const message = options.message ?? 'An unexpected error occurred';

    super(message, status);

    this.errorCode = options.errorCode;
    this.details = options.details;
    this.i18nKey = options.i18nKey;
    this.logContext = options.context;
  }
}

// ─── Convenience subclasses ──────────────────────────────────────────────────

export class ValidationException extends AppException {
  constructor(details: ErrorDetail[], message = 'Validation failed') {
    super({
      errorCode: AppErrorCode.VALIDATION_FAILED,
      status: HttpStatus.BAD_REQUEST,
      message,
      details,
      i18nKey: 'errors.validation_failed',
    });
  }
}

export class AuthenticationException extends AppException {
  constructor(
    message = 'Authentication required',
    errorCode: AppErrorCode = AppErrorCode.AUTH_INVALID_CREDENTIALS,
  ) {
    super({
      errorCode,
      status: HttpStatus.UNAUTHORIZED,
      message,
      i18nKey: 'errors.authentication_required',
    });
  }
}

export class AuthorizationException extends AppException {
  constructor(message = 'Insufficient permissions') {
    super({
      errorCode: AppErrorCode.INSUFFICIENT_PERMISSIONS,
      status: HttpStatus.FORBIDDEN,
      message,
      i18nKey: 'errors.insufficient_permissions',
    });
  }
}

export class NotFoundException extends AppException {
  constructor(resource = 'Resource', message?: string) {
    super({
      errorCode: AppErrorCode.RESOURCE_NOT_FOUND,
      status: HttpStatus.NOT_FOUND,
      message: message ?? `${resource} not found`,
      i18nKey: 'errors.resource_not_found',
    });
  }
}

export class ConflictException extends AppException {
  constructor(message = 'Resource already exists') {
    super({
      errorCode: AppErrorCode.DUPLICATE_RESOURCE,
      status: HttpStatus.CONFLICT,
      message,
      i18nKey: 'errors.duplicate_resource',
    });
  }
}

export class RateLimitException extends AppException {
  constructor(message = 'Too many requests — please slow down') {
    super({
      errorCode: AppErrorCode.RATE_LIMIT_EXCEEDED,
      status: HttpStatus.TOO_MANY_REQUESTS,
      message,
      i18nKey: 'errors.rate_limit_exceeded',
    });
  }
}

export class DatabaseException extends AppException {
  constructor(
    message = 'A database error occurred',
    errorCode: AppErrorCode = AppErrorCode.DB_QUERY_FAILED,
    context?: Record<string, unknown>,
  ) {
    super({
      errorCode,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message,
      i18nKey: 'errors.database_error',
      context,
    });
  }
}
