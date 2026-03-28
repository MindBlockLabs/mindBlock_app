# Request Logger Plugin — First-Party Plugin Documentation

## Overview

The **Request Logger Plugin** is a production-ready HTTP request logging middleware provided by the MindBlock middleware team. It offers structured logging of all incoming requests with configurable verbosity, filtering, and correlation tracking.

**Key Features:**
- 🔍 Structured request logging with request ID correlation
- ⚙️ Highly configurable (log levels, filters, headers, body logging)
- 🎨 Color-coded output for terminal readability
- 🔐 Sensitive header filtering (auth, cookies, API keys)
- ⏱️ Response timing and latency tracking
- 📊 Support for custom request ID headers
- 🚫 Exclude paths from logging (health checks, metrics, etc.)
- 🔄 Runtime configuration changes via exports API

## Installation

The plugin is included with `@mindblock/middleware`. To use it:

```bash
npm install @mindblock/middleware
```

## Quick Start (5 Minutes)

### 1. Load and Activate the Plugin

```typescript
import { PluginRegistry } from '@mindblock/middleware';

const registry = new PluginRegistry();
await registry.init();

// Load the request logger plugin
const loggerPlugin = await registry.load('@mindblock/plugin-request-logger', {
  enabled: true,
  options: {
    logLevel: 'info',
    excludePaths: ['/health', '/metrics', '/favicon.ico'],
    logHeaders: false,
    logBody: false,
    colorize: true,
    requestIdHeader: 'x-request-id'
  }
});

// Get the middleware
const middleware = loggerPlugin.plugin.getMiddleware();

// Use it in your Express/NestJS app
app.use(middleware);

// Activate for full functionality
await registry.activate('@mindblock/plugin-request-logger');
```

### 2. Use in NestJS

```typescript
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { PluginRegistry } from '@mindblock/middleware';

@Module({})
export class AppModule implements NestModule {
  async configure(consumer: MiddlewareConsumer) {
    const registry = new PluginRegistry();
    await registry.init();

    const loggerPlugin = await registry.load('@mindblock/plugin-request-logger');
    const middleware = loggerPlugin.plugin.getMiddleware();

    consumer
      .apply(middleware)
      .forRoutes('*');
  }
}
```

### 3. Access Request Utilities

```typescript
import { Request } from 'express';

app.get('/api/data', (req: Request, res) => {
  // Get the request ID attached by the logger
  const requestId = (req as any).requestId;
  
  res.json({
    status: 'ok',
    requestId,
    message: 'All requests are logged'
  });
});
```

## Configuration

### Configuration Schema

```typescript
interface RequestLoggerConfig {
  enabled: boolean;
  options?: {
    // Logging verbosity: 'debug' | 'info' | 'warn' | 'error'
    logLevel?: 'debug' | 'info' | 'warn' | 'error';

    // Paths to exclude from logging
    // Supports glob patterns (wildcards)
    excludePaths?: string[];

    // Include request/response headers in logs
    logHeaders?: boolean;

    // Include request/response body in logs
    logBody?: boolean;

    // Maximum body content length to log (bytes)
    maxBodyLength?: number;

    // Add ANSI color codes to log output
    colorize?: boolean;

    // Header name for request correlation ID
    requestIdHeader?: string;
  };
}
```

### Default Configuration

```typescript
{
  enabled: true,
  options: {
    logLevel: 'info',
    excludePaths: ['/health', '/metrics', '/favicon.ico'],
    logHeaders: false,
    logBody: false,
    maxBodyLength: 500,
    colorize: true,
    requestIdHeader: 'x-request-id'
  }
}
```

## Log Output Examples

### Basic Request (Info Level)

```
[2025-03-28T10:15:23.456Z] req-1711610123456-abc7d3 GET /api/users 200 (45ms)
[2025-03-28T10:15:24.789Z] req-1711610124789-def9k2 POST /api/users 201 (120ms)
```

### With Query Parameters

```
[2025-03-28T10:15:25.123Z] req-1711610125123-ghi4m5 GET /api/users 200 (45ms) - Query: {"page":1,"limit":10}
```

### With Headers Logged

```
[2025-03-28T10:15:26.456Z] req-1711610126456-jkl8p9 GET /api/data 200 (78ms) - Headers: {"content-type":"application/json","user-agent":"Mozilla/5.0"}
```

### With Response Body

```
[2025-03-28T10:15:27.789Z] req-1711610127789-mno2r1 POST /api/users 201 (156ms) - Body: {"id":123,"name":"John","email":"john@example.com"}
```

### Error Request (Automatic Color Coding)

```
[2025-03-28T10:15:28.012Z] req-1711610128012-pqr5s3 DELETE /api/admin 403 (12ms)  ← Yellow (4xx)
[2025-03-28T10:15:29.345Z] req-1711610129345-stu8v6 GET /api/fail 500 (234ms)      ← Red (5xx)
```

## Log Levels

### `debug`
Log all requests with maximum verbosity. Useful for development and debugging.

### `info` (Default)
Log standard information for successful requests (2xx, 3xx) and client errors (4xx).

