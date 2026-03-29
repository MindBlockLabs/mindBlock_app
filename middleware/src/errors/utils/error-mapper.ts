import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorCodeHttpStatus, ErrorCodeMessages } from '../constants/error-codes';
import { ValidationErrorDetail } from '../interfaces/error.interface';
import { BaseException } from '../exceptions/base.exception';
import {
  DatabaseConnectionException,
  UniqueConstraintException,
  ForeignKeyConstraintException,
  DatabaseTimeoutException,
  ConstraintViolationException,
} from '../exceptions/database.exceptions';

/**
 * PostgreSQL error codes
 */
const PG_ERROR_CODES = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  CONNECTION_ERROR: '08000',
  CONNECTION_EXCEPTION: '08003',
  CONNECTION_FAILURE: '08006',
};

/**
 * Mapped error result
 */
export interface MappedError {
  statusCode: number;
  errorCode: ErrorCode | string;
  message: string;
  details?: ValidationErrorDetail[];
  stack?: string;
  context?: Record<string, unknown>;
}

/**
 * Map any error to a standardized format
 */
export function mapError(error: unknown, isProduction: boolean = false): MappedError {
  // Handle BaseException (our custom exceptions)
  if (error instanceof BaseException) {
    return {
      statusCode: error.getStatus(),
      errorCode: error.errorCode,
      message: error.message,
      details: error.details,
      stack: isProduction ? undefined : error.stack,
      context: error.context,
    };
  }

  // Handle NestJS HttpException
  if (error instanceof HttpException) {
    const status = error.getStatus();
    const response = error.getResponse();
    const errorCode = mapHttpStatusToErrorCode(status);

    let message: string;
    let details: ValidationErrorDetail[] | undefined;

    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object' && response !== null) {
      const res = response as Record<string, unknown>;
      message = (res.message as string) ?? error.message;
      
      // Handle class-validator validation errors
      if (Array.isArray(res.message)) {
        details = mapValidationMessages(res.message);
        message = 'Validation failed';
      }
    } else {
      message = error.message;
    }

    return {
      statusCode: status,
      errorCode,
      message: isProduction ? sanitizeMessage(message, status) : message,
      details,
      stack: isProduction ? undefined : error.stack,
    };
  }

  // Handle database errors
  const dbError = mapDatabaseError(error);
  if (dbError) {
    return {
      ...dbError,
      stack: isProduction ? undefined : (error as Error)?.stack,
    };
  }

  // Handle standard Error
  if (error instanceof Error) {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      message: isProduction
        ? ErrorCodeMessages[ErrorCode.INTERNAL_SERVER_ERROR]
        : error.message,
      stack: isProduction ? undefined : error.stack,
    };
  }

  // Handle unknown errors
  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: ErrorCode.UNKNOWN_ERROR,
    message: ErrorCodeMessages[ErrorCode.UNKNOWN_ERROR],
  };
}

/**
 * Map HTTP status code to error code
 */
function mapHttpStatusToErrorCode(status: number): ErrorCode {
  const statusMapping: Record<number, ErrorCode> = {
    400: ErrorCode.VALIDATION_FAILED,
    401: ErrorCode.AUTH_TOKEN_INVALID,
    403: ErrorCode.INSUFFICIENT_PERMISSIONS,
    404: ErrorCode.RESOURCE_NOT_FOUND,
    409: ErrorCode.DUPLICATE_RESOURCE,
    429: ErrorCode.RATE_LIMIT_EXCEEDED,
    500: ErrorCode.INTERNAL_SERVER_ERROR,
    502: ErrorCode.EXTERNAL_SERVICE_ERROR,
    503: ErrorCode.SERVICE_UNAVAILABLE,
    504: ErrorCode.EXTERNAL_SERVICE_TIMEOUT,
  };

  return statusMapping[status] ?? ErrorCode.UNKNOWN_ERROR;
}

/**
 * Map database errors to application exceptions
 */
