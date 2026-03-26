import { ServiceUnavailableException } from '@nestjs/common';
import {
  CircuitBreakerMiddleware,
  CircuitBreakerService,
} from '../../src/middleware/advanced/circuit-breaker.middleware';

describe('CircuitBreakerService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-26T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stays CLOSED until the configured failure threshold is reached', () => {
    const service = new CircuitBreakerService({
      name: 'auth-service',
      failureThreshold: 3,
      halfOpenRetryIntervalMs: 1000,
    });

    service.recordFailure();
    expect(service.getState()).toBe('CLOSED');

    service.recordFailure();
    expect(service.getState()).toBe('CLOSED');

    service.recordFailure();
    expect(service.getState()).toBe('OPEN');
  });

  it('transitions from OPEN to HALF_OPEN after the retry interval', () => {
    const service = new CircuitBreakerService({
      name: 'auth-service',
      failureThreshold: 2,
      halfOpenRetryIntervalMs: 1000,
    });

    service.recordFailure();
    service.recordFailure();
    expect(service.getState()).toBe('OPEN');

    jest.advanceTimersByTime(999);
    expect(service.getState()).toBe('OPEN');

    jest.advanceTimersByTime(1);
    expect(service.getState()).toBe('HALF_OPEN');
  });

  it('transitions from HALF_OPEN to CLOSED after a successful trial request', () => {
    const service = new CircuitBreakerService({
      name: 'auth-service',
      failureThreshold: 1,
      halfOpenRetryIntervalMs: 1000,
    });

    service.recordFailure();
    expect(service.getState()).toBe('OPEN');

    jest.advanceTimersByTime(1000);
    expect(service.getState()).toBe('HALF_OPEN');
    expect(service.canRequest()).toBe(true);

    service.recordSuccess();

    expect(service.getState()).toBe('CLOSED');
    expect(service.getSnapshot().failureCount).toBe(0);
  });

  it('transitions from HALF_OPEN back to OPEN when the trial request fails', () => {
    const service = new CircuitBreakerService({
      name: 'auth-service',
      failureThreshold: 1,
      halfOpenRetryIntervalMs: 1000,
    });

    service.recordFailure();
    jest.advanceTimersByTime(1000);

    expect(service.getState()).toBe('HALF_OPEN');
    expect(service.canRequest()).toBe(true);

    service.recordFailure();

    expect(service.getState()).toBe('OPEN');
  });

  it('exposes the current circuit state through getSnapshot', () => {
    const service = new CircuitBreakerService({
      name: 'auth-service',
      failureThreshold: 5,
      timeoutWindowMs: 2500,
      halfOpenRetryIntervalMs: 7000,
    });

    expect(service.getSnapshot()).toMatchObject({
      name: 'auth-service',
      state: 'CLOSED',
      failureThreshold: 5,
      timeoutWindowMs: 2500,
      halfOpenRetryIntervalMs: 7000,
    });
  });
});

describe('CircuitBreakerMiddleware', () => {
  it('returns 503 while the circuit is OPEN', () => {
    const service = new CircuitBreakerService({
      name: 'auth-service',
      failureThreshold: 1,
      halfOpenRetryIntervalMs: 1000,
    });
    const middleware = new CircuitBreakerMiddleware(service);
    const next = jest.fn();

    service.recordFailure();

    middleware.use(
      {} as any,
      createResponse(),
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.any(ServiceUnavailableException));
  });
});

function createResponse() {
  const listeners = new Map<string, Array<() => void>>();

  return {
    statusCode: 200,
    writableEnded: false,
    once: jest.fn((event: string, handler: () => void) => {
      const current = listeners.get(event) ?? [];
      listeners.set(event, [...current, handler]);
    }),
    removeListener: jest.fn((event: string, handler: () => void) => {
      const current = listeners.get(event) ?? [];
      listeners.set(
        event,
        current.filter((candidate) => candidate !== handler),
      );
    }),
    emit: (event: string) => {
      for (const handler of listeners.get(event) ?? []) {
        handler();
      }
    },
  } as any;
}
