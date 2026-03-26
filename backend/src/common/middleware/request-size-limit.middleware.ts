import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import {
  DEFAULT_SIZE_LIMITS,
  CONTENT_TYPE_LIMITS,
} from './request-size-limit.config';

interface RequestWithSizeData extends Request {
  _sizeCheckPassed?: boolean;
  _receivedSize?: number;
}

@Injectable()
export class RequestSizeLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestSizeLimitMiddleware.name);

  async use(req: RequestWithSizeData, res: Response, next: NextFunction) {
    // Get content-type
    const contentType = req.headers['content-type'] as string;
    const baseContentType = this.getBaseContentType(contentType);

    // Determine size limit based on content type
    const sizeLimit = this.getSizeLimitForContentType(baseContentType);

    // Override size check if custom limit is set
    const customLimit = (req as any)._customSizeLimit;
    const finalLimit = customLimit || sizeLimit;

    let receivedSize = 0;
    let sizeLimitExceeded = false;

    // Monitor data chunks
    req.on('data', (chunk) => {
      receivedSize += chunk.length;

      if (receivedSize > finalLimit && !sizeLimitExceeded) {
        sizeLimitExceeded = true;
        req.pause();

        this.logger.warn(
          `Request body exceeds size limit: ${receivedSize} bytes > ${finalLimit} bytes - ${req.method} ${req.path} from ${req.ip}`,
        );

        const error: any = new Error('PAYLOAD_TOO_LARGE');
        error.statusCode = 413;
        error.errorCode = 'PAYLOAD_TOO_LARGE';
        error.maxSize = finalLimit;
        error.receivedSize = receivedSize;

        req.emit('error', error);
      }
    });

    // Handle errors
    const originalError = res.on.bind(res);
    req.once('error', (err: any) => {
      if (err && err.statusCode === 413) {
        res.status(413).json({
          statusCode: 413,
          errorCode: 'PAYLOAD_TOO_LARGE',
          message: `Request body exceeds maximum size of ${this.formatBytes(finalLimit)}`,
          maxSize: finalLimit,
          receivedSize: err.receivedSize,
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Store size info for later use
    req._sizeCheckPassed = true;
    req._receivedSize = receivedSize;

    next();
  }

  private getSizeLimitForContentType(contentType: string): number {
    // Check for exact match first
    if (CONTENT_TYPE_LIMITS[contentType]) {
      return CONTENT_TYPE_LIMITS[contentType];
    }

    // Check for partial match
    for (const [type, limit] of Object.entries(CONTENT_TYPE_LIMITS)) {
      if (contentType.includes(type)) {
        return limit;
      }
    }

    // Default to JSON limit
    return DEFAULT_SIZE_LIMITS.json;
  }

  private getBaseContentType(contentTypeHeader: string): string {
    if (!contentTypeHeader) {
      return 'application/json'; // Default to JSON
    }

    // Remove charset and other parameters
    return contentTypeHeader.split(';')[0].trim().toLowerCase();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}