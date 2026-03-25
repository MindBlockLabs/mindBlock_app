import { DynamicModule, Module, Global, Provider } from '@nestjs/common';
import {
  JwtAuthMiddleware,
  JwtAuthMiddlewareOptions,
} from './jwt-auth.middleware';

export { JwtAuthMiddleware } from './jwt-auth.middleware';

/**
 * Module for JWT Authentication Middleware.
 * Supports both static and async registration.
 */
@Global()
@Module({})
export class JwtAuthModule {
  /**
   * Registers the JWT Auth Module with static options.
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
   * Registers the JWT Auth Module asynchronously (factory pattern).
   */
  static registerAsync(options: {
    imports?: any[];
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
      imports: options.imports || [],
      providers: [provider, JwtAuthMiddleware],
      exports: [JwtAuthMiddleware, 'JWT_AUTH_OPTIONS'],
    };
  }
}
