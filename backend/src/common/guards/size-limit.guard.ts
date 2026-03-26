import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CUSTOM_SIZE_LIMIT_KEY } from '../decorators/size-limit.decorator';

@Injectable()
export class SizeLimitGuard implements CanActivate {
  private readonly logger = new Logger(SizeLimitGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const customSizeLimit = this.reflector.get<number>(
      CUSTOM_SIZE_LIMIT_KEY,
      context.getHandler(),
    );

    if (customSizeLimit) {
      const request = context.switchToHttp().getRequest<Request>();
      (request as any)._customSizeLimit = customSizeLimit;

      this.logger.debug(
        `Custom size limit set to ${customSizeLimit} bytes for ${request.method} ${request.path}`,
      );
    }

    return true;
  }
}