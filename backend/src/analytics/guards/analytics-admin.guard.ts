import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { userRole } from '../../users/enums/userRole.enum';
import { DecodedUserPayload } from '../../auth/middleware/jwt-auth.middleware';

/**
 * Restricts analytics routes that expose sensitive aggregate data
 * (e.g. retention curves) to admin users.
 *
 * Relies on `JwtAuthMiddleware`, which runs globally and attaches
 * the decoded token payload to `req.user` before any guard executes.
 * This guard does not re-verify the token -- it only checks role.
 */
@Injectable()
export class AnalyticsAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
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
