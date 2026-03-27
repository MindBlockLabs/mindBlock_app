import { Request, Response, NextFunction } from 'express';
import { ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { rbacMiddleware, UserRole } from '../../src/auth/rbac.middleware';

function mockReq(userRole?: UserRole, email = 'test@example.com'): Partial<Request> {
  const user = userRole ? { userRole, email } : undefined;
  return { method: 'GET', path: '/test', user } as any;
}

function mockRes(): Partial<Response> {
  return {} as Partial<Response>;
}

describe('rbacMiddleware()', () => {
  let next: jest.Mock;

  beforeEach(() => {
    next = jest.fn();
  });

  it('calls next() when user has the exact required role', () => {
    const mw = rbacMiddleware([UserRole.USER]);
    mw(mockReq(UserRole.USER) as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('throws ForbiddenException when user lacks the required role', () => {
    const mw = rbacMiddleware([UserRole.ADMIN]);
    expect(() =>
      mw(mockReq(UserRole.USER) as Request, mockRes() as Response, next),
    ).toThrow(ForbiddenException);
    expect(next).not.toHaveBeenCalled();
  });

  it('error message includes the required role', () => {
    const mw = rbacMiddleware([UserRole.ADMIN]);
    try {
      mw(mockReq(UserRole.USER) as Request, mockRes() as Response, next);
    } catch (err: any) {
      expect(err.message).toContain('ADMIN');
    }
  });

  // Role hierarchy
  it('ADMIN can access USER-required routes', () => {
    const mw = rbacMiddleware([UserRole.USER]);
    mw(mockReq(UserRole.ADMIN) as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ADMIN can access MODERATOR-required routes', () => {
    const mw = rbacMiddleware([UserRole.MODERATOR]);
    mw(mockReq(UserRole.ADMIN) as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('MODERATOR can access USER-required routes', () => {
    const mw = rbacMiddleware([UserRole.USER]);
    mw(mockReq(UserRole.MODERATOR) as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('MODERATOR cannot access ADMIN-required routes', () => {
    const mw = rbacMiddleware([UserRole.ADMIN]);
    expect(() =>
      mw(mockReq(UserRole.MODERATOR) as Request, mockRes() as Response, next),
    ).toThrow(ForbiddenException);
  });

  // OR logic — multiple roles
  it('allows access when user matches any of multiple required roles', () => {
    const mw = rbacMiddleware([UserRole.ADMIN, UserRole.MODERATOR]);
    mw(mockReq(UserRole.MODERATOR) as Request, mockRes() as Response, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('denies access when user matches none of multiple required roles', () => {
    const mw = rbacMiddleware([UserRole.ADMIN, UserRole.MODERATOR]);
    expect(() =>
      mw(mockReq(UserRole.USER) as Request, mockRes() as Response, next),
    ).toThrow(ForbiddenException);
  });

  // Edge cases
  it('throws ForbiddenException when user is not authenticated', () => {
    const mw = rbacMiddleware([UserRole.USER]);
    const req = { method: 'GET', path: '/test' } as any; // no user
    expect(() =>
      mw(req as Request, mockRes() as Response, next),
    ).toThrow(ForbiddenException);
  });

  it('throws InternalServerErrorException when userRole field is missing', () => {
    const mw = rbacMiddleware([UserRole.USER]);
    const req = { method: 'GET', path: '/test', user: { email: 'x@x.com' } } as any;
    expect(() =>
      mw(req as Request, mockRes() as Response, next),
    ).toThrow(InternalServerErrorException);
  });
});
