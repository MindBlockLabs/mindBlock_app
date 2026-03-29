import { Inject, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';

interface RateLimitTier {
  name: string;
  limit: number;
  windowMs: number;
  burstAllowance: number;
  methods?: string[];
  match: (req: Request) => boolean;
}

interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  resetAtMs: number;
  nowMs: number;
}

const TOKEN_BUCKET_LUA = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_per_ms = tonumber(ARGV[2])
local requested = tonumber(ARGV[3])
local ttl_ms = tonumber(ARGV[4])

local time = redis.call('TIME')
local now_ms = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local values = redis.call('HMGET', key, 'tokens', 'last')

local tokens = tonumber(values[1])
local last = tonumber(values[2])

if not tokens or not last then
  tokens = capacity
  last = now_ms
end

if now_ms > last then
  local replenished = (now_ms - last) * refill_per_ms
  tokens = math.min(capacity, tokens + replenished)
  last = now_ms
end

local allowed = 0
local retry_after_ms = 0

if tokens >= requested then
  allowed = 1
  tokens = tokens - requested
else
  retry_after_ms = math.ceil((requested - tokens) / refill_per_ms)
end

redis.call('HMSET', key, 'tokens', tokens, 'last', last)
redis.call('PEXPIRE', key, ttl_ms)

local remaining = math.floor(tokens)
local reset_at_ms = now_ms + math.ceil((capacity - tokens) / refill_per_ms)

