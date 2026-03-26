import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CorrelationIdMiddleware } from '../src/common/middleware/correlation-id.middleware';
import {
  unless,
  onlyFor,
} from '../src/common/middleware/utils/conditional.middleware';

describe('Conditional Middleware Integration Tests', () => {
  let app: INestApplication;
  let correlationMiddleware: CorrelationIdMiddleware;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    correlationMiddleware = new CorrelationIdMiddleware();

    // Set up global prefix to match main.ts
    app.setGlobalPrefix('api', {
      exclude: ['health', 'health/*path'],
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('unless() integration', () => {
    it('should skip correlation middleware for health endpoint', async () => {
      // Apply conditional middleware to skip correlation ID for health routes
      const conditionalMiddleware = unless(correlationMiddleware, [
        '/health',
        '/api/health',
      ]);
      app.use(conditionalMiddleware.use.bind(conditionalMiddleware));

      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // Health endpoint should not have correlation ID header when skipped
      expect(response.headers['x-correlation-id']).toBeUndefined();
    });

    it('should apply correlation middleware for non-excluded routes', async () => {
      // Apply conditional middleware to skip correlation ID for health routes only
      const conditionalMiddleware = unless(correlationMiddleware, ['/health']);
      app.use(conditionalMiddleware.use.bind(conditionalMiddleware));

      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(404); // We expect 404 since the route doesn't exist, but middleware should run

      // Non-excluded endpoint should have correlation ID header
      expect(response.headers['x-correlation-id']).toBeDefined();
      expect(typeof response.headers['x-correlation-id']).toBe('string');
    });

    it('should work with glob patterns', async () => {
      // Apply conditional middleware to skip correlation ID for API metrics routes
      const conditionalMiddleware = unless(correlationMiddleware, [
        '/api/*/metrics',
      ]);
      app.use(conditionalMiddleware.use.bind(conditionalMiddleware));

      const response = await request(app.getHttpServer())
        .get('/api/v1/metrics')
        .expect(404); // Route doesn't exist but should be skipped

      // Metrics endpoint should not have correlation ID header when skipped
      expect(response.headers['x-correlation-id']).toBeUndefined();
    });

    it('should work with regex patterns', async () => {
      // Apply conditional middleware to skip correlation ID for status routes
      const conditionalMiddleware = unless(correlationMiddleware, [
        /^\/api\/v\d+\/status$/,
      ]);
      app.use(conditionalMiddleware.use.bind(conditionalMiddleware));

      const response = await request(app.getHttpServer())
        .get('/api/v2/status')
        .expect(404); // Route doesn't exist but should be skipped

      // Status endpoint should not have correlation ID header when skipped
      expect(response.headers['x-correlation-id']).toBeUndefined();
    });
  });

  describe('onlyFor() integration', () => {
    it('should apply correlation middleware only for specified routes', async () => {
      // Apply conditional middleware to only run correlation ID for admin routes
      const conditionalMiddleware = onlyFor(correlationMiddleware, [
        '/api/admin/*',
      ]);
      app.use(conditionalMiddleware.use.bind(conditionalMiddleware));

      // Admin route should have correlation ID
      const adminResponse = await request(app.getHttpServer())
        .get('/api/admin/users')
        .expect(404); // Route doesn't exist but middleware should run

      expect(adminResponse.headers['x-correlation-id']).toBeDefined();

      // Regular route should not have correlation ID
      const userResponse = await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(404); // Route doesn't exist and middleware should be skipped

      expect(userResponse.headers['x-correlation-id']).toBeUndefined();
    });

    it('should work with multiple patterns', async () => {
      // Apply conditional middleware to only run for admin and billing routes
      const conditionalMiddleware = onlyFor(correlationMiddleware, [
        '/api/admin/*',
        '/api/billing/*',
        /^\/api\/v\d+\/audit/,
      ]);
      app.use(conditionalMiddleware.use.bind(conditionalMiddleware));

      // Test admin route
      const adminResponse = await request(app.getHttpServer())
        .get('/api/admin/users')
        .expect(404);

      expect(adminResponse.headers['x-correlation-id']).toBeDefined();

      // Test billing route
      const billingResponse = await request(app.getHttpServer())
        .get('/api/billing/invoices')
        .expect(404);

      expect(billingResponse.headers['x-correlation-id']).toBeDefined();

      // Test audit route with regex
      const auditResponse = await request(app.getHttpServer())
        .get('/api/v2/audit/logs')
        .expect(404);

      expect(auditResponse.headers['x-correlation-id']).toBeDefined();

      // Test non-matching route
      const userResponse = await request(app.getHttpServer())
        .get('/api/v1/users')
        .expect(404);

      expect(userResponse.headers['x-correlation-id']).toBeUndefined();
    });
  });

  describe('Performance Integration', () => {
    it('should have minimal overhead for conditional middleware', async () => {
      const conditionalMiddleware = unless(correlationMiddleware, [
        '/health',
        '/metrics',
      ]);
      app.use(conditionalMiddleware.use.bind(conditionalMiddleware));

      const start = Date.now();

      // Make multiple requests to test performance
      const promises: Promise<any>[] = [];
      for (let i = 0; i < 100; i++) {
        promises.push(request(app.getHttpServer()).get('/api/test'));
      }

      await Promise.all(promises);
      const end = Date.now();

      const duration = end - start;

      // Should complete quickly (less than 1 second for 100 requests)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle high concurrency without issues', async () => {
      const conditionalMiddleware = onlyFor(correlationMiddleware, [
        '/api/secure/*',
      ]);
      app.use(conditionalMiddleware.use.bind(conditionalMiddleware));

      // Test concurrent requests to both matching and non-matching routes
      const promises: Promise<any>[] = [];
      for (let i = 0; i < 50; i++) {
        promises.push(request(app.getHttpServer()).get('/api/secure/data'));
        promises.push(request(app.getHttpServer()).get('/api/public/data'));
      }

      const responses = await Promise.all(promises);

      // Secure routes should have correlation ID
      const secureResponses = responses.slice(0, 50);
      secureResponses.forEach((response: any) => {
        expect(response.headers['x-correlation-id']).toBeDefined();
      });

      // Public routes should not have correlation ID
      const publicResponses = responses.slice(50);
      publicResponses.forEach((response: any) => {
        expect(response.headers['x-correlation-id']).toBeUndefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed patterns gracefully', async () => {
      // This should not throw an error
      expect(() => {
        const conditionalMiddleware = unless(correlationMiddleware, ['']);
        app.use(conditionalMiddleware.use.bind(conditionalMiddleware));
      }).not.toThrow();
    });

    it('should handle undefined request path gracefully', async () => {
      const conditionalMiddleware = unless(correlationMiddleware, ['/health']);

      // Create a mock request with no path
      const mockReq = { url: undefined };
      const mockRes = { setHeader: jest.fn() };
      const mockNext = jest.fn();

      // Should not throw an error
      expect(() => {
        conditionalMiddleware.use(mockReq as any, mockRes as any, mockNext);
      }).not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
