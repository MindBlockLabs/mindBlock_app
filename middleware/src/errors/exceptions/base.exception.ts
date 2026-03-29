import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorCodeHttpStatus, ErrorCodeMessages } from '../constants/error-codes';
import { ValidationErrorDetail } from '../interfaces/error.interface';

/**
 * Base exception class for all application errors
 */
export class BaseException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly details?: ValidationErrorDetail[];
  public readonly context?: Record<string, unknown>;

  constructor(
    errorCode: ErrorCode,
    message?: string,
    details?: ValidationErrorDetail[],
    context?: Record<string, unknown>,
  ) {
    const statusCode = ErrorCodeHttpStatus[errorCode] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const errorMessage = message ?? ErrorCodeMessages[errorCode] ?? 'An error occurred';

    super(
      {
        statusCode,
        errorCode,
        message: errorMessage,
        details,
      },
      statusCode,
    );

    this.errorCode = errorCode;
    this.details = details;
    this.context = context;
  }

  /**
   * Get the error code
   */
  getErrorCode(): ErrorCode {
    return this.errorCode;
  }

  /**
   * Get validation error details
   */
  getDetails(): ValidationErrorDetail[] | undefined {
    return this.details;
  }

  /**
   * Get additional context
   */
  getContext(): Record<string, unknown> | undefined {
    return this.context;
  }
}
