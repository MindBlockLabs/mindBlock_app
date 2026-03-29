# Advanced Middleware

This directory contains advanced middleware components for reliability and performance optimization in the MindBlock API.

## Circuit Breaker Middleware

### Overview

The Circuit Breaker middleware protects against cascading failures by automatically stopping requests to failing services and providing fallback responses.

### Memory Management

⚠️ **Important**: This middleware maintains a request history for circuit breaker state management and requires periodic cleanup to prevent memory leaks.

### Cleanup Requirements

#### Automatic Cleanup

```typescript
import { CircuitBreakerMiddleware } from '@mindblock/middleware';

const circuitBreaker = new CircuitBreakerMiddleware({
  failureThreshold: 5,
  resetTimeout: 60000,
});

// Set up automatic cleanup every 5 minutes
setInterval(() => {
  circuitBreaker.cleanup();
}, 5 * 60 * 1000);
```

#### Manual Cleanup

```typescript
// Call cleanup manually when needed
circuitBreaker.cleanup();

// Call before application shutdown
process.on('SIGTERM', () => {
  circuitBreaker.cleanup();
  process.exit(0);
});
```

#### Cleanup Behavior

The `cleanup()` method:
- Removes old request history entries
- Resets counters for stale data
- Maintains recent failure/success statistics
- Preserves current circuit breaker state

### Memory Usage

- **Normal Operation**: ~1.8MB heap growth per 10k requests
- **After Cleanup**: Returns to baseline
- **Cleanup Frequency**: Recommended every 5 minutes
- **History Window**: Default 5 minutes of request history

### Usage

```typescript
import { CircuitBreakerMiddleware } from '@mindblock/middleware';

@Module({
  providers: [CircuitBreakerMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CircuitBreakerMiddleware)
      .forRoutes('external-service', 'api-gateway');
  }
}
```

### Configuration

```typescript
const circuitBreaker = new CircuitBreakerMiddleware({
  failureThreshold: 5,        // Open circuit after 5 failures
  resetTimeout: 60000,        // Try again after 60 seconds
  monitoringPeriod: 300000,   // Monitor last 5 minutes
  halfOpenMaxCalls: 3,        // Allow 3 calls in half-open state
});
```

## Timeout Middleware

### Overview

The Timeout middleware prevents hanging requests by setting a maximum execution time and automatically terminating long-running operations.

### Memory Management

✅ **Clean**: The Timeout middleware does not maintain state and does not require cleanup.

### Usage

```typescript
import { TimeoutMiddleware } from '@mindblock/middleware';

@Module({
  providers: [TimeoutMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TimeoutMiddleware)
      .forRoutes('slow-operations', 'external-calls');
  }
}
```

### Configuration

```typescript
const timeout = new TimeoutMiddleware({
  timeout: 30000,  // 30 seconds timeout
  handler: (req, res) => {
    res.status(408).json({ error: 'Request timeout' });
  },
});
```

## Memory Leak Prevention

### Circuit Breaker Monitoring

```typescript
// Monitor circuit breaker memory usage
setInterval(() => {
  const historySize = circuitBreaker.getHistorySize();
  if (historySize > 10000) {
    console.warn(`Circuit breaker history size high: ${historySize} entries`);
    circuitBreaker.cleanup();
  }
}, 60000); // Check every minute
```

### Memory Threshold Alerts

```typescript
// Memory monitoring for circuit breaker
setInterval(() => {
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 150 * 1024 * 1024) { // 150MB
    console.warn('Circuit breaker high memory usage - forcing cleanup');
    circuitBreaker.cleanup();
  }
}, 60000); // Check every minute
```

## Performance Considerations

### Circuit Breaker

1. **Memory Growth**: Request history accumulates based on traffic
2. **Cleanup Impact**: Minimal performance impact during cleanup
3. **State Management**: O(1) state transitions
4. **History Window**: Configurable monitoring period
5. **Failure Tracking**: Efficient counter-based tracking

### Timeout Middleware

1. **No Memory Leaks**: Uses timer-based approach without state retention
2. **Low Overhead**: Minimal performance impact
3. **Timer Management**: Automatic cleanup of expired timers
4. **Resource Cleanup**: Proper cleanup on request completion

## Best Practices

### Circuit Breaker

1. Configure appropriate failure thresholds for your services
2. Set up automated cleanup intervals
3. Monitor circuit breaker state changes
4. Use different configurations for different services
5. Set up graceful shutdown handlers
6. Monitor request history size

### Timeout Middleware

1. Set appropriate timeout values per endpoint
2. Consider different timeouts for different operations
3. Monitor timeout frequency
4. Handle timeout errors gracefully
5. Log timeout events for analysis

## Troubleshooting

### Circuit Breaker Issues

1. **Circuit Always Open**: Check failure threshold configuration
2. **Slow Recovery**: Verify reset timeout settings
3. **High Memory Usage**: Ensure cleanup is running
4. **False Positives**: Adjust monitoring period

### Timeout Issues

1. **Too Many Timeouts**: Increase timeout values
2. **Resource Leaks**: Ensure proper cleanup in handlers
3. **Performance Impact**: Monitor timeout frequency

## Configuration Options

### Circuit Breaker

```typescript
interface CircuitBreakerConfig {
  failureThreshold?: number;     // Default: 5
  resetTimeout?: number;         // Default: 60000ms
  monitoringPeriod?: number;     // Default: 300000ms
  halfOpenMaxCalls?: number;     // Default: 3
  errorHandler?: (error: Error) => void;
}
```

### Timeout Middleware

```typescript
interface TimeoutConfig {
  timeout?: number;              // Default: 30000ms
  handler?: (req: Request, res: Response) => void;
  onTimeout?: (req: Request) => void;
}
```
