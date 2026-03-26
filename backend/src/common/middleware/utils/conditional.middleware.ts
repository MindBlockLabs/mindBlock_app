import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as micromatch from 'micromatch';

export type RoutePattern = string | RegExp | (string | RegExp)[];

/**
 * Checks if the request path matches any of the provided patternsss
 */
function matchesPath(path: string, patterns: RoutePattern): boolean {
  if (!patterns || (Array.isArray(patterns) && patterns.length === 0)) {
    return false;
  }

  if (Array.isArray(patterns)) {
    return patterns.some((pattern) => matchesPath(path, pattern));
  }

  if (patterns instanceof RegExp) {
    return patterns.test(path);
  }

  // Handle empty strings and invalid patterns
  if (typeof patterns !== 'string' || patterns.trim() === '') {
    return false;
  }

  // Handle glob patterns and exact strings with micromatch
  try {
    return micromatch.isMatch(path, patterns);
  } catch (error) {
    // If micromatch fails, fall back to exact string comparison
    return path === patterns;
  }
}

/**
 * Higher-order middleware wrapper that skips execution for specified routes
 *
 * @param middleware - The NestJS middleware to wrap
 * @param excludePatterns - Route patterns to exclude (string, regex, or glob)
 * @returns Wrapped middleware that skips execution for matching routes
 */
export function unless<T extends NestMiddleware>(
  middleware: T,
  excludePatterns: RoutePattern,
): T {
  return new (class {
    use(req: Request, res: Response, next: NextFunction): void {
      const requestPath = req.path || req.url || '/';

      // If path matches exclude patterns, skip middleware
      if (matchesPath(requestPath, excludePatterns)) {
        return next();
      }

      // Otherwise, execute the original middleware
      return middleware.use(req, res, next);
    }
  })() as T;
}

/**
 * Higher-order middleware wrapper that executes only for specified routes
 *
 * @param middleware - The NestJS middleware to wrap
 * @param includePatterns - Route patterns to include (string, regex, or glob)
 * @returns Wrapped middleware that executes only for matching routes
 */
export function onlyFor<T extends NestMiddleware>(
  middleware: T,
  includePatterns: RoutePattern,
): T {
  return new (class {
    use(req: Request, res: Response, next: NextFunction): void {
      const requestPath = req.path || req.url || '/';

      // If path doesn't match include patterns, skip middleware
      if (!matchesPath(requestPath, includePatterns)) {
        return next();
      }

      // Otherwise, execute the original middleware
      return middleware.use(req, res, next);
    }
  })() as T;
}
