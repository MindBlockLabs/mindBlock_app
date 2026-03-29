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

  it('supports exact string patterns', () => {
    const wrapped = onlyFor(middleware as unknown as MiddlewareFn, ['/api/users']);
    wrapped(mockReq('/api/users') as Request, mockRes() as Response, next);
    expect(middleware).toHaveBeenCalledTimes(1);
  });

  it('does not run middleware for non-matching exact string', () => {
    const wrapped = onlyFor(middleware as unknown as MiddlewareFn, ['/api/users']);
    wrapped(mockReq('/api/posts') as Request, mockRes() as Response, next);
    expect(middleware).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not run middleware when glob pattern does not match', () => {
    const wrapped = onlyFor(middleware as unknown as MiddlewareFn, ['/api/**']);
    wrapped(mockReq('/admin/dashboard') as Request, mockRes() as Response, next);
    expect(middleware).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not run middleware when regex pattern does not match', () => {
    const wrapped = onlyFor(middleware as unknown as MiddlewareFn, [/^\/admin/]);
    wrapped(mockReq('/user/profile') as Request, mockRes() as Response, next);
    expect(middleware).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('handles multiple patterns with mixed types', () => {
    const wrapped = onlyFor(middleware as unknown as MiddlewareFn, [
      '/health',
      /^\/api\/v1/,
      '/admin/**',
    ]);
    wrapped(mockReq('/health') as Request, mockRes() as Response, next);
    expect(middleware).toHaveBeenCalledTimes(1);
    
    middleware.mockClear();
    next.mockClear();
    
    wrapped(mockReq('/api/v1/users') as Request, mockRes() as Response, next);
    expect(middleware).toHaveBeenCalledTimes(1);
    
    middleware.mockClear();
    next.mockClear();
    
    wrapped(mockReq('/admin/settings/general') as Request, mockRes() as Response, next);
    expect(middleware).toHaveBeenCalledTimes(1);
    
    middleware.mockClear();
    next.mockClear();
    
    wrapped(mockReq('/public/assets') as Request, mockRes() as Response, next);
    expect(middleware).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('Pattern Matching - Cross-Functional Tests', () => {
  let middleware: jest.Mock;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = jest.fn((_req, _res, n) => n());
    next = jest.fn();
  });

  it('both unless() and onlyFor() handle nested paths with glob patterns', () => {
    const unlessWrapped = unless(middleware as unknown as MiddlewareFn, ['/api/**/internal']);
    const onlyForWrapped = onlyFor(middleware as unknown as MiddlewareFn, ['/api/**/internal']);

    // unless should skip for nested paths matching the pattern
    unlessWrapped(mockReq('/api/v1/internal') as Request, mockRes() as Response, next);
    expect(middleware).not.toHaveBeenCalled();

    middleware.mockClear();
    next.mockClear();

    // onlyFor should run for matching nested paths
    onlyForWrapped(mockReq('/api/v1/internal') as Request, mockRes() as Response, next);
    expect(middleware).toHaveBeenCalledTimes(1);
  });

  it('both unless() and onlyFor() handle complex patterns correctly', () => {
    const patterns = ['/api/v[12]/**', /^\/admin/, '/health'];
    const unlessWrapped = unless(middleware as unknown as MiddlewareFn, patterns);
    const onlyForWrapped = onlyFor(middleware as unknown as MiddlewareFn, patterns);

    // Test with glob v1
    unlessWrapped(mockReq('/api/v1/users') as Request, mockRes() as Response, next);
    expect(middleware).not.toHaveBeenCalled();

    middleware.mockClear();
    next.mockClear();

    // Test with glob v2
    unlessWrapped(mockReq('/api/v2/posts') as Request, mockRes() as Response, next);
    expect(middleware).not.toHaveBeenCalled();

    middleware.mockClear();
    next.mockClear();

    // Test onlyFor with regex
    onlyForWrapped(mockReq('/admin/dashboard') as Request, mockRes() as Response, next);
    expect(middleware).toHaveBeenCalledTimes(1);
  });
});