### `warn`
Log only client errors (4xx) and server errors (5xx).

### `error`
Log only server errors (5xx).

## Exclude Paths

Exclude paths from logging to reduce noise and improve performance:

```typescript
// Basic exclusion
excludePaths: ['/health', '/metrics', '/status']

// Glob pattern support
excludePaths: [
  '/health',
  '/metrics',
  '/api/internal/*',      // Exclude all internal API routes
  '*.js',                 // Exclude JS files
  '/admin/*'              // Exclude admin section
]
```

## Request ID Correlation

The plugin automatically extracts or generates request IDs for correlation:

### Automatic Extraction from Headers

By default, the plugin looks for `x-request-id` header:

```bash
curl http://localhost:3000/api/data \
  -H "x-request-id: req-abc-123"

# Log output:
# [2025-03-28T10:15:23.456Z] req-abc-123 GET /api/data 200 (45ms)
```

### Custom Header Name

Configure a different header name:

```typescript
options: {
  requestIdHeader: 'x-trace-id'
}

// Now looks for x-trace-id header
```

### Auto-Generated IDs

If the header is not present, the plugin generates one:

```
req-1711610123456-abc7d3
├── req prefix
├── timestamp
└── random identifier
```

## Sensitive Header Filtering

The plugin automatically filters sensitive headers to prevent logging credentials:

**Filtered Headers:**
- `authorization`
- `cookie`
- `x-api-key`
- `x-auth-token`
- `password`

These headers are never logged even if `logHeaders: true`.

## Runtime Configuration Changes

### Change Log Level Dynamically

```typescript
const registry = new PluginRegistry();
await registry.init();

const loggerPlugin = await registry.load('@mindblock/plugin-request-logger');
const exports = loggerPlugin.plugin.getExports();

// Change log level at runtime
exports.setLogLevel('debug');
console.log(exports.getLogLevel()); // 'debug'
```

### Manage Excluded Paths at Runtime

```typescript
const exports = loggerPlugin.plugin.getExports();

// Add excluded paths
exports.addExcludePaths('/api/private', '/admin/secret');

// Remove excluded paths
exports.removeExcludePaths('/health');

// Get all excluded paths
const excluded = exports.getExcludePaths();
console.log(excluded); // ['/metrics', '/status', '/api/private', ...]

// Clear all exclusions
exports.clearExcludePaths();
```

### Extract Request ID from Request Object

```typescript
app.get('/api/data', (req: Request, res) => {
  const requestId = (req as any).requestId;

  // Or use the exported utility
  const registry = getRegistry(); // Your registry instance
  const loggerPlugin = registry.getPlugin('@mindblock/plugin-request-logger');
  const exports = loggerPlugin.getExports();
  
  const extractedId = exports.getRequestId(req);

  res.json({ requestId: extractedId });
});
```

## Advanced Usage Patterns

### Pattern 1: Development vs Production

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

const config = {
  enabled: true,
  options: {
    logLevel: isDevelopment ? 'debug' : 'info',
    logHeaders: isDevelopment,
    logBody: isDevelopment,
    excludePaths: isDevelopment 
      ? ['/health']
      : ['/health', '/metrics', '/status', '/internal/*'],
    colorize: isDevelopment
  }
};

const loggerPlugin = await registry.load('@mindblock/plugin-request-logger', config);
```

### Pattern 2: Conditional Body Logging

```typescript
// Enable body logging only for POST/PUT requests
const registry = new PluginRegistry();
const loggerPlugin = await registry.load('@mindblock/plugin-request-logger', {
  enabled: true,
  options: {
    logBody: false,
    logHeaders: false
  }
});

const exports = loggerPlugin.plugin.getExports();

// Custom middleware wrapper
app.use((req, res, next) => {
  if (['POST', 'PUT'].includes(req.method)) {
    exports.setLogLevel('debug'); // More verbose for mutations
  } else {
    exports.setLogLevel('info');
  }
  next();
});

app.use(loggerPlugin.plugin.getMiddleware());
```

### Pattern 3: Request ID Propagation

```typescript
// Extract request ID and use in downstream services
const exports = loggerPlugin.plugin.getExports();

app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = exports.getRequestId(req);
  
  // Set response header for client correlation
  res.setHeader('x-request-id', requestId);
  
  // Store in request context for services
  (req as any).requestId = requestId;
  
  next();
});
```

## Best Practices

### 1. **Strategic Path Exclusion**

Exclude high-frequency, low-value paths:

```typescript
excludePaths: [
  '/health',
  '/healthz',
  '/metrics',
  '/status',
  '/ping',
  '/robots.txt',
  '/favicon.ico',
  '/.well-known/*',
  '/assets/*'
]
```

### 2. **Use Appropriate Log Levels**

- **Development**: Use `debug` for maximum visibility
- **Staging**: Use `info` for balanced verbosity
- **Production**: Use `warn` or `info` with selective body logging

### 3. **Avoid Logging Sensitive Paths**

```typescript
excludePaths: [
  '/auth/login',
  '/auth/password-reset',
  '/users/*/password',
  '/api/secrets/*'
]
```

### 4. **Limit Body Logging Size**

```typescript
options: {
  logBody: true,
  maxBodyLength: 500  // Prevent logging huge payloads
}
```

### 5. **Use Request IDs Consistently**

Pass request ID to child services:

```typescript
const requestId = (req as any).requestId;

