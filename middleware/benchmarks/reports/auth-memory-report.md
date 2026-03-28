
# Memory Test Report: JWT Auth Middleware
## Test Configuration
- Requests: 10000
- Duration: 0.08s
- Requests/sec: 129386.53

## Memory Snapshots
| Phase | Heap Used (MB) | RSS (MB) |
|-------|---------------|----------|
| Baseline | 4.90 | 32.79 |
| After Warmup | 5.53 | 47.07 |
| After Load Test | 6.00 | 44.16 |
| After GC | 5.59 | 44.00 |

## Memory Changes
| Phase | Heap Growth (MB) | Heap Growth (%) | RSS Growth (MB) |
|-------|------------------|-----------------|-----------------|
| Warmup | 0.63 | 12.87 | 14.28 |
| Load Test | 0.48 | 8.61 | -2.91 |
| Total | 0.70 | 14.25 | 11.21 |

## Leak Detection
**Status:** ✅ NO LEAK

