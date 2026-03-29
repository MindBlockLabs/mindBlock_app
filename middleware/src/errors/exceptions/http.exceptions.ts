import { ErrorCode } from '../constants/error-codes';
import { ValidationErrorDetail } from '../interfaces/error.interface';
import { BaseException } from './base.exception';

/**
 * 400 Bad Request - Validation errors
 */
export class ValidationException extends BaseException {
  constructor(
    details: ValidationErrorDetail[],
    message: string = 'Validation failed',
  ) {
    super(ErrorCode.VALIDATION_FAILED, message, details);
  }

  static fromFieldErrors(errors: Record<string, string[]>): ValidationException {
    const details: ValidationErrorDetail[] = Object.entries(errors).map(
      ([field, messages]) => ({
        field,
        message: messages.join(', '),
        constraints: messages.reduce(
          (acc, msg, idx) => ({ ...acc, [`constraint${idx}`]: msg }),
          {},
        ),
      }),
    );
    return new ValidationException(details);
  }
}

/**
 * 401 Unauthorized - Authentication errors
 */
export class UnauthorizedException extends BaseException {
  constructor(
    errorCode: ErrorCode = ErrorCode.AUTH_TOKEN_INVALID,
    message?: string,
  ) {
    super(errorCode, message);
  }

  static tokenExpired(): UnauthorizedException {
    return new UnauthorizedException(ErrorCode.AUTH_TOKEN_EXPIRED);
  }

  static tokenInvalid(): UnauthorizedException {
    return new UnauthorizedException(ErrorCode.AUTH_TOKEN_INVALID);
  }

  static tokenMissing(): UnauthorizedException {
    return new UnauthorizedException(ErrorCode.AUTH_TOKEN_MISSING);
  }

  static invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException(ErrorCode.AUTH_INVALID_CREDENTIALS);
  }
}

/**
 * 403 Forbidden - Authorization errors
 */
export class ForbiddenException extends BaseException {
  constructor(
    errorCode: ErrorCode = ErrorCode.INSUFFICIENT_PERMISSIONS,
    message?: string,
  ) {
    super(errorCode, message);
  }

  static insufficientPermissions(): ForbiddenException {
    return new ForbiddenException(ErrorCode.INSUFFICIENT_PERMISSIONS);
  }

  static roleNotAllowed(role?: string): ForbiddenException {
    return new ForbiddenException(
      ErrorCode.ROLE_NOT_ALLOWED,
      role ? `Role '${role}' is not allowed to perform this action` : undefined,
    );
  }
}

/**
 * 404 Not Found - Resource not found errors
 */
export class NotFoundException extends BaseException {
  constructor(resource?: string, identifier?: string) {
    const message = resource
      ? `${resource}${identifier ? ` with identifier '${identifier}'` : ''} was not found`
      : undefined;
    super(ErrorCode.RESOURCE_NOT_FOUND, message);
  }
}

/**
 * 409 Conflict - Duplicate resource errors
 */
export class ConflictException extends BaseException {
  constructor(
    errorCode: ErrorCode = ErrorCode.DUPLICATE_RESOURCE,
    message?: string,
  ) {
    super(errorCode, message);
  }

  static duplicate(resource: string, field?: string): ConflictException {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    return new ConflictException(ErrorCode.DUPLICATE_RESOURCE, message);
  }

  static conflict(message: string): ConflictException {
    return new ConflictException(ErrorCode.RESOURCE_CONFLICT, message);
  }
}

/**
 * 429 Too Many Requests - Rate limiting
 */
export class RateLimitException extends BaseException {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number, message?: string) {
    super(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      message ?? `Rate limit exceeded${retryAfter ? `. Retry after ${retryAfter} seconds` : ''}`,
    );
    this.retryAfter = retryAfter;
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerException extends BaseException {
  constructor(message?: string, context?: Record<string, unknown>) {
    super(ErrorCode.INTERNAL_SERVER_ERROR, message, undefined, context);
  }
}

/**
 * 502/503/504 External Service Errors
 */
export class ExternalServiceException extends BaseException {
  constructor(
    errorCode: ErrorCode = ErrorCode.EXTERNAL_SERVICE_ERROR,
    serviceName?: string,
    message?: string,
  ) {
    const errorMessage = serviceName
      ? `External service '${serviceName}' error: ${message ?? 'unavailable'}`
      : message;
    super(errorCode, errorMessage);
  }

  static timeout(serviceName: string): ExternalServiceException {
    return new ExternalServiceException(
      ErrorCode.EXTERNAL_SERVICE_TIMEOUT,
      serviceName,
      'request timed out',
    );
  }

  static unavailable(serviceName: string): ExternalServiceException {
    return new ExternalServiceException(
      ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE,
      serviceName,
      'service unavailable',
    );
  }
}
