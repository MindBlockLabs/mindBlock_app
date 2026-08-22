import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChallengeAttempt } from './entities/challenge-attempt.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { GameSession } from '../game-sessions/entities/game-session.entity';
import { UsersModule } from '../users/users.module';
import { ChallengeAttemptService } from './providers/challenge-attempt.service';
import { ChallengeAttemptController } from './controllers/challenge-attempt.controller';
import { ChallengeValidationService } from './providers/challenge-validation.service';

@Module({
  imports: [
    // UserProgress is written via the injected DataSource's EntityManager
    // inside a transaction (see ChallengeAttemptService.submitAttempt), not
    // via a Repository<UserProgress> here — it doesn't need to be
    // forFeature'd in this module. It's already part of the global entity
    // set via ProgressModule/UsersModule (autoLoadEntities: true).
    //
    // GameSession *is* forFeature'd (read-only lookup, no write access here)
    // so submitAttempt can use the real GameSession.challengeCount as the
    // session-length target instead of a hardcoded fallback, without
    // importing GameSessionsModule itself (which would create a circular
    // module dependency — GameSessionsModule already imports the
    // ChallengeAttempt entity).
    TypeOrmModule.forFeature([ChallengeAttempt, Puzzle, GameSession]),
    UsersModule, // for XpLevelService
  ],
  controllers: [ChallengeAttemptController],
  providers: [ChallengeAttemptService, ChallengeValidationService],
  exports: [ChallengeAttemptService, ChallengeValidationService],
})
export class ChallengeAttemptModule {}
