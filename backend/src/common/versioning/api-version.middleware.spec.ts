import { BadRequestException, GoneException } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiVersionMiddleware } from './api-version.middleware';
import { ApiVersionService } from './api-version.service';

describe('ApiVersionMiddleware', () => {
  let middleware: ApiVersionMiddleware;

  beforeEach(() => {
    middleware = new ApiVersionMiddleware(new ApiVersionService());
  });

  it('rewrites unversioned versioned-resource URLs to the latest version', () => {
    const request = createRequest({
      path: '/api/puzzles',
      url: '/api/puzzles?page=1',
    });
    const next = jest.fn();

    middleware.use(request as Request, {} as Response, next);

    expect(request.url).toBe('/api/v2/puzzles?page=1');
    expect(request.apiVersionContext?.resolvedVersion).toBe('2');
    expect(request.apiVersionContext?.source).toBe('default');
    expect(next).toHaveBeenCalled();
  });

  it('accepts header-based version selection', () => {
    const request = createRequest({
      path: '/api/puzzles',
      url: '/api/puzzles',
      headers: { 'x-api-version': '1' },
    });
    const next = jest.fn();

    middleware.use(request as Request, {} as Response, next);

    expect(request.url).toBe('/api/v1/puzzles');
    expect(request.apiVersionContext?.resolvedVersion).toBe('1');
    expect(request.apiVersionContext?.source).toBe('header');
    expect(next).toHaveBeenCalled();
  });

  it('accepts query-based version selection', () => {
    const request = createRequest({
      path: '/api/puzzles',
      url: '/api/puzzles?api_version=1',
      query: { api_version: '1' },
    });
    const next = jest.fn();

    middleware.use(request as Request, {} as Response, next);

    expect(request.url).toBe('/api/v1/puzzles?api_version=1');
    expect(request.apiVersionContext?.resolvedVersion).toBe('1');
    expect(request.apiVersionContext?.source).toBe('query');
    expect(next).toHaveBeenCalled();
  });

  it('rejects conflicting version selectors', () => {
    const request = createRequest({
      path: '/api/puzzles',
      url: '/api/puzzles?api_version=2',
      headers: { 'x-api-version': '1' },
      query: { api_version: '2' },
    });

    expect(() =>
      middleware.use(request as Request, {} as Response, jest.fn()),
    ).toThrow(BadRequestException);
  });

  it('returns 410 for removed versions', () => {
    const request = createRequest({
      path: '/api/v0/puzzles',
      url: '/api/v0/puzzles',
    });

    expect(() =>
      middleware.use(request as Request, {} as Response, jest.fn()),
    ).toThrow(GoneException);
  });

  it('skips non-versioned resources', () => {
    const request = createRequest({
      path: '/api/auth/login',
      url: '/api/auth/login',
    });
    const next = jest.fn();

    middleware.use(request as Request, {} as Response, next);

    expect(request.apiVersionContext).toBeUndefined();
    expect(request.url).toBe('/api/auth/login');
    expect(next).toHaveBeenCalled();
  });
});

function createRequest(overrides: Partial<Request>): Partial<Request> {
  return {
    path: '/api/puzzles',
    url: '/api/puzzles',
    query: {},
    headers: {},
    ...overrides,
  };
}
