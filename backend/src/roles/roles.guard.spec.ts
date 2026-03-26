import {
  ExecutionContext,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { userRole } from '../users/enums/userRole.enum';
import { RolesGuard } from './roles.guard';
import { RolesOptions } from './roles.decorator';

describe('RolesGuard', () => {
  let reflector: Reflector & {
    getAllAndOverride: jest.Mock;
  };

  let guard: RolesGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector & {
      getAllAndOverride: jest.Mock;
    };
    guard = new RolesGuard(reflector);
  });

  it('allows admins through user routes via hierarchy', () => {
    mockRoles({ roles: [userRole.USER] });
    const context = createContext({
      user: { userId: '1', userRole: userRole.ADMIN },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows access when any required role matches', () => {
    mockRoles({ roles: [userRole.ADMIN, userRole.MODERATOR] });
    const context = createContext({
      user: { userId: '1', userRole: userRole.MODERATOR },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows ownership-based access', () => {
    mockRoles({
      roles: [userRole.ADMIN],
      ownership: { param: 'id' },
    });
    const context = createContext({
      user: { userId: '42', userRole: userRole.USER },
      params: { id: '42' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('throws 403 with a clear message when access is denied', () => {
    mockRoles({ roles: [userRole.ADMIN] });
    const context = createContext({
      user: { userId: '9', userRole: userRole.USER },
    });

    expect(() => guard.canActivate(context)).toThrow(
      new ForbiddenException('Access denied. Required role: ADMIN'),
    );
  });

  it('throws 500 when the role is missing from auth context', () => {
    mockRoles({ roles: [userRole.ADMIN] });
    const context = createContext({
      user: { userId: '9' },
    });

    expect(() => guard.canActivate(context)).toThrow(
      InternalServerErrorException,
    );
  });
});

function mockRoles(options: RolesOptions) {
  reflector.getAllAndOverride.mockReturnValue(options);
}

function createContext(request: Record<string, unknown>): ExecutionContext {
  return {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        url: '/users/42',
        originalUrl: '/users/42',
        params: {},
        ...request,
      }),
    }),
  } as unknown as ExecutionContext;
}
