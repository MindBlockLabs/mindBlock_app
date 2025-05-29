
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from '../constants/auth.constant';
import { ActiveUserData } from '../interface/activeInterface';

/**Active user class */
export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    const user: ActiveUserData = request[REQUEST_USER_KEY]
    return field ? user?.[field] : user 
  },
);
