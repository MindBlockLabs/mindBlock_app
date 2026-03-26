# Conditional Middleware Utilities

This module provides higher-order middleware wrappers that allow you to conditionally apply middleware based on route patterns.

## Installation

The utilities are exported from `src/index.ts`:

```typescript
import { unless, onlyFor, RoutePattern } from '@/index';
```

## Usage

### `unless(middleware, excludePatterns)`

Skips middleware execution for routes matching the provided patterns.

```typescript
import { unless } from '@/index';
import { CorrelationIdMiddleware } from './correlation-id.middleware';

// Skip correlation ID for health and metrics endpoints
const conditionalMiddleware = unless(
  new CorrelationIdMiddleware(),
  ['/health', '/metrics', '/api/*/health']
);

// Apply in your module
app.use(conditionalMiddleware.use.bind(conditionalMiddleware));
```

### `onlyFor(middleware, includePatterns)`

Executes middleware only for routes matching the provided patterns.

```typescript
import { onlyFor } from '@/index';
import { AuthMiddleware } from './auth.middleware';

// Apply auth middleware only to admin routes
const conditionalMiddleware = onlyFor(
  new AuthMiddleware(),
  ['/api/admin/*', '/admin/**']
);

// Apply in your module
app.use(conditionalMiddleware.use.bind(conditionalMiddleware));
```

## Pattern Types

The utilities support three types of patterns:

### 1. Exact Strings
```typescript
unless(middleware, '/health')
```

### 2. Regular Expressions
```typescript
unless(middleware, /^\/api\/v\d+\/status$/)
```

### 3. Glob Patterns
```typescript
unless(middleware, [
  '/api/*/metrics',
  '/static/**',
  '/admin/**/users/**'
])
```

## Examples

### Skip middleware for static assets
```typescript
const conditionalMiddleware = unless(
  new LoggingMiddleware(),
  [
    '/static/**',
    '/assets/**',
    '/**/*.css',
    '/**/*.js',
    '/**/*.png',
    '/**/*.jpg'
  ]
);
```

### Apply middleware only to API routes
```typescript
const conditionalMiddleware = onlyFor(
  new RateLimitMiddleware(),
  [
    '/api/**',
    '!/api/docs/**'  // Exclude API docs
  ]
);
```

### Complex routing scenarios
```typescript
// Skip authentication for public routes
const publicRoutes = [
  '/health',
  '/metrics',
  '/auth/login',
  '/auth/register',
  '/public/**',
  '/api/v1/public/**'
];

const conditionalAuth = unless(
  new AuthMiddleware(),
  publicRoutes
);
```

## Performance

The conditional middleware is designed to have minimal overhead:

- Zero overhead for non-matching routes (early return)
- Efficient pattern matching using micromatch
- Stateless implementation
- No memory leaks

## Error Handling

The utilities gracefully handle:

- Invalid patterns (treated as non-matching)
- Null/undefined patterns (treated as non-matching)
- Malformed regex patterns (fallback to string comparison)
- Empty pattern arrays (treated as non-matching)

## TypeScript Support

Full TypeScript support with proper type definitions:

```typescript
import { RoutePattern } from '@/index';

const patterns: RoutePattern = [
  '/api/users',           // string
  /^\/api\/v\d+/,        // regex
  '/admin/**'            // glob
];
```
