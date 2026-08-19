import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeAttempt } from './entities/challenge-attempt.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { ChallengeAttemptService } from './providers/challenge-attempt.service';
import { ChallengeAttemptController } from './controllers/challenge-attempt.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChallengeAttempt, Puzzle])],
  controllers: [ChallengeAttemptController],
  providers: [ChallengeAttemptService],
  exports: [ChallengeAttemptService],
})
export class ChallengeAttemptModule {}
