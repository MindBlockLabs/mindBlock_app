import {
  Inject,
  Injectable,
  Logger,
  NestMiddleware,
  ServiceUnavailableException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export const TIMEOUT_MIDDLEWARE_OPTIONS = 'TIMEOUT_MIDDLEWARE_OPTIONS';

export interface TimeoutMiddlewareOptions {
  timeoutMs?: number;
  message?: string;
}

@Injectable()
export class TimeoutMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TimeoutMiddleware.name);
  private readonly timeoutMs: number;
  private readonly message: string;

  constructor(
    @Inject(TIMEOUT_MIDDLEWARE_OPTIONS)
    options: TimeoutMiddlewareOptions = {},
  ) {
    this.timeoutMs = options.timeoutMs ?? 5000;
    this.message =
      options.message ??
      `Request timed out after ${this.timeoutMs}ms while waiting for middleware execution.`;
  }

  use(_req: Request, res: Response, next: NextFunction): void {
    let completed = false;

    const clear = () => {
      completed = true;
      clearTimeout(timer);
      res.removeListener('finish', onComplete);
      res.removeListener('close', onComplete);
    };

    const onComplete = () => {
      clear();
    };

    const timer = setTimeout(() => {
      if (completed || res.headersSent) {
        return;
      }

      clear();
      this.logger.warn(this.message);
      next(new ServiceUnavailableException(this.message));
    }, this.timeoutMs);

    res.once('finish', onComplete);
    res.once('close', onComplete);

    next();
  }
}
