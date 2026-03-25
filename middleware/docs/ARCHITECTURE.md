# Middleware Architecture Documentation

## Overview

### Purpose of the Middleware Package

The `@mindblock/middleware` package provides a comprehensive, framework-agnostic collection of middleware components designed to handle cross-cutting concerns in web applications. This package enables consistent security, performance, monitoring, and validation behaviors across different services and applications within the Mind Block ecosystem.

### Why Middleware is Separated from Backend

The middleware package is intentionally separated from the main backend application for several key reasons:

1. **Reusability**: Middleware components can be shared across multiple backend services, microservices, and even different frameworks
2. **Testability**: Isolated middleware is easier to unit test and integrate test without coupling to application-specific logic
3. **Versioning**: Middleware can evolve independently of the main application, allowing for incremental updates and backward compatibility
4. **Maintainability**: Clear separation of concerns makes it easier to maintain, debug, and extend middleware functionality
5. **Performance**: Shared middleware can be optimized once and benefit all consuming applications

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    @mindblock/middleware                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   Auth   │ │ Security │ │Performance│ │Monitoring │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │Validation │ │  Common  │ │  Config  │ │   Index  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
├─────────────────────────────────────────────────────────────┤
│                    Export Interface                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Unified exports from all categories                  │  │
│  │ Individual category exports for tree-shaking        │  │
│  │ Type definitions and interfaces                      │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Framework Agnostic**: Middleware components work with Express, Fastify, Koa, and other Node.js frameworks
2. **Composable**: Middleware can be chained and combined in different orders based on application needs
3. **Configurable**: All middleware supports runtime configuration through environment variables or config objects
4. **Performance Optimized**: Minimal overhead, async-friendly, and non-blocking where possible
5. **Type Safe**: Full TypeScript support with comprehensive type definitions
6. **Testable**: Each middleware component is easily mockable and testable

## Middleware Categories

### Authentication (`auth/`)

#### Purpose
Handle user authentication and authorization workflows, including token validation, session management, and access control.

#### Examples
- **JWT Validation Middleware**: Verify JWT tokens, extract user claims, and attach user context to requests
- **API Key Authentication**: Validate API keys for service-to-service communication
- **Session Middleware**: Manage user sessions, handle session expiration, and provide session context
- **OAuth Integration**: Support for OAuth 2.0 flows and token exchange

#### When to Add New Auth Middleware
Add new auth middleware when you need to:
- Support a new authentication method (e.g., SAML, LDAP)
- Implement custom token validation logic
- Handle multi-factor authentication flows
- Integrate with external identity providers

```typescript
// Example: JWT Authentication Middleware
export class JwtAuthMiddleware {
  constructor(private config: JwtAuthConfig) {}
  
  async handle(req: Request, res: Response, next: NextFunction) {
    const token = this.extractToken(req);
    if (!token) return res.status(401).json({ error: 'No token provided' });
    
    try {
      const payload = await this.verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}
```

### Security (`security/`)

#### Purpose
Protect against common security threats and enforce security policies across all HTTP requests.

#### Examples
- **CORS Middleware**: Handle cross-origin resource sharing with configurable origins and methods
- **Rate Limiting**: Prevent abuse and DoS attacks with configurable rate limits
- **Security Headers**: Add security-related HTTP headers (HSTS, CSP, X-Frame-Options, etc.)
- **Input Sanitization**: Prevent XSS and injection attacks through input sanitization
- **CSRF Protection**: Implement Cross-Site Request Forgery protection tokens

#### Common Security Patterns
1. **Defense in Depth**: Multiple layers of security checks
2. **Fail Secure**: Default to secure behavior when configuration is missing
3. **Least Privilege**: Grant minimum necessary permissions
4. **Audit Logging**: Log security events for monitoring and forensics

```typescript
// Example: Rate Limiting Middleware
export class RateLimitingMiddleware {
  constructor(private config: RateLimitConfig) {}
  
  async handle(req: Request, res: Response, next: NextFunction) {
    const key = this.generateKey(req);
    const count = await this.increment(key);
    
    if (count > this.config.maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    next();
  }
}
```

### Performance (`performance/`)

#### Purpose
Optimize API performance and resource utilization through caching, compression, and request optimization.

#### Examples
- **Response Compression**: Gzip/Brotli compression for API responses
- **Caching Middleware**: HTTP caching with configurable TTL and cache headers
- **Request Timeout**: Prevent hanging requests with configurable timeouts
- **Connection Pooling**: Optimize database and external service connections
- **Response Time Monitoring**: Track and log slow requests

