import { performance } from 'perf_hooks';
import { Request, Response, NextFunction } from 'express';

export interface MiddlewareTestOptions {
  middlewareName: string;
  requestCount: number;
  warmupRequests: number;
  gcAttempts: number;
}

export interface MockRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  query?: any;
  params?: any;
}

export interface MockResponse {
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
  setHeader: (name: string, value: string) => void;
  getHeaders: () => Record<string, string>;
  status: (code: number) => MockResponse;
  send: (body?: any) => void;
}

export interface MiddlewareFunction {
  (req: Request, res: Response, next: NextFunction): void | Promise<void>;
}

/**
 * Generic middleware test runner
 */
export class MiddlewareTestRunner {
  private createMockRequest(overrides: Partial<MockRequest> = {}): MockRequest {
    return {
      method: 'GET',
      path: '/test',
      headers: {
        'content-type': 'application/json',
        'user-agent': 'memory-test-runner',
        ...overrides.headers,
      },
      body: overrides.body,
      query: overrides.query,
      params: overrides.params,
      ...overrides,
    };
  }

  private createMockResponse(): MockResponse {
    const res: MockResponse = {
      statusCode: 200,
      headers: {},
      setHeader(name: string, value: string) {
        this.headers[name.toLowerCase()] = value;
      },
      getHeaders() {
        return { ...this.headers };
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      send(body?: any) {
        this.body = body;
      },
    };
    return res;
  }

  /**
   * Create a mock next function
   */
  private createMockNext(): jest.Mock {
    return jest.fn();
  }

  /**
   * Run middleware with mock request/response
   */
  async runMiddleware(
    middleware: MiddlewareFunction,
    request: MockRequest = {},
    responseOverrides: Partial<MockResponse> = {}
  ): Promise<{ req: MockRequest; res: MockResponse; next: jest.Mock }> {
    const req = this.createMockRequest(request);
    const res = { ...this.createMockResponse(), ...responseOverrides };
    const next = this.createMockNext();

    await middleware(req as Request, res as Response, next);

    return { req, res, next };
  }

  /**
   * Run multiple requests through middleware
   */
  async runMultipleRequests(
    middleware: MiddlewareFunction,
    count: number,
    requestFactory?: () => MockRequest
  ): Promise<void> {
    for (let i = 0; i < count; i++) {
      const request = requestFactory ? requestFactory() : {};
      await this.runMiddleware(middleware, request);
    }
  }

  /**
   * Measure execution time for middleware
   */
  async measureExecutionTime(
    middleware: MiddlewareFunction,
    request: MockRequest = {}
  ): Promise<{ duration: number; result: any }> {
    const start = performance.now();
    const result = await this.runMiddleware(middleware, request);
    const end = performance.now();
    
    return {
      duration: end - start,
      result,
    };
  }

  /**
   * Create request factories for different middleware types
   */
  static createRequestFactactories = {
    // JWT Auth middleware factory
    jwtAuth: (index: number) => ({
      method: 'GET',
      path: '/api/protected',
      headers: {
        'authorization': `Bearer mock.jwt.token.${index}`,
        'content-type': 'application/json',
      },
    }),

    // Correlation ID middleware factory
    correlationId: (index: number) => ({
      method: 'POST',
      path: '/api/test',
      headers: {
        'x-correlation-id': `test-correlation-${index}`,
        'content-type': 'application/json',
      },
      body: { data: `test-data-${index}` },
    }),

    // Idempotency middleware factory
    idempotency: (index: number) => ({
      method: 'POST',
      path: '/api/puzzles',
      headers: {
        'x-idempotency-key': `idempotency-key-${index}`,
        'content-type': 'application/json',
      },
      body: { puzzle: `puzzle-data-${index}` },
    }),

    // Security headers middleware factory
    securityHeaders: (index: number) => ({
      method: 'GET',
      path: '/api/public',
      headers: {
        'user-agent': `test-agent-${index}`,
        'content-type': 'application/json',
      },
    }),

    // Compression middleware factory
    compression: (index: number) => ({
      method: 'GET',
      path: '/api/large-data',
      headers: {
        'accept-encoding': 'gzip',
        'content-type': 'application/json',
      },
      body: { data: 'x'.repeat(1000) }, // Large payload
    }),

    // Circuit breaker middleware factory
    circuitBreaker: (index: number) => ({
      method: 'GET',
      path: '/api/external-service',
      headers: {
        'content-type': 'application/json',
      },
    }),

    // Timeout middleware factory
    timeout: (index: number) => ({
      method: 'POST',
      path: '/api/slow-operation',
      headers: {
        'content-type': 'application/json',
      },
      body: { delay: index % 2 === 0 ? 100 : 10 }, // Alternate between slow and fast
    }),
  };

  /**
   * Get appropriate request factory for middleware type
   */
  getRequestFactory(middlewareType: string): () => MockRequest {
    const factory = MiddlewareTestRunner.createRequestFactactories[middlewareType as keyof typeof MiddlewareTestRunner.createRequestFactactories];
    
    if (!factory) {
      return () => ({});
    }
    
    let index = 0;
    return () => {
      return factory(index++);
    };
  }

  /**
   * Validate middleware behavior after execution
   */
  validateMiddlewareResult(
    middlewareType: string,
    result: { req: MockRequest; res: MockResponse; next: jest.Mock }
  ): { passed: boolean; errors: string[] } {
    const errors: string[] = [];
    const { req, res, next } = result;

    switch (middlewareType) {
      case 'jwtAuth':
        if (!next.mock.calls.length) {
          errors.push('JWT Auth: next() was not called');
        }
        if (!(req as any).user) {
          errors.push('JWT Auth: user object not attached to request');
        }
        break;

      case 'correlationId':
        if (!next.mock.calls.length) {
          errors.push('Correlation ID: next() was not called');
        }
        if (!req.headers['x-correlation-id']) {
          errors.push('Correlation ID: correlation ID not set in request headers');
        }
        if (!res.getHeaders()['x-correlation-id']) {
          errors.push('Correlation ID: correlation ID not set in response headers');
        }
        break;

      case 'idempotency':
        if (!next.mock.calls.length) {
          errors.push('Idempotency: next() was not called');
        }
        if (typeof res.send !== 'function') {
          errors.push('Idempotency: response.send was not wrapped');
        }
        break;

      case 'securityHeaders':
        if (!next.mock.calls.length) {
          errors.push('Security Headers: next() was not called');
        }
        const securityHeaders = ['x-frame-options', 'x-content-type-options', 'x-xss-protection'];
        securityHeaders.forEach(header => {
          if (!res.getHeaders()[header]) {
            errors.push(`Security Headers: ${header} not set`);
          }
        });
        break;

      default:
        if (!next.mock.calls.length) {
          errors.push(`${middlewareType}: next() was not called`);
        }
        break;
    }

    return {
      passed: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate test report
   */
  generateTestReport(
    options: MiddlewareTestOptions,
    validationResults: { passed: boolean; errors: string[] }[]
  ): string {
    const passedCount = validationResults.filter(r => r.passed).length;
    const failedCount = validationResults.length - passedCount;

    let report = `\n# Middleware Test Report: ${options.middlewareName}\n`;
    report += `## Test Configuration\n`;
    report += `- Total Requests: ${options.requestCount}\n`;
    report += `- Warmup Requests: ${options.warmupRequests}\n`;
    report += `- GC Attempts: ${options.gcAttempts}\n\n`;

    report += `## Results\n`;
    report += `- **Passed**: ${passedCount}\n`;
    report += `- **Failed**: ${failedCount}\n`;
    report += `- **Success Rate**: ${((passedCount / validationResults.length) * 100).toFixed(2)}%\n\n`;

    if (failedCount > 0) {
      report += `## Errors\n`;
      validationResults.forEach((result, index) => {
        if (!result.passed) {
          report += `### Request ${index + 1}\n`;
          result.errors.forEach(error => {
            report += `- ${error}\n`;
          });
          report += `\n`;
        }
      });
    }

    return report;
  }
}
