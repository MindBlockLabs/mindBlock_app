import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiKeyScope } from './api-key.entity';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeyThrottlerGuard } from './api-key-throttler.guard';

export const API_KEY_SCOPES = 'api_key_scopes';
export const REQUIRE_API_KEY = 'require_api_key';

export function RequireApiKey() {
  return applyDecorators(
    SetMetadata(REQUIRE_API_KEY, true),
    UseGuards(ApiKeyGuard, ApiKeyThrottlerGuard),
  );
}

export function RequireApiKeyScopes(...scopes: ApiKeyScope[]) {
  return applyDecorators(
    SetMetadata(API_KEY_SCOPES, scopes),
    SetMetadata(REQUIRE_API_KEY, true),
    UseGuards(ApiKeyGuard, ApiKeyThrottlerGuard),
  );
}