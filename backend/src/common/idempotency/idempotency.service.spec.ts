import { Test, TestingModule } from '@nestjs/testing';
import { IdempotencyService } from './idempotency.service';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

/**
 * Mock Redis client that simulates SET NX, GET, SET, DEL, and EXPIRE.
 */
function createMockRedis() {
  const store = new Map<string, string>();
  const ttls = new Map<string, number>();

  return {
    store,
    ttls,
    set: jest.fn(
      async (
        key: string,
        value: string,
        ...args: string[]
      ): Promise<string | null> => {
        const nx = args.includes('NX');
        const exIdx = args.indexOf('EX');
        const ttl = exIdx !== -1 ? parseInt(args[exIdx + 1], 10) : undefined;

        if (nx && store.has(key)) {
          return null; // NX: key already exists
        }
        store.set(key, value);
        if (ttl) ttls.set(key, ttl);
        return 'OK';
      },
    ) as any,
    get: jest.fn(async (key: string): Promise<string | null> => {
      return store.get(key) ?? null;
    }) as any,
    del: jest.fn(async (key: string): Promise<number> => {
      const existed = store.has(key);
      store.delete(key);
      ttls.delete(key);
      return existed ? 1 : 0;
    }) as any,
    // Helper to simulate TTL expiry by removing the key
    expire: jest.fn(async (_key: string, _ttl: number): Promise<number> => 1) as any,
  };
}

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let redis: ReturnType<typeof createMockRedis>;

  beforeEach(async () => {
    redis = createMockRedis();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotencyService,
        { provide: REDIS_CLIENT, useValue: redis },
      ],
    }).compile();

    service = module.get<IdempotencyService>(IdempotencyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // First request (no prior state)
  // ─────────────────────────────────────────────────────────────────────────────

  describe('first request', () => {
    it('should execute the function and return result with duplicate=false', async () => {
      const fn = async () => ({ score: 100 });

      const result = await service.execute('key-1', fn);

      expect(result.duplicate).toBe(false);
      expect(result.data).toEqual({ score: 100 });
      // Lock acquired (SET NX)
      expect(redis.set).toHaveBeenCalledWith(
        'idempotency:lock:key-1',
        '1',
        'EX',
        expect.any(Number),
        'NX',
      );
      // Result stored
      expect(redis.set).toHaveBeenCalledWith(
        'idempotency:result:key-1',
        JSON.stringify({ score: 100 }),
        'EX',
        expect.any(Number),
      );
    });

    it('should release the lock after execution', async () => {
      const fn = async () => 'done';

      await service.execute('key-2', fn);

      expect(redis.del).toHaveBeenCalledWith('idempotency:lock:key-2');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Duplicate request (result already cached)
  // ─────────────────────────────────────────────────────────────────────────────

  describe('duplicate request (cached result)', () => {
    it('should return the cached result with duplicate=true without re-executing', async () => {
      // Pre-populate the result cache
      redis.store.set(
        'idempotency:result:key-3',
        JSON.stringify({ score: 200 }),
      );

      const fn = jest.fn() as unknown as () => Promise<unknown>;

      const result = await service.execute('key-3', fn);

      expect(result.duplicate).toBe(true);
      expect(result.data).toEqual({ score: 200 });
      // Function should NOT have been called
      expect(fn).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Lock contention (concurrent in-flight request)
  // ─────────────────────────────────────────────────────────────────────────────

  describe('lock contention', () => {
    it('should wait for a concurrent request to finish and return its cached result', async () => {
      // Simulate: lock is held, then result appears after a delay
      redis.store.set('idempotency:lock:key-4', '1');
      const fn = jest.fn() as unknown as () => Promise<unknown>;

      // After 2 retries (100ms), the result should appear
      let callCount = 0;
      redis.get.mockImplementation(async (key: string) => {
        if (key === 'idempotency:result:key-4') {
          callCount++;
          if (callCount >= 3) {
            return JSON.stringify({ score: 300 });
          }
        }
        return redis.store.get(key) ?? null;
      });

      const result = await service.execute('key-4', fn);

      expect(result.duplicate).toBe(true);
      expect(result.data).toEqual({ score: 300 });
      expect(fn).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Function throws an error
  // ─────────────────────────────────────────────────────────────────────────────

  describe('function throws', () => {
    it('should release the lock and not cache the error', async () => {
      const fn = async () => {
        throw new Error('boom');
      };

      await expect(service.execute('key-5', fn)).rejects.toThrow('boom');

      // Lock should have been released
      expect(redis.del).toHaveBeenCalledWith('idempotency:lock:key-5');
      // No result should have been cached
      expect(redis.store.has('idempotency:result:key-5')).toBe(false);
    });

    it('should allow retrying after a failed attempt', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        if (callCount === 1) throw new Error('transient');
        return { score: 50 };
      };

      // First attempt fails
      await expect(service.execute('key-6', fn)).rejects.toThrow('transient');

      // Second attempt should succeed (lock was released)
      const result = await service.execute('key-6', fn);
      expect(result.duplicate).toBe(false);
      expect(result.data).toEqual({ score: 50 });
      expect(callCount).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Custom TTL
  // ─────────────────────────────────────────────────────────────────────────────

  describe('custom TTL', () => {
    it('should use the provided TTL for the result cache', async () => {
      const fn = async () => 'ok';

      await service.execute('key-7', fn, 3600);

      expect(redis.set).toHaveBeenCalledWith(
        'idempotency:result:key-7',
        JSON.stringify('ok'),
        'EX',
        3600,
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Lock held by dead request (timeout path)
  // ─────────────────────────────────────────────────────────────────────────────

  describe('dead lock owner', () => {
    it('should force-acquire the lock and execute after timeout when lock owner dies', async () => {
      // Simulate: lock held forever, never a result
      redis.store.set('idempotency:lock:key-8', '1');
      redis.get.mockImplementation(async (key: string) => {
        if (key === 'idempotency:result:key-8') return null;
        if (key === 'idempotency:lock:key-8') return '1';
        return redis.store.get(key) ?? null;
      });

      const fn = async () => ({ recovered: true });

      // This will retry MAX_RETRIES times then force-acquire
      const result = await service.execute('key-8', fn);

      expect(result.duplicate).toBe(false);
      expect(result.data).toEqual({ recovered: true });
    });
  });
});
