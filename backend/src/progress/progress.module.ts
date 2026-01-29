import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgress } from './entities/progress.entity';
import { User } from '../users/user.entity';
import { Streak } from '../streak/entities/streak.entity';
import { DailyQuest } from '../quests/entities/daily-quest.entity';
import { ProgressController } from './controllers/progress.controller';
import { ProgressService } from './progress.service';
import { GetProgressHistoryProvider } from './providers/get-progress-history.provider';
import { GetCategoryStatsProvider } from './providers/get-category-stats.provider';
import { GetOverallStatsProvider } from './providers/get-overall-stats.provider';
import { ProgressCalculationProvider } from './providers/progress-calculation.provider';
import { Puzzle } from '../puzzles/entities/puzzle.entity';


@Module({
  imports: [
    TypeOrmModule.forFeature([UserProgress, User, Puzzle, Streak, DailyQuest]),
  ],
  controllers: [ProgressController],
  providers: [
    ProgressService,
    GetProgressHistoryProvider,
    GetCategoryStatsProvider,
    GetOverallStatsProvider,
    ProgressCalculationProvider,
  ],
  exports: [ProgressService, ProgressCalculationProvider, TypeOrmModule],
})
export class ProgressModule {}