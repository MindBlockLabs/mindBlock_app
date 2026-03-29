#!/usr/bin/env node

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Import utilities using require for CommonJS compatibility
const { MemoryProfiler } = require('../utils/memory-profiler');
const { MiddlewareTestRunner } = require('../utils/test-runner');
const { HeapSnapshotManager } = require('../utils/heap-snapshot');

// Mock IdempotencyMiddleware for testing
class MockIdempotencyMiddleware {
  constructor() {
    this.responseCache = new Map(); // Potential leak source
    this.ttlMap = new Map();
  }

  async use(req, res, next) {
    // Skip GET requests
    if (req.method === 'GET') return next();

    const headerKey = 'x-idempotency-key';
    let idempotencyKey = req.headers[headerKey];

    if (!idempotencyKey) {
      // Auto-generate key if not provided
      idempotencyKey = this.generateKey(req);
    }

    if (typeof idempotencyKey !== 'string') {
      return next(new Error('Invalid idempotency key format'));
    }

    const cachedResponse = this.getResponse(idempotencyKey);
    if (cachedResponse) {
      // Return cached response immediately
      res.set(cachedResponse.headers);
      return res.status(cachedResponse.statusCode).send(cachedResponse.body);
    }

    // Intercept response to store it
    const originalSend = res.send.bind(res);
    res.send = (body) => {
      const ttl = this.resolveTTL(req.originalUrl);
      const responsePayload = {
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body,
      };
      this.storeResponse(idempotencyKey, responsePayload, ttl);
      return originalSend(body);
    };

    next();
  }

  generateKey(req) {
    return `auto-${req.method}-${req.path}-${Date.now()}`;
  }

  getResponse(key) {
    const cached = this.responseCache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiresAt) {
      this.responseCache.delete(key);
      this.ttlMap.delete(key);
      return null;
    }

    return cached.data;
  }

  storeResponse(key, data, ttl) {
    const expiresAt = Date.now() + (ttl * 1000);
    this.responseCache.set(key, { data, expiresAt });
    this.ttlMap.set(key, expiresAt);
  }

  resolveTTL(url) {
    if (url.includes('/puzzles')) return 3600; // 1 hour
    if (url.includes('/points')) return 1800; // 30 minutes
    if (url.includes('/friends')) return 900; // 15 minutes
    if (url.includes('/profile')) return 300; // 5 minutes
    return 300; // default 5 minutes
  }

  // Cleanup method to prevent leaks
  cleanup() {
    const now = Date.now();
    for (const [key, expiresAt] of this.ttlMap.entries()) {
      if (now > expiresAt) {
        this.responseCache.delete(key);
        this.ttlMap.delete(key);
      }
    }
  }
}

/**
 * Idempotency Middleware Memory Leak Test
 * 
 * This test verifies that the Idempotency middleware doesn't leak memory
 * across multiple requests. It specifically tests:
 * - Response caching
 * - TTL management
 * - Key generation and storage
 * - Response interception
 */

async function runIdempotencyMemoryTest() {
  const profiler = new MemoryProfiler();
  const testRunner = new MiddlewareTestRunner();
  const snapshotManager = new HeapSnapshotManager();
  
  const middlewareName = 'Idempotency Middleware';
  const requestCount = 10000;
  const warmupRequests = 100;
  const gcAttempts = 3;

  console.log(`🧪 Starting ${middlewareName} memory test...`);

  // Create middleware instance
  const middleware = new MockIdempotencyMiddleware();
  const requestFactory = testRunner.getRequestFactory('idempotency');

  // Phase 1: Baseline snapshot
  console.log('📊 Taking baseline memory snapshot...');
  const baseline = profiler.takeSnapshot('baseline');
  const beforeSnapshot = snapshotManager.takeSnapshot('before-idempotency-test');

  // Phase 2: Warmup
  console.log(`🔥 Warming up with ${warmupRequests} requests...`);
  await testRunner.runMultipleRequests(middleware, warmupRequests, requestFactory);
  const afterWarmup = profiler.takeSnapshot('after-warmup');

  // Phase 3: Force GC to stabilize
  console.log(`🧹 Forcing garbage collection (${gcAttempts} attempts)...`);
  profiler.forceMultipleGC(gcAttempts);
  const afterGC = profiler.takeSnapshot('after-gc');

  // Phase 4: Load test
  console.log(`⚡ Running load test with ${requestCount} requests...`);
  const startTime = performance.now();
  
  await testRunner.runMultipleRequests(middleware, requestCount, requestFactory);
  
  const endTime = performance.now();
  const duration = endTime - startTime;

  const afterLoadTest = profiler.takeSnapshot('after-load-test');
  const afterSnapshot = snapshotManager.takeSnapshot('after-idempotency-test');

  // Phase 5: Post-test GC
  console.log(`🧹 Post-test garbage collection...`);
  profiler.forceMultipleGC(gcAttempts);
  
  // Perform cleanup
  console.log('🔧 Performing cleanup of idempotency cache...');
  middleware.cleanup();
  
  const finalSnapshot = profiler.takeSnapshot('final');

  // Phase 6: Leak detection
  const leakDetected = profiler.detectMemoryLeak(baseline, finalSnapshot);
  const leakDetails = leakDetected ? profiler.analyzeDifference(baseline, finalSnapshot) : undefined;

  // Phase 7: Generate report
  const result = {
    middleware: middlewareName,
    baseline,
    afterWarmup,
    afterLoadTest,
    afterGC: finalSnapshot,
    requestCount,
    duration,
    leakDetected,
    leakDetails: leakDetails ? {
      heapGrowthMB: leakDetails.heapGrowthMB,
      heapGrowthPercent: leakDetails.heapGrowthPercent,
      stabilizationAttempts: gcAttempts,
    } : undefined,
  };

  // Generate and save report
  const report = profiler.generateReport(result);
  const reportsDir = path.join(__dirname, '..', '..', 'reports');
  
  try {
    fs.mkdirSync(reportsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
  
  const reportPath = path.join(reportsDir, 'idempotency-memory-report.md');
  fs.writeFileSync(reportPath, report);
  
  // Generate heap comparison report
  try {
    const comparison = snapshotManager.compareSnapshots(beforeSnapshot.filename, afterSnapshot.filename);
    const comparisonReport = snapshotManager.generateComparisonReport(beforeSnapshot, afterSnapshot, comparison);
    const comparisonPath = path.join(reportsDir, 'idempotency-heap-comparison.md');
    fs.writeFileSync(comparisonPath, comparisonReport);
  } catch (error) {
    console.warn('Failed to generate heap comparison:', error);
  }

  // Cleanup old snapshots
  snapshotManager.cleanupOldSnapshots();

  console.log(`\n✅ ${middlewareName} memory test completed!`);
  console.log(`📄 Report saved to: ${reportPath}`);
  console.log(`🚨 Leak Status: ${leakDetected ? 'DETECTED' : 'NONE'}`);
  
  if (leakDetected && leakDetails) {
    console.log(`📈 Heap Growth: ${leakDetails.heapGrowthMB.toFixed(2)} MB (${leakDetails.heapGrowthPercent.toFixed(2)}%)`);
  }

  return result;
}

// Run the test if this file is executed directly
if (require.main === module) {
  runIdempotencyMemoryTest()
    .then((result) => {
      process.exit(result.leakDetected ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runIdempotencyMemoryTest };
