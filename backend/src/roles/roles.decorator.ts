import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse } from '@nestjs/swagger';
import { userRole } from '../users/enums/userRole.enum';
import { RolesGuard } from './roles.guard';

export const ROLES_KEY = 'roles';

export interface OwnershipRequirement {
  param: string;
  userIdField?: string;
}

export interface RolesOptions {
  roles: userRole[];
  ownership?: OwnershipRequirement;
}

export function Roles(...roles: userRole[]): MethodDecorator & ClassDecorator;
export function Roles(
  options: RolesOptions,
): MethodDecorator & ClassDecorator;
export function Roles(
  ...rolesOrOptions: [RolesOptions] | userRole[]
): MethodDecorator & ClassDecorator {
  const options =
    typeof rolesOrOptions[0] === 'object' && !Array.isArray(rolesOrOptions[0])
      ? (rolesOrOptions[0] as RolesOptions)
      : ({
          roles: rolesOrOptions as userRole[],
        } satisfies RolesOptions);

  const readableRoles = options.roles.map((role) => role.toUpperCase()).join(' or ');
  const forbiddenMessage = options.ownership
    ? `Access denied. Required role: ${readableRoles} or ownership of this resource`
    : `Access denied. Required role: ${readableRoles}`;

  return applyDecorators(
    SetMetadata(ROLES_KEY, options),
    UseGuards(RolesGuard),
    ApiBearerAuth(),
    ApiForbiddenResponse({
      description: forbiddenMessage,
    }),
  );
}
