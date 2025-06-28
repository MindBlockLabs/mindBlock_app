/* eslint-disable prettier/prettier */
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';

const mockExecutionContext = (
  role: string | null,
): Partial<ExecutionContext> => {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : null }) as any,
      getResponse: <T = any>() => ({}) as T,
      getNext: <T = any>() => ({}) as T,
    }),
    getHandler: () => function () {},
  };
};

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = mockExecutionContext('admin') as ExecutionContext;
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const context = mockExecutionContext('admin') as ExecutionContext;
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const context = mockExecutionContext('user') as ExecutionContext;
    expect(() => guard.canActivate(context)).toThrow(
      'Forbidden: Insufficient role',
    );
  });

  it('should throw ForbiddenException if user is not authenticated', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const context = mockExecutionContext(null) as ExecutionContext;
    expect(() => guard.canActivate(context)).toThrow(
      'Forbidden: Insufficient role',
    );
  });
});
