import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamificationService } from './gamification.service';
import { PuzzleModule } from '../puzzle/puzzle.module';
import { GamificationController } from './gamification.controller';
import { StreakController } from './controllers/streak.controller';
import { DailyStreakService } from './providers/daily-streak.service';
import { StreakListener } from './listeners/streak.listener';
import { DailyStreak } from './entities/daily-streak.entity';
import { User } from '../users/user.entity';
import { UpdateStreakService } from './providers/update-streak.service';
import { GetStreakService } from './providers/get-streak.service';
import { GetStreakLeaderboardService } from './providers/get-streak-leaderboard.service';
import { CheckAndAwardMilestonesService } from './providers/check-and-award-milestones.service';
import { BuildStreakResponseService } from './providers/build-streak-response.service';
import { GetStreakStatsService } from './providers/get-streak-stats.service';

@Module({
  imports: [
    forwardRef(() => PuzzleModule),
    TypeOrmModule.forFeature([DailyStreak, User]),
  ],
  controllers: [GamificationController, StreakController],
  providers: [
    GamificationService,
    DailyStreakService,
    StreakListener,
    UpdateStreakService,
    GetStreakService,
    GetStreakLeaderboardService,
    CheckAndAwardMilestonesService,
    BuildStreakResponseService,
    GetStreakStatsService,
  ],
  exports: [GamificationService, DailyStreakService],
})
export class GamificationModule {}
