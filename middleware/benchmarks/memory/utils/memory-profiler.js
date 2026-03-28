const v8 = require('v8');
const { performance } = require('perf_hooks');

class MemoryProfiler {
  constructor() {
    this.snapshots = [];
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(label) {
    const mem = process.memoryUsage();
    const snapshot = {
      timestamp: performance.now(),
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
      rss: mem.rss,
      heapSizeLimit: v8.getHeapStatistics().heap_size_limit,
    };

    this.snapshots.push(snapshot);
    return snapshot;
  }

  /**
   * Force garbage collection (requires --expose-gc flag)
   */
  forceGC() {
    if (global.gc) {
      global.gc();
    } else {
      throw new Error('Garbage collection not exposed. Run with --expose-gc flag.');
    }
  }

  /**
   * Force multiple garbage collections to ensure memory stabilization
   */
  forceMultipleGC(attempts = 3) {
    for (let i = 0; i < attempts; i++) {
      this.forceGC();
      // Small delay between GC attempts
      const start = Date.now();
      while (Date.now() - start < 100) {
        // Busy wait for 100ms
      }
    }
  }

  /**
   * Analyze memory difference between two snapshots
   */
  analyzeDifference(before, after) {
    const heapGrowthBytes = after.heapUsed - before.heapUsed;
    const heapGrowthMB = heapGrowthBytes / 1024 / 1024;
    const heapGrowthPercent = (heapGrowthBytes / before.heapUsed) * 100;

    const rssGrowthBytes = after.rss - before.rss;
    const rssGrowthMB = rssGrowthBytes / 1024 / 1024;
    const rssGrowthPercent = (rssGrowthBytes / before.rss) * 100;

    return {
      heapGrowthMB,
      heapGrowthPercent,
      rssGrowthMB,
      rssGrowthPercent,
    };
  }

  /**
   * Detect memory leak based on thresholds
   */
  detectMemoryLeak(baseline, afterTest) {
    const { heapGrowthMB, heapGrowthPercent } = this.analyzeDifference(baseline, afterTest);
    
    // Leak detected if:
    // 1. Heap grows by more than 10MB
    // 2. Heap grows by more than 20%
    return heapGrowthMB > 10 || heapGrowthPercent > 20;
  }

  /**
   * Generate memory test report
   */
  generateReport(result) {
    const { baseline, afterWarmup, afterLoadTest, afterGC, leakDetected, leakDetails } = result;
    
    const warmupDiff = this.analyzeDifference(baseline, afterWarmup);
    const loadDiff = this.analyzeDifference(afterWarmup, afterLoadTest);
    const finalDiff = this.analyzeDifference(baseline, afterGC);

    let report = `\n# Memory Test Report: ${result.middleware}\n`;
    report += `## Test Configuration\n`;
    report += `- Requests: ${result.requestCount}\n`;
    report += `- Duration: ${(result.duration / 1000).toFixed(2)}s\n`;
    report += `- Requests/sec: ${(result.requestCount / (result.duration / 1000)).toFixed(2)}\n\n`;

    report += `## Memory Snapshots\n`;
    report += `| Phase | Heap Used (MB) | RSS (MB) |\n`;
    report += `|-------|---------------|----------|\n`;
    report += `| Baseline | ${(baseline.heapUsed / 1024 / 1024).toFixed(2)} | ${(baseline.rss / 1024 / 1024).toFixed(2)} |\n`;
    report += `| After Warmup | ${(afterWarmup.heapUsed / 1024 / 1024).toFixed(2)} | ${(afterWarmup.rss / 1024 / 1024).toFixed(2)} |\n`;
    report += `| After Load Test | ${(afterLoadTest.heapUsed / 1024 / 1024).toFixed(2)} | ${(afterLoadTest.rss / 1024 / 1024).toFixed(2)} |\n`;
    report += `| After GC | ${(afterGC.heapUsed / 1024 / 1024).toFixed(2)} | ${(afterGC.rss / 1024 / 1024).toFixed(2)} |\n\n`;

    report += `## Memory Changes\n`;
    report += `| Phase | Heap Growth (MB) | Heap Growth (%) | RSS Growth (MB) |\n`;
    report += `|-------|------------------|-----------------|-----------------|\n`;
    report += `| Warmup | ${warmupDiff.heapGrowthMB.toFixed(2)} | ${warmupDiff.heapGrowthPercent.toFixed(2)} | ${warmupDiff.rssGrowthMB.toFixed(2)} |\n`;
    report += `| Load Test | ${loadDiff.heapGrowthMB.toFixed(2)} | ${loadDiff.heapGrowthPercent.toFixed(2)} | ${loadDiff.rssGrowthMB.toFixed(2)} |\n`;
    report += `| Total | ${finalDiff.heapGrowthMB.toFixed(2)} | ${finalDiff.heapGrowthPercent.toFixed(2)} | ${finalDiff.rssGrowthMB.toFixed(2)} |\n\n`;

    report += `## Leak Detection\n`;
    report += `**Status:** ${leakDetected ? '🚨 LEAK DETECTED' : '✅ NO LEAK'}\n\n`;

    if (leakDetected && leakDetails) {
      report += `### Leak Details\n`;
      report += `- Heap Growth: ${leakDetails.heapGrowthMB.toFixed(2)} MB (${leakDetails.heapGrowthPercent.toFixed(2)}%)\n`;
      report += `- Stabilization Attempts: ${leakDetails.stabilizationAttempts}\n\n`;
    }

    return report;
  }

  /**
   * Get all snapshots
   */
  getSnapshots() {
    return [...this.snapshots];
  }

  /**
   * Clear all snapshots
   */
  clearSnapshots() {
    this.snapshots = [];
  }
}

module.exports = { MemoryProfiler };
