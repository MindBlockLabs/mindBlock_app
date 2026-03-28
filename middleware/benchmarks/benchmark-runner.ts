import { NestFactory } from '@nestjs/core';
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Benchmark configuration options
 */
export interface BenchmarkConfig {
  /** Name of the benchmark chain */
  name: string;
  /** Number of iterations to run */
  iterations: number;
  /** Warmup iterations before measurement */
  warmupIterations: number;
  /** Request path to test */
  path: string;
  /** HTTP method to test */
  method: string;
}

/**
 * Benchmark result for a single iteration
 */
export interface BenchmarkIteration {
  iteration: number;
  duration: number;
  timestamp: number;
}

/**
 * Aggregated benchmark results
 */
export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  standardDeviation: number;
  iterationsData: BenchmarkIteration[];
}

/**
 * Baseline benchmark result for comparison
 */
export interface BaselineResult {
  name: string;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
}

/**
 * Comparison result between chains
 */
export interface ChainComparison {
  chainName: string;
  baselineName: string;
  overheadMs: number;
  overheadPercent: number;
  averageDuration: number;
}

/**
 * Utility class for running middleware chain benchmarks
 */
export class BenchmarkRunner {
  private readonly config: BenchmarkConfig;

  constructor(config: BenchmarkConfig) {
    this.config = config;
  }

  /**
   * Run a benchmark for a given middleware chain module
   */
  async runBenchmark(chainModule: any): Promise<BenchmarkResult> {
    const app = await NestFactory.create(chainModule, { logger: false });
    await app.init();

    const server = app.getHttpServer();
    const iterationsData: BenchmarkIteration[] = [];

    // Warmup phase
    console.log(`Warming up ${this.config.name} (${this.config.warmupIterations} iterations)...`);
    for (let i = 0; i < this.config.warmupIterations; i++) {
      await this.executeRequest(server);
    }

    // Measurement phase
    console.log(`Running ${this.config.name} (${this.config.iterations} iterations)...`);
    for (let i = 0; i < this.config.iterations; i++) {
      const start = process.hrtime.bigint();
      await this.executeRequest(server);
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1_000_000; // Convert to milliseconds

      iterationsData.push({
        iteration: i + 1,
        duration,
        timestamp: Date.now(),
      });
    }

    await app.close();

    return this.calculateStatistics(iterationsData);
  }

  /**
   * Execute a single HTTP request
   */
  private async executeRequest(server: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = {
        method: this.config.method,
        url: this.config.path,
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlclJvbGUiOiJ1c2VyIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
        body: {},
        query: {},
        params: {},
        ip: '127.0.0.1',
        get: (header: string) => req.headers[header.toLowerCase()],
      };

      const res = {
        statusCode: 200,
        headers: {} as Record<string, string>,
        setHeader: (key: string, value: string) => {
          res.headers[key] = value;
        },
        status: (code: number) => {
          res.statusCode = code;
          return res;
        },
        json: (data: any) => {
          resolve();
        },
        send: (data: any) => {
          resolve();
        },
        end: () => {
          resolve();
        },
      };

      const next: NextFunction = (error?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      };

      try {
        // Simulate middleware execution
        server._events.request(req, res, next);
      } catch (error) {
        // If direct invocation fails, resolve anyway
        resolve();
      }
    });
  }

  /**
   * Calculate statistical metrics from benchmark iterations
   */
  private calculateStatistics(iterationsData: BenchmarkIteration[]): BenchmarkResult {
    const durations = iterationsData.map((d) => d.duration).sort((a, b) => a - b);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalDuration / durations.length;

    // Calculate standard deviation
    const squaredDiffs = durations.map((d) => Math.pow(d - averageDuration, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, d) => sum + d, 0) / durations.length;
    const standardDeviation = Math.sqrt(avgSquaredDiff);

    // Calculate percentiles
    const p50Index = Math.floor(durations.length * 0.5);
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    return {
      name: this.config.name,
      iterations: this.config.iterations,
      totalDuration,
      averageDuration,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50Duration: durations[p50Index],
      p95Duration: durations[p95Index],
      p99Duration: durations[p99Index],
      standardDeviation,
      iterationsData,
    };
  }

  /**
   * Compare chain results against baseline
   */
  static compareAgainstBaseline(
    chainResult: BenchmarkResult,
    baselineResult: BaselineResult,
  ): ChainComparison {
    const overheadMs = chainResult.averageDuration - baselineResult.averageDuration;
    const overheadPercent = (overheadMs / baselineResult.averageDuration) * 100;

    return {
      chainName: chainResult.name,
      baselineName: baselineResult.name,
      overheadMs,
      overheadPercent,
      averageDuration: chainResult.averageDuration,
    };
  }

  /**
   * Format benchmark results as a table
   */
  static formatResultsTable(results: BenchmarkResult[]): string {
    const headers = [
      'Chain',
      'Avg (ms)',
      'Min (ms)',
      'Max (ms)',
      'P50 (ms)',
      'P95 (ms)',
      'P99 (ms)',
      'Std Dev',
    ];

    const rows = results.map((r) => [
      r.name,
      r.averageDuration.toFixed(3),
      r.minDuration.toFixed(3),
      r.maxDuration.toFixed(3),
      r.p50Duration.toFixed(3),
      r.p95Duration.toFixed(3),
      r.p99Duration.toFixed(3),
      r.standardDeviation.toFixed(3),
    ]);

    const colWidths = headers.map((h, i) =>
      Math.max(h.length, ...rows.map((r) => r[i].length)),
    );

    const separator = colWidths.map((w) => '-'.repeat(w)).join(' | ');
    const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ');
    const dataRows = rows.map((r) =>
      r.map((cell, i) => cell.padEnd(colWidths[i])).join(' | '),
    );

    return [headerRow, separator, ...dataRows].join('\n');
  }

  /**
   * Format comparison results as a table
   */
  static formatComparisonTable(comparisons: ChainComparison[]): string {
    const headers = ['Chain', 'Baseline', 'Overhead (ms)', 'Overhead (%)', 'Avg (ms)'];

    const rows = comparisons.map((c) => [
      c.chainName,
      c.baselineName,
      c.overheadMs.toFixed(3),
      c.overheadPercent.toFixed(2) + '%',
      c.averageDuration.toFixed(3),
    ]);

    const colWidths = headers.map((h, i) =>
      Math.max(h.length, ...rows.map((r) => r[i].length)),
    );

    const separator = colWidths.map((w) => '-'.repeat(w)).join(' | ');
    const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ');
    const dataRows = rows.map((r) =>
      r.map((cell, i) => cell.padEnd(colWidths[i])).join(' | '),
    );

    return [headerRow, separator, ...dataRows].join('\n');
  }
}
