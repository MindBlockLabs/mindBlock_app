import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Logger,
  Module,
  NestMiddleware,
  ServiceUnavailableException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export const CIRCUIT_BREAKER_OPTIONS = 'CIRCUIT_BREAKER_OPTIONS';

export interface CircuitBreakerMiddlewareOptions {
  name?: string;
  failureThreshold?: number;
  timeoutWindowMs?: number;
  halfOpenRetryIntervalMs?: number;
}

export interface CircuitBreakerSnapshot {
  name: string;
  state: CircuitBreakerState;
  failureCount: number;
  failureThreshold: number;
  timeoutWindowMs: number;
  halfOpenRetryIntervalMs: number;
  nextAttemptAt: number | null;
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly timeoutWindowMs: number;
  private readonly halfOpenRetryIntervalMs: number;

  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private nextAttemptAt: number | null = null;
  private halfOpenInFlight = false;

  constructor(
    @Inject(CIRCUIT_BREAKER_OPTIONS)
    options: CircuitBreakerMiddlewareOptions = {},
  ) {
    this.name = options.name ?? 'middleware-circuit-breaker';
    this.failureThreshold = options.failureThreshold ?? 5;
    this.timeoutWindowMs = options.timeoutWindowMs ?? 10_000;
    this.halfOpenRetryIntervalMs = options.halfOpenRetryIntervalMs ?? 30_000;
  }

  getState(): CircuitBreakerState {
    this.refreshState();
    return this.state;
  }

  getSnapshot(): CircuitBreakerSnapshot {
    this.refreshState();

    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      timeoutWindowMs: this.timeoutWindowMs,
      halfOpenRetryIntervalMs: this.halfOpenRetryIntervalMs,
      nextAttemptAt: this.nextAttemptAt,
    };
  }

  canRequest(): boolean {
    this.refreshState();

    if (this.state === 'OPEN') {
      return false;
    }

    if (this.state === 'HALF_OPEN' && this.halfOpenInFlight) {
      return false;
    }

    if (this.state === 'HALF_OPEN') {
      this.halfOpenInFlight = true;
    }

    return true;
  }

  recordSuccess(): void {
    const previousState = this.state;

    this.state = 'CLOSED';
    this.failureCount = 0;
    this.nextAttemptAt = null;
    this.halfOpenInFlight = false;

    if (previousState !== 'CLOSED') {
      this.logger.log(
        `Circuit "${this.name}" closed after a successful recovery attempt.`,
      );
    }
  }

  recordFailure(): void {
    this.refreshState();
    this.failureCount += 1;

    if (
      this.state === 'HALF_OPEN' ||
      this.failureCount >= this.failureThreshold
    ) {
      this.openCircuit();
      return;
    }

    this.logger.warn(
      `Circuit "${this.name}" failure count is ${this.failureCount}/${this.failureThreshold}.`,
    );
  }

  private refreshState(): void {
    if (
      this.state === 'OPEN' &&
      this.nextAttemptAt !== null &&
      Date.now() >= this.nextAttemptAt
    ) {
      this.state = 'HALF_OPEN';
      this.halfOpenInFlight = false;
      this.failureCount = Math.max(this.failureCount, this.failureThreshold);
      this.logger.warn(`Circuit "${this.name}" moved to HALF_OPEN.`);
    }
  }

  private openCircuit(): void {
    this.state = 'OPEN';
    this.nextAttemptAt = Date.now() + this.halfOpenRetryIntervalMs;
    this.halfOpenInFlight = false;

    this.logger.error(
      `Circuit "${this.name}" opened after ${this.failureCount} failures.`,
    );
  }
}

@Injectable()
export class CircuitBreakerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CircuitBreakerMiddleware.name);

  constructor(private readonly circuitBreakerService: CircuitBreakerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    if (!this.circuitBreakerService.canRequest()) {
      const snapshot = this.circuitBreakerService.getSnapshot();
      const retryAt = snapshot.nextAttemptAt
        ? new Date(snapshot.nextAttemptAt).toISOString()
        : 'unknown';
      const message = `Circuit breaker is OPEN for ${snapshot.name}. Retry after ${retryAt}.`;

      this.logger.warn(message);
      next(new ServiceUnavailableException(message));
      return;
    }

    let settled = false;

    const finalizeSuccess = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      this.circuitBreakerService.recordSuccess();
    };

    const finalizeFailure = () => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      this.circuitBreakerService.recordFailure();
    };

    const onFinish = () => {
      if (res.statusCode >= 500) {
        finalizeFailure();
        return;
      }

      finalizeSuccess();
    };

    const onClose = () => {
      if (!res.writableEnded) {
        finalizeFailure();
      }
    };

    const cleanup = () => {
      res.removeListener('finish', onFinish);
      res.removeListener('close', onClose);
    };

    res.once('finish', onFinish);
    res.once('close', onClose);

    next((error?: unknown) => {
      if (error) {
        finalizeFailure();
      }

      next(error as any);
    });
  }
}

@Global()
@Module({})
export class CircuitBreakerModule {
  static register(
    options: CircuitBreakerMiddlewareOptions = {},
  ): DynamicModule {
    return {
      module: CircuitBreakerModule,
      providers: [
        {
          provide: CIRCUIT_BREAKER_OPTIONS,
          useValue: options,
        },
        CircuitBreakerService,
        CircuitBreakerMiddleware,
      ],
      exports: [CircuitBreakerService, CircuitBreakerMiddleware],
    };
  }
}
