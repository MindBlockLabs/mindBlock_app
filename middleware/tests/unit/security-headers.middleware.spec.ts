import { Request, Response, NextFunction } from 'express';
import { SecurityHeadersMiddleware } from '../../src/security/security-headers.middleware';
import { SECURITY_HEADERS_CONFIG } from '../../src/security/security-headers.config';

function makeMiddleware(): SecurityHeadersMiddleware {
  return new SecurityHeadersMiddleware();
}

function mockReq(path = '/test'): Partial<Request> {
  return { method: 'GET', path } as any;
}

function mockRes(): {
  headers: Record<string, string>;
  removedHeaders: string[];
  setHeader: jest.Mock;
  removeHeader: jest.Mock;
  getHeader: jest.Mock;
  on: jest.Mock;
  finishCallback?: () => void;
} {
  const headers: Record<string, string> = {};
  const removedHeaders: string[] = [];

  const res = {
    headers,
    removedHeaders,
    setHeader: jest.fn((name: string, value: string) => {
      headers[name] = value;
    }),
    removeHeader: jest.fn((name: string) => {
      removedHeaders.push(name);
      delete headers[name];
    }),
    getHeader: jest.fn((name: string) => headers[name]),
    on: jest.fn((event: string, cb: () => void) => {
      if (event === 'finish') {
        res.finishCallback = cb;
      }
    }),
    finishCallback: undefined as (() => void) | undefined,
  };
  return res;
}

describe('SecurityHeadersMiddleware', () => {
  let next: jest.Mock;

  beforeEach(() => {
    next = jest.fn();
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  describe('common security headers', () => {
    it('sets X-Content-Type-Options to nosniff', () => {
      const mw = makeMiddleware();
      const res = mockRes();
      mw.use(mockReq() as Request, res as unknown as Response, next);
      expect(res.headers['X-Content-Type-Options']).toBe('nosniff');
    });

    it('sets X-Frame-Options to DENY', () => {
      const mw = makeMiddleware();
      const res = mockRes();
      mw.use(mockReq() as Request, res as unknown as Response, next);
      expect(res.headers['X-Frame-Options']).toBe('DENY');
    });

    it('sets X-XSS-Protection', () => {
      const mw = makeMiddleware();
      const res = mockRes();
      mw.use(mockReq() as Request, res as unknown as Response, next);
      expect(res.headers['X-XSS-Protection']).toBe('1; mode=block');
    });

    it('sets all common headers defined in config', () => {
      const mw = makeMiddleware();
      const res = mockRes();
      mw.use(mockReq() as Request, res as unknown as Response, next);
      for (const [header, value] of Object.entries(SECURITY_HEADERS_CONFIG.common)) {
        expect(res.headers[header]).toBe(value);
      }
    });

    it('calls next() after setting headers', () => {
      const mw = makeMiddleware();
      const res = mockRes();
      mw.use(mockReq() as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('removes sensitive headers', () => {
    it('removes X-Powered-By', () => {
      const mw = makeMiddleware();
      const res = mockRes();
      mw.use(mockReq() as Request, res as unknown as Response, next);
      expect(res.removedHeaders).toContain('X-Powered-By');
    });

    it('removes Server header', () => {
      const mw = makeMiddleware();
      const res = mockRes();
      mw.use(mockReq() as Request, res as unknown as Response, next);
      expect(res.removedHeaders).toContain('Server');
    });

    it('removes all headers listed in config.removeHeaders', () => {
      const mw = makeMiddleware();
      const res = mockRes();
      mw.use(mockReq() as Request, res as unknown as Response, next);
      for (const header of SECURITY_HEADERS_CONFIG.removeHeaders) {
        expect(res.removedHeaders).toContain(header);
      }
    });
  });

  describe('HSTS header', () => {
    it('does NOT set HSTS in non-production', () => {
      process.env.NODE_ENV = 'development';
      const mw = makeMiddleware();
      const res = mockRes();
      mw.use(mockReq() as Request, res as unknown as Response, next);
      expect(res.headers['Strict-Transport-Security']).toBeUndefined();
    });

    it('sets HSTS in production', () => {
      process.env.NODE_ENV = 'production';
      const mw = makeMiddleware();
      const res = mockRes();
      mw.use(mockReq() as Request, res as unknown as Response, next);
      expect(res.headers['Strict-Transport-Security']).toBe(
        SECURITY_HEADERS_CONFIG.hsts.production,
      );
    });
  });

  describe('Cache-Control on finish', () => {
    it('sets no-cache for application/json response', () => {
      const mw = makeMiddleware();
      const res = mockRes();
      res.headers['Content-Type'] = 'application/json';
      mw.use(mockReq() as Request, res as unknown as Response, next);
      res.finishCallback?.();
      expect(res.headers['Cache-Control']).toBe(SECURITY_HEADERS_CONFIG.cacheControl.dynamic);
    });

    it('sets public max-age for text/html response', () => {
      const mw = makeMiddleware();
      const res = mockRes();
      res.headers['Content-Type'] = 'text/html';
      mw.use(mockReq() as Request, res as unknown as Response, next);
      res.finishCallback?.();
      expect(res.headers['Cache-Control']).toBe(SECURITY_HEADERS_CONFIG.cacheControl.static);
    });

    it('sets public max-age for text/css response', () => {
      const mw = makeMiddleware();
      const res = mockRes();
      res.headers['Content-Type'] = 'text/css';
      mw.use(mockReq() as Request, res as unknown as Response, next);
      res.finishCallback?.();
      expect(res.headers['Cache-Control']).toBe(SECURITY_HEADERS_CONFIG.cacheControl.static);
    });

    it('sets private no-cache for unknown content type', () => {
      const mw = makeMiddleware();
      const res = mockRes();
      res.headers['Content-Type'] = 'application/octet-stream';
      mw.use(mockReq() as Request, res as unknown as Response, next);
      res.finishCallback?.();
      expect(res.headers['Cache-Control']).toBe(SECURITY_HEADERS_CONFIG.cacheControl.private);
    });

    it('does not set Cache-Control when Content-Type is absent', () => {
      const mw = makeMiddleware();
      const res = mockRes();
      // no Content-Type set
      mw.use(mockReq() as Request, res as unknown as Response, next);
      res.finishCallback?.();
      expect(res.headers['Cache-Control']).toBeUndefined();
    });
  });
});
