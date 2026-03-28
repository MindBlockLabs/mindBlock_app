# Memory Leak Detection Benchmarks

This directory contains memory leak detection utilities and benchmarks for all middleware components.

## Structure

```
benchmarks/memory/
├── README.md                    # This file
├── utils/
│   ├── memory-profiler.ts       # Core memory profiling utilities
│   ├── heap-snapshot.ts         # Heap snapshot comparison utility
│   └── test-runner.ts           # Generic test runner for middleware
├── scripts/
│   ├── auth-memory.test.ts      # JWT auth middleware memory test
│   ├── correlation-memory.test.ts # Correlation ID middleware memory test
│   ├── idempotency-memory.test.ts # Idempotency middleware memory test
│   ├── security-memory.test.ts  # Security headers middleware memory test
│   ├── compression-memory.test.ts # Compression middleware memory test
│   ├── circuit-breaker-memory.test.ts # Circuit breaker memory test
│   ├── timeout-memory.test.ts   # Timeout middleware memory test
│   └── all-middleware.test.ts   # Run all middleware memory tests
├── snapshots/                   # Heap snapshots directory
└── reports/                     # Generated memory reports
```

## Usage

### Running Individual Middleware Tests

```bash
# Test JWT Auth middleware memory usage
node --expose-gc dist/benchmarks/memory/scripts/auth-memory.test.js

# Test Correlation ID middleware memory usage
node --expose-gc dist/benchmarks/memory/scripts/correlation-memory.test.js
```

### Running All Middleware Tests

```bash
# Run all memory tests
node --expose-gc dist/benchmarks/memory/scripts/all-middleware.test.js
```

### Using Clinic.js for Advanced Profiling

```bash
# Install clinic.js if not already installed
npm install -g clinic

# Run heap profiling
clinic heap -- node dist/benchmarks/memory/scripts/all-middleware.test.js

# View results
open clinic.html
```

## Memory Leak Detection Criteria

A middleware is considered to have a memory leak if:

1. **Heap Growth**: Heap usage increases by more than 10MB after 10,000 requests
2. **No Stabilization**: Memory doesn't stabilize after 3 consecutive garbage collections
3. **Object Retention**: Objects created during requests are not properly garbage collected

## Test Methodology

Each middleware test follows this pattern:

1. **Baseline**: Measure initial memory usage
2. **Warm-up**: Process 100 requests to warm up the middleware
3. **GC**: Force garbage collection to establish stable baseline
4. **Load Test**: Process 10,000 requests
5. **Post-Test GC**: Force garbage collection multiple times
6. **Analysis**: Compare before/after memory usage and detect leaks

## Cleanup Requirements

Middleware that require manual cleanup:

- **Correlation ID Middleware**: Uses AsyncLocalStorage for context propagation
- **Idempotency Middleware**: Maintains in-memory caches
- **Circuit Breaker Middleware**: Holds state and timers

See individual middleware README files for specific cleanup instructions.
