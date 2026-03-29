import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse, DevErrorResponse, ErrorContext, ErrorHandlingConfig } from '../interfaces/error.interface';
import { ErrorCode } from '../constants/error-codes';
import { mapError } from '../utils/error-mapper';
import { getCorrelationId, getCorrelationIdHeader } from '../utils/correlation-id';
import { ErrorLoggerService } from '../services/error-logger.service';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ErrorHandlingConfig = {
  environment: process.env.NODE_ENV ?? 'development',
  includeStackTrace: true,
  logErrors: true,
  sensitiveHeaders: ['authorization', 'cookie', 'x-api-key'],
  sensitiveFields: ['password', 'token', 'secret'],
};

/**
 * Global exception filter that catches all errors and formats them consistently
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');
  private readonly errorLogger: ErrorLoggerService;
  private readonly config: ErrorHandlingConfig;
  private readonly isProduction: boolean;

  constructor(config: Partial<ErrorHandlingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isProduction = this.config.environment === 'production';
    this.errorLogger = new ErrorLoggerService({
      sensitiveHeaders: this.config.sensitiveHeaders,
      sensitiveFields: this.config.sensitiveFields,
    });
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Generate or extract correlation ID
    const correlationId = getCorrelationId(request);

    // Map the error to a standardized format
    const mappedError = mapError(exception, this.isProduction);

    // Build error context for logging
    const errorContext = this.buildErrorContext(request, correlationId);

    // Log the error
    if (this.config.logErrors) {
      const logEntry = this.errorLogger.createLogEntry(
        exception,
        errorContext,
        mappedError.statusCode,
        mappedError.errorCode,
        mappedError.message,
      );
      this.errorLogger.logError(logEntry);
    }

    // Build and send response
    const errorResponse = this.buildErrorResponse(
      mappedError,
      correlationId,
      request.url,
      exception,
    );

    // Set correlation ID header in response
    response.setHeader(getCorrelationIdHeader(), correlationId);

    response.status(mappedError.statusCode).json(errorResponse);
  }

  /**
   * Build error context from request
   */
  private buildErrorContext(request: Request, correlationId: string): ErrorContext {
    // Extract user ID from request if available (set by auth middleware)
    const userId = (request as Record<string, unknown>).userId as string | undefined;

    // Get relevant headers (exclude sensitive ones for context)
    const safeHeaders: Record<string, string> = {};
    const headerKeys = ['content-type', 'user-agent', 'accept', 'accept-language'];
    
    for (const key of headerKeys) {
      const value = request.headers[key];
      if (typeof value === 'string') {
        safeHeaders[key] = value;
      }
    }

    return {
      correlationId,
      path: request.url,
      method: request.method,
      ip: request.ip ?? request.socket?.remoteAddress,
      userId,
      userAgent: request.headers['user-agent'],
      body: request.body,
      query: request.query,
      params: request.params,
      headers: safeHeaders,
    };
  }

  /**
   * Build the error response object
   */
  private buildErrorResponse(
    mappedError: ReturnType<typeof mapError>,
    correlationId: string,
    path: string,
    originalError: unknown,
  ): ErrorResponse | DevErrorResponse {
    const baseResponse: ErrorResponse = {
      statusCode: mappedError.statusCode,
      errorCode: mappedError.errorCode,
      message: mappedError.message,
      correlationId,
      timestamp: new Date().toISOString(),
      path,
    };

    // Include validation error details
    if (mappedError.details && mappedError.details.length > 0) {
      baseResponse.details = mappedError.details;
    }

    // In development, include additional debugging info
    if (!this.isProduction && this.config.includeStackTrace) {
      const devResponse: DevErrorResponse = {
        ...baseResponse,
      };

      if (mappedError.stack) {
        devResponse.stack = mappedError.stack;
      }

      if (mappedError.context) {
        devResponse.context = mappedError.context;
      }

      if (originalError instanceof Error && originalError.cause) {
        devResponse.cause = String(originalError.cause);
      }

      return devResponse;
    }

    return baseResponse;
  }
}

/**
 * Factory function to create the global exception filter with custom config
 */
export function createGlobalExceptionFilter(
  config?: Partial<ErrorHandlingConfig>,
): GlobalExceptionFilter {
  return new GlobalExceptionFilter(config);
}