#### Performance Considerations
1. **Async Operations**: All middleware should be async-friendly and non-blocking
2. **Memory Usage**: Minimize memory footprint and avoid memory leaks
3. **CPU Overhead**: Keep processing time under 1ms per request where possible
4. **Network Efficiency**: Optimize for minimal network round trips

```typescript
// Example: Compression Middleware
export class CompressionMiddleware {
  constructor(private config: CompressionConfig) {}
  
  async handle(req: Request, res: Response, next: NextFunction) {
    if (this.shouldCompress(req)) {
      res.setHeader('Content-Encoding', 'gzip');
      // Implement compression logic
    }
    next();
  }
}
```

### Monitoring (`monitoring/`)

#### Purpose
Provide observability and debugging capabilities through logging, metrics, and distributed tracing.

#### Examples
- **Request Logging**: Comprehensive HTTP request/response logging
- **Metrics Collection**: Track request counts, response times, and error rates
- **Correlation IDs**: Add request tracing IDs for distributed tracing
- **Health Checks**: Application health monitoring and endpoint availability
- **Error Tracking**: Centralized error logging and reporting

#### Integration with Monitoring Tools
- **Prometheus**: Export metrics in Prometheus format
- **Grafana**: Dashboard integration for metrics visualization
- **ELK Stack**: Log aggregation and search capabilities
- **Jaeger/Zipkin**: Distributed tracing integration
- **Datadog/New Relic**: APM and monitoring platform integration

```typescript
// Example: Request Logging Middleware
export class RequestLoggingMiddleware {
  constructor(private config: LoggingConfig) {}
  
  async handle(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const correlationId = this.generateCorrelationId();
    
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logRequest(req, res, duration, correlationId);
    });
    
    next();
  }
}
```

### Validation (`validation/`)

#### Purpose
Ensure input data integrity and prevent malformed data from reaching application logic.

#### Examples
- **Request Body Validation**: Validate JSON payloads against schemas
- **Query Parameter Validation**: Type-check and sanitize query parameters
- **File Upload Validation**: Validate file types, sizes, and content
- **API Contract Validation**: Ensure requests match OpenAPI specifications
- **XSS Prevention**: Sanitize user input to prevent XSS attacks

#### Validation Patterns
1. **Schema-First**: Define validation schemas separately from business logic
2. **Early Validation**: Validate as early as possible in the request pipeline
3. **Detailed Errors**: Provide specific validation error messages
4. **Type Safety**: Use TypeScript for compile-time type checking

```typescript
// Example: Validation Middleware
export class ValidationMiddleware {
  constructor(private schemas: ValidationSchemas) {}
  
  async handle(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.body && this.schemas.body) {
        req.body = await this.validate(req.body, this.schemas.body);
      }
      if (req.query && this.schemas.query) {
        req.query = await this.validate(req.query, this.schemas.query);
      }
      next();
    } catch (error) {
      res.status(400).json({ error: 'Validation failed', details: error.message });
    }
  }
}
```

### Common (`common/`)

#### Purpose
Provide shared utilities, types, and base classes used across all middleware categories.

#### What Belongs Here vs Category Folders
**Put in Common**:
- Base middleware classes and interfaces
- Shared utility functions
- Common type definitions
- Error handling utilities
- Configuration helpers

**Put in Category Folders**:
- Category-specific implementations
- Business logic for that category
- Category-specific configurations
- Specialized utilities

#### Reusability Guidelines
1. **Framework Agnostic**: Common utilities should work with any Node.js framework
2. **Minimal Dependencies**: Avoid pulling in heavy dependencies
3. **Well Documented**: Clear JSDoc comments and examples
4. **Type Safe**: Full TypeScript support with proper generics

```typescript
// Example: Base Middleware Class
export abstract class BaseMiddleware {
  protected config: MiddlewareConfig;
  
  constructor(config: MiddlewareConfig) {
    this.config = config;
  }
  
  abstract handle(req: Request, res: Response, next: NextFunction): Promise<void>;
  
  protected log(message: string, level: LogLevel = 'info'): void {
    // Shared logging logic
  }
  
  protected handleError(error: Error, res: Response): void {
    // Shared error handling logic
  }
}
```

## Middleware Execution Pipeline

### How Middleware Executes in NestJS

In NestJS, middleware follows the Express.js execution pattern:

