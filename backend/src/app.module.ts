/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
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
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { BadgeModule } from './badge/badge.module';
import { TimeFilterModule } from './timefilter/timefilter.module';
import { IQAssessmentModule } from './iq-assessment/iq-assessment.module';
import { PuzzleModule } from './puzzle/puzzle.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { GamificationModule } from './gamification/gamification.module';
import { AchievementModule } from './achievement/achievement.module';

// const ENV = process.env.NODE_ENV;
// console.log('NODE_ENV:', process.env.NODE_ENV);
// console.log('ENV:', ENV);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig, databaseConfig],
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get('database');

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
    LeaderboardModule,
    CommonModule,
    RedisModule,
    BlockchainModule,
    BadgeModule,
    TimeFilterModule,
    IQAssessmentModule,
    PuzzleModule,
    GamificationModule,
    AchievementModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
