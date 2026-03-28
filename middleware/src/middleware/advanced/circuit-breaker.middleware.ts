import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit. Default: 5 */
  failureThreshold?: number;
  /** Window in ms for counting failures. Default: 60000 (1 minute) */
  timeoutWindow?: number;
  /** Time in ms to wait before moving from OPEN to HALF_OPEN. Default: 30000 */
  halfOpenRetryInterval?: number;
  /** HTTP status codes considered failures. Default: [500, 502, 503, 504] */
  failureStatusCodes?: number[];
}

/**
 * Tracks circuit breaker state and exposes it for health checks.
 */
@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger('CircuitBreakerService');
  private state: CircuitState = CircuitState.CLOSED;
  private failureTimestamps: number[] = [];
  private lastFailureTime: number | null = null;

  readonly failureThreshold: number;
  readonly timeoutWindow: number;
  readonly halfOpenRetryInterval: number;
  readonly failureStatusCodes: number[];

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.timeoutWindow = options.timeoutWindow ?? 60_000;
    this.halfOpenRetryInterval = options.halfOpenRetryInterval ?? 30_000;
    this.failureStatusCodes = options.failureStatusCodes ?? [
      500, 502, 503, 504,
    ];
  }

  getState(): CircuitState {
    const now = Date.now();

    if (
      this.state === CircuitState.OPEN &&
      this.lastFailureTime !== null &&
      now - this.lastFailureTime >= this.halfOpenRetryInterval
    ) {
      this.logger.log('Circuit transitioning OPEN → HALF_OPEN');
      this.state = CircuitState.HALF_OPEN;
    }

    return this.state;
  }

  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.logger.log('Circuit transitioning HALF_OPEN → CLOSED');
      this.state = CircuitState.CLOSED;
      this.failureTimestamps = [];
      this.lastFailureTime = null;
    }
  }

  recordFailure(): void {
    const now = Date.now();
    this.lastFailureTime = now;

    if (this.state === CircuitState.HALF_OPEN) {
      this.logger.warn('Circuit transitioning HALF_OPEN → OPEN');
      this.state = CircuitState.OPEN;
      return;
    }

    this.failureTimestamps.push(now);

    // Filter failures outside the window
    this.failureTimestamps = this.failureTimestamps.filter(
      (t) => now - t <= this.timeoutWindow,
    );

    if (this.failureTimestamps.length >= this.failureThreshold) {
      this.logger.warn(
        `Circuit transitioning → OPEN (failures: ${this.failureTimestamps.length})`,
      );
      this.state = CircuitState.OPEN;
    }
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureTimestamps = [];
    this.lastFailureTime = null;
  }
}

/**
 * Middleware that short-circuits requests when the circuit is OPEN.
 * Returns 503 Service Unavailable immediately.
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
      } else if (res.statusCode >= 200 && res.statusCode < 300) {
        this.circuitBreaker.recordSuccess();
      }
      return originalSend(body);
    };

    next();
  }
}

