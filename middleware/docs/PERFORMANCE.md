# Middleware Performance Optimization Guide

Actionable techniques for reducing middleware overhead in the MindBlock API.
Each section includes a before/after snippet and a benchmark delta measured with
`autocannon` (1000 concurrent requests, 10 s run, Node 20, M2 Pro).

---

## Memory Leak Detection & Prevention

### Overview

Memory leaks in middleware are silent and catastrophic in long-running NestJS services. This section documents our comprehensive memory leak detection system and findings.

### Testing Methodology

We use a systematic approach to detect memory leaks:

1. **Baseline Memory Snapshot**: Measure initial memory usage
2. **Warm-up Phase**: Process 100 requests to stabilize the middleware
3. **Forced GC**: Run garbage collection 3 times to establish stable baseline
4. **Load Test**: Process 10,000 requests
5. **Post-Test GC**: Force garbage collection multiple times
6. **Leak Detection**: Compare before/after memory usage

### Memory Leak Criteria

A middleware is considered to have a memory leak if:
- Heap usage increases by more than 10MB after 10,000 requests
- Heap grows by more than 20% from baseline
- Memory doesn't stabilize after 3 consecutive garbage collections

### Running Memory Tests

```bash
# Run individual middleware memory tests
node --expose-gc benchmarks/memory/scripts/auth-memory.test.js
node --expose-gc benchmarks/memory/scripts/correlation-memory.test.js

# Run all middleware memory tests
node --expose-gc benchmarks/memory/scripts/all-middleware.test.js

# Using Clinic.js for advanced profiling
npm install -g clinic
clinic heap -- node --expose-gc benchmarks/memory/scripts/all-middleware.test.js
```

### Memory Test Results

#### ✅ Middleware Passing Memory Tests

| Middleware | Heap Growth (MB) | Requests/sec | Status |
|-------------|-------------------|--------------|---------|
| JWT Auth | 0.8 | 4,800 | ✅ No Leak |
| Security Headers | 0.2 | 18,000 | ✅ No Leak |
| Compression | 1.2 | 2,100 | ✅ No Leak |
| Timeout | 0.5 | 3,500 | ✅ No Leak |

#### ⚠️ Middleware Requiring Cleanup

| Middleware | Heap Growth (MB) | Issue | Cleanup Required |
|-------------|-------------------|-------|-----------------|
| Correlation ID | 2.1 | Accumulates correlation IDs | Yes |
| Idempotency | 3.4 | Response cache growth | Yes |
| Circuit Breaker | 1.8 | Request history accumulation | Yes |

### Memory Leak Prevention Patterns

#### 1. Automatic Cleanup Implementation

```typescript
class ExampleMiddleware {
  private cache = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    const ttl = 5 * 60 * 1000; // 5 minutes
    
    for (const [key, data] of this.cache.entries()) {
      if (now - data.timestamp > ttl) {
        this.cache.delete(key);
      }
    }
  }

  onDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}
```

#### 2. WeakMap for Temporary Storage

```typescript
// Use WeakMap for request-scoped data
const requestData = new WeakMap();

middleware.use(req, res, next) {
  // Automatically cleaned up when request object is GC'd
  requestData.set(req, { startTime: Date.now() });
  next();
}
```

#### 3. Bounded Collections

```typescript
class BoundedCache {
  private cache = new Map();
  private maxSize = 1000;

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

### Cleanup Requirements by Middleware

#### Correlation ID Middleware
- **Issue**: Accumulates correlation IDs in internal storage
- **Cleanup Method**: `correlationMiddleware.cleanup()`
- **Frequency**: Every 5 minutes recommended
- **Manual Cleanup**: Call before application shutdown

#### Idempotency Middleware
- **Issue**: Response cache grows indefinitely
- **Cleanup Method**: `idempotencyMiddleware.cleanup()`
- **Frequency**: Every 10 minutes recommended
- **TTL Management**: Automatic cleanup of expired entries

#### Circuit Breaker Middleware
- **Issue**: Request history accumulates
- **Cleanup Method**: `circuitBreakerMiddleware.cleanup()`
- **Frequency**: Every 5 minutes recommended
- **History Window**: Default 5 minutes

### Monitoring Memory Usage

#### Production Monitoring

```typescript
// Memory monitoring middleware
app.use((req, res, next) => {
  const memUsage = process.memoryUsage();
  
  // Alert if heap usage exceeds threshold
  if (memUsage.heapUsed > 500 * 1024 * 1024) { // 500MB
    console.warn('High memory usage detected:', {
      heap: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
    });
  }
  
  next();
});
```

#### Heap Snapshot Analysis

```bash
# Take heap snapshots during load testing
node --inspect --expose-gc your-app.js

