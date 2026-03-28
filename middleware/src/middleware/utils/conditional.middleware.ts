import { Request, Response, NextFunction } from 'express';
import * as micromatch from 'micromatch';

export type RoutePattern = string | RegExp;
export type MiddlewareFn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => void | Promise<void>;

function matchesPath(path: string, patterns: RoutePattern[]): boolean {
  for (const pattern of patterns) {
    if (typeof pattern === 'string') {
      if (path === pattern || micromatch.isMatch(path, pattern)) return true;
    } else if (pattern instanceof RegExp) {
      if (pattern.test(path)) return true;
    }
  }
  return false;
}

/**
 * Wraps a middleware so it is skipped for any matching route patterns.
 *
 * @example
 * consumer.apply(unless(RateLimitMiddleware, ['/health', '/metrics']));
 */
export function unless(
  middleware: MiddlewareFn,
  patterns: RoutePattern[],
): MiddlewareFn {
  return (req: Request, res: Response, next: NextFunction) => {
    if (matchesPath(req.path, patterns)) {
      return next();
    }
    return middleware(req, res, next);
  };
}

/**
 * Wraps a middleware so it only runs for matching route patterns.
 * Inverse of `unless`.
 *
 * @example
 * consumer.apply(onlyFor(LoggingMiddleware, ['/api/**']));
 */
export function onlyFor(
  middleware: MiddlewareFn,
  patterns: RoutePattern[],
): MiddlewareFn {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!matchesPath(req.path, patterns)) {
      return next();
    }
    return middleware(req, res, next);
  };
}
