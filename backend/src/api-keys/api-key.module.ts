import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ApiKey } from './api-key.entity';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { User } from '../users/user.entity';
import { ApiKeyMiddleware, ApiKeyAuthMiddleware } from './api-key.middleware';
import { ApiKeyLoggingInterceptor } from './api-key-logging.interceptor';
import { ApiKeyThrottlerGuard } from './api-key-throttler.guard';
import { ApiKeyGuard } from './api-key.guard';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey, User])],
  controllers: [ApiKeyController],
  providers: [
    ApiKeyService,
    ApiKeyThrottlerGuard,
    ApiKeyGuard,
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiKeyLoggingInterceptor,
    },
  ],
  exports: [ApiKeyService, ApiKeyThrottlerGuard],
})
export class ApiKeyModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply API key middleware to all routes (optional authentication)
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}