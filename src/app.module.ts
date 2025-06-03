/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
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
import { Puzzle } from './puzzle/entities/puzzle.entity';
import { PuzzleSubmission } from './puzzle/entities/puzzle-submission.entity';
import { PuzzleProgress } from './puzzle/entities/puzzle-progress.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [Puzzle, PuzzleSubmission, PuzzleProgress],
        autoLoadEntities: configService.get('DATABASE_LOAD'),
        synchronize: configService.get('DATABASE_SYNC'),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
