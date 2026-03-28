#!/usr/bin/env ts-node

import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import { Server } from 'http';

// Import middleware
import { SecurityHeadersMiddleware } from '../src/security/security-headers.middleware';
import { TimeoutMiddleware } from '../src/middleware/advanced/timeout.middleware';
import { CircuitBreakerMiddleware, CircuitBreakerService } from '../src/middleware/advanced/circuit-breaker.middleware';
import { CorrelationIdMiddleware } from '../src/monitoring/correlation-id.middleware';
import { unless } from '../src/middleware/utils/conditional.middleware';

interface BenchmarkResult {
  middleware: string;
  requestsPerSecond: number;
  latency: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  errors: number;
}

interface MiddlewareConfig {
  name: string;
  middleware: any;
  options?: any;
}

// Simple load testing function to replace autocannon
async function simpleLoadTest(url: string, options: {
  connections: number;
  duration: number;
  headers?: Record<string, string>;
}): Promise<{
  requests: { average: number };
  latency: { average: number; p50: number; p95: number; p99: number };
  errors: number;
}> {
  const { connections, duration, headers = {} } = options;
  const latencies: number[] = [];
  let completedRequests = 0;
  let errors = 0;
  const startTime = Date.now();

  // Create concurrent requests
  const promises = Array.from({ length: connections }, async () => {
    const requestStart = Date.now();

    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.request(url, {
          method: 'GET',
          headers
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            completedRequests++;
            latencies.push(Date.now() - requestStart);
            resolve();
          });
        });

        req.on('error', (err) => {
          errors++;
          latencies.push(Date.now() - requestStart);
          reject(err);
        });

        req.setTimeout(10000, () => {
          errors++;
          latencies.push(Date.now() - requestStart);
          req.destroy();
          reject(new Error('Timeout'));
        });

        req.end();
      });
    } catch (error) {
      // Ignore errors for load testing
    }
  });

  // Run for the specified duration
  await Promise.race([
    Promise.all(promises),
    new Promise(resolve => setTimeout(resolve, duration * 1000))
  ]);

  const totalTime = (Date.now() - startTime) / 1000; // in seconds
  const requestsPerSecond = completedRequests / totalTime;

  // Calculate percentiles
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const average = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length || 0;

  return {
    requests: { average: requestsPerSecond },
    latency: { average, p50, p95, p99 },
    errors
  };
}

// Mock JWT Auth Middleware (simplified for benchmarking)
class MockJwtAuthMiddleware {
  constructor(private options: { secret: string; algorithms?: string[] }) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // For benchmarking, just check if a token is present (skip actual verification)
    const token = authHeader.substring(7);
    if (!token || token.length < 10) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Mock user object
    (req as any).user = {
      userId: '1234567890',
      email: 'test@example.com',
      userRole: 'user'
    };
    next();
  }
}

// Mock RBAC Middleware (simplified for benchmarking)
class MockRbacMiddleware {
  constructor(private options: { roles: string[]; defaultRole: string }) {}

  use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'No user found' });
    }

    // Simple role check - allow if user has any of the allowed roles
    const userRole = user.userRole || this.options.defaultRole;
    if (!this.options.roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  }
}

class MiddlewareBenchmarker {
  private port = 3001;
  private server: Server | null = null;

  private middlewareConfigs: MiddlewareConfig[] = [
    {
      name: 'JWT Auth',
      middleware: MockJwtAuthMiddleware,
      options: {
        secret: 'test-secret-key-for-benchmarking-only',
        algorithms: ['HS256']
      }
    },
    {
      name: 'RBAC',
      middleware: MockRbacMiddleware,
      options: {
        roles: ['user', 'admin'],
        defaultRole: 'user'
      }
    },
    {
      name: 'Security Headers',
      middleware: SecurityHeadersMiddleware,
      options: {}
    },
    {
      name: 'Timeout (5s)',
      middleware: TimeoutMiddleware,
      options: { timeout: 5000 }
    },
    {
      name: 'Circuit Breaker',
      middleware: CircuitBreakerMiddleware,
      options: {
        failureThreshold: 5,
        recoveryTimeout: 30000,
        monitoringPeriod: 10000
      }
    },
    {
      name: 'Correlation ID',
      middleware: CorrelationIdMiddleware,
      options: {}
    }
  ];

