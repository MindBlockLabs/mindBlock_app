import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuzzlesController } from './controllers/puzzles.controller';
import { SubmissionProvider } from './providers/submission.provider';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzleSubmission } from './entities/puzzle-submission.entity';
import { PuzzleProgress } from './entities/puzzle-progress.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Puzzle, PuzzleSubmission, PuzzleProgress, User]),
  ],
  controllers: [PuzzlesController],
  providers: [SubmissionProvider],
  exports: [SubmissionProvider],
})
export class PuzzlesModule {}
