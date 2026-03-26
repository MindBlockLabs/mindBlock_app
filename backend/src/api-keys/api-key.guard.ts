import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyService } from './api-key.service';
import { ApiKeyScope } from './api-key.entity';
import { RequestWithApiKey } from './api-key.middleware';
import { API_KEY_SCOPES, REQUIRE_API_KEY } from './api-key.decorators';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithApiKey>();
    const requireApiKey = this.reflector.get<boolean>(REQUIRE_API_KEY, context.getHandler());

    if (!requireApiKey) {
      return true; // No API key required
    }

    if (!request.apiKey) {
      throw new UnauthorizedException('API key authentication required');
    }

    const requiredScopes = this.reflector.get<ApiKeyScope[]>(API_KEY_SCOPES, context.getHandler());

    if (requiredScopes && requiredScopes.length > 0) {
      const hasRequiredScope = requiredScopes.some(scope =>
        this.apiKeyService.hasScope(request.apiKey, scope)
      );

      if (!hasRequiredScope) {
        throw new UnauthorizedException('Insufficient API key permissions');
      }
    }

    return true;
  }
}