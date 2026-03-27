import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TimeoutMiddlewareOptions {
  /** Request timeout in milliseconds. Default: 5000 */
  timeout?: number;
}

/**
 * Middleware that enforces a maximum request duration.
 * Returns 503 Service Unavailable when the threshold is exceeded.
 *
 * @example
 * consumer.apply(new TimeoutMiddleware({ timeout: 3000 }).use.bind(timeoutMiddleware));
 */
@Injectable()
export class TimeoutMiddleware implements NestMiddleware {
  private readonly logger = new Logger('TimeoutMiddleware');
  private readonly timeout: number;

  constructor(options: TimeoutMiddlewareOptions = {}) {
    this.timeout = options.timeout ?? 5000;
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        this.logger.warn(
          `Request timed out after ${this.timeout}ms: ${req.method} ${req.path}`,
        );
        res.status(503).json({
          statusCode: 503,
          message: `Request timed out after ${this.timeout}ms`,
          error: 'Service Unavailable',
        });
      }
    }, this.timeout);

    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));

    next();
  }
}