```
Incoming Request → Middleware 1 → Middleware 2 → ... → Controller → Response
                    ↓              ↓              ↓
                Pre-processing  Pre-processing  Route Handler
                    ↓              ↓              ↓
                Post-processing Post-processing Response
```

### Order of Middleware Execution

1. **Request Logging** (first) - Capture request details
2. **CORS** - Handle cross-origin requests
3. **Security Headers** - Add security-related headers
4. **Rate Limiting** - Prevent abuse
5. **Authentication** - Verify user identity
6. **Authorization** - Check permissions
7. **Validation** - Validate request data
8. **Performance** - Compression, caching
9. **Error Handling** (last) - Catch and format errors

### Request/Response Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Request Lifecycle                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Request received by server                               │
│ 2. Middleware chain begins execution                        │
│ 3. Each middleware can:                                     │
│    - Modify request object                                  │
│    - End request early (error/redirect)                    │
│    - Pass control to next middleware                        │
│ 4. Controller method executes                                │
│ 5. Response generated                                       │
│ 6. Middleware chain processes response (reverse order)     │
│ 7. Response sent to client                                  │
└─────────────────────────────────────────────────────────────┘
```

### Error Handling Flow

```
Error in Middleware → Error Handler → Formatted Error Response
        ↓                      ↓              ↓
   Log Error           Classify Error    Send Response
        ↓                      ↓              ↓
   Track Metrics     Add Context Info   Close Connection
```

## Design Patterns

### Decorator Pattern

#### How Middleware Wraps Functionality
The decorator pattern allows middleware to wrap existing functionality with additional behavior without modifying the original code.

#### Example Use Cases
- **Logging**: Wrap controller methods with automatic logging
- **Caching**: Wrap expensive operations with cache logic
- **Validation**: Wrap parameter processing with validation
- **Security**: Wrap sensitive operations with security checks

```typescript
// Example: Decorator Pattern Implementation
export function LogRequests(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    const start = Date.now();
    console.log(`Starting ${propertyKey}`);
    
    try {
      const result = await originalMethod.apply(this, args);
      console.log(`Completed ${propertyKey} in ${Date.now() - start}ms`);
      return result;
    } catch (error) {
      console.log(`Failed ${propertyKey}: ${error.message}`);
      throw error;
    }
  };
  
  return descriptor;
}
```

### Chain of Responsibility

#### How Middleware Chains Together
Each middleware in the chain has the opportunity to process the request and either handle it or pass it to the next middleware in the chain.

#### Request Passing Between Middleware
```typescript
// Example: Chain of Responsibility
interface Middleware {
  setNext(middleware: Middleware): Middleware;
  handle(request: Request): Response | null;
}

export abstract class BaseMiddlewareHandler implements Middleware {
  private nextHandler: Middleware | null = null;
  
  setNext(middleware: Middleware): Middleware {
    this.nextHandler = middleware;
    return middleware;
  }
  
  handle(request: Request): Response | null {
    if (this.canHandle(request)) {
      return this.process(request);
    }
    
    if (this.nextHandler) {
      return this.nextHandler.handle(request);
    }
    
    return null;
  }
  
  protected abstract canHandle(request: Request): boolean;
  protected abstract process(request: Request): Response;
}
```

### Factory Pattern

#### Creating Configurable Middleware
The factory pattern enables the creation of middleware instances with different configurations based on runtime parameters.

#### Dynamic Middleware Generation
```typescript
// Example: Factory Pattern
export class MiddlewareFactory {
  static createAuthMiddleware(type: 'jwt' | 'apikey', config: AuthConfig): Middleware {
    switch (type) {
      case 'jwt':
        return new JwtAuthMiddleware(config);
      case 'apikey':
        return new ApiKeyAuthMiddleware(config);
      default:
        throw new Error(`Unknown auth type: ${type}`);
    }
  }
  
  static createSecurityMiddleware(features: SecurityFeatures): Middleware[] {
    const middleware: Middleware[] = [];
    
    if (features.cors) middleware.push(new CorsMiddleware(features.cors));
    if (features.rateLimit) middleware.push(new RateLimitMiddleware(features.rateLimit));
    if (features.securityHeaders) middleware.push(new SecurityHeadersMiddleware());
    
    return middleware;
  }
}
```

### Dependency Injection

#### How Middleware Uses NestJS DI
Middleware can inject services and dependencies through NestJS's dependency injection system.

#### Injecting Services into Middleware
```typescript
// Example: Dependency Injection in Middleware
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}
  
  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = this.extractToken(req);
      const user = await this.authService.validateToken(token);
      req.user = user;
      this.logger.log(`User authenticated: ${user.id}`);
      next();
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}
```

#### Best Practices
1. **Constructor Injection**: Use constructor injection for required dependencies
2. **Interface Segregation**: Inject only what's needed, not entire service objects
3. **Optional Dependencies**: Use optional injection for non-critical dependencies
4. **Testability**: Design injection to make middleware easily testable

## Common Interfaces and Contracts

### Request Context

#### User Information Structure
```typescript
export interface RequestContext {
  user?: UserContext;
  sessionId?: string;
  correlationId: string;
  requestTime: number;
  metadata: Record<string, any>;
}

