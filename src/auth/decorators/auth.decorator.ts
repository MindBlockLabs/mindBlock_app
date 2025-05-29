import { SetMetadata } from '@nestjs/common';
import { AUTH_TYPE_KEY } from '../constants/auth.constant';
import { authType } from '../enum/auth-type.enum';

/**auth constants */
export const Auth = (...authTypes: authType[]) => 
    SetMetadata(AUTH_TYPE_KEY, authTypes);