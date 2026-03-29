import { Injectable, NestMiddleware, ForbiddenException, Logger, InternalServerErrorException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  /** Trusted score submitter — can call blockchain score endpoints (Issue #295). */
  ORACLE = 'ORACLE',
  ADMIN = 'ADMIN',
}

/**
 * ADMIN inherits all permissions.
 * ORACLE can submit trusted scores (USER-level API access + score submission).
 * MODERATOR inherits USER permissions.
 */
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.ORACLE, UserRole.MODERATOR, UserRole.USER],
  [UserRole.ORACLE]: [UserRole.ORACLE, UserRole.USER],
  [UserRole.MODERATOR]: [UserRole.MODERATOR, UserRole.USER],
  [UserRole.USER]: [UserRole.USER],
};

export interface RbacOptions {
  /** Whether to log unauthorized access attempts. Default: true */
  logging?: boolean;
}

/**
 * Returns true when the user's role satisfies at least one of the required roles
 * (OR logic), respecting the role hierarchy.
 */
function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  const effectiveRoles = ROLE_HIERARCHY[userRole] ?? [userRole];
  return requiredRoles.some((required) => effectiveRoles.includes(required));
}

/**
 * Factory that creates a NestJS-compatible middleware function enforcing
 * role-based access control. Must run after auth middleware so `req.user`
 * is already populated.
 *
 * @example
 * consumer
 *   .apply(JwtAuthMiddleware, rbacMiddleware([UserRole.ADMIN]))
 *   .forRoutes('/admin');
 */
export function rbacMiddleware(
  requiredRoles: UserRole[],
  options: RbacOptions = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const logger = new Logger('RbacMiddleware');
  const { logging = true } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      // Auth middleware should have caught this first; treat as misconfiguration
      throw new ForbiddenException('Access denied. User not authenticated.');
    }

    const userRole: UserRole = user.userRole;
    if (!userRole) {
      throw new InternalServerErrorException(
        'User object is missing the userRole field.',
      );
    }

    if (!hasPermission(userRole, requiredRoles)) {
      const requiredList = requiredRoles.join(' or ');
      if (logging) {
        logger.warn(
          `Unauthorized access attempt by ${user.email} (role: ${userRole}) ` +
            `on ${req.method} ${req.path} — required: ${requiredList}`,
        );
      }
      throw new ForbiddenException(
        `Access denied. Required role: ${requiredList}`,
      );
    }

    next();
  };
}
