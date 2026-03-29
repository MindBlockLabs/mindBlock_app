import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import micromatch from 'micromatch';

export interface RateLimitStore {
  eval(
    script: string,
    numKeys: number,
    ...args: Array<string | number>
  ): Promise<unknown>;
}

export interface RateLimitRequestIdentity {
  key: string;
  userId?: string;
  ip: string;
}

export interface RateLimitTier {
  name: string;
  limit: number;
  windowMs: number;
  burstAllowance?: number;
  methods?: string[];
  pathPatterns?: Array<string | RegExp>;
  match?: (req: Request) => boolean;
  keyPrefix?: string;
}

export interface RateLimitMiddlewareOptions {
  store: RateLimitStore;
  tiers: RateLimitTier[];
  whitelistIps?: string[];
  trustProxy?: boolean;
  keyGenerator?: (req: Request) => RateLimitRequestIdentity;
  onViolation?: (context: RateLimitViolationContext) => void;
  onStoreError?: (error: unknown, req: Request, tier: RateLimitTier) => void;
  logger?: Pick<Logger, 'warn' | 'error' | 'log'>;
}

export interface RateLimitViolationContext {
  req: Request;
  tier: RateLimitTier;
  identity: RateLimitRequestIdentity;
  retryAfterMs: number;
  remaining: number;
  resetAtMs: number;
}

export interface RateLimitDecision {
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

const DEFAULT_LOGGER = new Logger('RateLimitMiddleware');

type RawEvalResult = [number, number, number, number, number];

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function matchesPattern(path: string, pattern: string | RegExp): boolean {
  if (pattern instanceof RegExp) {
    return pattern.test(path);
  }

  return micromatch.isMatch(path, pattern);
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(',')[0].trim();
  }

  return (
    req.ip ||
    (req.socket?.remoteAddress ?? '') ||
    (req.connection?.remoteAddress ?? '') ||
    'unknown'
  );
}

function getRequestUserId(req: Request): string | undefined {
  const user = (req as Request & { user?: Record<string, unknown> }).user;
  if (!user) {
    return undefined;
  }

  const candidates = [user.userId, user.sub, user.id];
  const firstValue = candidates.find(
    (candidate): candidate is string | number =>
      typeof candidate === 'string' || typeof candidate === 'number',
  );

  return firstValue !== undefined ? String(firstValue) : undefined;
}

function defaultKeyGenerator(req: Request): RateLimitRequestIdentity {
  const userId = getRequestUserId(req);
  const ip = getClientIp(req);

  if (userId) {
    return {
      key: `user:${userId}`,
      userId,
      ip,
    };
  }

  return {
    key: `ip:${ip}`,
    ip,
  };
}

function matchTier(req: Request, tiers: RateLimitTier[]): RateLimitTier | undefined {
  const method = req.method.toUpperCase();
  const path = normalizePath(req.path || req.url || '/');

  return tiers.find((tier) => {
    const methodsMatch =
      !tier.methods ||
      tier.methods.length === 0 ||
      tier.methods.some((tierMethod) => tierMethod.toUpperCase() === method);

    if (!methodsMatch) {
      return false;
    }

    if (tier.match && tier.match(req)) {
      return true;
    }

    if (!tier.pathPatterns || tier.pathPatterns.length === 0) {
      return false;
    }

    return tier.pathPatterns.some((pattern) => matchesPattern(path, pattern));
  });
}

function setRateLimitHeaders(
  res: Response,
  tier: RateLimitTier,
  remaining: number,
  resetAtMs: number,
): void {
  res.setHeader('X-RateLimit-Limit', String(tier.limit));
  res.setHeader(
    'X-RateLimit-Remaining',
    String(Math.max(0, Math.min(tier.limit, remaining))),
  );
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAtMs / 1000)));
}

function getExceededMessage(tier: RateLimitTier): string {
  return `Rate limit exceeded for ${tier.name}. Please retry later.`;
}

export async function consumeRateLimit(
  store: RateLimitStore,
  key: string,
  tier: RateLimitTier,
): Promise<RateLimitDecision> {
  const capacity = tier.limit + (tier.burstAllowance ?? 0);
  const refillPerMs = tier.limit / tier.windowMs;
  const ttlMs = Math.max(tier.windowMs * 2, 60_000);

  const raw = (await store.eval(
    TOKEN_BUCKET_LUA,
    1,
    key,
    capacity,
    refillPerMs,
    1,
    ttlMs,
  )) as RawEvalResult;

  const [allowed, remaining, retryAfterMs, resetAtMs, nowMs] = raw.map(Number) as RawEvalResult;

  return {
    allowed: allowed === 1,
    remaining,
    retryAfterMs,
    resetAtMs,
    nowMs,
  };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger: Pick<Logger, 'warn' | 'error' | 'log'>;

  constructor(private readonly options: RateLimitMiddlewareOptions) {
    this.logger = options.logger ?? DEFAULT_LOGGER;
  }

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const tier = matchTier(req, this.options.tiers);
    if (!tier) {
      return next();
    }

    const ip = getClientIp(req);
    if (this.options.whitelistIps?.includes(ip)) {
      return next();
    }

    const identity = (this.options.keyGenerator ?? defaultKeyGenerator)(req);
    const storageKey = `${tier.keyPrefix ?? 'ratelimit'}:${tier.name}:${identity.key}`;

    try {
      const decision = await consumeRateLimit(this.options.store, storageKey, tier);

      setRateLimitHeaders(res, tier, decision.remaining, decision.resetAtMs);

      if (decision.allowed) {
        return next();
      }

      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(decision.retryAfterMs / 1000),
      );

      res.setHeader('Retry-After', String(retryAfterSeconds));

      const violationContext: RateLimitViolationContext = {
        req,
        tier,
        identity,
        retryAfterMs: decision.retryAfterMs,
        remaining: decision.remaining,
        resetAtMs: decision.resetAtMs,
      };

      this.options.onViolation?.(violationContext);
      this.logger.warn(
        `Rate limit violation tier=${tier.name} key=${identity.key} ip=${identity.ip} path=${req.method} ${req.path} retry_after_ms=${decision.retryAfterMs}`,
      );

      res.status(429).json({
        statusCode: 429,
        errorCode: 'RATE_LIMIT_EXCEEDED',
        message: getExceededMessage(tier),
        timestamp: new Date(decision.nowMs).toISOString(),
        path: req.originalUrl || req.url,
      });
      return;
    } catch (error) {
      this.options.onStoreError?.(error, req, tier);
      this.logger.error(
        `Rate limit store failure on ${req.method} ${req.path}: ${error instanceof Error ? error.message : String(error)}`,
      );
      next();
    }
  }
}

export function createRateLimitTier(
  name: string,
  limit: number,
  windowMs: number,
  options: Omit<RateLimitTier, 'name' | 'limit' | 'windowMs'> = {},
): RateLimitTier {
  return {
    name,
    limit,
    windowMs,
    ...options,
  };
}

