#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import all middleware test functions
const { runAuthMemoryTest } = require('./auth-memory.test');
const { runCorrelationMemoryTest } = require('./correlation-memory.test');
const { runIdempotencyMemoryTest } = require('./idempotency-memory.test');
const { runSecurityMemoryTest } = require('./security-memory.test');
const { runCircuitBreakerMemoryTest } = require('./circuit-breaker-memory.test');

/**
 * All Middleware Memory Leak Test Runner
 * 
 * This script runs memory leak tests for all middleware components
 * and generates a comprehensive report summarizing the results.
 */

const ALL_TESTS = [
  {
    name: 'JWT Auth Middleware',
    test: runAuthMemoryTest,
    file: 'auth-memory.test.js',
  },
  {
    name: 'Correlation ID Middleware',
    test: runCorrelationMemoryTest,
    file: 'correlation-memory.test.js',
  },
  {
    name: 'Idempotency Middleware',
    test: runIdempotencyMemoryTest,
    file: 'idempotency-memory.test.js',
  },
  {
    name: 'Security Headers Middleware',
    test: runSecurityMemoryTest,
    file: 'security-memory.test.js',
  },
  {
    name: 'Circuit Breaker Middleware',
    test: runCircuitBreakerMemoryTest,
    file: 'circuit-breaker-memory.test.js',
  },
];