export interface UserContext {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  tenantId?: string;
  metadata: Record<string, any>;
}
```

#### How User Data Attached to Request
```typescript
// Augment Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
      correlationId: string;
      session?: SessionContext;
      metadata: RequestMetadata;
    }
  }
}

export interface RequestMetadata {
  userAgent: string;
  ip: string;
  country?: string;
  device?: string;
  platform?: string;
}
```

### Error Handling

#### Standard Error Format
```typescript
export interface StandardError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  correlationId: string;
  stack?: string;
}

export interface ErrorResponse {
  error: StandardError;
  requestId: string;
  path: string;
}
```

#### How Errors Propagate
```typescript
// Error propagation through middleware chain
export class ErrorHandlerMiddleware {
  async use(err: Error, req: Request, res: Response, next: NextFunction) {
    const standardError = this.standardizeError(err);
    const errorResponse: ErrorResponse = {
      error: standardError,
      requestId: req.correlationId,
      path: req.path,
    };
    
    this.logError(standardError, req);
    res.status(this.getHttpStatusCode(standardError.code)).json(errorResponse);
  }
  
  private standardizeError(error: Error): StandardError {
    // Convert any error to standard format
  }
}
```

### Configuration

#### How Middleware Receives Configuration
```typescript
export interface MiddlewareConfig {
  enabled: boolean;
  options: Record<string, any>;
  environment: 'development' | 'staging' | 'production';
}

export interface ConfigurableMiddleware {
  configure(config: MiddlewareConfig): void;
  getConfig(): MiddlewareConfig;
}

// Example configuration loading
export class ConfigurableAuthMiddleware extends BaseMiddleware 
  implements ConfigurableMiddleware {
  
  constructor(config?: Partial<AuthConfig>) {
    super(this.loadConfig(config));
  }
  
  private loadConfig(providedConfig?: Partial<AuthConfig>): AuthConfig {
    const envConfig = this.loadFromEnvironment();
    return { ...this.defaultConfig, ...envConfig, ...providedConfig };
  }
  
  private loadFromEnvironment(): Partial<AuthConfig> {
    return {
      jwtSecret: process.env.JWT_SECRET,
      jwtExpiration: process.env.JWT_EXPIRES_IN,
      // ... other environment variables
    };
  }
}
```

#### Environment Variable Usage
```typescript
// Environment variable configuration
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'staging' | 'production';
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX: number;
  CORS_ORIGINS: string[];
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

