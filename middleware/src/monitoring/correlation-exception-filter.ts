import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { CorrelationIdStorage } from './correlation-id.storage';

@Catch()
export class CorrelationExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const correlationId = CorrelationIdStorage.getCorrelationId();
    const userId = CorrelationIdStorage.getUserId();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      correlationId: correlationId || 'N/A',
      userId: userId || 'N/A',
      message: exception?.message || 'Internal server error',
      path: ctx.getRequest().url,
    });
  }
}
