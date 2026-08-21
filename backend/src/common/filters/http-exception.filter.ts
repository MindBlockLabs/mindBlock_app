import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';
import { AppException } from '../errors/app.exception';
import { AppErrorCode } from '../errors/error-codes.enum';

/**
 * Standard API error response structure as required.
 * Every error returned by the API must conform to this shape.
 */
export interface ErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  code: string;
  timestamp: string;
  path: string;
  /** Field-level validation details — only present on validation errors. */
  details?: Array<{ field?: string; message: string; value?: unknown }>;
  /** Unique request ID for tracing */
  requestId?: string;
  /** Full stack trace — development only, never sent to production clients. */
  stack?: string;
}

/**
 * TypeORM Postgres error codes mapped to our domain error codes.
 */
const PG_ERROR_MAP: Record<
  string,
  { code: AppErrorCode; status: HttpStatus; message: string }
> = {
  '23505': {
    code: AppErrorCode.CONFLICT,
    status: HttpStatus.CONFLICT,
    message: 'A record with the same unique value already exists.',
  },
  '23503': {
    code: AppErrorCode.CONFLICT,
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'Referenced resource does not exist.',
  },
  '23502': {
    code: AppErrorCode.VALIDATION_ERROR,
    status: HttpStatus.BAD_REQUEST,
    message: 'A required field is missing.',
  },
  '23514': {
    code: AppErrorCode.VALIDATION_ERROR,
    status: HttpStatus.BAD_REQUEST,
    message: 'A check constraint was violated.',
  },
  ECONNREFUSED: {
    code: AppErrorCode.INTERNAL_SERVER_ERROR,
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: 'Database is temporarily unavailable. Please try again later.',
  },
};

