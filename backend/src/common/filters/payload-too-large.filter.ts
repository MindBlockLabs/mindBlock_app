import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class PayloadTooLargeFilter implements ExceptionFilter {
  private readonly logger = new Logger(PayloadTooLargeFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Check for payload too large errors
    if (
      exception.statusCode === 413 ||
      exception.message?.includes('PAYLOAD_TOO_LARGE') ||
      exception.code === 'PAYLOAD_TOO_LARGE'
    ) {
      const status = 413;
      const errorResponse = {
        statusCode: status,
        errorCode: 'PAYLOAD_TOO_LARGE',
        message:
          exception.message || 'Request body exceeds maximum allowed size',
        maxSize: exception.maxSize,
        receivedSize: exception.receivedSize,
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      this.logger.warn(
        `Payload too large: ${exception.receivedSize} bytes > ${exception.maxSize} bytes from ${request.ip}`,
      );

      return response.status(status).json(errorResponse);
    }

    // Let other exceptions pass through
    throw exception;
  }
}