export class ConfigLoader {
  static load(): EnvironmentConfig {
    return {
      NODE_ENV: process.env.NODE_ENV as any || 'development',
      JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
      JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
      RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'),
      RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100'),
      CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',') || ['*'],
      LOG_LEVEL: process.env.LOG_LEVEL as any || 'info',
    };
  }
}
```

#### Configuration Validation
```typescript
// Configuration validation
export class ConfigValidator {
  static validate(config: EnvironmentConfig): ValidationResult {
    const errors: string[] = [];
    
    if (!config.JWT_SECRET || config.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters long');
    }
    
    if (config.RATE_LIMIT_WINDOW < 1000) {
      errors.push('RATE_LIMIT_WINDOW must be at least 1000ms');
    }
    
    if (config.RATE_LIMIT_MAX < 1) {
      errors.push('RATE_LIMIT_MAX must be at least 1');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

## Integration with NestJS

### How Middleware Registers in NestJS
```typescript
// In app.module.ts or a specific module
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware, LoggingMiddleware, ValidationMiddleware)
      .forRoutes('*');
      
    consumer
      .apply(AdminAuthMiddleware)
      .forRoutes('admin/*');
      
    consumer
      .apply(PublicMiddleware)
      .forRoutes('public/*');
  }
}
```

### Global vs Route-Specific Middleware

#### Global Middleware
```typescript
// Applied to all routes
consumer
  .apply(LoggingMiddleware, CorsMiddleware, SecurityHeadersMiddleware)
  .forRoutes('*');
```

#### Route-Specific Middleware
```typescript
// Applied to specific route patterns
consumer
  .apply(AuthMiddleware)
  .forRoutes(
    { path: '/api/v1/users', method: RequestMethod.ALL },
    { path: '/api/v1/admin/**', method: RequestMethod.ALL },
  );
```

#### Conditional Middleware
```typescript
// Applied based on conditions
consumer
  .apply(RateLimitMiddleware)
  .forRoutes({ path: '/api/v1/**', method: RequestMethod.POST });
```

### Middleware vs Guards vs Interceptors

#### When to Use Which

**Middleware**:
- Low-level request/response manipulation
- Framework-agnostic functionality
- Request logging, CORS, compression
- Early request processing

**Guards**:
- Authentication and authorization
- Route-level access control
- Business logic validation
- NestJS-specific functionality

**Interceptors**:
- Request/response transformation
- Logging and monitoring
- Caching at the method level
- Aspect-oriented programming

#### Example Comparison
```typescript
// Middleware: Framework-agnostic logging
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`${req.method} ${req.path}`);
    next();
  }
}

// Guard: Authentication
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    return !!request.user;
  }
}

// Interceptor: Response transformation
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map(data => ({ data, timestamp: new Date() })));
  }
}
```

#### Examples of Integration
```typescript
// Complete integration example
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Global middleware
    consumer
      .apply(
        RequestLoggingMiddleware,
        CorsMiddleware,
        SecurityHeadersMiddleware,
        RateLimitMiddleware,
      )
      .forRoutes('*');
    
    // Auth middleware for protected routes
    consumer
      .apply(JwtAuthMiddleware)
      .forRoutes(
        { path: '/api/v1/users/**', method: RequestMethod.ALL },
        { path: '/api/v1/admin/**', method: RequestMethod.ALL },
      );
    
    // Validation middleware for API endpoints
    consumer
      .apply(ValidationMiddleware)
      .forRoutes('/api/v1/**');
    
    // Performance middleware for specific endpoints
    consumer
      .apply(CachingMiddleware)
      .forRoutes({ path: '/api/v1/public/**', method: RequestMethod.GET });
  }
}
```

## Adding New Middleware

### Step-by-Step Guide

#### 1. Choose Appropriate Category
Select the category that best fits your middleware's purpose:
- **Auth**: Authentication/authorization related
- **Security**: Security headers, rate limiting, protection
- **Performance**: Caching, compression, optimization
- **Monitoring**: Logging, metrics, tracing
- **Validation**: Input validation and sanitization
- **Common**: Shared utilities and base classes

#### 2. Create Middleware File
```typescript
// Example: src/security/rate-limiting.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}

@Injectable()
export class RateLimitingMiddleware implements NestMiddleware {
  constructor(private readonly config: RateLimitConfig) {}
  
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Implementation here
  }
}
```

#### 3. Implement Middleware Logic
```typescript
async use(req: Request, res: Response, next: NextFunction): Promise<void> {
  const key = this.generateKey(req);
  const current = await this.getCurrentCount(key);
  
  if (current >= this.config.maxRequests) {
    return res.status(429).json({
      error: 'Too many requests',
      message: this.config.message || 'Rate limit exceeded',
    });
  }
  
  await this.incrementCount(key);
  next();
}

private generateKey(req: Request): string {
  return `rate_limit:${req.ip}:${req.path}`;
}
```

#### 4. Add Configuration Support
```typescript
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests from this IP',
};
```

#### 5. Write Tests
```typescript
// Example: src/security/rate-limiting.middleware.spec.ts
describe('RateLimitingMiddleware', () => {
  let middleware: RateLimitingMiddleware;
  let config: RateLimitConfig;
  
  beforeEach(() => {
    config = { windowMs: 60000, maxRequests: 10 };
    middleware = new RateLimitingMiddleware(config);
  });
  
  describe('when under limit', () => {
    it('should allow request', async () => {
      const mockReq = { ip: '127.0.0.1', path: '/test' } as any;
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const mockNext = jest.fn();
      
      await middleware.use(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });
  
  describe('when over limit', () => {
    it('should block request', async () => {
      // Mock being over limit
      const mockReq = { ip: '127.0.0.1', path: '/test' } as any;
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const mockNext = jest.fn();
      
      // Simulate being over limit
      jest.spyOn(middleware as any, 'getCurrentCount').mockResolvedValue(11);
      
      await middleware.use(mockReq, mockRes, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Too many requests',
        message: 'Too many requests from this IP',
      });
    });
  });
});
```

#### 6. Export from Category Index
```typescript
// src/security/index.ts
export * from './rate-limiting.middleware';
export * from './cors.middleware';
export * from './security-headers.middleware';
export * from './interfaces/security.interfaces';
```

#### 7. Update Main Index
```typescript
// src/index.ts
export * from './auth';
export * from './security';
export * from './performance';
export * from './monitoring';
export * from './validation';
export * from './common';
export * from './config';
```

#### 8. Document Usage
```typescript
/**
 * Rate limiting middleware to prevent abuse and DoS attacks.
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const rateLimit = new RateLimitingMiddleware({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   maxRequests: 100, // limit each IP to 100 requests per windowMs
 * });
 * 
 * // Custom key generator
 * const rateLimit = new RateLimitingMiddleware({
 *   windowMs: 15 * 60 * 1000,
 *   maxRequests: 100,
 *   keyGenerator: (req) => `rate_limit:${req.user?.id || req.ip}`,
 * });
 * 
 * // Skip certain requests
 * const rateLimit = new RateLimitingMiddleware({
 *   windowMs: 15 * 60 * 1000,
 *   maxRequests: 100,
 *   skip: (req) => req.path.startsWith('/health'),
 * });
 * ```
 */
```

## Testing Strategy

### Unit Testing Middleware

#### Test Structure
```typescript
describe('MiddlewareName', () => {
  describe('method/scenario', () => {
    it('should handle expected case', () => {});
    it('should handle error case', () => {});
  });
});
```

#### What to Test
- **Middleware executes correctly**: Verify the middleware processes requests as expected
- **Configuration properly applied**: Ensure configuration affects behavior
- **Error handling works**: Test error scenarios and error responses
- **Integration with NestJS**: Verify proper NestJS integration
- **Performance characteristics**: Test performance under load

#### Example Test Structure
```typescript
describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let authService: AuthService;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  
  beforeEach(() => {
    authService = createMockAuthService();
    middleware = new AuthMiddleware(authService);
    mockReq = { headers: {} };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockNext = jest.fn();
  });
  
  describe('when valid token provided', () => {
    it('should authenticate and call next', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      jest.spyOn(authService, 'validateToken').mockResolvedValue(mockUser);
      
      await middleware.use(mockReq as Request, mockRes as Response, mockNext);
      
      expect(authService.validateToken).toHaveBeenCalledWith('valid-token');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });
  });
  
  describe('when invalid token provided', () => {
    it('should return 401', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';
      jest.spyOn(authService, 'validateToken').mockRejectedValue(new Error('Invalid token'));
      
      await middleware.use(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
```

### Integration Testing with Controllers

#### Mocking Strategies
```typescript
// Integration test example
describe('AuthMiddleware Integration', () => {
  let app: INestApplication;
  let authService: AuthService;
  
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TestController],
      providers: [AuthService],
    })
    .overrideProvider(AuthService)
    .useValue(createMockAuthService())
    .compile();
    
    app = module.createNestApplication();
    app.use(new AuthMiddleware(authService));
    await app.init();
  });
  
  it('should protect endpoints', async () => {
    const response = await request(app.getHttpServer())
      .get('/protected')
      .expect(401);
      
    expect(response.body.error).toBe('Unauthorized');
  });
  
  it('should allow authenticated requests', async () => {
    authService.validateToken.mockResolvedValue(mockUser);
    
    const response = await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', 'Bearer valid-token')
      .expect(200);
      
    expect(response.body.message).toBe('Success');
  });
});
```

### Coverage Requirements

#### Minimum Coverage Standards
- **80% branch coverage**: All conditional branches must be tested
- **80% function coverage**: All functions must be called in tests
- **80% line coverage**: All lines of code must be executed
- **80% statement coverage**: All statements must be tested

#### Running Coverage Tests
```bash
# Run tests with coverage
npm run test:cov

# Generate coverage report
npm run test:coverage

# Check coverage thresholds
npm run test:coverage:check
```

## Performance Considerations

### Middleware Overhead

#### Target Performance Metrics
- **Execution Time**: < 1ms for simple middleware, < 5ms for complex middleware
- **Memory Usage**: < 1MB additional memory per middleware instance
- **CPU Overhead**: < 5% additional CPU usage under normal load
- **Throughput Impact**: < 2% reduction in requests per second

#### Performance Testing
```typescript
// Performance test example
describe('Middleware Performance', () => {
  it('should execute within time limits', async () => {
    const middleware = new PerformanceCriticalMiddleware();
    const iterations = 10000;
    const start = process.hrtime.bigint();
    
    for (let i = 0; i < iterations; i++) {
      await middleware.use(mockReq, mockRes, mockNext);
    }
    
    const end = process.hrtime.bigint();
    const avgTime = Number(end - start) / iterations / 1000000; // Convert to ms
    
    expect(avgTime).toBeLessThan(1); // Less than 1ms average
  });
});
```

### Async Operations Handling

#### Best Practices
1. **Use async/await**: Always use async/await for asynchronous operations
2. **Avoid blocking**: Never use synchronous operations that block the event loop
3. **Parallel execution**: Use Promise.all() for independent async operations
4. **Error handling**: Properly handle async errors with try/catch

```typescript
// Good async handling
export class AsyncMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [user, permissions] = await Promise.all([
        this.getUser(req),
        this.getPermissions(req),
      ]);
      
