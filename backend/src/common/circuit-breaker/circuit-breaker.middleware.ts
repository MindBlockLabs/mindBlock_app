import {
  Injectable,
  NestMiddleware,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CircuitBreaker } from './circuit-breaker';
import { CircuitBreakerOptions } from './circuit-breaker.options';

@Injectable()
export class CircuitBreakerMiddleware implements NestMiddleware {
  private readonly breaker: CircuitBreaker;

  constructor(options: CircuitBreakerOptions = {}) {
    this.breaker = new CircuitBreaker(options);
  }

  use(req: Request, res: Response, next: NextFunction): void {
    if (!this.breaker.allowRequest()) {
      throw new ServiceUnavailableException('Circuit breaker is OPEN');
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode >= 500) {
        this.breaker.recordFailure();
      } else {
        this.breaker.recordSuccess();
      }
      return originalJson(body);
    };

    next();
  }
}
