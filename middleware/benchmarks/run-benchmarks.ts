import { BenchmarkRunner, BenchmarkResult, BenchmarkConfig } from './benchmark-runner';
import { BaselineChainModule } from './chains/baseline.chain';
import { MinimalChainModule } from './chains/minimal.chain';
import { AuthChainModule } from './chains/auth.chain';
import { FullChainModule } from './chains/full.chain';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Main benchmark runner script
 * 
 * This script runs performance benchmarks for different middleware chain configurations
 * and generates a comprehensive performance report.
 * 
 * Usage:
 *   npx ts-node benchmarks/run-benchmarks.ts
 * 
 * Output:
 *   - Console output with benchmark results
 *   - JSON report saved to benchmarks/results.json
 */

interface BenchmarkSuite {
  name: string;
  module: any;
  config: BenchmarkConfig;
}

async function runAllBenchmarks() {
  console.log('🚀 Starting Middleware Chain Performance Benchmarks\n');
  console.log('=' .repeat(80));

  const benchmarkSuites: BenchmarkSuite[] = [
    {
      name: 'Baseline',
      module: BaselineChainModule,
      config: {
        name: 'Baseline (No-op)',
        iterations: 1000,
        warmupIterations: 100,
        path: '/test',
        method: 'GET',
      },
    },
    {
      name: 'Minimal',
      module: MinimalChainModule,
      config: {
        name: 'Minimal Stack',
        iterations: 1000,
        warmupIterations: 100,
        path: '/test',
        method: 'GET',
      },
    },
    {
      name: 'Auth',
      module: AuthChainModule,
      config: {
        name: 'Auth Stack',
        iterations: 1000,
        warmupIterations: 100,
        path: '/test',
        method: 'GET',
      },
    },
    {
      name: 'Full',
      module: FullChainModule,
      config: {
        name: 'Full Stack',
        iterations: 1000,
        warmupIterations: 100,
        path: '/test',
        method: 'GET',
      },
    },
  ];

  const results: BenchmarkResult[] = [];

  // Run each benchmark suite
  for (const suite of benchmarkSuites) {
    console.log(`\n📊 Running ${suite.name} benchmark...`);
    console.log('-'.repeat(80));

    const runner = new BenchmarkRunner(suite.config);
    
    try {
      const result = await runner.runBenchmark(suite.module);
      results.push(result);
      
      console.log(`\n✅ ${suite.name} completed:`);
      console.log(`   Average: ${result.averageDuration.toFixed(3)}ms`);
      console.log(`   Min: ${result.minDuration.toFixed(3)}ms`);
      console.log(`   Max: ${result.maxDuration.toFixed(3)}ms`);
      console.log(`   P50: ${result.p50Duration.toFixed(3)}ms`);
      console.log(`   P95: ${result.p95Duration.toFixed(3)}ms`);
      console.log(`   P99: ${result.p99Duration.toFixed(3)}ms`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ ${suite.name} failed:`, errorMessage);
    }
  }

  // Generate comparison report
  console.log('\n' + '='.repeat(80));
  console.log('📈 BENCHMARK RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  // Print results table
  console.log('\n' + BenchmarkRunner.formatResultsTable(results));
  
  // Calculate and print comparisons
  const baseline = results.find(r => r.name === 'Baseline (No-op)');
  if (baseline) {
    console.log('\n📊 OVERHEAD COMPARISON (vs Baseline)');
    console.log('-'.repeat(80));
    
    const comparisons = results
      .filter(r => r.name !== 'Baseline (No-op)')
      .map(r => BenchmarkRunner.compareAgainstBaseline(r, {
        name: baseline.name,
        averageDuration: baseline.averageDuration,
        minDuration: baseline.minDuration,
        maxDuration: baseline.maxDuration,
      }));
    
    console.log(BenchmarkRunner.formatComparisonTable(comparisons));
    
    // Identify disproportionate overhead
    console.log('\n⚠️  PERFORMANCE ANALYSIS');
    console.log('-'.repeat(80));
    
    const minimal = results.find(r => r.name === 'Minimal Stack');
    const auth = results.find(r => r.name === 'Auth Stack');
    const full = results.find(r => r.name === 'Full Stack');
    
    if (minimal && auth && full) {
      const minimalOverhead = minimal.averageDuration - baseline.averageDuration;
      const authOverhead = auth.averageDuration - baseline.averageDuration;
      const fullOverhead = full.averageDuration - baseline.averageDuration;
      
      console.log(`\nIndividual chain overhead:`);
      console.log(`  Minimal: ${minimalOverhead.toFixed(3)}ms`);
      console.log(`  Auth: ${authOverhead.toFixed(3)}ms`);
      console.log(`  Full: ${fullOverhead.toFixed(3)}ms`);
      
      // Check for disproportionate overhead
      const expectedFullOverhead = minimalOverhead + authOverhead;
      const actualFullOverhead = fullOverhead;
      const overheadRatio = actualFullOverhead / expectedFullOverhead;
      
      console.log(`\nChain interaction analysis:`);
      console.log(`  Expected Full overhead (sum of parts): ${expectedFullOverhead.toFixed(3)}ms`);
      console.log(`  Actual Full overhead: ${actualFullOverhead.toFixed(3)}ms`);
      console.log(`  Overhead ratio: ${overheadRatio.toFixed(2)}x`);
      
      if (overheadRatio > 1.2) {
        console.log(`\n⚠️  WARNING: Disproportionate overhead detected!`);
        console.log(`   The full stack costs ${((overheadRatio - 1) * 100).toFixed(1)}% more than expected.`);
        console.log(`   This may indicate:`);
        console.log(`   - Shared-state contention between middleware`);
        console.log(`   - Blocking calls in middleware chain`);
        console.log(`   - Inefficient middleware ordering`);
        console.log(`   - Memory leaks or resource exhaustion`);
      } else if (overheadRatio < 0.8) {
        console.log(`\n✅ GOOD: Efficient middleware chain!`);
        console.log(`   The full stack costs less than expected, indicating good optimization.`);
      } else {
        console.log(`\n✅ NORMAL: Overhead is within expected range.`);
      }
    }
  }

  // Print recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('-'.repeat(80));
  console.log(`
1. Middleware Ordering:
   - Place lightweight middleware (correlation ID, security headers) first
   - Place expensive middleware (JWT, geolocation) later in the chain
   - Consider conditional middleware application based on routes

2. Performance Optimization:
   - Cache JWT verification results for repeated requests
   - Use Redis for rate limiting instead of in-memory maps
   - Implement connection pooling for external services
   - Consider async middleware for non-blocking operations

3. Monitoring:
   - Track middleware execution times in production
   - Set up alerts for disproportionate overhead
   - Monitor memory usage of stateful middleware
   - Profile middleware under load

4. Testing:
   - Run benchmarks regularly to catch performance regressions
   - Test with realistic request patterns
   - Benchmark under various load conditions
   - Compare results across different environments
`);

  // Save results to JSON
  const report = {
    timestamp: new Date().toISOString(),
    results,
    comparisons: baseline ? results
      .filter(r => r.name !== 'Baseline (No-op)')
      .map(r => BenchmarkRunner.compareAgainstBaseline(r, {
        name: baseline.name,
        averageDuration: baseline.averageDuration,
        minDuration: baseline.minDuration,
        maxDuration: baseline.maxDuration,
      })) : [],
  };

  const resultsPath = path.join(__dirname, 'results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Results saved to: ${resultsPath}`);
  console.log('\n✅ Benchmark suite completed successfully!');
}

// Run benchmarks if this file is executed directly
if (require.main === module) {
  runAllBenchmarks().catch(error => {
    console.error('❌ Benchmark suite failed:', error);
    process.exit(1);
  });
}

export { runAllBenchmarks };