      req.user = user;
      req.permissions = permissions;
      next();
    } catch (error) {
      this.handleError(error, res);
    }
  }
}

// Bad: Blocking operations
export class BlockingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const user = fs.readFileSync('/tmp/user.json'); // Blocking!
    req.user = JSON.parse(user);
    next();
  }
}
```

### Resource Management

#### Memory Management
```typescript
// Memory-efficient middleware
export class MemoryEfficientMiddleware implements NestMiddleware {
  private cache = new LRUCache<string, any>({ max: 1000 });
  
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const key = this.generateKey(req);
    const cached = this.cache.get(key);
    
    if (cached) {
      req.data = cached;
      return next();
    }
    
    const data = await this.fetchData(req);
    this.cache.set(key, data);
    req.data = data;
    next();
  }
}
```

#### Connection Pooling
```typescript
// Connection pooling for external services
export class DatabaseMiddleware implements NestMiddleware {
  private connectionPool: ConnectionPool;
  
  constructor() {
    this.connectionPool = new ConnectionPool({
      max: 10,
      min: 2,
      acquireTimeoutMillis: 30000,
    });
  }
  
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const connection = await this.connectionPool.acquire();
    
    try {
      req.db = connection;
      await next();
    } finally {
      this.connectionPool.release(connection);
    }
  }
}
```

### Caching Strategies

#### Response Caching
```typescript
export class CachingMiddleware implements NestMiddleware {
  private cache = new Map<string, CacheEntry>();
  
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const key = this.generateCacheKey(req);
    const cached = this.cache.get(key);
    
