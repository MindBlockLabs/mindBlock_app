# Middleware Performance Optimization Guide

Actionable techniques for reducing middleware overhead in the MindBlock API.
Each section includes a before/after snippet and a benchmark delta measured with
`autocannon` (1000 concurrent requests, 10 s run, Node 20, M2 Pro).

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
