import { Module, NestModule, MiddlewareConsumer, Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Simple logger middleware for benchmarking
 * Logs request method and path
 */
@Injectable()
export class SimpleLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('SimpleLogger');

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
 * Simple error handler middleware for benchmarking
 * Catches and logs errors
 */
@Injectable()
export class SimpleErrorHandlerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('ErrorHandler');

  use(req: Request, res: Response, next: NextFunction): void {
    try {
      next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error processing ${req.method} ${req.path}: ${errorMessage}`);
      throw error;
    }
  }
}

/**
 * Minimal stack chain module
 * 
 * Middleware stack:
 * 1. SimpleLoggerMiddleware - Logs request/response
 * 2. SimpleErrorHandlerMiddleware - Error handling
 * 
 * This represents a minimal production middleware stack with basic
 * logging and error handling capabilities.
 * 
 * Expected overhead: Low (1-2ms)
 * Use case: Simple APIs, internal services, development environments
 */
@Module({})
export class MinimalChainModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SimpleLoggerMiddleware, SimpleErrorHandlerMiddleware)
      .forRoutes('*');
  }
}
