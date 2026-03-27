import { Request, Response, NextFunction } from 'express';
import {
  CircuitBreakerService,
  CircuitBreakerMiddleware,
  CircuitState,
} from '../../src/middleware/advanced/circuit-breaker.middleware';

jest.useFakeTimers();

function mockRes(): Partial<Response> {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { status, json, statusCode: 200, send: jest.fn() } as any;
}

function mockReq(): Partial<Request> {
  return { method: 'GET', path: '/test' } as any;
}

// ─── CircuitBreakerService state machine ────────────────────────────────────

describe('CircuitBreakerService', () => {
  let svc: CircuitBreakerService;

  beforeEach(() => {
    svc = new CircuitBreakerService({
      failureThreshold: 3,
      resetTimeout: 5000,
    });
  });

  it('starts in CLOSED state', () => {
    expect(svc.getState()).toBe(CircuitState.CLOSED);
  });

  it('stays CLOSED below failure threshold', () => {
    svc.recordFailure();
    svc.recordFailure();
    expect(svc.getState()).toBe(CircuitState.CLOSED);
  });

  it('transitions CLOSED → OPEN at failure threshold', () => {
    svc.recordFailure();
    svc.recordFailure();
    svc.recordFailure();
    expect(svc.getState()).toBe(CircuitState.OPEN);
  });

  it('transitions OPEN → HALF_OPEN after resetTimeout', () => {
    svc.recordFailure();
    svc.recordFailure();
    svc.recordFailure();
    expect(svc.getState()).toBe(CircuitState.OPEN);

    jest.advanceTimersByTime(5001);
    expect(svc.getState()).toBe(CircuitState.HALF_OPEN);
  });

  it('transitions HALF_OPEN → CLOSED on success', () => {
    svc.recordFailure();
    svc.recordFailure();
    svc.recordFailure();
    jest.advanceTimersByTime(5001);
    expect(svc.getState()).toBe(CircuitState.HALF_OPEN);

    svc.recordSuccess();
    expect(svc.getState()).toBe(CircuitState.CLOSED);
  });

  it('transitions HALF_OPEN → OPEN on failure', () => {
    svc.recordFailure();
    svc.recordFailure();
    svc.recordFailure();
    jest.advanceTimersByTime(5001);
    expect(svc.getState()).toBe(CircuitState.HALF_OPEN);

    svc.recordFailure();
    expect(svc.getState()).toBe(CircuitState.OPEN);
  });

  it('resets failure count on success', () => {
    svc.recordFailure();
    svc.recordFailure();
    svc.recordSuccess();
    // Still 2 more failures before threshold of 3
    svc.recordFailure();
    svc.recordFailure();
    expect(svc.getState()).toBe(CircuitState.CLOSED);
  });

  it('reset() restores CLOSED state', () => {
    svc.recordFailure();
    svc.recordFailure();
    svc.recordFailure();
    svc.reset();
    expect(svc.getState()).toBe(CircuitState.CLOSED);
  });
});

// ─── CircuitBreakerMiddleware ────────────────────────────────────────────────

describe('CircuitBreakerMiddleware', () => {
  let svc: CircuitBreakerService;
  let mw: CircuitBreakerMiddleware;
  let next: jest.Mock;

  beforeEach(() => {
    svc = new CircuitBreakerService({ failureThreshold: 2 });
    mw = new CircuitBreakerMiddleware(svc);
    next = jest.fn();
  });

  afterEach(() => jest.clearAllTimers());

  it('calls next() when circuit is CLOSED', () => {
    const res = mockRes();
    mw.use(mockReq() as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 503 without calling next() when circuit is OPEN', () => {
    svc.recordFailure();
    svc.recordFailure();
    const res = mockRes();
    mw.use(mockReq() as Request, res as Response, next);
    expect(next).not.toHaveBeenCalled();
    expect((res as any).status).toHaveBeenCalledWith(503);
  });

  it('records failure when response has a 5xx status code', () => {
    const res = mockRes() as any;
    res.statusCode = 500;
    const recordFailure = jest.spyOn(svc, 'recordFailure');
    mw.use(mockReq() as Request, res as Response, next);
    res.send('error body');
    expect(recordFailure).toHaveBeenCalledTimes(1);
  });

  it('records success when response has a 2xx status code', () => {
    const res = mockRes() as any;
    res.statusCode = 200;
    const recordSuccess = jest.spyOn(svc, 'recordSuccess');
    mw.use(mockReq() as Request, res as Response, next);
    res.send('ok');
    expect(recordSuccess).toHaveBeenCalledTimes(1);
  });
});
