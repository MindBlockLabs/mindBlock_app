import { Request, Response, NextFunction } from 'express';
import { TimeoutMiddleware } from '../../src/middleware/advanced/timeout.middleware';

jest.useFakeTimers();

function mockReq(path = '/test'): Partial<Request> {
  return { method: 'GET', path } as Partial<Request>;
}

function mockRes(): {
  res: Partial<Response>;
  status: jest.Mock;
  json: jest.Mock;
  headersSent: boolean;
  on: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const on = jest.fn();
  return {
    res: { status, json, on, headersSent: false } as any,
    status,
    json,
    on,
    headersSent: false,
  };
}

describe('TimeoutMiddleware', () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it('calls next() immediately', () => {
    const mw = new TimeoutMiddleware({ timeout: 1000 });
    const next = jest.fn();
    const { res } = mockRes();
    mw.use(mockReq() as Request, res as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not send 503 before timeout elapses', () => {
    const mw = new TimeoutMiddleware({ timeout: 1000 });
    const next = jest.fn();
    const { res, status } = mockRes();
    mw.use(mockReq() as Request, res as Response, next);
    jest.advanceTimersByTime(999);
    expect(status).not.toHaveBeenCalled();
  });

  it('sends 503 after timeout elapses and headers not sent', () => {
    const mw = new TimeoutMiddleware({ timeout: 1000 });
    const next = jest.fn();
    const { res, status, json } = mockRes();
    (res as any).headersSent = false;
    mw.use(mockReq() as Request, res as Response, next);
    jest.advanceTimersByTime(1001);
    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 503 }),
    );
  });

  it('does not send 503 if headers already sent', () => {
    const mw = new TimeoutMiddleware({ timeout: 1000 });
    const next = jest.fn();
    const { res, status } = mockRes();
    (res as any).headersSent = true;
    mw.use(mockReq() as Request, res as Response, next);
    jest.advanceTimersByTime(1001);
    expect(status).not.toHaveBeenCalled();
  });

  it('uses default timeout of 5000ms', () => {
    const mw = new TimeoutMiddleware();
    const next = jest.fn();
    const { res, status, json } = mockRes();
    (res as any).headersSent = false;
    mw.use(mockReq() as Request, res as Response, next);
    jest.advanceTimersByTime(4999);
    expect(status).not.toHaveBeenCalled();
    jest.advanceTimersByTime(2);
    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalled();
  });
});
