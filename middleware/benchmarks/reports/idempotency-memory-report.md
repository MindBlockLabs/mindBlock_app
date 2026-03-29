
# Memory Test Report: Idempotency Middleware
## Test Configuration
- Requests: 10000
- Duration: 0.14s
- Requests/sec: 72556.78

## Memory Snapshots
| Phase | Heap Used (MB) | RSS (MB) |
|-------|---------------|----------|
| Baseline | 5.31 | 49.45 |
| After Warmup | 5.35 | 85.25 |
| After Load Test | 11.40 | 98.13 |
| After GC | 5.21 | 110.24 |

## Memory Changes
| Phase | Heap Growth (MB) | Heap Growth (%) | RSS Growth (MB) |
|-------|------------------|-----------------|-----------------|
| Warmup | 0.03 | 0.65 | 35.80 |
| Load Test | 6.05 | 113.26 | 12.88 |
| Total | -0.10 | -1.90 | 60.79 |

## Leak Detection
**Status:** ✅ NO LEAK

