import { Request, Response, NextFunction } from 'express';
import { CorrelationIdMiddleware } from '../../src/monitoring/correlation-id.middleware';
import { CorrelationIdStorage } from '../../src/monitoring/correlation-id.storage';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function makeMiddleware(): CorrelationIdMiddleware {
  return new CorrelationIdMiddleware();
}

function mockRes() {
  const headers: Record<string, string> = {};
  return {
    headers,
    setHeader: jest.fn((name: string, value: string) => { headers[name] = value; }),
    getHeader: jest.fn((name: string) => headers[name]),
  } as unknown as Response;
}

function mockReq(correlationId?: string, user?: { id: string }): Partial<Request> {
  const headers: Record<string, string> = {};
  if (correlationId) headers['x-correlation-id'] = correlationId;
  return { method: 'GET', path: '/test', headers, user, header: (name: string) => headers[name.toLowerCase()] } as any;
}

describe('CorrelationIdMiddleware', () => {
  let next: jest.Mock;

  beforeEach(() => {
    next = jest.fn();
  });

  it('calls next()', () => {
    const mw = makeMiddleware();
    const req = mockReq();
    const res = mockRes();
    mw.use(req as Request, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('generates a UUID v4 when no X-Correlation-ID header is provided', () => {
    const mw = makeMiddleware();
    const req = mockReq();
    const res = mockRes();
    mw.use(req as Request, res, next);
    const id = (req as any).correlationId as string;
    expect(id).toMatch(UUID_REGEX);
  });

  it('reuses an existing X-Correlation-ID from the request header', () => {
    const existingId = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    const mw = makeMiddleware();
    const req = mockReq(existingId);
    const res = mockRes();
    mw.use(req as Request, res, next);
    expect((req as any).correlationId).toBe(existingId);
  });

  it('sets X-Correlation-ID on the response', () => {
    const mw = makeMiddleware();
    const req = mockReq();
    const res = mockRes();
    mw.use(req as Request, res, next);
    expect((res as any).headers['X-Correlation-ID']).toBeDefined();
    expect((res as any).headers['X-Correlation-ID']).toMatch(UUID_REGEX);
  });

  it('response X-Correlation-ID matches request correlationId', () => {
    const mw = makeMiddleware();
    const req = mockReq();
    const res = mockRes();
    mw.use(req as Request, res, next);
    expect((res as any).headers['X-Correlation-ID']).toBe((req as any).correlationId);
  });

  it('attaches correlationId to request headers for downstream propagation', () => {
    const mw = makeMiddleware();
    const req = mockReq();
    const res = mockRes();
    mw.use(req as Request, res, next);
    expect(req.headers!['x-correlation-id']).toBe((req as any).correlationId);
  });

  it('makes correlationId accessible via CorrelationIdStorage inside next()', () => {
    const mw = makeMiddleware();
    const req = mockReq();
    const res = mockRes();
    let storedId: string | undefined;

    next.mockImplementation(() => {
      storedId = CorrelationIdStorage.getCorrelationId();
    });

    mw.use(req as Request, res, next);
    expect(storedId).toBe((req as any).correlationId);
  });

  it('stores userId from req.user.id in CorrelationIdStorage', () => {
    const mw = makeMiddleware();
    const req = mockReq(undefined, { id: 'user-42' });
    const res = mockRes();
    let storedUserId: string | undefined;

    next.mockImplementation(() => {
      storedUserId = CorrelationIdStorage.getUserId();
    });

    mw.use(req as Request, res, next);
    expect(storedUserId).toBe('user-42');
  });

  it('stores undefined userId when req.user is absent', () => {
    const mw = makeMiddleware();
    const req = mockReq();
    const res = mockRes();
    let storedUserId: string | undefined = 'sentinel';

    next.mockImplementation(() => {
      storedUserId = CorrelationIdStorage.getUserId();
    });

    mw.use(req as Request, res, next);
    expect(storedUserId).toBeUndefined();
  });
});
