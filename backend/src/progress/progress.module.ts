import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgress } from './entities/progress.entity';
import { User } from '../users/user.entity';
import { Puzzle } from '../puzzles/entities/puzzle.entity';
import { Streak } from '../streak/entities/streak.entity';
import { DailyQuest } from '../quests/entities/daily-quest.entity';
import { ProgressService } from './progress.service';
import { ProgressCalculationProvider } from './providers/progress-calculation.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProgress, User, Puzzle, Streak, DailyQuest]),
  ],
  providers: [ProgressService, ProgressCalculationProvider],
  exports: [ProgressService, ProgressCalculationProvider, TypeOrmModule],
})
export class ProgressModule {}
