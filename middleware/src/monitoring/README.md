# Monitoring Middleware

This directory contains middleware components for monitoring and observability in the MindBlock API.

## Correlation ID Middleware

### Overview

The Correlation ID middleware generates and propagates correlation IDs across requests for distributed tracing and logging.

### Memory Management

⚠️ **Important**: This middleware maintains an internal storage of correlation IDs and requires periodic cleanup to prevent memory leaks.

### Cleanup Requirements

#### Automatic Cleanup

```typescript
import { CorrelationIdMiddleware } from '@mindblock/middleware';

const correlationMiddleware = new CorrelationIdMiddleware();

// Set up automatic cleanup every 5 minutes
setInterval(() => {
  correlationMiddleware.cleanup();
}, 5 * 60 * 1000);
```

#### Manual Cleanup

```typescript
// Call cleanup manually when needed
correlationMiddleware.cleanup();

// Call before application shutdown
process.on('SIGTERM', () => {
  correlationMiddleware.cleanup();
  process.exit(0);
});
```

#### Cleanup Behavior

The `cleanup()` method:
- Removes correlation entries older than 5 minutes
- Frees memory from expired correlation contexts
- Maintains active correlation IDs for ongoing requests

### Memory Usage

- **Normal Operation**: ~2MB heap growth per 10k requests
- **After Cleanup**: Returns to baseline
- **Cleanup Frequency**: Recommended every 5 minutes

### Usage

```typescript
import { CorrelationIdMiddleware } from '@mindblock/middleware';

@Module({
  providers: [CorrelationIdMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes('*');
  }
}
```

### Monitoring

Monitor memory usage in production:

```typescript
// Memory monitoring for correlation middleware
setInterval(() => {
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.warn('Correlation middleware high memory usage - consider cleanup');
  }
}, 60000); // Check every minute
```

## Other Monitoring Components

### Correlation Exception Filter
Handles exceptions with correlation ID context.

### Correlation HTTP Interceptor
Adds correlation IDs to outgoing HTTP requests.

### Correlation Logger Service
Enhanced logging with correlation context.

### Correlation Propagation Utils
Utilities for correlation ID propagation across services.

## Performance Considerations

1. **Memory Growth**: Correlation IDs accumulate in memory
2. **Cleanup Impact**: Minimal performance impact during cleanup
3. **Storage**: Uses Map for O(1) lookup performance
4. **TTL**: Default 5-minute retention for correlation entries

## Best Practices

1. Always call `cleanup()` periodically in production
2. Monitor memory usage of correlation storage
3. Consider using WeakMap for request-scoped data when possible
4. Set up graceful shutdown handlers
5. Use automated cleanup intervals
