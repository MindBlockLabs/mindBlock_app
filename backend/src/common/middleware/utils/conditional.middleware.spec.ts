import { Test, TestingModule } from '@nestjs/testing';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { unless, onlyFor, RoutePattern } from './conditional.middleware';

// Mock middleware for testing
@Injectable()
class TestMiddleware implements NestMiddleware {
  public static callCount = 0;
  public static lastPath: string = '';

  use(req: Request, res: Response, next: NextFunction): void {
    TestMiddleware.callCount++;
    TestMiddleware.lastPath = req.path || req.url || '/';
    next();
  }

  static reset(): void {
    TestMiddleware.callCount = 0;
    TestMiddleware.lastPath = '';
  }
}

describe('Conditional Middleware', () => {
  let middleware: TestMiddleware;
  let mockReq: any;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    TestMiddleware.reset();
    middleware = new TestMiddleware();

    mockReq = {
      path: '/test',
      url: '/test',
    };

    mockRes = {};
    mockNext = jest.fn();
  });

  describe('matchesPath', () => {
    const testMatchesPath = (
      path: string,
      pattern: RoutePattern,
      expected: boolean,
    ) => {
      // Import the private function through reflection for testing
      const conditionalMiddleware = require('./conditional.middleware');

      // We'll test the public behavior through unless/onlyFor instead
    };

    describe('exact string matching', () => {
      it('should match exact strings', async () => {
        const wrappedMiddleware = unless(middleware, '/health');

        mockReq.path = '/health';
        wrappedMiddleware.use(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(TestMiddleware.callCount).toBe(0);
        expect(mockNext).toHaveBeenCalled();
      });

      it('should not match different strings', async () => {
        const wrappedMiddleware = unless(middleware, '/health');

        mockReq.path = '/api/users';
        wrappedMiddleware.use(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(TestMiddleware.callCount).toBe(1);
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('regex pattern matching', () => {
      it('should match regex patterns', async () => {
        const wrappedMiddleware = unless(middleware, /^\/health/);

        mockReq.path = '/health/detailed';
        wrappedMiddleware.use(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(TestMiddleware.callCount).toBe(0);
        expect(mockNext).toHaveBeenCalled();
      });

      it('should not match non-matching regex', async () => {
        const wrappedMiddleware = unless(middleware, /^\/health/);

        mockReq.path = '/api/users';
        wrappedMiddleware.use(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(TestMiddleware.callCount).toBe(1);
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('glob pattern matching', () => {
      it('should match glob patterns', async () => {
        const wrappedMiddleware = unless(middleware, '/api/*/users');

        mockReq.path = '/api/v1/users';
        wrappedMiddleware.use(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(TestMiddleware.callCount).toBe(0);
        expect(mockNext).toHaveBeenCalled();
      });

      it('should match complex glob patterns', async () => {
        const wrappedMiddleware = unless(middleware, '/api/**/metrics');

        mockReq.path = '/api/v1/system/metrics';
        wrappedMiddleware.use(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(TestMiddleware.callCount).toBe(0);
        expect(mockNext).toHaveBeenCalled();
      });

      it('should not match non-matching glob patterns', async () => {
        const wrappedMiddleware = unless(middleware, '/api/*/users');

        mockReq.path = '/api/v1/posts';
        wrappedMiddleware.use(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(TestMiddleware.callCount).toBe(1);
        expect(mockNext).toHaveBeenCalled();
      });
    });

    describe('array of patterns', () => {
      it('should match any pattern in array', async () => {
        const wrappedMiddleware = unless(middleware, [
          '/health',
          '/metrics',
          /^\/api\/v\d+\/status/,
        ]);

        // Test first pattern
        mockReq.path = '/health';
        wrappedMiddleware.use(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );
        expect(TestMiddleware.callCount).toBe(0);

        TestMiddleware.reset();

        // Test second pattern
        mockReq.path = '/metrics';
        wrappedMiddleware.use(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );
        expect(TestMiddleware.callCount).toBe(0);

        TestMiddleware.reset();

        // Test regex pattern
        mockReq.path = '/api/v2/status';
        wrappedMiddleware.use(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );
        expect(TestMiddleware.callCount).toBe(0);
      });

      it('should not match when no patterns match', async () => {
        const wrappedMiddleware = unless(middleware, ['/health', '/metrics']);

        mockReq.path = '/api/users';
        wrappedMiddleware.use(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );

        expect(TestMiddleware.callCount).toBe(1);
        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  describe('unless', () => {
    it('should skip middleware for excluded routes', async () => {
      const wrappedMiddleware = unless(middleware, '/health');

      mockReq.path = '/health';
      wrappedMiddleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(TestMiddleware.callCount).toBe(0);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should execute middleware for non-excluded routes', async () => {
      const wrappedMiddleware = unless(middleware, '/health');

      mockReq.path = '/api/users';
      wrappedMiddleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(TestMiddleware.callCount).toBe(1);
      expect(TestMiddleware.lastPath).toBe('/api/users');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle req.url fallback when req.path is undefined', async () => {
      const wrappedMiddleware = unless(middleware, '/health');

      delete mockReq.path;
      mockReq.url = '/health';
      wrappedMiddleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(TestMiddleware.callCount).toBe(0);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle fallback to root path when both are undefined', async () => {
      const wrappedMiddleware = unless(middleware, '/health');

      delete mockReq.path;
      delete mockReq.url;
      wrappedMiddleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(TestMiddleware.callCount).toBe(1);
      expect(TestMiddleware.lastPath).toBe('/');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('onlyFor', () => {
    it('should execute middleware only for specified routes', async () => {
      const wrappedMiddleware = onlyFor(middleware, '/api/v1/users');

      mockReq.path = '/api/v1/users';
      wrappedMiddleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(TestMiddleware.callCount).toBe(1);
      expect(TestMiddleware.lastPath).toBe('/api/v1/users');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip middleware for non-specified routes', async () => {
      const wrappedMiddleware = onlyFor(middleware, '/api/v1/users');

      mockReq.path = '/api/v1/posts';
      wrappedMiddleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(TestMiddleware.callCount).toBe(0);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should work with regex patterns', async () => {
      const wrappedMiddleware = onlyFor(middleware, /^\/api\/v\d+\/users/);

      mockReq.path = '/api/v2/users';
      wrappedMiddleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(TestMiddleware.callCount).toBe(1);
      expect(TestMiddleware.lastPath).toBe('/api/v2/users');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should work with glob patterns', async () => {
      const wrappedMiddleware = onlyFor(middleware, '/api/*/users');

      mockReq.path = '/api/v1/users';
      wrappedMiddleware.use(mockReq as Request, mockRes as Response, mockNext);

      expect(TestMiddleware.callCount).toBe(1);
      expect(TestMiddleware.lastPath).toBe('/api/v1/users');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('performance', () => {
    it('should have minimal overhead for non-matching routes', async () => {
      const wrappedMiddleware = unless(middleware, '/health');

      const start = process.hrtime.bigint();

      // Run many iterations to measure overhead
      for (let i = 0; i < 10000; i++) {
        mockReq.path = '/api/users';
        wrappedMiddleware.use(
          mockReq as Request,
          mockRes as Response,
          mockNext,
        );
        TestMiddleware.reset();
      }

      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds

      // Should complete very quickly (less than 100ms for 10k iterations)
      expect(duration).toBeLessThan(100);
    });
  });
});
