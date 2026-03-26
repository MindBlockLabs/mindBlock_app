import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { unless, onlyFor } from './conditional.middleware';

// Simple test middleware for integration testing
@Injectable()
class TestLoggingMiddleware implements NestMiddleware {
  public static calls: Array<{ path: string; timestamp: number }> = [];

  use(req: Request, res: Response, next: NextFunction): void {
    TestLoggingMiddleware.calls.push({
      path: req.path || req.url || '/',
      timestamp: Date.now(),
    });
    next();
  }

  static reset(): void {
    TestLoggingMiddleware.calls = [];
  }
}

// Second test middleware for chaining tests
@Injectable()
class TestAuthMiddleware implements NestMiddleware {
  public static calls: Array<{ path: string; timestamp: number }> = [];

  use(req: Request, res: Response, next: NextFunction): void {
    TestAuthMiddleware.calls.push({
      path: req.path || req.url || '/',
      timestamp: Date.now(),
    });
    next();
  }

  static reset(): void {
    TestAuthMiddleware.calls = [];
  }
}

describe('Conditional Middleware Integration Tests', () => {
  let middleware: TestLoggingMiddleware;
  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    TestLoggingMiddleware.reset();
    middleware = new TestLoggingMiddleware();

    mockRes = {
      setHeader: jest.fn(),
      getHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('Real-world usage scenarios', () => {
    it('should work with typical API route patterns', () => {
      // Skip logging for health and metrics endpoints
      const conditionalMiddleware = unless(middleware, [
        '/health',
        '/metrics',
        '/api/*/health',
        '/api/*/metrics',
      ]);

      // Test various routes
      const routes = [
        { path: '/health', shouldLog: false },
        { path: '/metrics', shouldLog: false },
        { path: '/api/v1/health', shouldLog: false },
        { path: '/api/v2/metrics', shouldLog: false },
        { path: '/api/v1/users', shouldLog: true },
        { path: '/api/v2/posts', shouldLog: true },
        { path: '/auth/login', shouldLog: true },
      ];

      routes.forEach((route) => {
        mockReq = { path: route.path, url: route.path };
        conditionalMiddleware.use(mockReq, mockRes as Response, mockNext);
      });

      const loggedPaths = TestLoggingMiddleware.calls.map((call) => call.path);
      const expectedLoggedPaths = routes
        .filter((route) => route.shouldLog)
        .map((route) => route.path);

      expect(loggedPaths).toEqual(expectedLoggedPaths);
      expect(loggedPaths).not.toContain('/health');
      expect(loggedPaths).not.toContain('/metrics');
    });

    it('should handle admin-only middleware with onlyFor', () => {
      // Only apply logging middleware to admin routes
      const conditionalMiddleware = onlyFor(middleware, [
        '/api/admin/*',
        '/api/v*/admin/**',
        /^\/admin\//,
      ]);

      const routes = [
        { path: '/api/admin/users', shouldLog: true },
        { path: '/api/v1/admin/settings', shouldLog: true },
        { path: '/admin/dashboard', shouldLog: true },
        { path: '/api/v1/users', shouldLog: false },
        { path: '/api/v2/posts', shouldLog: false },
        { path: '/public/home', shouldLog: false },
      ];

      routes.forEach((route) => {
        mockReq = { path: route.path, url: route.path };
        conditionalMiddleware.use(mockReq, mockRes as Response, mockNext);
      });

      const loggedPaths = TestLoggingMiddleware.calls.map((call) => call.path);
      const expectedLoggedPaths = routes
        .filter((route) => route.shouldLog)
        .map((route) => route.path);

      expect(loggedPaths).toEqual(expectedLoggedPaths);
      expect(loggedPaths).toContain('/api/admin/users');
      expect(loggedPaths).not.toContain('/api/v1/users');
    });

    it('should handle complex routing scenarios', () => {
      // Skip middleware for static assets and API documentation
      const conditionalMiddleware = unless(middleware, [
        '/static/**',
        '/assets/**',
        '/docs/**',
        '/api/docs/**',
        '/swagger/**',
        /\.(css|js|ico|png|jpg|jpeg|gif|svg)$/, // Static file extensions
      ]);

      const routes = [
        { path: '/static/css/main.css', shouldLog: false },
        { path: '/assets/images/logo.png', shouldLog: false },
        { path: '/docs/api.html', shouldLog: false },
        { path: '/api/docs/v1', shouldLog: false },
        { path: '/swagger/ui', shouldLog: false },
        { path: '/favicon.ico', shouldLog: false },
        { path: '/api/v1/users', shouldLog: true },
        { path: '/auth/login', shouldLog: true },
        { path: '/dashboard', shouldLog: true },
      ];

      routes.forEach((route) => {
        mockReq = { path: route.path, url: route.path };
        conditionalMiddleware.use(mockReq, mockRes as Response, mockNext);
      });

      const loggedPaths = TestLoggingMiddleware.calls.map((call) => call.path);
      const expectedLoggedPaths = routes
        .filter((route) => route.shouldLog)
        .map((route) => route.path);

      expect(loggedPaths).toEqual(expectedLoggedPaths);
      expect(loggedPaths).not.toContain('/static/css/main.css');
      expect(loggedPaths).not.toContain('/favicon.ico');
      expect(loggedPaths).toContain('/api/v1/users');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty pattern arrays', () => {
      const conditionalMiddleware = unless(middleware, [] as any);

      mockReq = { path: '/test', url: '/test' };
      conditionalMiddleware.use(mockReq, mockRes as Response, mockNext);

      expect(TestLoggingMiddleware.calls).toHaveLength(1);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle null/undefined patterns gracefully', () => {
      expect(() => {
        const conditionalMiddleware1 = unless(middleware, null as any);
        const conditionalMiddleware2 = onlyFor(middleware, undefined as any);

        mockReq = { path: '/test', url: '/test' };
        conditionalMiddleware1.use(mockReq, mockRes as Response, mockNext);
        conditionalMiddleware2.use(mockReq, mockRes as Response, mockNext);
      }).not.toThrow();
    });

    it('should handle malformed regex patterns', () => {
      expect(() => {
        const conditionalMiddleware = unless(middleware, [
          /invalid regex/ as any,
        ]);
        mockReq = { path: '/test', url: '/test' };
        conditionalMiddleware.use(mockReq, mockRes as Response, mockNext);
      }).not.toThrow();
    });

    it('should handle very long paths', () => {
      const longPath = '/api/v1/' + 'segment/'.repeat(100) + 'endpoint';
      const conditionalMiddleware = unless(middleware, ['/api/v1/**'] as any);

      mockReq = { path: longPath, url: longPath };
      conditionalMiddleware.use(mockReq, mockRes as Response, mockNext);

      expect(TestLoggingMiddleware.calls).toHaveLength(0);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Performance under load', () => {
    it('should handle large numbers of route patterns efficiently', () => {
      // Create a large array of patterns
      const patterns: any[] = [];
      for (let i = 0; i < 1000; i++) {
        patterns.push(`/api/v${i}/**`);
      }
      patterns.push('/health', '/metrics');

      const conditionalMiddleware = unless(middleware, patterns);

      const start = Date.now();

      // Test with many routes
      for (let i = 0; i < 1000; i++) {
        mockReq = { path: `/api/v500/test${i}`, url: `/api/v500/test${i}` };
        conditionalMiddleware.use(mockReq, mockRes as Response, mockNext);
        TestLoggingMiddleware.reset();
      }

      const end = Date.now();
      const duration = end - start;

      // Should complete quickly even with many patterns
      expect(duration).toBeLessThan(10000);
    });

    it('should maintain performance with nested glob patterns', () => {
      const complexPatterns: any[] = [
        '/api/**/users/**',
        '/api/**/posts/**',
        '/api/**/comments/**',
        '/admin/**/settings/**',
        '/admin/**/users/**',
      ];

      const conditionalMiddleware = onlyFor(middleware, complexPatterns);

      const start = Date.now();

      const testRoutes = [
        '/api/v1/users/123/posts',
        '/api/v2/posts/456/comments',
        '/admin/panel/settings/general',
        '/api/v1/users/789/profile',
        '/admin/dashboard/users/list',
      ];

      testRoutes.forEach((route) => {
        mockReq = { path: route, url: route };
        conditionalMiddleware.use(mockReq, mockRes as Response, mockNext);
        TestLoggingMiddleware.reset();
      });

      const end = Date.now();
      const duration = end - start;

      // Should handle complex patterns efficiently
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Middleware chaining', () => {
    it('should work correctly when multiple conditional middlewares are chained', () => {
      // First middleware: skip for health routes
      const firstConditional = unless(middleware, ['/health']);

      // Second middleware: only for admin routes
      const secondMiddleware = new TestAuthMiddleware();
      const secondConditional = onlyFor(secondMiddleware, ['/admin/**']);

      const routes = [
        { path: '/health', firstShouldLog: false, secondShouldLog: false },
        { path: '/admin/users', firstShouldLog: true, secondShouldLog: true },
        { path: '/api/users', firstShouldLog: true, secondShouldLog: false },
      ];

      routes.forEach((route) => {
        TestLoggingMiddleware.reset();
        TestAuthMiddleware.reset();

        mockReq = { path: route.path, url: route.path };

        firstConditional.use(mockReq, mockRes as Response, mockNext);
        const firstLogged = TestLoggingMiddleware.calls.length > 0;

        secondConditional.use(mockReq, mockRes as Response, mockNext);
        const secondLogged = TestAuthMiddleware.calls.length > 0;

        expect(firstLogged).toBe(route.firstShouldLog);
        expect(secondLogged).toBe(route.secondShouldLog);
      });
    });
  });
});