/**
 * Global exception filter that catches every thrown value and formats it
 * according to the standard ErrorResponse schema.
 *
 * Behaviour:
 *  - AppException  → uses the typed errorCode + details already on the instance.
 *  - HttpException → maps status → errorCode automatically.
 *  - QueryFailedError (TypeORM) → maps Postgres error codes gracefully.
 *  - EntityNotFoundError → 404 RESOURCE_NOT_FOUND.
 *  - Anything else → 500 INTERNAL_SERVER_ERROR with sanitised message.
 *
 * Dev vs Production:
 *  - NODE_ENV=development: includes `stack` in response.
 *  - NODE_ENV=production:  omits stack, sanitises opaque internal errors.
 *
 * Logging:
 *  - Always logs the full stack trace + correlation ID to the server log,
 *    regardless of environment.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');
  private readonly isDev = process.env.NODE_ENV !== 'production';

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = (request as any).correlationId ?? 'unknown';
    const path = request.url;
    const timestamp = new Date().toISOString();

    // ── 1. Resolve status, errorCode, message, details ───────────────────────
    const resolved = this.resolveError(exception);

    // ── 2. Log full details (always — even in production) ────────────────────
    this.logError(exception, resolved, correlationId, path, request.method);

    // Get the standard error name based on status code
    const errorName = this.getHttpStatusName(resolved.status);
    
    // ── 3. Build the response body ────────────────────────────────────────────
    const body: ErrorResponse = {
      success: false,
      statusCode: resolved.status,
      error: errorName,
      message: resolved.message,
      code: resolved.errorCode,
      timestamp,
      path,
      requestId: correlationId,
    };

    if (resolved.details?.length) {
      body.details = resolved.details;
    }

    // Stack trace only in development
    if (this.isDev && exception instanceof Error) {
      body.stack = exception.stack;
    }

    response.status(resolved.status).json(body);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private resolveError(exception: unknown): {
    status: HttpStatus;
    errorCode: string;
    message: string;
    details?: Array<{ field?: string; message: string; value?: unknown }>;
  } {
    // ── AppException (our typed hierarchy) ──────────────────────────────────
    if (exception instanceof AppException) {
      return {
        status: exception.getStatus(),
        errorCode: exception.errorCode,
        message: exception.message,
        details: exception.details,
      };
    }

    // ── TypeORM EntityNotFoundError ──────────────────────────────────────────
    if (exception instanceof EntityNotFoundError) {
      return {
        status: HttpStatus.NOT_FOUND,
        errorCode: AppErrorCode.RESOURCE_NOT_FOUND,
        message: 'The requested resource could not be found.',
      };
    }

    // ── TypeORM QueryFailedError (Postgres) ──────────────────────────────────
    if (exception instanceof QueryFailedError) {
      const pgCode = (exception as any).code as string | undefined;
      const mapped = pgCode ? PG_ERROR_MAP[pgCode] : undefined;

      if (mapped) {
        return {
          status: mapped.status,
          errorCode: mapped.code,
          message: mapped.message,
        };
      }

      // Unknown DB error — don't leak the raw query
      const safeMsg = this.isDev
        ? `Database error: ${exception.message}`
        : 'A database error occurred. Please try again later.';
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: AppErrorCode.DB_QUERY_FAILED,
        message: safeMsg,
      };
    }

    // ── NestJS / node HttpException ──────────────────────────────────────────
    if (exception instanceof HttpException) {
      const status = exception.getStatus() as HttpStatus;
      const raw = exception.getResponse();

      // class-validator ValidationPipe throws HttpException with `message[]`
      if (
        status === HttpStatus.BAD_REQUEST &&
        typeof raw === 'object' &&
        raw !== null &&
        'message' in raw
      ) {
        const messages = (raw as any).message;
        if (Array.isArray(messages)) {
          // Parse class-validator error messages to extract field information when possible
          const details = messages.map((m: string) => {
            // Try to extract field name from common validation error formats
            const fieldMatch = m.match(/^(\w+)\s/);
            const field = fieldMatch ? fieldMatch[1] : undefined;
            return { message: m, field };
          });
          
          return {
            status,
            errorCode: AppErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
            details,
          };
        }
      }

      return {
        status,
        errorCode: this.mapHttpStatusToErrorCode(status),
        message: typeof raw === 'string' ? raw : exception.message,
      };
    }

    // ── Unknown / unhandled error ────────────────────────────────────────────
    const safeMsg = this.isDev
      ? `Internal error: ${(exception as any)?.message ?? String(exception)}`
      : 'An unexpected internal error occurred. Our team has been notified.';

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: AppErrorCode.INTERNAL_SERVER_ERROR,
      message: safeMsg,
    };
  }

  private getHttpStatusName(status: HttpStatus): string {
    const statusNames: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
      [HttpStatus.FORBIDDEN]: 'Forbidden',
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Service Unavailable',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
    };
    return statusNames[status] ?? 'Unknown Error';
  }

  private mapHttpStatusToErrorCode(status: HttpStatus): string {
    const map: Partial<Record<HttpStatus, AppErrorCode>> = {
      [HttpStatus.BAD_REQUEST]: AppErrorCode.VALIDATION_ERROR,
      [HttpStatus.UNAUTHORIZED]: AppErrorCode.UNAUTHORIZED,
      [HttpStatus.FORBIDDEN]: AppErrorCode.FORBIDDEN,
      [HttpStatus.NOT_FOUND]: AppErrorCode.NOT_FOUND,
      [HttpStatus.CONFLICT]: AppErrorCode.CONFLICT,
      [HttpStatus.TOO_MANY_REQUESTS]: AppErrorCode.RATE_LIMITED,
      [HttpStatus.SERVICE_UNAVAILABLE]: AppErrorCode.INTERNAL_SERVER_ERROR,
      [HttpStatus.INTERNAL_SERVER_ERROR]: AppErrorCode.INTERNAL_SERVER_ERROR,
    };
    return map[status] ?? AppErrorCode.INTERNAL_SERVER_ERROR;
  }

  private logError(
    exception: unknown,
    resolved: { status: number; errorCode: string; message: string },
    correlationId: string,
    path: string,
    method: string,
  ): void {
    const stack = exception instanceof Error ? exception.stack : undefined;
    const context =
      exception instanceof AppException ? exception.logContext : undefined;

    const logPayload = {
      correlationId,
      method,
      path,
      status: resolved.status,
      errorCode: resolved.errorCode,
      message: resolved.message,
      ...(context ? { context } : {}),
    };

    if (resolved.status >= 500) {
      this.logger.error(JSON.stringify(logPayload), stack);
    } else {
      this.logger.warn(JSON.stringify(logPayload));
    }
  }
}