    if (cached && !this.isExpired(cached)) {
      return res.send(cached.data);
    }
    
    // Capture response for caching
    const originalSend = res.send.bind(res);
    res.send = (data) => {
      this.cache.set(key, { data, timestamp: Date.now() });
      return originalSend(data);
    };
    
    next();
  }
  
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.ttl;
  }
}
```

#### Monitoring Performance Impact
```typescript
export class PerformanceMonitoringMiddleware implements NestMiddleware {
  private metrics: Map<string, PerformanceMetric> = new Map();
  
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const start = process.hrtime.bigint();
    const middlewareName = this.constructor.name;
    
    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to ms
      
      this.recordMetric(middlewareName, duration);
      
      if (duration > this.slowThreshold) {
        this.logger.warn(`Slow middleware: ${middlewareName} took ${duration}ms`);
      }
    });
    
    next();
  }
  
  private recordMetric(name: string, duration: number): void {
    const metric = this.metrics.get(name) || { count: 0, totalTime: 0, maxTime: 0 };
    metric.count++;
    metric.totalTime += duration;
    metric.maxTime = Math.max(metric.maxTime, duration);
    this.metrics.set(name, metric);
  }
}
```

## Security Considerations

### Secure Coding Practices

#### Input Validation
```typescript
export class SecureValidationMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Validate all inputs
    if (req.body) {
      req.body = this.sanitizeInput(req.body);
    }
    
    if (req.query) {
      req.query = this.validateQuery(req.query);
    }
    
    // Check for common attack patterns
    if (this.containsSqlInjection(req)) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    
    next();
  }
  
  private sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }
}
```

#### Authentication Security
```typescript
export class SecureAuthMiddleware implements NestMiddleware {
  private readonly jwtAlgorithm = ['HS256'];
  private readonly maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours
  
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = this.extractToken(req);
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    try {
      const payload = jwt.verify(token, this.secret, {
        algorithms: this.jwtAlgorithm,
        maxAge: this.maxTokenAge,
      }) as JwtPayload;
      
      // Additional security checks
      if (this.isTokenBlacklisted(token)) {
        return res.status(401).json({ error: 'Token blacklisted' });
      }
      
      if (payload.iss !== this.expectedIssuer) {
        return res.status(401).json({ error: 'Invalid token issuer' });
      }
      
      req.user = payload;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
}
```

### Sensitive Data Handling

#### Never Log Sensitive Data
```typescript
export class SecureLoggingMiddleware implements NestMiddleware {
  private sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard'];
  
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const sanitizedReq = this.sanitizeForLogging(req);
    this.logger.info(`Request: ${JSON.stringify(sanitizedReq)}`);
    
