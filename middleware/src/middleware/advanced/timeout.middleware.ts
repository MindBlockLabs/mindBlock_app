import {
  Injectable,
  NestMiddleware,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TimeoutMiddlewareOptions {
  /** Request timeout in milliseconds. Default: 5000 */
  timeout?: number;
}

/**
 * Middleware that enforces a maximum request duration.
 * Uses Promise.race() to reject after the configured threshold,
 * letting NestJS's exception filter handle the 503 response.
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

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        this.logger.warn(
          `Request timed out after ${this.timeout}ms: ${req.method} ${req.path}`,
        );
        reject(
          new ServiceUnavailableException(
            `Request timed out after ${this.timeout}ms`,
          ),
        );
      }, this.timeout);
    });

    const nextPromise = new Promise((resolve) => {
      res.on('finish', () => resolve(true));
      res.on('close', () => resolve(true));
      next();
    });

    try {
      await Promise.race([nextPromise, timeoutPromise]);
    } catch (error) {
      if (!res.headersSent) {
        next(error);
      }
    } finally {
      clearTimeout(timeoutId!);
    }
  }
}

