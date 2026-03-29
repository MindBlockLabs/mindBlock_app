import { Response, NextFunction } from 'express';

/**
 * Mock Express request object with proper typing
 */
export interface MockRequest {
  method: string;
  url: string;
  path: string;
  params: Record<string, any>;
  query: Record<string, any>;
  body: any;
  headers: Record<string, string>;
  route?: {
    path: string;
  };
  on: jest.Mock;
}

/**
 * Create a typed mock Express request
 */
export function mockRequest(overrides?: Partial<MockRequest>): MockRequest {
  return {
    method: 'GET',
    url: '/test',
    path: '/test',
    params: {},
    query: {},
    body: undefined,
    headers: {},
    route: undefined,
    on: jest.fn(),
    ...overrides,
  };
}

/**
 * Mock Express response object with proper typing
 */
export interface MockResponse extends Partial<Response> {
  statusCode: number;
  statusMessage: string;
  headersSent: boolean;
  json: jest.Mock<MockResponse, [any]>;
  send: jest.Mock<MockResponse, [any]>;
  set: jest.Mock<MockResponse, [string | Record<string, string>, string?]>;
  status: jest.Mock<MockResponse, [number]>;
  end: jest.Mock<MockResponse, [any?]>;
  on: jest.Mock;
}

/**
 * Create a typed mock Express response
 */
export function mockResponse(overrides?: Partial<MockResponse>): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    statusMessage: 'OK',
    headersSent: false,
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    on: jest.fn(),
    ...overrides,
  };
  
  return res;
}

/**
 * Create a typed mock Express next function
 */
export function mockNext(): jest.Mock {
  return jest.fn();
}

/**
 * Create a complete Express middleware test context
 */
export interface MiddlewareTestContext {
  req: MockRequest;
  res: MockResponse;
  next: jest.Mock;
}

/**
 * Create a complete test context for middleware testing
 */
export function createMiddlewareTestContext(
  overrides?: {
    req?: Partial<MockRequest>;
    res?: Partial<MockResponse>;
  }
): MiddlewareTestContext {
  return {
    req: mockRequest(overrides?.req),
    res: mockResponse(overrides?.res),
    next: mockNext(),
  };
}
