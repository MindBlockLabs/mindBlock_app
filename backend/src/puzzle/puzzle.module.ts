import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PuzzleController } from './puzzle.controller';
import { PuzzleService } from './puzzle.service';
import { GamificationModule } from '../gamification/gamification.module';
import { Puzzle } from './entities/puzzle.entity';
import { PuzzleSubmission } from './entities/puzzle-submission.entity';
import { PuzzleProgress } from './entities/puzzle-progress.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    forwardRef(() => GamificationModule),
    TypeOrmModule.forFeature([Puzzle, PuzzleSubmission, PuzzleProgress, User]),
  ],
  controllers: [PuzzleController],
  providers: [PuzzleService],
  exports: [PuzzleService],
})
export class PuzzleModule {}
