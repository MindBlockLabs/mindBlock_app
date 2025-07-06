import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GamificationService } from './gamification.service';
import { PuzzleModule } from 'src/puzzle/puzzle.module';
import { GamificationController } from './gamification.controller';
import { StreakController } from './controllers/streak.controller';
import { DailyStreakService } from './providers/daily-streak.service';
import { StreakListener } from './listeners/streak.listener';
import { DailyStreak } from './entities/daily-streak.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    forwardRef(() => PuzzleModule),
    TypeOrmModule.forFeature([DailyStreak, User]),
  ],
  controllers: [GamificationController, StreakController],
  providers: [GamificationService, DailyStreakService, StreakListener],
  exports: [GamificationService, DailyStreakService],
})
export class GamificationModule {}