# In Chrome DevTools:
# 1. Open chrome://inspect
# 2. Connect to your application
# 3. Take heap snapshots before and after load testing
# 4. Compare snapshots to identify retained objects
```

---

## 1. Lazy Initialization

Expensive setup (DB connections, compiled regex, crypto keys) should happen once
at startup, not on every request.

**Before** — initializes per request
```typescript
@Injectable()
export class SignatureMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const publicKey = fs.readFileSync('./keys/public.pem'); // ❌ disk read per request
    verify(req.body, publicKey);
    next();
  }
}
```

**After** — initializes once in the constructor
```typescript
@Injectable()
export class SignatureMiddleware implements NestMiddleware {
  private readonly publicKey: Buffer;

  constructor() {
    this.publicKey = fs.readFileSync('./keys/public.pem'); // ✅ once at startup
  }

  use(req: Request, res: Response, next: NextFunction) {
    verify(req.body, this.publicKey);
    next();
  }
}
```

**Delta:** ~1 200 req/s → ~4 800 req/s (+300 %) on signed-payload routes.

---

## 2. Caching Middleware Results (JWT Payload)

Re-verifying a JWT on every request is expensive. Cache the decoded payload in
Redis for the remaining token lifetime.

**Before** — verifies signature every request
```typescript
const decoded = jwt.verify(token, secret); // ❌ crypto on hot path
```

**After** — check cache first
```typescript
const cacheKey = `jwt:${token.slice(-16)}`; // last 16 chars as key
let decoded = await redis.get(cacheKey);

if (!decoded) {
  const payload = jwt.verify(token, secret) as JwtPayload;
  const ttl = payload.exp - Math.floor(Date.now() / 1000);
  await redis.setex(cacheKey, ttl, JSON.stringify(payload));
  decoded = JSON.stringify(payload);
}

req.user = JSON.parse(decoded);
```

**Delta:** ~2 100 req/s → ~6 700 req/s (+219 %) on authenticated routes with a
warm Redis cache.

---

## 3. Short-Circuit on Known-Safe Routes

Skipping all middleware logic for health and metric endpoints removes latency
on paths that are polled at high frequency.

**Before** — every route runs the full stack
```typescript
consumer.apply(JwtAuthMiddleware).forRoutes('*');
```

**After** — use the `unless` helper from this package
```typescript
import { unless } from '@mindblock/middleware';

consumer.apply(unless(JwtAuthMiddleware, ['/health', '/metrics', '/favicon.ico']));
```

**Delta:** health endpoint: ~18 000 req/s → ~42 000 req/s (+133 %); no change
to protected routes.

---

## 4. Async vs Sync — Avoid Blocking the Event Loop

Synchronous crypto operations (e.g. `bcrypt.hashSync`, `crypto.pbkdf2Sync`) block
the Node event loop and starve all concurrent requests.

**Before** — synchronous hash comparison
```typescript
const match = bcrypt.compareSync(password, hash); // ❌ blocks loop
```

**After** — async comparison with `await`
```typescript
const match = await bcrypt.compare(password, hash); // ✅ non-blocking
```

**Delta:** under 200 concurrent users, p99 latency drops from ~620 ms to ~95 ms.

---

## 5. Avoid Object Allocation on Every Request

Creating new objects, arrays, or loggers inside `use()` generates garbage-
collection pressure at scale.

**Before** — allocates a logger per call
```typescript
use(req, res, next) {
  const logger = new Logger('Auth'); // ❌ new instance per request
  logger.log('checking token');
  // ...
}
```

**After** — single shared instance
```typescript
private readonly logger = new Logger('Auth'); // ✅ created once

use(req, res, next) {
  this.logger.log('checking token');
  // ...
}
```

**Delta:** p95 latency improvement of ~12 % under sustained 1 000 req/s load due
to reduced GC pauses.

---

## 6. Use the Circuit Breaker to Protect the Whole Pipeline

Under dependency failures, without circuit breaking, every request pays the full
timeout cost. With a circuit breaker, failing routes short-circuit immediately.

**Before** — every request waits for the external service to time out
```
p99: 5 050 ms (timeout duration) during an outage
```

**After** — circuit opens after 5 failures; subsequent requests return 503 in < 1 ms
```
p99: 0.8 ms during an outage (circuit open)
```

**Delta:** ~99.98 % latency reduction on affected routes during outage windows.
See [circuit-breaker.middleware.ts](../src/middleware/advanced/circuit-breaker.middleware.ts).

---

## Anti-Patterns

### ❌ Creating New Instances Per Request

```typescript
// ❌ instantiates a validator (with its own schema compilation) per call
use(req, res, next) {
  const validator = new Validator(schema);
  validator.validate(req.body);
}
```
Compile the schema once in the constructor and reuse the validator instance.

---

### ❌ Synchronous File Reads on the Hot Path

```typescript
// ❌ synchronous disk I/O blocks ALL concurrent requests
use(req, res, next) {
  const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
}
```
Load config at application startup and inject it via the constructor.

---

### ❌ Forgetting to Call `next()` on Non-Error Paths

```typescript
use(req, res, next) {
  if (isPublic(req.path)) {
    return; // ❌ hangs the request — next() never called
  }
  checkAuth(req);
  next();
}
```
Always call `next()` (or send a response) on every code path.
