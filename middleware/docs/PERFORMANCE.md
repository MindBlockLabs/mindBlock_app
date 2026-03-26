# Middleware Performance

Last generated: pending benchmark execution

Benchmarks use a 2 second warmup and 10 second measured run per middleware. Overhead is calculated as `middleware_p99 - baseline_p99`.

The benchmark harness lives in `benchmarks/middleware/` and writes this file when `npm run benchmark:middleware` completes successfully.

| Middleware | Source | Baseline p99 (ms) | Middleware p99 (ms) | Overhead p99 (ms) | p95 (ms) | p50 (ms) | Requests | Status Codes | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |
| JwtAuthMiddleware | `src/auth/jwt-auth.middleware.ts` | pending | pending | pending | pending | pending | pending | `pending` | Waiting for benchmark execution in a workspace with installed dependencies. |
| TimeoutMiddleware | `src/middleware/advanced/timeout.middleware.ts` | pending | pending | pending | pending | pending | pending | `pending` | Waiting for benchmark execution in a workspace with installed dependencies. |
| CircuitBreakerMiddleware | `src/middleware/advanced/circuit-breaker.middleware.ts` | pending | pending | pending | pending | pending | pending | `pending` | Waiting for benchmark execution in a workspace with installed dependencies. |
