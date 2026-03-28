import { Module, NestModule, MiddlewareConsumer, Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

/**
 * Correlation ID middleware for benchmarking
 * Attaches a unique correlation ID to each request
 */
@Injectable()
export class BenchmarkCorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      randomUUID();

    (req as any).correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    
    next();
  }
}

/**
 * Geolocation middleware for benchmarking
 * Simulates IP-based geolocation lookup
 */
@Injectable()
export class BenchmarkGeolocationMiddleware implements NestMiddleware {
  private readonly logger = new Logger('BenchmarkGeolocation');
  private readonly cache: Map<string, any> = new Map();

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    
    // Check cache first
    if (this.cache.has(ip)) {
      (req as any).location = this.cache.get(ip);
      const duration = Date.now() - start;
      this.logger.debug(`Geolocation cache hit in ${duration}ms`);
      return next();
    }

    // Simulate geolocation lookup (async operation)
    setTimeout(() => {
      const location = {
        ip,
        country: 'US',
        region: 'CA',
        city: 'San Francisco',
        timezone: 'America/Los_Angeles',
        language: 'en',
      };
      
      (req as any).location = location;
      this.cache.set(ip, location);
      
      const duration = Date.now() - start;
      this.logger.debug(`Geolocation lookup took ${duration}ms`);
      
      next();
    }, 1); // Simulate 1ms async delay
  }
}

/**
 * Request validation middleware for benchmarking
 * Validates request body and query parameters
 */
@Injectable()
export class BenchmarkValidationMiddleware implements NestMiddleware {
  private readonly logger = new Logger('BenchmarkValidation');

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    
    // Simulate validation logic
    const contentType = req.headers['content-type'];
    if (req.method === 'POST' || req.method === 'PUT') {
      if (!contentType || !contentType.includes('application/json')) {
        this.logger.warn('Invalid content type');
      }
    }
    
    // Simulate query parameter validation
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        if (typeof req.query[key] === 'string' && req.query[key].length > 1000) {
          this.logger.warn(`Query parameter ${key} exceeds max length`);
        }
      });
    }
    
    const duration = Date.now() - start;
    this.logger.debug(`Validation took ${duration}ms`);
    
    next();
  }
}

/**
 * Security headers middleware for benchmarking
 * Adds security headers to responses
 */
@Injectable()
export class BenchmarkSecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    
    next();
  }
}

/**
 * Request logging middleware for benchmarking
 * Comprehensive request/response logging
 */
@Injectable()
export class BenchmarkRequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('BenchmarkRequestLogger');

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const correlationId = (req as any).correlationId || 'unknown';
    
    this.logger.log(
      `Incoming request: ${req.method} ${req.path} | Correlation ID: ${correlationId} | IP: ${req.ip}`,
    );
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(
        `Request completed: ${req.method} ${req.path} ${res.statusCode} | Duration: ${duration}ms | Correlation ID: ${correlationId}`,
      );
    });
    
    next();
  }
}

/**
 * JWT Authentication middleware for benchmarking
 */
@Injectable()
export class BenchmarkFullJwtAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger('BenchmarkFullJwtAuth');
  private readonly secret = 'benchmark-secret-key-for-testing-only';

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.logger.warn('Missing or invalid Authorization header');
        return next();
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, this.secret);
      
      (req as any).user = decoded;
      
      const duration = Date.now() - start;
      this.logger.debug(`JWT validation took ${duration}ms`);
      
      next();
    } catch (error) {
      const duration = Date.now() - start;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`JWT validation failed after ${duration}ms: ${errorMessage}`);
      next();
    }
  }
}

/**
 * Rate limiting middleware for benchmarking
 */
@Injectable()
export class BenchmarkFullRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger('BenchmarkFullRateLimit');
  private readonly requests: Map<string, number[]> = new Map();
  private readonly windowMs = 60000;
  private readonly maxRequests = 100;

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    let timestamps = this.requests.get(clientIp) || [];
    timestamps = timestamps.filter(ts => now - ts < this.windowMs);
    
    if (timestamps.length >= this.maxRequests) {
      const duration = Date.now() - start;
      this.logger.warn(`Rate limit exceeded for ${clientIp} after ${duration}ms`);
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
    
    timestamps.push(now);
    this.requests.set(clientIp, timestamps);
    
    const duration = Date.now() - start;
    this.logger.debug(`Rate limit check took ${duration}ms`);
    
    next();
  }
}

/**
 * Full stack chain module
 * 
 * Middleware stack:
 * 1. BenchmarkCorrelationIdMiddleware - Request tracing
 * 2. BenchmarkGeolocationMiddleware - IP-based geolocation
 * 3. BenchmarkSecurityHeadersMiddleware - Security headers
 * 4. BenchmarkValidationMiddleware - Request validation
 * 5. BenchmarkRequestLoggerMiddleware - Comprehensive logging
 * 6. BenchmarkFullRateLimitMiddleware - Rate limiting
 * 7. BenchmarkFullJwtAuthMiddleware - JWT authentication
 * 
 * This represents a full production middleware stack with all common
 * middleware components typically used in production APIs.
 * 
 * Expected overhead: High (10-25ms)
 * Use case: Production APIs, public-facing services, enterprise applications
 * 
 * Performance considerations:
 * - Multiple async operations (geolocation, JWT verification)
 * - In-memory state management (rate limiting, caching)
 * - Extensive logging can impact performance
 * - Consider middleware ordering for optimal performance
 * - Monitor for disproportionate overhead (chain > sum of parts)
 */
@Module({})
export class FullChainModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        BenchmarkCorrelationIdMiddleware,
        BenchmarkGeolocationMiddleware,
        BenchmarkSecurityHeadersMiddleware,
        BenchmarkValidationMiddleware,
        BenchmarkRequestLoggerMiddleware,
        BenchmarkFullRateLimitMiddleware,
        BenchmarkFullJwtAuthMiddleware,
      )
      .forRoutes('*');
  }
}
