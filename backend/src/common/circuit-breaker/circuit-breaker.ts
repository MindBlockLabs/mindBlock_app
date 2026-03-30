export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

import { CircuitBreakerOptions } from './circuit-breaker.options';

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failures = 0;
  private openedAt = 0;
  private lastHalfOpenAttempt = 0;

  private readonly failureThreshold: number;
  private readonly timeout: number;
  private readonly halfOpenRetryInterval: number;

  constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.timeout = options.timeout ?? 60_000;
    this.halfOpenRetryInterval = options.halfOpenRetryInterval ?? 5_000;
  }

  getState(): CircuitState {
    return this.state;
  }

  /** Returns true if the request should be allowed through. */
  allowRequest(): boolean {
    const now = Date.now();

    if (this.state === CircuitState.CLOSED) return true;

    if (this.state === CircuitState.OPEN) {
      if (now - this.openedAt >= this.timeout) {
        this.state = CircuitState.HALF_OPEN;
        this.lastHalfOpenAttempt = now;
        return true;
      }
      return false;
    }

    // HALF_OPEN: allow one probe per retry interval
    if (now - this.lastHalfOpenAttempt >= this.halfOpenRetryInterval) {
      this.lastHalfOpenAttempt = now;
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = CircuitState.CLOSED;
  }

  recordFailure(): void {
    this.failures += 1;
    if (this.state === CircuitState.HALF_OPEN || this.failures >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.openedAt = Date.now();
    }
  }
}
