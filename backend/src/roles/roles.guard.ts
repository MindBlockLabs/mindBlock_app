import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { userRole } from '../users/enums/userRole.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<userRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: userRole } }>();
    const user = request.user;

    if (
      !user ||
      user.role === undefined ||
      !requiredRoles.includes(user.role)
    ) {
      throw new ForbiddenException('Forbidden: Insufficient role');
    }

    return true;
  }
}