async function runAllMiddlewareTests() {
  console.log('🚀 Starting comprehensive middleware memory leak tests...\n');
  
  const results = [];
  const startTime = Date.now();

  for (const testConfig of ALL_TESTS) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Running: ${testConfig.name}`);
    console.log(`${'='.repeat(60)}`);
    
    try {
      const result = await testConfig.test();
      results.push({
        name: testConfig.name,
        file: testConfig.file,
        success: true,
        result,
        error: null,
      });
      
      console.log(`✅ ${testConfig.name} completed successfully`);
    } catch (error) {
      console.error(`❌ ${testConfig.name} failed:`, error.message);
      results.push({
        name: testConfig.name,
        file: testConfig.file,
        success: false,
        result: null,
        error: error.message,
      });
    }

    // Small delay between tests to allow for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  // Generate comprehensive report
  await generateComprehensiveReport(results, totalDuration);

  // Print summary
  printSummary(results, totalDuration);

  // Determine exit code
  const hasLeaks = results.some(r => r.result?.leakDetected);
  const hasFailures = results.some(r => !r.success);

  if (hasFailures) {
    console.log('\n❌ Some tests failed. Check individual reports for details.');
    process.exit(2);
  } else if (hasLeaks) {
    console.log('\n🚨 Memory leaks detected in some middleware. Check reports for details.');
    process.exit(1);
  } else {
    console.log('\n✅ All middleware passed memory leak tests!');
    process.exit(0);
  }
}

async function generateComprehensiveReport(results, totalDuration) {
  const reportsDir = path.join(__dirname, '..', '..', 'reports');
  
  try {
    fs.mkdirSync(reportsDir, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  let report = `# Comprehensive Middleware Memory Leak Report\n\n`;
  report += `**Generated:** ${new Date().toISOString()}\n`;
  report += `**Total Duration:** ${(totalDuration / 1000).toFixed(2)}s\n`;
  report += `**Tests Run:** ${results.length}\n\n`;

  // Summary Table
  report += `## Summary\n\n`;
  report += `| Middleware | Status | Leak Detected | Heap Growth (MB) | Requests/sec |\n`;
  report += `|------------|---------|---------------|------------------|-------------|\n`;

  results.forEach(result => {
    if (result.success && result.result) {
      const requestsPerSec = (result.result.requestCount / (result.result.duration / 1000)).toFixed(2);
      const heapGrowth = result.result.leakDetails 
        ? result.result.leakDetails.heapGrowthMB.toFixed(2)
        : 'N/A';
      
      report += `| ${result.name} | ✅ Passed | ${result.result.leakDetected ? '🚨 Yes' : '✅ No'} | ${heapGrowth} | ${requestsPerSec} |\n`;
    } else {
      report += `| ${result.name} | ❌ Failed | - | - | - |\n`;
    }
  });

  report += `\n`;

  // Detailed Results
  report += `## Detailed Results\n\n`;

  results.forEach(result => {
    report += `### ${result.name}\n\n`;
    
    if (!result.success) {
      report += `**Status:** ❌ Failed\n`;
      report += `**Error:** ${result.error}\n\n`;
      return;
    }

    const { result: testResult } = result;
    report += `**Status:** ✅ Passed\n`;
    report += `**Leak Detected:** ${testResult.leakDetected ? '🚨 Yes' : '✅ No'}\n`;
    report += `**Requests:** ${testResult.requestCount}\n`;
    report += `**Duration:** ${(testResult.duration / 1000).toFixed(2)}s\n`;
    report += `**Requests/sec:** ${(testResult.requestCount / (testResult.duration / 1000)).toFixed(2)}\n`;

    if (testResult.leakDetails) {
      report += `**Heap Growth:** ${testResult.leakDetails.heapGrowthMB.toFixed(2)} MB (${testResult.leakDetails.heapGrowthPercent.toFixed(2)}%)\n`;
    }

    // Memory snapshots
    report += `\n**Memory Snapshots:**\n`;
    report += `- Baseline: ${(testResult.baseline.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
    report += `- After Load Test: ${(testResult.afterLoadTest.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
    report += `- Final: ${(testResult.afterGC.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;

    report += `\n---\n\n`;
  });

  // Recommendations
  report += `## Recommendations\n\n`;

  const leakyMiddleware = results.filter(r => r.result?.leakDetected);
  const failedMiddleware = results.filter(r => !r.success);

  if (leakyMiddleware.length > 0) {
    report += `### 🚨 Memory Leaks Found\n\n`;
    leakyMiddleware.forEach(result => {
      report += `- **${result.name}**: Shows memory growth after 10k requests. Review the middleware implementation for:\n`;
      report += `  - Unclosed event listeners\n`;
      report += `  - Growing caches or collections\n`;
      report += `  - Closure references\n`;
      report += `  - Timer references\n\n`;
    });
  }

  if (failedMiddleware.length > 0) {
    report += `### ❌ Failed Tests\n\n`;
    failedMiddleware.forEach(result => {
      report += `- **${result.name}**: Test execution failed with error: ${result.error}\n\n`;
    });
  }

  if (leakyMiddleware.length === 0 && failedMiddleware.length === 0) {
    report += `✅ All middleware passed memory leak tests. No immediate action required.\n\n`;
    report += `### Best Practices Maintained\n\n`;
    report += `- Proper cleanup of caches and collections\n`;
    report += `- No event listener leaks\n`;
    report += `- Appropriate use of WeakMap/WeakSet where applicable\n`;
    report += `- Timer cleanup on middleware destruction\n\n`;
  }

  // Cleanup Requirements
  report += `## Cleanup Requirements\n\n`;
  report += `The following middleware require manual cleanup:\n\n`;
  report += `- **Correlation ID Middleware**: Call cleanup() method to clear old correlation entries\n`;
  report += `- **Idempotency Middleware**: Call cleanup() method to clear expired cache entries\n`;
  report += `- **Circuit Breaker Middleware**: Call cleanup() method to clear request history\n\n`;

  report += `### Automated Cleanup\n\n`;
  report += `Consider implementing automated cleanup intervals:\n\n`;
  report += `\`\`\`javascript\n`;
  report += `// Example: Cleanup every 5 minutes\n`;
  report += `setInterval(() => {\n`;
  report += `  correlationMiddleware.cleanup();\n`;
  report += `  idempotencyMiddleware.cleanup();\n`;
  report += `  circuitBreakerMiddleware.cleanup();\n`;
  report += `}, 5 * 60 * 1000);\n`;
  report += `\`\`\`\n\n`;

  // Save report
  const reportPath = path.join(reportsDir, 'comprehensive-memory-report.md');
  fs.writeFileSync(reportPath, report);
  
  console.log(`📄 Comprehensive report saved to: ${reportPath}`);
}

function printSummary(results, totalDuration) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 MEMORY LEAK TEST SUMMARY');
  console.log(`${'='.repeat(80)}`);
  
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  const leaky = results.filter(r => r.result?.leakDetected).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Memory Leaks: ${leaky} 🚨`);
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

  console.log('\nIndividual Results:');
  results.forEach(result => {
    const status = !result.success ? '❌ FAILED' : 
                  result.result?.leakDetected ? '🚨 LEAK' : '✅ PASS';
    console.log(`  ${status} ${result.name}`);
  });

  console.log(`${'='.repeat(80)}`);
}

// Run the test if this file is executed directly
if (require.main === module) {
  runAllMiddlewareTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runAllMiddlewareTests };
