import { SecurityHeadersMiddleware } from '../../src/security/security-headers.middleware';
import { TimeoutMiddleware } from '../../src/middleware/advanced/timeout.middleware';
import { CircuitBreakerMiddleware, CircuitBreakerService } from '../../src/middleware/advanced/circuit-breaker.middleware';
import { CorrelationIdMiddleware } from '../../src/monitoring/correlation-id.middleware';

describe('Middleware Benchmark Integration', () => {
  it('should instantiate all benchmarked middleware without errors', () => {
    // Test SecurityHeadersMiddleware
    const securityMiddleware = new SecurityHeadersMiddleware();
    expect(securityMiddleware).toBeDefined();
    expect(typeof securityMiddleware.use).toBe('function');

    // Test TimeoutMiddleware
    const timeoutMiddleware = new TimeoutMiddleware({ timeout: 5000 });
    expect(timeoutMiddleware).toBeDefined();
    expect(typeof timeoutMiddleware.use).toBe('function');

    // Test CircuitBreakerMiddleware
    const circuitBreakerService = new CircuitBreakerService({
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 10000
    });
    const circuitBreakerMiddleware = new CircuitBreakerMiddleware(circuitBreakerService);
    expect(circuitBreakerMiddleware).toBeDefined();
    expect(typeof circuitBreakerMiddleware.use).toBe('function');

    // Test CorrelationIdMiddleware
    const correlationMiddleware = new CorrelationIdMiddleware();
    expect(correlationMiddleware).toBeDefined();
    expect(typeof correlationMiddleware.use).toBe('function');
  });

  it('should have all required middleware exports', () => {
    // This test ensures the middleware are properly exported for benchmarking
    expect(SecurityHeadersMiddleware).toBeDefined();
    expect(TimeoutMiddleware).toBeDefined();
    expect(CircuitBreakerMiddleware).toBeDefined();
    expect(CircuitBreakerService).toBeDefined();
    expect(CorrelationIdMiddleware).toBeDefined();
  });
});