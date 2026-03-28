/**
 * Middleware Chain Performance Benchmarks
 * 
 * This module exports all benchmark chain modules and utilities
 * for measuring middleware chain performance.
 * 
 * @module benchmarks
 */

// Benchmark utilities
export { BenchmarkRunner } from './benchmark-runner';
export type {
  BenchmarkConfig,
  BenchmarkIteration,
  BenchmarkResult,
  BaselineResult,
  ChainComparison,
} from './benchmark-runner';

// Chain modules
export { BaselineChainModule } from './chains/baseline.chain';
export { MinimalChainModule } from './chains/minimal.chain';
export { AuthChainModule } from './chains/auth.chain';
export { FullChainModule } from './chains/full.chain';

// Benchmark runner
export { runAllBenchmarks } from './run-benchmarks';
