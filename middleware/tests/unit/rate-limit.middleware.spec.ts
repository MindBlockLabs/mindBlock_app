import { Request } from 'express';
import {
  createRateLimitTier,
  RateLimitMiddleware,
  RateLimitStore,
} from '../../src/security/rate-limit.middleware';
import { createMiddlewareTestContext } from '../utils/mock-express';

describe('RateLimitMiddleware', () => {
  const tiers = [
    createRateLimitTier('auth', 5, 15 * 60 * 1000, {
      methods: ['POST'],
      pathPatterns: ['/auth/**'],
    }),
    createRateLimitTier('puzzle-submit', 30, 60 * 60 * 1000, {
      methods: ['POST'],
      pathPatterns: ['/progress/submit'],
    }),
    createRateLimitTier('daily-quest-generate', 2, 24 * 60 * 60 * 1000, {
      methods: ['GET'],
      pathPatterns: ['/daily-quest'],
    }),
    createRateLimitTier('read-only', 300, 60 * 60 * 1000, {
      methods: ['GET'],
      pathPatterns: ['/**'],
    }),
  ];

  it('applies user-based keys when an authenticated user exists', async () => {
    const evalMock = jest.fn().mockResolvedValue([1, 29, 0, 1_710_000_000_000, 1_700_000_000_000]);
    const store: RateLimitStore = { eval: evalMock };
    const middleware = new RateLimitMiddleware({ store, tiers });
    const { req, res, next } = createMiddlewareTestContext({
      req: {
        method: 'POST',
        path: '/progress/submit',
      },
    });

    ((req as unknown) as Request & { user?: Record<string, string> }).user = {
      userId: 'user-123',
    };

    await middleware.use(req as unknown as Request, res as any, next);

    expect(evalMock).toHaveBeenCalled();
    expect(String(evalMock.mock.calls[0][2])).toContain(
      'ratelimit:puzzle-submit:user:user-123',
    );
    expect(res.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '30');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 429 with headers when the request is throttled', async () => {
    const store: RateLimitStore = {
      eval: jest.fn().mockResolvedValue([0, 0, 12_000, 1_710_000_012_000, 1_700_000_000_000]),
    };
    const middleware = new RateLimitMiddleware({ store, tiers });
    const { req, res, next } = createMiddlewareTestContext({
      req: {
        method: 'POST',
        path: '/auth/signIn',
      },
    });

    await middleware.use(req as unknown as Request, res as any, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 429,
        errorCode: 'RATE_LIMIT_EXCEEDED',
      }),
    );
    expect(res.setHeader).toHaveBeenCalledWith('Retry-After', '12');
    expect(next).not.toHaveBeenCalled();
  });

  it('bypasses whitelisted IPs', async () => {
    const store: RateLimitStore = {
      eval: jest.fn(),
    };
    const middleware = new RateLimitMiddleware({
      store,
      tiers,
      whitelistIps: ['127.0.0.1'],
    });
    const { req, res, next } = createMiddlewareTestContext({
      req: {
        method: 'POST',
        path: '/auth/signIn',
        headers: {
          'x-forwarded-for': '127.0.0.1',
        },
      },
    });

    await middleware.use(req as unknown as Request, res as any, next);

    expect(store.eval).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('fails open when Redis is unavailable', async () => {
    const store: RateLimitStore = {
      eval: jest.fn().mockRejectedValue(new Error('redis offline')),
    };
    const onStoreError = jest.fn();
    const middleware = new RateLimitMiddleware({
      store,
      tiers,
      onStoreError,
    });
    const { req, next } = createMiddlewareTestContext({
      req: {
        method: 'GET',
        path: '/puzzles',
      },
    });

    await middleware.use(req as unknown as Request, {} as any, next);

    expect(onStoreError).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
