import { Inject, Injectable, Logger } from '@nestjs/common';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import Redis from 'ioredis';

/** Default TTL for idempotency keys (24 hours). */
const DEFAULT_TTL_SECONDS = 86_400;

/** How long a pending lock can live before we consider the original request dead. */
const LOCK_TTL_SECONDS = 60;

/** How often to retry when a lock is held by another in-flight request. */
const RETRY_DELAY_MS = 50;

/** Maximum number of retries when waiting for a concurrent request to finish. */
const MAX_RETRIES = 20;

export interface IdempotencyResult<T> {
  /** Whether this is a replayed request (cached result returned). */
  duplicate: boolean;
  /** The result — either freshly computed or the cached original. */
  data: T;
}

/**
 * Provides idempotency guarantees for write operations by storing a
 * per-key lock in Redis and caching the result of the first request.
 *
 * ## Protocol
 *
 * 1. Caller calls `execute(key, fn)`.
 * 2. If a cached result already exists → return it (`duplicate: true`).
 * 3. Attempt to acquire the lock (Redis SETNX). If acquired → run `fn`,
 *    store the result, release the lock, return (`duplicate: false`).
 * 4. If the lock is held by another in-flight request → poll until the
 *    result appears (retry loop) or the lock expires.
 *
 * This handles double-clicks, network retries, browser refreshes, and
 * malicious duplicate requests.
 */
@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Execute a function with idempotency guarantees.
   *
   * @param key    A unique idempotency key (e.g. from the client or derived from the request).
   * @param fn     The function to execute if this is the first request with this key.
   * @param ttl    TTL in seconds for both the lock and the cached result (default 24h).
   */
  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = DEFAULT_TTL_SECONDS,
  ): Promise<IdempotencyResult<T>> {
    const lockKey = `idempotency:lock:${key}`;
    const resultKey = `idempotency:result:${key}`;

    // 1. Check if a cached result already exists.
    const cached = await this.redis.get(resultKey);
    if (cached) {
      this.logger.debug(`Idempotency hit for key: ${key}`);
      return { duplicate: true, data: JSON.parse(cached) as T };
    }

    // 2. Try to acquire the lock atomically.
    const acquired = await this.redis.set(
      lockKey,
      '1',
      'EX',
      LOCK_TTL_SECONDS,
      'NX',
    );

    if (acquired === 'OK') {
      // We won the race — execute the function.
      try {
        const result = await fn();
        // Store the result with the longer TTL.
        await this.redis.set(resultKey, JSON.stringify(result), 'EX', ttl);
        return { duplicate: false, data: result };
      } finally {
        // Always release the lock so future requests can proceed
        // (even if the function threw — we don't cache errors).
        await this.redis.del(lockKey);
      }
    }

    // 3. Another request holds the lock — wait for its result to appear.
    this.logger.debug(
      `Lock contention for key: ${key}, waiting for result...`,
    );

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      await this.delay(RETRY_DELAY_MS);

      const result = await this.redis.get(resultKey);
      if (result) {
        return { duplicate: true, data: JSON.parse(result) as T };
      }

      // Also check if the lock was released without storing a result
      // (i.e. the other request failed). In that case, try to acquire
      // the lock ourselves.
      const lockStillHeld = await this.redis.get(lockKey);
      if (!lockStillHeld) {
        // Lock gone, no result stored — the previous request failed.
        // Recurse to try again from scratch.
        return this.execute(key, fn, ttl);
      }
    }

    // 4. Timed out waiting. The lock holder may have crashed.
    // Try to acquire the lock one more time and execute ourselves.
    this.logger.warn(
      `Timed out waiting for lock on key: ${key}. Force-acquiring.`,
    );
    await this.redis.del(lockKey);

    const result = await fn();
    await this.redis.set(resultKey, JSON.stringify(result), 'EX', ttl);
    return { duplicate: false, data: result };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
