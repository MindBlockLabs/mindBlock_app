import { forwardRef, Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { DailyStreakModule } from 'src/daily-streak/daily_streak_module';
import { PuzzleModule } from 'src/puzzle/puzzle.module';
import { GamificationController } from './gamification.controller';

@Module({
  imports: [forwardRef(() => DailyStreakModule), forwardRef(() => PuzzleModule)],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
