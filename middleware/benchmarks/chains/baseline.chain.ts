import { Module, NestModule, MiddlewareConsumer, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Minimal baseline middleware - does almost nothing
 * This establishes the absolute minimum overhead of the NestJS middleware system
 */
@Injectable()
export class BaselineMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Minimal overhead - just call next()
    next();
  }
}

/**
 * Baseline chain module - minimal middleware stack
 * 
 * This represents the absolute minimum overhead of the NestJS middleware system.
 * It includes only a no-op middleware to establish a baseline for comparison.
 * 
 * Use this to understand the fundamental cost of middleware invocation in NestJS.
 */
@Module({})
export class BaselineChainModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BaselineMiddleware)
      .forRoutes('*');
  }
}