    next();
  }
  
  private sanitizeForLogging(req: Request): any {
    const sanitized = { ...req };
    
    if (sanitized.body) {
      sanitized.body = this.redactSensitiveFields(sanitized.body);
    }
    
    if (sanitized.headers) {
      sanitized.headers = this.redactSensitiveFields(sanitized.headers);
    }
    
    return sanitized;
  }
  
  private redactSensitiveFields(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    const redacted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = this.redactSensitiveFields(value);
      }
    }
    
    return redacted;
  }
}
```

#### Secure Configuration Management
```typescript
export class SecureConfigMiddleware implements NestMiddleware {
  private config: SecureConfig;
  
  constructor() {
    this.config = this.loadSecureConfig();
  }
  
  private loadSecureConfig(): SecureConfig {
    const config = {
      jwtSecret: process.env.JWT_SECRET,
      databaseUrl: process.env.DATABASE_URL,
      apiKey: process.env.API_KEY,
    };
    
    // Validate required secrets
    const requiredSecrets = ['jwtSecret', 'databaseUrl'];
    for (const secret of requiredSecrets) {
      if (!config[secret]) {
        throw new Error(`Required secret ${secret} is not configured`);
      }
      
      // Check secret strength
      if (secret === 'jwtSecret' && config[secret].length < 32) {
        throw new Error('JWT secret must be at least 32 characters long');
      }
    }
    
    return config as SecureConfig;
  }
}
```

### Logging Security

#### Security Event Logging
```typescript
export class SecurityLoggingMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const securityEvents: SecurityEvent[] = [];
    
    // Log authentication attempts
    if (req.path.includes('/auth') || req.path.includes('/login')) {
      securityEvents.push({
        type: 'AUTH_ATTEMPT',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        success: false, // Will be updated based on outcome
      });
    }
    
    // Capture response for security logging
    const originalSend = res.send.bind(res);
    res.send = (data) => {
      // Log authentication failures
      if (res.statusCode === 401 && securityEvents.length > 0) {
        securityEvents[0].success = false;
        this.logSecurityEvent(securityEvents[0]);
      }
      
      // Log authentication successes
      if (res.statusCode === 200 && req.path.includes('/auth')) {
        securityEvents[0].success = true;
        this.logSecurityEvent(securityEvents[0]);
      }
      
      return originalSend(data);
    };
    
    next();
  }
  
  private logSecurityEvent(event: SecurityEvent): void {
    const logLevel = event.success ? 'info' : 'warn';
    this.logger[logLevel](`Security Event: ${event.type}`, {
      ip: event.ip,
      userAgent: event.userAgent,
      timestamp: event.timestamp,
      success: event.success,
    });
  }
}
```

### Common Vulnerabilities to Avoid

#### Preventing Common Attacks
```typescript
export class SecurityProtectionMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Prevent Clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Force HTTPS
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    // Check for common attack patterns
    if (this.detectSuspiciousActivity(req)) {
      this.logger.warn(`Suspicious activity detected from ${req.ip}`);
      return res.status(429).json({ error: 'Request blocked' });
    }
    
    next();
  }
  
  private detectSuspiciousActivity(req: Request): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /drop\s+table/i,
    ];
    
    const requestBody = JSON.stringify(req.body);
    const queryString = JSON.stringify(req.query);
    
    return suspiciousPatterns.some(pattern => 
      pattern.test(requestBody) || pattern.test(queryString)
    );
  }
}
```

This comprehensive architecture documentation provides a complete guide for understanding, implementing, and extending the middleware system. It covers all the required sections with detailed examples, best practices, and clear guidelines for contributors.
