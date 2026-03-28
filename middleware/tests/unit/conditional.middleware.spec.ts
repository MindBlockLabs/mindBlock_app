import { Request, Response, NextFunction } from 'express';
import { unless, onlyFor, MiddlewareFn } from '../../src/middleware/utils/conditional.middleware';

function mockReq(path: string): Partial<Request> {
  return { path } as Partial<Request>;
}

function mockRes(): Partial<Response> {
  return {} as Partial<Response>;
}

describe('unless()', () => {
  let middleware: jest.Mock;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = jest.fn((_req, _res, n) => n());
    next = jest.fn();
  });

  it('calls next() without running middleware for an exact match', () => {
    const wrapped = unless(middleware as unknown as MiddlewareFn, ['/health']);
    wrapped(mockReq('/health') as Request, mockRes() as Response, next);
    expect(middleware).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('runs middleware when path does not match', () => {
    const wrapped = unless(middleware as unknown as MiddlewareFn, ['/health']);
    wrapped(mockReq('/api/users') as Request, mockRes() as Response, next);
    expect(middleware).toHaveBeenCalledTimes(1);
  });

  it('supports regex patterns', () => {
    const wrapped = unless(middleware as unknown as MiddlewareFn, [/^\/public/]);
    wrapped(mockReq('/public/assets') as Request, mockRes() as Response, next);
    expect(middleware).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('supports glob patterns', () => {
    const wrapped = unless(middleware as unknown as MiddlewareFn, ['/api/**']);
    wrapped(mockReq('/api/v1/users') as Request, mockRes() as Response, next);
    expect(middleware).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('runs middleware when glob does not match', () => {
    const wrapped = unless(middleware as unknown as MiddlewareFn, ['/api/**']);
    wrapped(mockReq('/admin/settings') as Request, mockRes() as Response, next);
    expect(middleware).toHaveBeenCalledTimes(1);
  });

  it('handles multiple patterns', () => {
    const wrapped = unless(middleware as unknown as MiddlewareFn, ['/health', '/metrics']);
    wrapped(mockReq('/metrics') as Request, mockRes() as Response, next);
    expect(middleware).not.toHaveBeenCalled();
  });
});

describe('onlyFor()', () => {
  let middleware: jest.Mock;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = jest.fn((_req, _res, n) => n());
    next = jest.fn();
  });

  it('runs middleware for matching path', () => {
    const wrapped = onlyFor(middleware as unknown as MiddlewareFn, ['/api/**']);
    wrapped(mockReq('/api/users') as Request, mockRes() as Response, next);
    expect(middleware).toHaveBeenCalledTimes(1);
  });

  it('skips middleware for non-matching path', () => {
    const wrapped = onlyFor(middleware as unknown as MiddlewareFn, ['/api/**']);
    wrapped(mockReq('/health') as Request, mockRes() as Response, next);
    expect(middleware).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('supports regex patterns', () => {
    const wrapped = onlyFor(middleware as unknown as MiddlewareFn, [/^\/admin/]);
    wrapped(mockReq('/admin/users') as Request, mockRes() as Response, next);
    expect(middleware).toHaveBeenCalledTimes(1);
  });
});
