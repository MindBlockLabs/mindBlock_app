import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  /** Number of consecutive failures before opening the circuit. Default: 5 */
  failureThreshold?: number;
  /** Time in ms to wait before moving from OPEN to HALF_OPEN. Default: 30000 */
  resetTimeout?: number;
  /** HTTP status codes considered failures. Default: [500, 502, 503, 504] */
  failureStatusCodes?: number[];
}

/**
 * Tracks circuit breaker state and exposes it for health checks.
 *
 * State machine:
 *   CLOSED  → (N failures) → OPEN
 *   OPEN    → (resetTimeout elapsed) → HALF_OPEN
 *   HALF_OPEN → (success) → CLOSED | (failure) → OPEN
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger('CircuitBreakerService');
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime: number | null = null;

  readonly failureThreshold: number;
  readonly resetTimeout: number;
  readonly failureStatusCodes: number[];

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeout = options.resetTimeout ?? 30_000;
    this.failureStatusCodes = options.failureStatusCodes ?? [500, 502, 503, 504];
  }

  getState(): CircuitState {
    if (
      this.state === CircuitState.OPEN &&
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime >= this.resetTimeout
    ) {
      this.logger.log('Circuit transitioning OPEN → HALF_OPEN');
      this.state = CircuitState.HALF_OPEN;
    }
    return this.state;
  }

  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.logger.log('Circuit transitioning HALF_OPEN → CLOSED');
    }
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      this.state === CircuitState.HALF_OPEN ||
      this.failureCount >= this.failureThreshold
    ) {
      this.logger.warn(
        `Circuit transitioning → OPEN (failures: ${this.failureCount})`,
      );
      this.state = CircuitState.OPEN;
    }
  }

  /** Reset to initial CLOSED state (useful for testing). */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = null;
  }
}

/**
 * Middleware that short-circuits requests when the circuit is OPEN,
 * returning 503 immediately without hitting downstream handlers.
 */
@Injectable()
export class CircuitBreakerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('CircuitBreakerMiddleware');

  constructor(private readonly circuitBreaker: CircuitBreakerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const state = this.circuitBreaker.getState();

    if (state === CircuitState.OPEN) {
      this.logger.warn(`Circuit OPEN — rejecting ${req.method} ${req.path}`);
      res.status(503).json({
        statusCode: 503,
        message: 'Service temporarily unavailable (circuit open)',
        error: 'Service Unavailable',
      });
      return;
    }

    // Intercept the response to observe the outcome
    const originalSend = res.send.bind(res);
    res.send = (body?: any): Response => {
      if (this.circuitBreaker.failureStatusCodes.includes(res.statusCode)) {
        this.circuitBreaker.recordFailure();
      } else {
        this.circuitBreaker.recordSuccess();
      }
      return originalSend(body);
    };

    next();
  }
}
