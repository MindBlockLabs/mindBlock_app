import { DynamicModule, Module, Global, Provider } from '@nestjs/common';
import {
  JwtAuthMiddleware,
  JwtAuthMiddlewareOptions,
} from './jwt-auth.middleware';

/**
 * Module for JWT Authentication Middleware.
 * Provides configuration and the middleware itself as a service.
 */
@Global()
@Module({})
export class JwtAuthModule {
  /**
   * Registers the JWT Auth Module with options.
   * @param options Static configuration options OR a provider configuration.
   */
  static register(options: JwtAuthMiddlewareOptions): DynamicModule {
    return {
      module: JwtAuthModule,
      providers: [
        {
          provide: 'JWT_AUTH_OPTIONS',
          useValue: options,
        },
        JwtAuthMiddleware,
      ],
      exports: [JwtAuthMiddleware, 'JWT_AUTH_OPTIONS'],
    };
  }

  /**
   * Registers the JWT Auth Module asynchronously.
   */
  static registerAsync(options: {
    useFactory: (
      ...args: any[]
    ) => Promise<JwtAuthMiddlewareOptions> | JwtAuthMiddlewareOptions;
    inject?: any[];
  }): DynamicModule {
    const provider: Provider = {
      provide: 'JWT_AUTH_OPTIONS',
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      module: JwtAuthModule,
      providers: [provider, JwtAuthMiddleware],
      exports: [JwtAuthMiddleware, 'JWT_AUTH_OPTIONS'],
    };
  }
}
