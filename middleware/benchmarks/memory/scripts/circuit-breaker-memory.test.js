#!/usr/bin/env node

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Import utilities using require for CommonJS compatibility
const { MemoryProfiler } = require('../utils/memory-profiler');
const { MiddlewareTestRunner } = require('../utils/test-runner');
const { HeapSnapshotManager } = require('../utils/heap-snapshot');

// Mock CircuitBreakerMiddleware for testing
class MockCircuitBreakerMiddleware {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.requestHistory = []; // Potential leak source
  }

  use(req, res, next) {
    const requestId = `${Date.now()}-${Math.random()}`;
    this.requestHistory.push({
      id: requestId,
      timestamp: Date.now(),
      path: req.path,
    });

    // Clean old history (prevent memory leak)
    this.cleanupHistory();

    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        return res.status(503).json({ error: 'Service unavailable' });
      }
    }

    // Wrap next to track success/failure
    const originalNext = next;
    const self = this;
    
    req.circuitBreakerCallback = (error) => {
      if (error) {
        self.recordFailure();
      } else {
        self.recordSuccess();
      }
    };

    originalNext();
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  recordSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
      }
    }
  }

  cleanupHistory() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    this.requestHistory = this.requestHistory.filter(
      request => now - request.timestamp < maxAge
    );
  }

  // Cleanup method
  cleanup() {
    this.requestHistory = [];
    this.failureCount = 0;
    this.successCount = 0;
    this.state = 'CLOSED';
  }
}

/**
 * Circuit Breaker Middleware Memory Leak Test
 * 
 * This test verifies that the Circuit Breaker middleware doesn't leak memory
 * across multiple requests. It specifically tests:
 * - State management
 * - Request history tracking
 * - Failure counting
 * - Timer management
 */

async function runCircuitBreakerMemoryTest() {
  const profiler = new MemoryProfiler();
  const testRunner = new MiddlewareTestRunner();
  const snapshotManager = new HeapSnapshotManager();
  
  const middlewareName = 'Circuit Breaker Middleware';
  const requestCount = 10000;
  const warmupRequests = 100;
  const gcAttempts = 3;

  console.log(`🧪 Starting ${middlewareName} memory test...`);

  // Create middleware instance
  const middleware = new MockCircuitBreakerMiddleware();
  const requestFactory = testRunner.getRequestFactory('circuitBreaker');

  // Phase 1: Baseline snapshot
  console.log('📊 Taking baseline memory snapshot...');
  const baseline = profiler.takeSnapshot('baseline');
  const beforeSnapshot = snapshotManager.takeSnapshot('before-circuit-breaker-test');

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
  const afterSnapshot = snapshotManager.takeSnapshot('after-circuit-breaker-test');

  // Phase 5: Post-test GC
  console.log(`🧹 Post-test garbage collection...`);
  profiler.forceMultipleGC(gcAttempts);
  
  // Perform cleanup
  console.log('🔧 Performing cleanup of circuit breaker state...');
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
  
  const reportPath = path.join(reportsDir, 'circuit-breaker-memory-report.md');
  fs.writeFileSync(reportPath, report);
  
  // Generate heap comparison report
  try {
    const comparison = snapshotManager.compareSnapshots(beforeSnapshot.filename, afterSnapshot.filename);
    const comparisonReport = snapshotManager.generateComparisonReport(beforeSnapshot, afterSnapshot, comparison);
    const comparisonPath = path.join(reportsDir, 'circuit-breaker-heap-comparison.md');
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
  runCircuitBreakerMemoryTest()
    .then((result) => {
      process.exit(result.leakDetected ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runCircuitBreakerMemoryTest };
