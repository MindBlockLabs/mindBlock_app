import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { ProgressModule } from './progress/progress.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { PuzzlesModule } from './puzzles/puzzles.module';
import { QuestsModule } from './quests/quests.module';
import { StreakModule } from './streak/strerak.module';
import { CategoriesModule } from './categories/categories.module';
import { JwtAuthModule, JwtAuthMiddleware } from './auth/middleware/jwt-auth.module';
import { REDIS_CLIENT } from './redis/redis.constants';
import jwtConfig from './auth/authConfig/jwt.config';
import { UsersService } from './users/providers/users.service';
import { GeolocationMiddleware } from './common/middleware/geolocation.middleware';
import { HealthModule } from './health/health.module';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';

// const ENV = process.env.NODE_ENV;
// console.log('NODE_ENV:', process.env.NODE_ENV);
// console.log('ENV:', ENV);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig, databaseConfig, jwtConfig],
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        interface DatabaseConfig {
          url?: string;
          host?: string;
          port?: number;
          user?: string;
          password?: string;
          name?: string;
          autoload?: boolean;
          synchronize?: boolean;
        }
        const dbConfig = configService.get<DatabaseConfig>('database');

        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }

        // If DATABASE_URL is set, use connection string (production)
        if (dbConfig.url) {
          return {
            type: 'postgres',
            url: dbConfig.url,
            autoLoadEntities: dbConfig.autoload,
            synchronize: dbConfig.synchronize,
          };
        }

        // Otherwise fall back to normal config (development)
        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.user,
          password: dbConfig.password,
          database: dbConfig.name,
          autoLoadEntities: dbConfig.autoload,
          synchronize: dbConfig.synchronize,
        };
      },
    }),
    AuthModule,
    UsersModule,
    PuzzlesModule,
    ProgressModule,
    QuestsModule,
    StreakModule,
    CommonModule,
    RedisModule,
    BlockchainModule,
    ProgressModule,
    CategoriesModule,
    // Register the custom JWT Auth Middleware module
    JwtAuthModule.registerAsync({
      imports: [ConfigModule, UsersModule, RedisModule],
      inject: [ConfigService, UsersService, REDIS_CLIENT],
      useFactory: (configService: ConfigService, usersService: UsersService, redisClient: any) => ({
        secret: configService.get<string>('jwt.secret') || '',
        redisClient: redisClient,
        validateUser: async (userId: string) => await usersService.findOneById(userId),
        logging: true,
        publicRoutes: ['/auth', '/api', '/docs', '/health'],
      }),
    }),
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService, RateLimitMiddleware],
})
export class AppModule implements NestModule {
  /**
   * Apply the JWT Authentication Middleware to all routes except public ones.
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(GeolocationMiddleware)
      .forRoutes('*');

    consumer
      .apply(JwtAuthMiddleware)
      .exclude(
        { path: 'auth/(.*)', method: RequestMethod.ALL },
        { path: 'api', method: RequestMethod.GET },
        { path: 'docs', method: RequestMethod.GET },
        { path: 'health', method: RequestMethod.GET },
      )
      .forRoutes('*');

    consumer
      .apply(RateLimitMiddleware)
      .exclude(
        { path: 'health/(.*)', method: RequestMethod.ALL },
        { path: 'health', method: RequestMethod.ALL },
        { path: 'api', method: RequestMethod.ALL },
        { path: 'docs', method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }
}