// In your service calls
const result = await externalService.fetch('/endpoint', {
  headers: {
    'x-request-id': requestId,
    'x-trace-id': requestId
  }
});
```

## Troubleshooting

### Issue: Request IDs Not Being Generated

**Symptom:** Logs show random IDs instead of custom ones

**Solution:** Ensure the header name matches:

```typescript
// If sending header as:
headers: { 'X-Custom-Request-ID': 'my-req-123' }

// Configure plugin as:
options: { requestIdHeader: 'x-custom-request-id' } // Headers are case-insensitive
```

### Issue: Too Much Logging

**Symptom:** Logs are generating too much output

**Solution:** Adjust log level and exclude more paths:

```typescript
options: {
  logLevel: 'warn',  // Only 4xx and 5xx
  excludePaths: [
    '/health',
    '/metrics',
    '/status',
    '/api/internal/*'
  ]
}
```

### Issue: Missing Request Body in Logs

**Symptom:** Body logging enabled but not showing in logs

**Solution:** Ensure middleware is placed early in the middleware chain:

```typescript
// ✓ Correct: Logger early
app.use(requestLoggerMiddleware);
app.use(bodyParser.json());

// ✗ Wrong: Logger after bodyParser
app.use(bodyParser.json());
app.use(requestLoggerMiddleware);
```

### Issue: Performance Impact

**Symptom:** Requests are slower with logger enabled

**Solution:** Disable unnecessary features:

```typescript
options: {
  logLevel: 'info',      // Not debug
  logHeaders: false,     // Unless needed
  logBody: false,        // Unless needed
  colorize: false        // Terminal colors cost CPU
}
```

## Performance Considerations

| Feature | Impact | Recommendation |
|---------|--------|-----------------|
| `logLevel: 'debug'` | ~2-3% | Development only |
| `logHeaders: true` | ~1-2% | Development/staging |
| `logBody: true` | ~2-5% | Selective use |
| `colorize: true` | ~1% | Accept cost |
| Exclude patterns | ~0.5% | Use wildcards sparingly |

**Typical overhead:** < 1% with default configuration

## Plugin Lifecycle Events

### onLoad
- Fired when plugin DLL is loaded
- Use for initializing internal state

### onInit
- Fired with configuration
- Apply config to middleware behavior
- Validate configuration

### onActivate
- Fired when middleware is activated
- Ready for request processing

### onDeactivate
- Fired when middleware is deactivated
- Cleanup if needed

### onUnload
- Fired when plugin is unloaded
- Final cleanup

## Examples

### Example 1: Basic Setup

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PluginRegistry } from '@mindblock/middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Setup request logger
  const registry = new PluginRegistry();
  await registry.init();

  const loggerPlugin = await registry.load('@mindblock/plugin-request-logger', {
    enabled: true,
    options: {
      logLevel: 'info',
      excludePaths: ['/health', '/metrics']
    }
  });

  const middleware = loggerPlugin.plugin.getMiddleware();
  app.use(middleware);
  await registry.activate('@mindblock/plugin-request-logger');

  await app.listen(3000);
}

bootstrap();
```

### Example 2: Production Configuration

```typescript
const loggerPlugin = await registry.load('@mindblock/plugin-request-logger', {
  enabled: true,
  options: {
    logLevel: 'warn',  // Only errors and client errors
    excludePaths: [
      '/health',
      '/healthz',
      '/metrics',
      '/status',
      '/ping',
      '/*.js',
      '/*.css',
      '/assets/*'
    ],
    logHeaders: false,
    logBody: false,
    colorize: false,   // No ANSI colors in production logs
    requestIdHeader: 'x-request-id'
  }
});
```

### Example 3: Debug with Full Context

```typescript
const loggerPlugin = await registry.load('@mindblock/plugin-request-logger', {
  enabled: true,
  options: {
    logLevel: 'debug',
    excludePaths: ['/health'],
    logHeaders: true,
    logBody: true,
    maxBodyLength: 2000,
    colorize: true,
    requestIdHeader: 'x-trace-id'
  }
});
```

## Metadata

| Property | Value |
|----------|-------|
| **ID** | `@mindblock/plugin-request-logger` |
| **Name** | Request Logger |
| **Version** | 1.0.0 |
| **Author** | MindBlock Team |
| **Type** | First-Party |
| **Priority** | 100 (High - runs early) |
| **Dependencies** | None |
| **Breaking Changes** | None |

## Support & Feedback

For issues, suggestions, or feedback about the Request Logger plugin:

1. Check this documentation
2. Review troubleshooting section
3. Submit an issue to the repository
4. Contact the MindBlock team

---

**Last Updated:** March 28, 2025  
**Status:** Production Ready ✓
