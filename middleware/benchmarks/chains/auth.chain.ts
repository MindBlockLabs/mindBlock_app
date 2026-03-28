import { Module, NestModule, MiddlewareConsumer, Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

/**
 * JWT Authentication middleware for benchmarking
 * Validates JWT tokens from Authorization header
 */
@Injectable()
export class BenchmarkJwtAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger('BenchmarkJwtAuth');
  private readonly secret = 'benchmark-secret-key-for-testing-only';

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    
    try {
      // Check for Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        this.logger.warn('Missing or invalid Authorization header');
        return next();
      }

      // Extract and verify token
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, this.secret);
      
      // Attach user to request
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
 * Simple in-memory rate limiter
 */
@Injectable()
export class BenchmarkRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger('BenchmarkRateLimit');
  private readonly requests: Map<string, number[]> = new Map();
  private readonly windowMs = 60000; // 1 minute
  private readonly maxRequests = 100;

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Get or initialize request timestamps for this IP
    let timestamps = this.requests.get(clientIp) || [];
    
    // Remove old timestamps outside the window
    timestamps = timestamps.filter(ts => now - ts < this.windowMs);
    
    // Check if rate limit exceeded
    if (timestamps.length >= this.maxRequests) {
      const duration = Date.now() - start;
      this.logger.warn(`Rate limit exceeded for ${clientIp} after ${duration}ms`);
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
    
    // Add current timestamp
    timestamps.push(now);
    this.requests.set(clientIp, timestamps);
    
    const duration = Date.now() - start;
    this.logger.debug(`Rate limit check took ${duration}ms`);
    
    next();
  }
}

/**
 * Simple logger middleware for benchmarking
 */
@Injectable()
export class BenchmarkLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('BenchmarkLogger');

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    });
    
    next();
  }
}

/**
 * Auth stack chain module
 * 
 * Middleware stack:
 * 1. BenchmarkLoggerMiddleware - Logs request/response
 * 2. BenchmarkRateLimitMiddleware - Rate limiting (100 req/min)
 * 3. BenchmarkJwtAuthMiddleware - JWT token validation
 * 
 * This represents an authentication-focused middleware stack commonly
 * used in APIs that require user authentication and rate limiting.
 * 
 * Expected overhead: Medium (3-8ms)
 * Use case: Protected APIs, user-facing services, mobile backends
 * 
 * Performance considerations:
 * - JWT verification is CPU-intensive (crypto operations)
 * - Rate limiting requires in-memory state management
 * - Consider caching JWT verification results for repeated requests
 */
@Module({})
export class AuthChainModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        BenchmarkLoggerMiddleware,
        BenchmarkRateLimitMiddleware,
        BenchmarkJwtAuthMiddleware,
      )
      .forRoutes('*');
  }
}
