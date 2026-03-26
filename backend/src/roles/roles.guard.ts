import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { userRole } from '../users/enums/userRole.enum';
import { OwnershipRequirement, ROLES_KEY, RolesOptions } from './roles.decorator';

type AuthenticatedRequestUser = {
  userId?: string;
  sub?: string;
  email?: string;
  userRole?: userRole;
  role?: userRole;
  [key: string]: unknown;
};

type AuthenticatedRequest = Request & {
  user?: AuthenticatedRequestUser;
};

const ROLE_HIERARCHY: Record<userRole, userRole[]> = {
  [userRole.ADMIN]: [userRole.ADMIN, userRole.MODERATOR, userRole.USER],
  [userRole.MODERATOR]: [userRole.MODERATOR, userRole.USER],
  [userRole.USER]: [userRole.USER],
  [userRole.GUEST]: [userRole.GUEST],
};

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RolesOptions>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options || options.roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied. Authentication context is missing.');
    }

    const effectiveRole = user.userRole ?? user.role;

    if (!effectiveRole) {
      this.logger.error(
        `Authenticated user is missing a role on ${request.method} ${request.originalUrl ?? request.url}`,
      );
      throw new InternalServerErrorException(
        'User role is missing from the authentication context.',
      );
    }

    if (this.hasRequiredRole(effectiveRole, options.roles)) {
      return true;
    }

    if (this.isOwner(request, user, options.ownership)) {
      return true;
    }

    const requiredRoles = options.roles.map((role) => role.toUpperCase()).join(' or ');
    const message = options.ownership
      ? `Access denied. Required role: ${requiredRoles} or ownership of this resource`
      : `Access denied. Required role: ${requiredRoles}`;

    this.logger.warn(
      JSON.stringify({
        event: 'rbac_denied',
        method: request.method,
        path: request.originalUrl ?? request.url,
        userId: user.userId ?? user.sub ?? null,
        userRole: effectiveRole,
        requiredRoles: options.roles,
        ownershipParam: options.ownership?.param ?? null,
      }),
    );

    throw new ForbiddenException(message);
  }

  private hasRequiredRole(currentRole: userRole, requiredRoles: userRole[]): boolean {
    const allowedRoles = ROLE_HIERARCHY[currentRole] ?? [currentRole];

    return requiredRoles.some((requiredRole) => allowedRoles.includes(requiredRole));
  }

  private isOwner(
    request: AuthenticatedRequest,
    user: AuthenticatedRequestUser,
    ownership?: OwnershipRequirement,
  ): boolean {
    if (!ownership) {
      return false;
    }

    const userId = user[ownership.userIdField ?? 'userId'] ?? user.userId ?? user.sub;
    const resourceOwner = request.params?.[ownership.param];

    return !!userId && !!resourceOwner && String(userId) === String(resourceOwner);
  }
}
