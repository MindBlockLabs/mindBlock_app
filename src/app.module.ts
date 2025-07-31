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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: +configService.get('database.port'),
        username: configService.get('database.user'),
        password: configService.get('database.password'),
        database: configService.get('database.name'),
        synchronize: configService.get('database.synchronize'),
        autoLoadEntities: configService.get('database.autoload'),
      }),
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
