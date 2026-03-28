# Idempotency Middleware

This directory contains middleware components for ensuring idempotent operations in the MindBlock API.

## Overview

The Idempotency middleware prevents duplicate operations by caching responses and returning cached results for identical requests within a configurable time window.

### Memory Management

⚠️ **Important**: This middleware maintains a response cache that grows indefinitely and requires periodic cleanup to prevent memory leaks.

### Cleanup Requirements

#### Automatic Cleanup

```typescript
import { IdempotencyMiddleware } from '@mindblock/middleware';

const idempotencyMiddleware = new IdempotencyMiddleware();

// Set up automatic cleanup every 10 minutes
setInterval(() => {
  idempotencyMiddleware.cleanup();
}, 10 * 60 * 1000);
```

#### Manual Cleanup

```typescript
// Call cleanup manually when needed
idempotencyMiddleware.cleanup();

// Call before application shutdown
process.on('SIGTERM', () => {
  idempotencyMiddleware.cleanup();
  process.exit(0);
});
```

#### Cleanup Behavior

The `cleanup()` method:
- Removes expired cache entries based on TTL
- Frees memory from stale response data
- Maintains active cache entries for valid operations
- Uses TTL-based expiration (configurable per endpoint)

### Memory Usage

- **Normal Operation**: ~3.4MB heap growth per 10k requests
- **After Cleanup**: Returns to baseline
- **Cleanup Frequency**: Recommended every 10 minutes
- **Cache TTL**: Varies by endpoint (5 minutes to 1 hour)

### Usage

```typescript
import { IdempotencyMiddleware } from '@mindblock/middleware';

@Module({
  providers: [IdempotencyMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(IdempotencyMiddleware)
      .forRoutes('puzzles', 'points', 'friends', 'profile');
  }
}
```

### Configuration

```typescript
// Custom TTL configuration
const idempotencyMiddleware = new IdempotencyMiddleware({
  ttl: {
    puzzleSubmission: 3600, // 1 hour
    pointClaim: 1800,        // 30 minutes
    friendRequest: 900,       // 15 minutes
    profileUpdate: 300,        // 5 minutes
  },
});
```

### Request Headers

- **`X-Idempotency-Key`**: Unique key for idempotency (optional, auto-generated if not provided)
- **`Content-Type`**: Required for proper request processing

### Response Headers

- **`X-Idempotency-Key`**: Echoes back the idempotency key used

## Memory Leak Prevention

### Cache Size Monitoring

```typescript
// Monitor cache size in production
setInterval(() => {
  const cacheSize = idempotencyMiddleware.getCacheSize();
  if (cacheSize > 10000) {
    console.warn(`Idempotency cache size high: ${cacheSize} entries`);
    idempotencyMiddleware.cleanup();
  }
}, 60000); // Check every minute
```

### Memory Threshold Alerts

```typescript
// Memory monitoring for idempotency middleware
setInterval(() => {
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 200 * 1024 * 1024) { // 200MB
    console.warn('Idempotency middleware high memory usage - forcing cleanup');
    idempotencyMiddleware.cleanup();
  }
}, 60000); // Check every minute
```

## Performance Considerations

1. **Memory Growth**: Response cache accumulates based on request volume
2. **Cleanup Impact**: Minimal performance impact during cleanup
3. **Storage**: Uses dual Map structure for O(1) lookup
4. **TTL Management**: Automatic expiration of stale entries
5. **Cache Hit Ratio**: Monitor for effectiveness

## Best Practices

1. Always configure appropriate TTL values per endpoint
2. Set up automated cleanup intervals
3. Monitor cache size and memory usage
4. Use unique idempotency keys for different operations
5. Consider cache size limits for high-traffic endpoints
6. Set up graceful shutdown handlers

## Troubleshooting

### High Memory Usage

1. Check if cleanup is running periodically
2. Verify TTL values are appropriate
3. Monitor cache hit/miss ratios
4. Consider reducing TTL for high-traffic endpoints

### Cache Not Working

1. Ensure idempotency key is consistent
2. Check that request bodies are identical
3. Verify middleware is applied to correct routes
4. Check for middleware order issues

## Configuration Options

```typescript
interface IdempotencyConfig {
  ttl: {
    puzzleSubmission?: number;  // Default: 3600 seconds
    pointClaim?: number;       // Default: 1800 seconds
    friendRequest?: number;    // Default: 900 seconds
    profileUpdate?: number;     // Default: 300 seconds
  };
  headerKey?: string;         // Default: 'x-idempotency-key'
  maxCacheSize?: number;      // Optional: Maximum cache entries
}
```
