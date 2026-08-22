import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameSession } from './entities/game-session.entity';
import { ChallengeAttempt } from '../challenge-attempt/entities/challenge-attempt.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { GameSessionsService } from './providers/game-sessions.service';
import { SessionSummaryProvider } from './providers/session-summary.provider';
import { GameSessionsController } from './controllers/game-sessions.controller';
import { StreakModule } from '../streak/strerak.module';
import { RewardsModule } from '../rewards/rewards.module';
import { IdempotencyModule } from '../common/idempotency/idempotency.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameSession, ChallengeAttempt, Puzzle]),
    StreakModule,
    RewardsModule,
    IdempotencyModule,
  ],
  controllers: [GameSessionsController],
  providers: [GameSessionsService, SessionSummaryProvider],
  exports: [GameSessionsService],
})
export class GameSessionsModule {}
