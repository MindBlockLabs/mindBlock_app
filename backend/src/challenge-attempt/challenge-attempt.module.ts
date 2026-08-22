import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeAttempt } from './entities/challenge-attempt.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { ChallengeAttemptService } from './providers/challenge-attempt.service';
import { ChallengeAttemptController } from './controllers/challenge-attempt.controller';
import { ChallengeValidationService } from './providers/challenge-validation.service';
import { IdempotencyModule } from '../common/idempotency/idempotency.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChallengeAttempt, Puzzle]),
    IdempotencyModule,
  ],
  controllers: [ChallengeAttemptController],
  providers: [ChallengeAttemptService, ChallengeValidationService],
  exports: [ChallengeAttemptService, ChallengeValidationService],
})
export class ChallengeAttemptModule {}
