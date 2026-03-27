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
 * Standard API error response structure.
 * Every error returned by the API must conform to this shape.
 */
export interface ErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  /** Field-level validation details — only present on 400 responses. */
  details?: Array<{ field?: string; message: string; value?: unknown }>;
  correlationId: string;
  timestamp: string;
  path: string;
  /** Full stack trace — development only, never sent to production clients. */
  stack?: string;
}

/**
 * TypeORM Postgres error codes mapped to our domain error codes.
 */
const PG_ERROR_MAP: Record<string, { code: AppErrorCode; status: HttpStatus; message: string }> = {
  '23505': {
    code: AppErrorCode.DUPLICATE_RESOURCE,
    status: HttpStatus.CONFLICT,
    message: 'A record with the same unique value already exists.',
  },
  '23503': {
    code: AppErrorCode.DB_CONSTRAINT_VIOLATION,
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'Referenced resource does not exist.',
  },
  '23502': {
    code: AppErrorCode.VALIDATION_FAILED,
    status: HttpStatus.BAD_REQUEST,
    message: 'A required field is missing.',
  },
  '23514': {
    code: AppErrorCode.DB_CONSTRAINT_VIOLATION,
    status: HttpStatus.BAD_REQUEST,
    message: 'A check constraint was violated.',
  },
  'ECONNREFUSED': {
    code: AppErrorCode.DB_CONNECTION_ERROR,
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

    // ── 3. Build the response body ────────────────────────────────────────────
    const body: ErrorResponse = {
      statusCode: resolved.status,
      errorCode: resolved.errorCode,
      message: resolved.message,
      correlationId,
      timestamp,
      path,
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
          return {
            status,
            errorCode: AppErrorCode.VALIDATION_FAILED,
            message: 'Validation failed',
            details: messages.map((m: string) => ({ message: m })),
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

  private mapHttpStatusToErrorCode(status: HttpStatus): string {
    const map: Partial<Record<HttpStatus, AppErrorCode>> = {
      [HttpStatus.BAD_REQUEST]: AppErrorCode.VALIDATION_FAILED,
      [HttpStatus.UNAUTHORIZED]: AppErrorCode.AUTH_TOKEN_INVALID,
      [HttpStatus.FORBIDDEN]: AppErrorCode.INSUFFICIENT_PERMISSIONS,
      [HttpStatus.NOT_FOUND]: AppErrorCode.RESOURCE_NOT_FOUND,
      [HttpStatus.CONFLICT]: AppErrorCode.DUPLICATE_RESOURCE,
      [HttpStatus.TOO_MANY_REQUESTS]: AppErrorCode.RATE_LIMIT_EXCEEDED,
      [HttpStatus.SERVICE_UNAVAILABLE]: AppErrorCode.SERVICE_UNAVAILABLE,
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
