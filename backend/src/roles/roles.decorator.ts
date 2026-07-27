import { SetMetadata } from '@nestjs/common';
import { userRole } from '../users/enums/userRole.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: userRole[]) => SetMetadata(ROLES_KEY, roles);

export const ANALYTICS_ADMIN_KEY = 'analytics_admin';
export const AnalyticsAdmin = () => SetMetadata(ANALYTICS_ADMIN_KEY, true);
