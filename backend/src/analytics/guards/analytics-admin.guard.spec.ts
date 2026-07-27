import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AnalyticsAdminGuard } from './analytics-admin.guard';
import { ANALYTICS_ADMIN_KEY } from '../../roles/roles.decorator';
import { userRole } from '../../users/enums/userRole.enum';

describe('AnalyticsAdminGuard', () => {
  let guard: AnalyticsAdminGuard;
  let reflector: Reflector;

  const mockContext = (userRoleValue?: string) => {
    const user = userRoleValue ? { userRole: userRoleValue } : undefined;
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => null,
      getClass: () => null,
    } as any;
  };

  beforeEach(() => {
    reflector = new Reflector();
    guard = new AnalyticsAdminGuard(reflector);
  });

  describe('when route has @AnalyticsAdmin() decorator', () => {
    beforeEach(() => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(true);
    });

    it('allows admin users', () => {
      const context = mockContext(userRole.ADMIN);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('throws ForbiddenException for non-admin users', () => {
      const context = mockContext(userRole.USER);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException for guest users', () => {
      const context = mockContext(userRole.GUEST);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when no user is attached to request', () => {
      const context = mockContext(undefined);
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('when route lacks @AnalyticsAdmin() decorator', () => {
    beforeEach(() => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(false);
    });

    it('allows any user through', () => {
      const context = mockContext(userRole.USER);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('allows unauthenticated requests through', () => {
      const context = mockContext(undefined);
      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
