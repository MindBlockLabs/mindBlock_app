import { forwardRef, Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { DailyStreakModule } from 'src/daily-streak/daily_streak_module';
import { PuzzleModule } from 'src/puzzle/puzzle.module';

@Module({
  imports: [forwardRef(() => DailyStreakModule), forwardRef(() => PuzzleModule)],
  controllers: [],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