function mapDatabaseError(error: unknown): MappedError | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const err = error as Record<string, unknown>;

  // PostgreSQL errors
  if (err.code && typeof err.code === 'string') {
    switch (err.code) {
      case PG_ERROR_CODES.UNIQUE_VIOLATION: {
        const detail = err.detail as string | undefined;
        const column = extractColumnFromPgDetail(detail);
        return {
          statusCode: ErrorCodeHttpStatus[ErrorCode.DB_UNIQUE_VIOLATION],
          errorCode: ErrorCode.DB_UNIQUE_VIOLATION,
          message: column
            ? `A record with this ${column} already exists`
            : ErrorCodeMessages[ErrorCode.DB_UNIQUE_VIOLATION],
        };
      }

      case PG_ERROR_CODES.FOREIGN_KEY_VIOLATION: {
        const detail = err.detail as string | undefined;
        const table = extractTableFromPgDetail(detail);
        return {
          statusCode: ErrorCodeHttpStatus[ErrorCode.DB_FOREIGN_KEY_VIOLATION],
          errorCode: ErrorCode.DB_FOREIGN_KEY_VIOLATION,
          message: table
            ? `Referenced ${table} does not exist`
            : ErrorCodeMessages[ErrorCode.DB_FOREIGN_KEY_VIOLATION],
        };
      }

      case PG_ERROR_CODES.NOT_NULL_VIOLATION:
      case PG_ERROR_CODES.CHECK_VIOLATION:
        return {
          statusCode: ErrorCodeHttpStatus[ErrorCode.DB_CONSTRAINT_VIOLATION],
          errorCode: ErrorCode.DB_CONSTRAINT_VIOLATION,
          message: ErrorCodeMessages[ErrorCode.DB_CONSTRAINT_VIOLATION],
        };

      case PG_ERROR_CODES.CONNECTION_ERROR:
      case PG_ERROR_CODES.CONNECTION_EXCEPTION:
      case PG_ERROR_CODES.CONNECTION_FAILURE:
        return {
          statusCode: ErrorCodeHttpStatus[ErrorCode.DB_CONNECTION_ERROR],
          errorCode: ErrorCode.DB_CONNECTION_ERROR,
          message: ErrorCodeMessages[ErrorCode.DB_CONNECTION_ERROR],
        };
    }
  }

  // TypeORM QueryFailedError
  if (err.name === 'QueryFailedError') {
    return {
      statusCode: ErrorCodeHttpStatus[ErrorCode.DB_QUERY_ERROR],
      errorCode: ErrorCode.DB_QUERY_ERROR,
      message: ErrorCodeMessages[ErrorCode.DB_QUERY_ERROR],
    };
  }

  // Connection errors
  if (
    err.name === 'ConnectionError' ||
    (err.message && typeof err.message === 'string' && err.message.includes('ECONNREFUSED'))
  ) {
    return {
      statusCode: ErrorCodeHttpStatus[ErrorCode.DB_CONNECTION_ERROR],
      errorCode: ErrorCode.DB_CONNECTION_ERROR,
      message: ErrorCodeMessages[ErrorCode.DB_CONNECTION_ERROR],
    };
  }

  // Timeout errors
  if (
    err.name === 'TimeoutError' ||
    (err.message && typeof err.message === 'string' && err.message.includes('timeout'))
  ) {
    return {
      statusCode: ErrorCodeHttpStatus[ErrorCode.DB_TIMEOUT],
      errorCode: ErrorCode.DB_TIMEOUT,
      message: ErrorCodeMessages[ErrorCode.DB_TIMEOUT],
    };
  }

  return null;
}

/**
 * Extract column name from PostgreSQL error detail
 */
function extractColumnFromPgDetail(detail?: string): string | undefined {
  if (!detail) return undefined;
  // Example: Key (email)=(test@test.com) already exists.
  const match = detail.match(/Key \(([^)]+)\)/);
  return match ? match[1] : undefined;
}

/**
 * Extract table name from PostgreSQL error detail
 */
function extractTableFromPgDetail(detail?: string): string | undefined {
  if (!detail) return undefined;
  // Example: Key (user_id)=(123) is not present in table "users".
  const match = detail.match(/table "([^"]+)"/);
  return match ? match[1] : undefined;
}

/**
 * Map class-validator validation messages to ValidationErrorDetail
 */
function mapValidationMessages(messages: unknown[]): ValidationErrorDetail[] {
  return messages
    .filter((msg): msg is string | Record<string, unknown> => Boolean(msg))
    .map((msg, index) => {
      if (typeof msg === 'string') {
        return {
          field: `field${index}`,
          message: msg,
        };
      }
      
      if (typeof msg === 'object' && msg !== null) {
        const obj = msg as Record<string, unknown>;
        return {
          field: (obj.property as string) ?? `field${index}`,
          message: Array.isArray(obj.constraints)
            ? Object.values(obj.constraints).join(', ')
            : String(obj.message ?? obj.constraints ?? msg),
          constraints: obj.constraints as Record<string, string> | undefined,
        };
      }

      return {
        field: `field${index}`,
        message: String(msg),
      };
    });
}

/**
 * Sanitize error messages for production
 */
function sanitizeMessage(message: string, statusCode: number): string {
  // For 5xx errors, always return a generic message
  if (statusCode >= 500) {
    return ErrorCodeMessages[ErrorCode.INTERNAL_SERVER_ERROR];
  }

  // Check for potentially sensitive information patterns
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /api[_-]?key/i,
    /credential/i,
    /internal/i,
    /stack/i,
    /sql/i,
    /query/i,
    /database/i,
    /connection/i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(message)) {
      return ErrorCodeMessages[mapHttpStatusToErrorCode(statusCode)];
    }
  }

  return message;
}
