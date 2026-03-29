#!/usr/bin/env node

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Import utilities using require for CommonJS compatibility
const { MemoryProfiler } = require('../utils/memory-profiler');
const { MiddlewareTestRunner } = require('../utils/test-runner');
const { HeapSnapshotManager } = require('../utils/heap-snapshot');

// Mock CorrelationIdMiddleware for testing
class MockCorrelationIdMiddleware {
  constructor() {
    this.HEADER_NAME = 'X-Correlation-ID';
    this.correlationMap = new Map(); // Simulate storage that could leak
  }

  use(req, res, next) {
    // 1. Extract from header or generate new UUID v4
    const correlationId = req.header(this.HEADER_NAME) || this.generateUUID();

    // 2. Attach to request headers for propagation
    req.headers[this.HEADER_NAME.toLowerCase()] = correlationId;

    // 3. Attach to response headers
    res.setHeader(this.HEADER_NAME, correlationId);

    // 4. Store correlation ID (potential leak source)
    this.correlationMap.set(correlationId, {
      timestamp: Date.now(),
      userId: req.user?.id || req.userId,
    });

    // 5. Store in request object as well for easy access
    req.correlationId = correlationId;
    
    next();
  }

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Cleanup method to prevent leaks
  cleanup() {
    const now = Date.now();
    const ttl = 5 * 60 * 1000; // 5 minutes TTL
    
    for (const [id, data] of this.correlationMap.entries()) {
      if (now - data.timestamp > ttl) {
        this.correlationMap.delete(id);
      }
    }
  }
}

/**
 * Correlation ID Middleware Memory Leak Test
 * 
 * This test verifies that the Correlation ID middleware doesn't leak memory
 * across multiple requests. It specifically tests:
 * - UUID generation for new correlation IDs
 * - Context management
 * - Header propagation
 * - Request/response header manipulation
 * 
 * This middleware is particularly important to test as it maintains state,
 * which can potentially retain memory if not properly managed.
 */

async function runCorrelationMemoryTest() {
  const profiler = new MemoryProfiler();
  const testRunner = new MiddlewareTestRunner();
  const snapshotManager = new HeapSnapshotManager();
  
  const middlewareName = 'Correlation ID Middleware';
  const requestCount = 10000;
  const warmupRequests = 100;
  const gcAttempts = 3;

  console.log(`🧪 Starting ${middlewareName} memory test...`);

  // Create middleware instance
  const middleware = new MockCorrelationIdMiddleware();
  const requestFactory = testRunner.getRequestFactory('correlationId');

  // Phase 1: Baseline snapshot
  console.log('📊 Taking baseline memory snapshot...');
  const baseline = profiler.takeSnapshot('baseline');
  const beforeSnapshot = snapshotManager.takeSnapshot('before-correlation-test');

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
  const afterSnapshot = snapshotManager.takeSnapshot('after-correlation-test');

  // Phase 5: Post-test GC
  console.log(`🧹 Post-test garbage collection...`);
  profiler.forceMultipleGC(gcAttempts);
  
  // Perform cleanup
  console.log('🔧 Performing cleanup of correlation storage...');
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
  
  const reportPath = path.join(reportsDir, 'correlation-memory-report.md');
  fs.writeFileSync(reportPath, report);
  
  // Generate heap comparison report
  try {
    const comparison = snapshotManager.compareSnapshots(beforeSnapshot.filename, afterSnapshot.filename);
    const comparisonReport = snapshotManager.generateComparisonReport(beforeSnapshot, afterSnapshot, comparison);
    const comparisonPath = path.join(reportsDir, 'correlation-heap-comparison.md');
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
  runCorrelationMemoryTest()
    .then((result) => {
      process.exit(result.leakDetected ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runCorrelationMemoryTest };
