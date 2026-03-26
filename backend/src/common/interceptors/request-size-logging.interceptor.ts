import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class RequestSizeLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestSizeLogging');

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Get content length if available
    const contentLength = request.headers['content-length']
      ? parseInt(request.headers['content-length'] as string, 10)
      : 0;

    if (contentLength > 0) {
      // Log large requests for monitoring
      if (contentLength > 5 * 1024 * 1024) {
        // 5MB
        this.logger.warn(
          `Large request detected: ${this.formatBytes(contentLength)} - ${request.method} ${request.path} from ${request.ip}`,
        );
      } else {
        this.logger.debug(
          `Request size: ${this.formatBytes(contentLength)} - ${request.method} ${request.path}`,
        );
      }
    }

    return next.handle();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}