  async runBenchmarks(): Promise<void> {
    console.log('🚀 Starting Middleware Performance Benchmarks\n');
    console.log('Configuration: 100 concurrent connections, 5s duration\n');

    const results: BenchmarkResult[] = [];

    // Baseline benchmark (no middleware)
    console.log('📊 Running baseline benchmark (no middleware)...');
    const baselineResult = await this.runBenchmark([]);
    results.push({
      middleware: 'Baseline (No Middleware)',
      ...baselineResult
    });

    // Individual middleware benchmarks
    for (const config of this.middlewareConfigs) {
      console.log(`📊 Running benchmark for ${config.name}...`);
      try {
        const result = await this.runBenchmark([config]);
        results.push({
          middleware: config.name,
          ...result
        });
      } catch (error) {
        console.error(`❌ Failed to benchmark ${config.name}:`, error.message);
        results.push({
          middleware: config.name,
          requestsPerSecond: 0,
          latency: { average: 0, p50: 0, p95: 0, p99: 0 },
          errors: 0
        });
      }
    }

    this.displayResults(results);
  }

  private async runBenchmark(middlewareConfigs: MiddlewareConfig[]): Promise<Omit<BenchmarkResult, 'middleware'>> {
    const app = express();

    // Simple test endpoint
    app.get('/test', (req: Request, res: Response) => {
      res.json({ message: 'ok', timestamp: Date.now() });
    });

    // Apply middleware
    for (const config of middlewareConfigs) {
      if (config.middleware) {
        // Special handling for CircuitBreakerMiddleware
        if (config.middleware === CircuitBreakerMiddleware) {
          const circuitBreakerService = new CircuitBreakerService(config.options);
          const instance = new CircuitBreakerMiddleware(circuitBreakerService);
          app.use((req, res, next) => instance.use(req, res, next));
        }
        // For middleware that need instantiation
        else if (typeof config.middleware === 'function' && config.middleware.prototype?.use) {
          const instance = new (config.middleware as any)(config.options);
          app.use((req, res, next) => instance.use(req, res, next));
        } else if (typeof config.middleware === 'function') {
          // For functional middleware
          app.use(config.middleware(config.options));
        }
      }
    }

    // Start server
    this.server = app.listen(this.port);

    try {
      // Run simple load test
      const result = await simpleLoadTest(`http://localhost:${this.port}/test`, {
        connections: 100,
        duration: 5, // 5 seconds instead of 10 for faster testing
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
        }
      });

      return {
        requestsPerSecond: Math.round(result.requests.average * 100) / 100,
        latency: {
          average: Math.round(result.latency.average * 100) / 100,
          p50: Math.round(result.latency.p50 * 100) / 100,
          p95: Math.round(result.latency.p95 * 100) / 100,
          p99: Math.round(result.latency.p99 * 100) / 100
        },
        errors: result.errors
      };
    } finally {
      // Clean up server
      if (this.server) {
        this.server.close();
        this.server = null;
      }
    }
  }

  private displayResults(results: BenchmarkResult[]): void {
    console.log('\n📈 Benchmark Results Summary');
    console.log('=' .repeat(80));

    console.log('│ Middleware'.padEnd(25) + '│ Req/sec'.padEnd(10) + '│ Avg Lat'.padEnd(10) + '│ P95 Lat'.padEnd(10) + '│ Overhead'.padEnd(12) + '│');
    console.log('├' + '─'.repeat(24) + '┼' + '─'.repeat(9) + '┼' + '─'.repeat(9) + '┼' + '─'.repeat(9) + '┼' + '─'.repeat(11) + '┤');

    const baseline = results.find(r => r.middleware === 'Baseline (No Middleware)');
    if (!baseline) {
      console.error('❌ Baseline benchmark not found!');
      return;
    }

    for (const result of results) {
      const overhead = result.middleware === 'Baseline (No Middleware)'
        ? '0%'
        : result.requestsPerSecond > 0
          ? `${Math.round((1 - result.requestsPerSecond / baseline.requestsPerSecond) * 100)}%`
          : 'N/A';

      console.log(
        '│ ' + result.middleware.padEnd(23) + ' │ ' +
        result.requestsPerSecond.toString().padEnd(8) + ' │ ' +
        result.latency.average.toString().padEnd(8) + ' │ ' +
        result.latency.p95.toString().padEnd(8) + ' │ ' +
        overhead.padEnd(10) + ' │'
      );
    }

    console.log('└' + '─'.repeat(24) + '┴' + '─'.repeat(9) + '┴' + '─'.repeat(9) + '┴' + '─'.repeat(9) + '┴' + '─'.repeat(11) + '┘');

    console.log('\n📝 Notes:');
    console.log('- Overhead is calculated as reduction in requests/second vs baseline');
    console.log('- Lower overhead percentage = better performance');
    console.log('- Results may vary based on system configuration');
    console.log('- Run with --ci flag for CI-friendly output');
  }
}

// CLI handling
async function main() {
  const isCI = process.argv.includes('--ci');

  try {
    const benchmarker = new MiddlewareBenchmarker();
    await benchmarker.runBenchmarks();
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}