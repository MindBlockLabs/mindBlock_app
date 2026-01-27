import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AUTH_TYPE_KEY } from '../constants/auth.constant';
import { authType } from '../enum/auth-type.enum';
import { AuthGuard } from '@nestjs/passport';

/**auth constants */
export const Auth = (...authTypes: authType[]) => {
  return applyDecorators(
    SetMetadata(AUTH_TYPE_KEY, authTypes),
    UseGuards(AuthGuard('jwt')), // ← This applies the Passport JWT guard
  );
};
