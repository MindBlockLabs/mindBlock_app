
# Memory Test Report: Circuit Breaker Middleware
## Test Configuration
- Requests: 10000
- Duration: 1.76s
- Requests/sec: 5667.13

## Memory Snapshots
| Phase | Heap Used (MB) | RSS (MB) |
|-------|---------------|----------|
| Baseline | 5.96 | 58.66 |
| After Warmup | 5.70 | 86.81 |
| After Load Test | 19.60 | 120.97 |
| After GC | 7.50 | 128.81 |

## Memory Changes
| Phase | Heap Growth (MB) | Heap Growth (%) | RSS Growth (MB) |
|-------|------------------|-----------------|-----------------|
| Warmup | -0.25 | -4.27 | 28.15 |
| Load Test | 13.90 | 243.65 | 34.16 |
| Total | 1.54 | 25.86 | 70.16 |

## Leak Detection
**Status:** 🚨 LEAK DETECTED

### Leak Details
- Heap Growth: 1.54 MB (25.86%)
- Stabilization Attempts: 3

