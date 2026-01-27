import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from '../constants/auth.constant';
import { ActiveUserData } from '../interfaces/activeInterface';

/**Active user class */
export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Record<string, any>>();

    const user = request[REQUEST_USER_KEY] as ActiveUserData;

    console.log('ActiveUser decorator - user:', user);
    console.log('ActiveUser decorator - field:', field);
    console.log('ActiveUser decorator - value:', field ? user?.[field] : user);
    return field ? user?.[field] : user;
  },
);
