import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GeolocationData } from '../interfaces/geolocation.interface';

export const LocationData = createParamDecorator(
  (data: keyof GeolocationData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const location = request.location;

    if (!location) {
      return null;
    }

    return data ? location[data] : location;
  },
);
