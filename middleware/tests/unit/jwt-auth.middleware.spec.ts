import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedException } from '@nestjs/common';
import {
  JwtAuthMiddleware,
  JwtAuthMiddlewareOptions,
  RedisClient,
} from '../../src/auth/jwt-auth.middleware';

const TEST_SECRET = 'test-secret-key';

function makeMiddleware(opts: Partial<JwtAuthMiddlewareOptions> = {}): JwtAuthMiddleware {
  const options: JwtAuthMiddlewareOptions = {
    secret: TEST_SECRET,
    logging: false,
    ...opts,
  };
  return new JwtAuthMiddleware(options as any);
}

function signToken(payload: object, secret = TEST_SECRET, options?: jwt.SignOptions): string {
  return jwt.sign(payload, secret, options);
}

function mockReq(headers: Record<string, string> = {}, path = '/protected'): Partial<Request> {
  return { method: 'GET', path, headers } as any;
}

function mockRes(): Partial<Response> {
  return {} as Partial<Response>;
}

describe('JwtAuthMiddleware', () => {
  let next: jest.Mock<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
  });

  describe('public routes', () => {
    it('calls next() without checking token for a public route', async () => {
      const mw = makeMiddleware({ publicRoutes: ['/public'] });
      const req = mockReq({}, '/public/resource');
      await mw.use(req as Request, mockRes() as Response, next);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('does not call next() for non-matching public route prefix', async () => {
      const mw = makeMiddleware({ publicRoutes: ['/public'] });
      const req = mockReq({}, '/protected');
      await expect(mw.use(req as Request, mockRes() as Response, next)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('missing / malformed Authorization header', () => {
    it('throws UnauthorizedException when no authorization header present', async () => {
      const mw = makeMiddleware();
      const req = mockReq({});
      await expect(mw.use(req as Request, mockRes() as Response, next)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when header does not start with Bearer', async () => {
      const mw = makeMiddleware();
      const req = mockReq({ authorization: 'Basic sometoken' });
      await expect(mw.use(req as Request, mockRes() as Response, next)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when Bearer token value is empty', async () => {
      const mw = makeMiddleware();
      const req = mockReq({ authorization: 'Bearer ' });
      await expect(mw.use(req as Request, mockRes() as Response, next)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('valid token', () => {
    it('calls next() and attaches user payload for a valid token', async () => {
      const token = signToken({ userId: 'u1', email: 'a@b.com', userRole: 'USER' });
      const mw = makeMiddleware();
      const req = mockReq({ authorization: `Bearer ${token}` });
      await mw.use(req as Request, mockRes() as Response, next);
      expect(next).toHaveBeenCalledTimes(1);
      expect((req as any).user).toMatchObject({ userId: 'u1', email: 'a@b.com', userRole: 'USER' });
    });

    it('normalizes sub claim to userId', async () => {
      const token = signToken({ sub: 'u2', email: 'b@b.com' });
      const mw = makeMiddleware();
      const req = mockReq({ authorization: `Bearer ${token}` });
      await mw.use(req as Request, mockRes() as Response, next);
      expect((req as any).user.userId).toBe('u2');
    });

    it('normalizes role claim to userRole', async () => {
      const token = signToken({ userId: 'u3', email: 'c@b.com', role: 'ADMIN' });
      const mw = makeMiddleware();
      const req = mockReq({ authorization: `Bearer ${token}` });
      await mw.use(req as Request, mockRes() as Response, next);
      expect((req as any).user.userRole).toBe('ADMIN');
    });
  });

  describe('invalid / expired token', () => {
    it('throws UnauthorizedException for an expired token', async () => {
      const token = signToken(
        { userId: 'u1', email: 'a@b.com' },
        TEST_SECRET,
        { expiresIn: -1 },
      );
      const mw = makeMiddleware();
      const req = mockReq({ authorization: `Bearer ${token}` });
      await expect(mw.use(req as Request, mockRes() as Response, next)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for a token signed with wrong secret', async () => {
      const token = signToken({ userId: 'u1', email: 'a@b.com' }, 'wrong-secret');
      const mw = makeMiddleware();
      const req = mockReq({ authorization: `Bearer ${token}` });
      await expect(mw.use(req as Request, mockRes() as Response, next)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when payload missing email', async () => {
      const token = signToken({ userId: 'u1' });
      const mw = makeMiddleware();
      const req = mockReq({ authorization: `Bearer ${token}` });
      await expect(mw.use(req as Request, mockRes() as Response, next)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when payload missing userId/sub/id', async () => {
      const token = signToken({ email: 'a@b.com' });
      const mw = makeMiddleware();
      const req = mockReq({ authorization: `Bearer ${token}` });
      await expect(mw.use(req as Request, mockRes() as Response, next)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('token blacklisting via Redis', () => {
    it('throws UnauthorizedException when token is blacklisted', async () => {
      const token = signToken({ userId: 'u1', email: 'a@b.com' });
      const redisClient: RedisClient = {
        get: jest.fn().mockResolvedValue('1'),
      };
      const mw = makeMiddleware({ redisClient });
      const req = mockReq({ authorization: `Bearer ${token}` });
      await expect(mw.use(req as Request, mockRes() as Response, next)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redisClient.get).toHaveBeenCalledWith(`blacklist:${token}`);
    });

    it('proceeds normally when token is not blacklisted', async () => {
      const token = signToken({ userId: 'u1', email: 'a@b.com' });
      const redisClient: RedisClient = {
        get: jest.fn().mockResolvedValue(null),
      };
      const mw = makeMiddleware({ redisClient });
      const req = mockReq({ authorization: `Bearer ${token}` });
      await mw.use(req as Request, mockRes() as Response, next);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateUser callback', () => {
    it('throws UnauthorizedException when validateUser returns falsy', async () => {
      const token = signToken({ userId: 'u1', email: 'a@b.com' });
      const validateUser = jest.fn().mockResolvedValue(null);
      const mw = makeMiddleware({ validateUser });
      const req = mockReq({ authorization: `Bearer ${token}` });
      await expect(mw.use(req as Request, mockRes() as Response, next)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(validateUser).toHaveBeenCalledWith('u1');
    });

    it('calls next() when validateUser returns a user object', async () => {
      const token = signToken({ userId: 'u1', email: 'a@b.com' });
      const validateUser = jest.fn().mockResolvedValue({ id: 'u1' });
      const mw = makeMiddleware({ validateUser });
      const req = mockReq({ authorization: `Bearer ${token}` });
      await mw.use(req as Request, mockRes() as Response, next);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe('custom authHeader', () => {
    it('reads the token from a custom header name', async () => {
      const token = signToken({ userId: 'u1', email: 'a@b.com' });
      const mw = makeMiddleware({ authHeader: 'x-custom-auth' });
      const req = mockReq({ 'x-custom-auth': `Bearer ${token}` });
      await mw.use(req as Request, mockRes() as Response, next);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
