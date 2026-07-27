import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ANALYTICS_ADMIN_KEY } from '../../roles/roles.decorator';
import { userRole } from '../../users/enums/userRole.enum';
import { DecodedUserPayload } from '../../auth/middleware/jwt-auth.middleware';

@Injectable()
export class AnalyticsAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<boolean>(
      ANALYTICS_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: DecodedUserPayload }>();
    const user = request.user;

    if (!user || user.userRole !== userRole.ADMIN) {
      throw new ForbiddenException(
        'Forbidden: analytics admin access required',
      );
    }

    return true;
  }
}