return { allowed, remaining, retry_after_ms, reset_at_ms, now_ms }
`;

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);
  private readonly whitelistIps: string[];
  private readonly tiers: RateLimitTier[];

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
    private readonly configService: ConfigService,
  ) {
    this.whitelistIps = this.parseCsv(
      this.configService.get<string>('RATE_LIMIT_WHITELIST_IPS'),
    );
    this.tiers = this.createTiers();
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const tier = this.tiers.find((candidate) => candidate.match(req));
    if (!tier) {
      return next();
    }

    const ip = this.getClientIp(req);
    if (this.whitelistIps.includes(ip)) {
      return next();
    }

    const userId = this.getUserId(req);
    const identity = userId ? `user:${userId}` : `ip:${ip}`;
    const key = `ratelimit:${tier.name}:${identity}`;

    try {
      const decision = await this.consumeRateLimit(key, tier);

      res.setHeader('X-RateLimit-Limit', String(tier.limit));
      res.setHeader(
        'X-RateLimit-Remaining',
        String(Math.max(0, Math.min(tier.limit, decision.remaining))),
      );
      res.setHeader(
        'X-RateLimit-Reset',
        String(Math.ceil(decision.resetAtMs / 1000)),
      );

      if (decision.allowed) {
        return next();
      }

      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(decision.retryAfterMs / 1000),
      );

      res.setHeader('Retry-After', String(retryAfterSeconds));

      this.logger.warn(
        `Rate limit violation tier=${tier.name} identity=${identity} method=${req.method} path=${req.path} retry_after_ms=${decision.retryAfterMs}`,
      );

      res.status(429).json({
        statusCode: 429,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded for ${tier.name}. Please retry later.`,
        correlationId: (req as Request & { correlationId?: string }).correlationId,
        timestamp: new Date(decision.nowMs).toISOString(),
        path: req.originalUrl || req.url,
      });
      return;
    } catch (error) {
      this.logger.error(
        `Rate limit store failure on ${req.method} ${req.path}: ${error instanceof Error ? error.message : String(error)}`,
      );
      next();
    }
  }

  private async consumeRateLimit(
    key: string,
    tier: RateLimitTier,
  ): Promise<RateLimitDecision> {
    const capacity = tier.limit + tier.burstAllowance;
    const refillPerMs = tier.limit / tier.windowMs;
    const ttlMs = Math.max(tier.windowMs * 2, 60_000);

    const raw = (await this.redisClient.eval(
      TOKEN_BUCKET_LUA,
      1,
      key,
      capacity,
      refillPerMs,
      1,
      ttlMs,
    )) as [number, number, number, number, number];

    const [allowed, remaining, retryAfterMs, resetAtMs, nowMs] = raw.map(
      Number,
    ) as [number, number, number, number, number];

    return {
      allowed: allowed === 1,
      remaining,
      retryAfterMs,
      resetAtMs,
      nowMs,
    };
  }

  private createTiers(): RateLimitTier[] {
    return [
      {
        name: 'auth',
        limit: this.getNumber('RATE_LIMIT_AUTH_LIMIT', 5),
        windowMs: this.getNumber('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000),
        burstAllowance: this.getNumber('RATE_LIMIT_AUTH_BURST', 0),
        methods: ['POST'],
        match: (req) =>
          req.method === 'POST' &&
          this.matchesAny(req.path, [
            '/auth/signIn',
            '/auth/refreshToken',
            '/auth/stellar-wallet-login',
            '/auth/google-authentication',
            '/auth/forgot-password',
            '/auth/reset-password/',
          ]),
      },
      {
        name: 'puzzle-submit',
        limit: this.getNumber('RATE_LIMIT_PUZZLE_SUBMIT_LIMIT', 30),
        windowMs: this.getNumber(
          'RATE_LIMIT_PUZZLE_SUBMIT_WINDOW_MS',
          60 * 60 * 1000,
        ),
        burstAllowance: this.getNumber('RATE_LIMIT_PUZZLE_SUBMIT_BURST', 0),
        methods: ['POST'],
        match: (req) => req.method === 'POST' && req.path === '/progress/submit',
      },
      {
        name: 'daily-quest-generate',
        limit: this.getNumber('RATE_LIMIT_DAILY_QUEST_LIMIT', 2),
        windowMs: this.getNumber(
          'RATE_LIMIT_DAILY_QUEST_WINDOW_MS',
          24 * 60 * 60 * 1000,
        ),
        burstAllowance: this.getNumber('RATE_LIMIT_DAILY_QUEST_BURST', 0),
        methods: ['GET'],
        match: (req) => req.method === 'GET' && req.path === '/daily-quest',
      },
      {
        name: 'admin',
        limit: this.getNumber('RATE_LIMIT_ADMIN_LIMIT', 1000),
        windowMs: this.getNumber('RATE_LIMIT_ADMIN_WINDOW_MS', 60 * 60 * 1000),
        burstAllowance: this.getNumber('RATE_LIMIT_ADMIN_BURST', 0),
        match: (req) => req.path.startsWith('/admin/'),
      },
      {
        name: 'public-landing',
        limit: this.getNumber('RATE_LIMIT_PUBLIC_LIMIT', 1000),
        windowMs: this.getNumber(
          'RATE_LIMIT_PUBLIC_WINDOW_MS',
          60 * 60 * 1000,
        ),
        burstAllowance: this.getNumber('RATE_LIMIT_PUBLIC_BURST', 0),
        methods: ['GET'],
        match: (req) => req.method === 'GET' && req.path === '/',
      },
      {
        name: 'read-only',
        limit: this.getNumber('RATE_LIMIT_READ_LIMIT', 300),
        windowMs: this.getNumber('RATE_LIMIT_READ_WINDOW_MS', 60 * 60 * 1000),
        burstAllowance: this.getNumber('RATE_LIMIT_READ_BURST', 0),
        match: (req) =>
          ['GET', 'HEAD'].includes(req.method) &&
          req.path !== '/' &&
          req.path !== '/daily-quest' &&
          !req.path.startsWith('/admin/') &&
          !req.path.startsWith('/health') &&
          !req.path.startsWith('/api') &&
          !req.path.startsWith('/docs'),
      },
    ];
  }

  private matchesAny(path: string, prefixes: string[]): boolean {
    return prefixes.some(
      (prefix) => path === prefix || path.startsWith(prefix),
    );
  }

  private getUserId(req: Request): string | undefined {
    const user = (req as Request & {
      user?: { userId?: string | number; sub?: string | number; id?: string | number };
    }).user;

    const candidate = user?.userId ?? user?.sub ?? user?.id;
    return candidate !== undefined ? String(candidate) : undefined;
  }

  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0].trim();
    }

    if (Array.isArray(forwarded) && forwarded.length > 0) {
      return forwarded[0].split(',')[0].trim();
    }

    return (
      req.ip ||
      req.socket?.remoteAddress ||
      (req as Request & { connection?: { remoteAddress?: string } }).connection
        ?.remoteAddress ||
      'unknown'
    );
  }

  private getNumber(key: string, fallback: number): number {
    const value = Number(this.configService.get<string>(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }

  private parseCsv(value?: string): string[] {
    if (!value) {
      return [];
    }

    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
}
