/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

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
// Entities
// import { Puzzle } from './puzzle/entities/puzzle.entity';
// import { PuzzleSubmission } from './puzzle/entities/puzzle-submission.entity';
// import { PuzzleProgress } from './puzzle/entities/puzzle-progress.entity';
import { DailyStreakModule } from './daily-streak/daily_streak_module';
import { GamificationModule } from './gamification/gamification.module';


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
    BlockchainModule,
    BadgeModule,
    TimeFilterModule,
    IQAssessmentModule,
    PuzzleModule,
    DailyStreakModule,
    GamificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
