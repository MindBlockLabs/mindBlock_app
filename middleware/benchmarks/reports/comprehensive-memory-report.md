# Comprehensive Middleware Memory Leak Report

**Generated:** 2026-03-28T22:08:02.362Z
**Total Duration:** 17.54s
**Tests Run:** 5

## Summary

| Middleware | Status | Leak Detected | Heap Growth (MB) | Requests/sec |
|------------|---------|---------------|------------------|-------------|
| JWT Auth Middleware | ✅ Passed | ✅ No | N/A | 129386.53 |
| Correlation ID Middleware | ❌ Failed | - | - | - |
| Idempotency Middleware | ✅ Passed | ✅ No | N/A | 72556.78 |
| Security Headers Middleware | ✅ Passed | ✅ No | N/A | 94276.74 |
| Circuit Breaker Middleware | ✅ Passed | 🚨 Yes | 1.54 | 5667.13 |

## Detailed Results

### JWT Auth Middleware

**Status:** ✅ Passed
**Leak Detected:** ✅ No
**Requests:** 10000
**Duration:** 0.08s
**Requests/sec:** 129386.53

**Memory Snapshots:**
- Baseline: 4.90 MB
- After Load Test: 6.00 MB
- Final: 5.59 MB

---

### Correlation ID Middleware

**Status:** ❌ Failed
**Error:** req.header is not a function

### Idempotency Middleware

**Status:** ✅ Passed
**Leak Detected:** ✅ No
**Requests:** 10000
**Duration:** 0.14s
**Requests/sec:** 72556.78

**Memory Snapshots:**
- Baseline: 5.31 MB
- After Load Test: 11.40 MB
- Final: 5.21 MB

---

### Security Headers Middleware

**Status:** ✅ Passed
**Leak Detected:** ✅ No
**Requests:** 10000
**Duration:** 0.11s
**Requests/sec:** 94276.74

**Memory Snapshots:**
- Baseline: 5.75 MB
- After Load Test: 6.06 MB
- Final: 5.42 MB

---

### Circuit Breaker Middleware

**Status:** ✅ Passed
**Leak Detected:** 🚨 Yes
**Requests:** 10000
**Duration:** 1.76s
**Requests/sec:** 5667.13
**Heap Growth:** 1.54 MB (25.86%)

**Memory Snapshots:**
- Baseline: 5.96 MB
- After Load Test: 19.60 MB
- Final: 7.50 MB

---

## Recommendations

### 🚨 Memory Leaks Found

- **Circuit Breaker Middleware**: Shows memory growth after 10k requests. Review the middleware implementation for:
  - Unclosed event listeners
  - Growing caches or collections
  - Closure references
  - Timer references

### ❌ Failed Tests

- **Correlation ID Middleware**: Test execution failed with error: req.header is not a function

## Cleanup Requirements

The following middleware require manual cleanup:

- **Correlation ID Middleware**: Call cleanup() method to clear old correlation entries
- **Idempotency Middleware**: Call cleanup() method to clear expired cache entries
- **Circuit Breaker Middleware**: Call cleanup() method to clear request history

### Automated Cleanup

Consider implementing automated cleanup intervals:

```javascript
// Example: Cleanup every 5 minutes
setInterval(() => {
  correlationMiddleware.cleanup();
  idempotencyMiddleware.cleanup();
  circuitBreakerMiddleware.cleanup();
}, 5 * 60 * 1000);
```

