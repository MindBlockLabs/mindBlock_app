#!/usr/bin/env node

const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Import utilities using require for CommonJS compatibility
const { MemoryProfiler } = require('../utils/memory-profiler');
const { MiddlewareTestRunner } = require('../utils/test-runner');
const { HeapSnapshotManager } = require('../utils/heap-snapshot');

// Import middleware classes (adjust paths as needed)
const { JwtAuthMiddleware } = require('../../../src/auth/jwt-auth.middleware');

/**
 * JWT Auth Middleware Memory Leak Test
 * 
 * This test verifies that the JWT authentication middleware doesn't leak memory
 * across multiple requests. It specifically tests:
 * - Token parsing and validation
 * - User payload attachment to requests
 * - Redis blacklisting checks (if enabled)
 * - Logging functionality
 */

async function runAuthMemoryTest() {
  const profiler = new MemoryProfiler();
  const testRunner = new MiddlewareTestRunner();
  const snapshotManager = new HeapSnapshotManager();
  
  const middlewareName = 'JWT Auth Middleware';
  const requestCount = 10000;
  const warmupRequests = 100;
  const gcAttempts = 3;

  console.log(`🧪 Starting ${middlewareName} memory test...`);

  // Create middleware instance with mock options
  const options = {
    secret: 'test-secret-key-for-memory-testing',
    publicRoutes: ['/public', '/health'],
    logging: false, // Disable logging to reduce noise in memory test
    authHeader: 'authorization',
  };

  const middleware = new JwtAuthMiddleware(options);
  const requestFactory = testRunner.getRequestFactory('jwtAuth');

  // Phase 1: Baseline snapshot
  console.log('📊 Taking baseline memory snapshot...');
  const baseline = profiler.takeSnapshot('baseline');
  const beforeSnapshot = snapshotManager.takeSnapshot('before-auth-test');

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
  const afterSnapshot = snapshotManager.takeSnapshot('after-auth-test');

  // Phase 5: Post-test GC
  console.log(`🧹 Post-test garbage collection...`);
  profiler.forceMultipleGC(gcAttempts);
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
  
  const reportPath = path.join(reportsDir, 'auth-memory-report.md');
  fs.writeFileSync(reportPath, report);
  
  // Generate heap comparison report
  try {
    const comparison = snapshotManager.compareSnapshots(beforeSnapshot.filename, afterSnapshot.filename);
    const comparisonReport = snapshotManager.generateComparisonReport(beforeSnapshot, afterSnapshot, comparison);
    const comparisonPath = path.join(reportsDir, 'auth-heap-comparison.md');
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
  runAuthMemoryTest()
    .then((result) => {
      process.exit(result.leakDetected ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { runAuthMemoryTest };
