# Middleware Testing Guide

This document explains the testing structure, utilities, and best practices for the MindBlock middleware package.

## Table of Contents

- [Test Tiers](#test-tiers)
- [Running Tests](#running-tests)
- [Test Utilities](#test-utilities)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)

## Test Tiers

We use three tiers of testing to ensure comprehensive coverage at different levels:

### Unit Tests (`tests/unit/`)

**Purpose**: Test individual components in isolation

**Configuration**: `jest.unit.config.ts`

**Coverage Thresholds**:
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

**When to use**: 
- Testing pure functions
- Testing class methods with mocked dependencies
- Testing middleware logic without full NestJS app

**Example**:
```typescript
import { PluginManager } from '../../../src/common/plugin.manager';

describe('PluginManager', () => {
  it('should register a plugin successfully', () => {
    const manager = new PluginManager();
    expect(manager.hasPlugin('TestPlugin')).toBe(false);
  });
});
```

### Integration Tests (`tests/integration/`)

**Purpose**: Test interactions between multiple components

**Configuration**: `jest.integration.config.ts`

**Coverage Thresholds**:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

**Timeout**: 10 seconds

**When to use**:
- Testing middleware chains
- Testing services with their dependencies
- Testing plugin lifecycle with PluginManager

**Example**:
```typescript
import { createTestApp } from '../utils/create-test-app';
import { MetricsMiddleware } from '../../src/monitoring/metrics.middleware';

describe('MetricsMiddleware Integration', () => {
  it('should track requests across middleware chain', async () => {
    const app = await createTestApp({
      middlewares: [MetricsMiddleware],
    });
    
    await app.init();
    // ... test integration
    await app.close();
  });
});
```

### E2E Tests (`tests/e2e/`)

**Purpose**: Test complete application flows

**Configuration**: `jest.e2e.config.ts`

**Coverage Thresholds**:
- Branches: 60%
- Functions: 60%
- Lines: 60%
- Statements: 60%

**Timeout**: 30 seconds

**When to use**:
- Testing full HTTP request/response cycles
- Testing multiple middleware working together
- Testing real-world scenarios

**Example**:
```typescript
import { createTestApp, createTestRequest } from '../utils';
import { PrometheusMetricsPlugin } from '../../src/monitoring/prometheus.plugin';

describe('Prometheus Metrics E2E', () => {
  it('should expose /metrics endpoint with valid format', async () => {
    const plugin = new PrometheusMetricsPlugin();
    await plugin.onInit();
    
    const app = await createTestApp({
      providers: [plugin],
    });
    
    await app.init();
    const request = createTestRequest(app);
    
    await request.get('/metrics')
      .expect(200)
      .expect('Content-Type', /text\/plain/);
    
    await app.close();
  });
});
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test tier
```bash
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:e2e           # E2E tests only
```

### Run with coverage
```bash
npm run test:cov            # All tests with coverage
npm run test:unit:cov       # Unit tests with coverage
npm run test:integration:cov # Integration tests with coverage
npm run test:e2e:cov        # E2E tests with coverage
```

### Watch mode
```bash
npm run test:watch
```

## Test Utilities

### Mock Factories

Located in `tests/utils/mock-express.ts`

#### `mockRequest(overrides?)`
Create a typed mock Express request object.

```typescript
import { mockRequest } from '../utils';

const req = mockRequest({
  method: 'POST',
  path: '/api/users',
  body: { name: 'John' },
});
```

#### `mockResponse(overrides?)`
Create a typed mock Express response object.

```typescript
import { mockResponse } from '../utils';

const res = mockResponse();
res.status.mockReturnValue(res); // Chainable

// Check if status was called
expect(res.status).toHaveBeenCalledWith(200);
```

#### `mockNext()`
Create a typed mock next function.

```typescript
import { mockNext } from '../utils';

const next = mockNext();
middleware(req, res, next);
expect(next).toHaveBeenCalled();
```

#### `createMiddlewareTestContext(overrides?)`
Create complete test context for middleware testing.

```typescript
import { createMiddlewareTestContext } from '../utils';

const { req, res, next } = createMiddlewareTestContext({
  req: { method: 'POST' },
  res: { statusCode: 201 },
});
```

### Test App Factory

Located in `tests/utils/create-test-app.ts`

#### `createTestApp(options)`
Create a minimal NestJS test application.

```typescript
import { createTestApp } from '../utils';

const app = await createTestApp({
  middlewares: [SomeMiddleware],
  providers: [SomeService],
  controllers: [SomeController],
});

await app.init();
// ... run tests
await app.close();
```

#### `createMockExecutionContext(handler?, type?)`
Create a mock execution context for testing guards/interceptors.

```typescript
import { createMockExecutionContext } from '../utils';

const context = createMockExecutionContext(null, 'http');
guard.canActivate(context);
```

#### `createTestRequest(app)`
Create a supertest wrapper for testing HTTP endpoints.

```typescript
import { createTestApp, createTestRequest } from '../utils';

const app = await createTestApp({ controllers: [MyController] });
await app.init();

const request = createTestRequest(app);
await request.get('/users').expect(200);

await app.close();
```

## Writing Tests

### File Naming Conventions

- Unit tests: `*.test.ts` or `*.spec.ts` in `tests/unit/`
- Integration tests: `*.test.ts` or `*.spec.ts` in `tests/integration/`
- E2E tests: `*.test.ts` or `*.spec.ts` in `tests/e2e/`

### Test Structure

```typescript
describe('ComponentName', () => {
  let component: ComponentName;

  beforeEach(() => {
    component = new ComponentName();
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      const input = 'test';

      // Act
      const result = await component.methodName(input);

      // Assert
      expect(result).toBe('expected');
    });

    it('should handle edge case', async () => {
      // Test edge cases
    });
  });
});
```

## Best Practices

### 1. Use Typed Mocks
Always use our typed mock factories instead of plain objects:

```typescript
// ✅ Good
const { req, res, next } = createMiddlewareTestContext();

// ❌ Bad
const req = { method: 'GET' };
```

### 2. Test Edge Cases
Don't just test the happy path:

```typescript
it('should handle empty input', () => {});
it('should handle null values', () => {});
it('should handle malformed data', () => {});
```

### 3. Keep Tests Isolated
Each test should be independent:

```typescript
beforeEach(() => {
  // Reset state
});

afterEach(async () => {
  // Cleanup
});
```

### 4. Use Descriptive Test Names
Test names should describe behavior:

```typescript
// ✅ Good
it('should reject duplicate plugin registration', () => {});

// ❌ Bad
it('test duplicate', () => {});
```

### 5. Test Async Code Properly
Always await promises and handle errors:

```typescript
it('should throw on invalid input', async () => {
  await expect(component.invalidMethod()).rejects.toThrow('Error message');
});
```

### 6. Mock External Dependencies
Isolate the unit under test:

```typescript
const mockService = {
  getData: jest.fn().mockResolvedValue({ id: 1 }),
};
```

### 7. Clean Up Resources
Always close apps and clear mocks:

```typescript
afterEach(async () => {
  await app.close();
  jest.clearAllMocks();
});
```

## Debugging Tests

### Run single test file
```bash
npx jest tests/unit/specific.test.ts
```

### Run test by pattern
```bash
npx jest -t "should register plugin"
```

### Debug with verbose output
```bash
npx jest --verbose
```

### Watch specific file
```bash
npx jest --watch tests/unit/specific.test.ts
```

## Coverage Reports

View HTML coverage report:
```bash
npm run test:unit:cov
open coverage/unit/index.html
```

## Troubleshooting

### Tests running slow
- Check if you're properly closing apps in `afterEach`
- Reduce timeouts in integration/E2E tests if possible
- Mock heavy external dependencies

### Type errors in tests
- Ensure you're using typed mock factories
- Import types from correct locations
- Check that devDependencies are installed

### Coverage not meeting thresholds
- Run coverage report to see uncovered lines
- Add tests for edge cases
- Test error handling paths
