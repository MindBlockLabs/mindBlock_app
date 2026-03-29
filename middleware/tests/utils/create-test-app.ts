import { INestApplication, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

/**
 * Options for creating a test application
 */
export interface CreateTestAppOptions {
  /** Middleware classes to apply */
  middlewares?: any[];
  
  /** Providers to include */
  providers?: any[];
  
  /** Controllers to include */
  controllers?: any[];
  
  /** Guards to apply */
  guards?: any[];
  
  /** Filters to apply */
  filters?: any[];
  
  /** Interceptors to apply */
  interceptors?: any[];
  
  /** Pipes to apply */
  pipes?: any[];
}

/**
 * Create a minimal NestJS test application with specified middleware
 * 
 * @param options - Configuration options for the test app
 * @returns Promise resolving to the test application
 * 
 * @example
 * ```ts
 * const app = await createTestApp({
 *   middlewares: [SomeMiddleware],
 *   providers: [SomeService],
 * });
 * 
 * await app.init();
 * // ... run tests
 * await app.close();
 * ```
 */
export async function createTestApp(
  options: CreateTestAppOptions = {}
): Promise<INestApplication> {
  const {
    middlewares = [],
    providers = [],
    controllers = [],
    guards = [],
    filters = [],
    interceptors = [],
    pipes = [],
  } = options;

  // Create testing module
  const moduleFixture: TestingModule = await Test.createTestingModule({
    controllers,
    providers: [
      ...providers,
      // Add common testing utilities if needed
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();

  // Apply global middleware
  if (middlewares.length > 0) {
    middlewares.forEach(middleware => {
      app.use(middleware);
    });
  }

  // Apply global guards
  if (guards.length > 0) {
    app.useGlobalGuards(...guards);
  }

  // Apply global filters
  if (filters.length > 0) {
    app.useGlobalFilters(...filters);
  }

  // Apply global interceptors
  if (interceptors.length > 0) {
    app.useGlobalInterceptors(...interceptors);
  }

  // Apply global pipes
  if (pipes.length > 0) {
    app.useGlobalPipes(...pipes);
  }

  return app;
}

/**
 * Create a mock execution context for testing guards/interceptors
 */
export function createMockExecutionContext(
  handler?: any,
  type: string = 'http'
): ExecutionContext {
  return {
    getType: () => type as any,
    getClass: () => class {},
    getHandler: () => handler || (() => {}),
    getArgs: () => [],
    getArgByIndex: () => null,
    switchToRpc: () => ({
      getContext: () => null,
      getData: () => null,
    }),
    switchToHttp: () => ({
      getRequest: () => null,
      getResponse: () => null,
      getNext: () => null,
    }),
    switchToWs: () => ({
      getClient: () => null,
      getData: () => null,
    }),
  };
}

/**
 * Wrapper for supertest that provides better typing
 */
export interface TestRequest {
  get(path: string): request.Test;
  post(path: string): request.Test;
  put(path: string): request.Test;
  delete(path: string): request.Test;
  patch(path: string): request.Test;
}

/**
 * Create a supertest wrapper for an Express-like app
 */
export function createTestRequest(app: INestApplication): TestRequest {
  const httpServer = app.getHttpServer();
  
  return {
    get: (path: string) => request(httpServer).get(path),
    post: (path: string) => request(httpServer).post(path),
    put: (path: string) => request(httpServer).put(path),
    delete: (path: string) => request(httpServer).delete(path),
    patch: (path: string) => request(httpServer).patch(path),
  };
}
