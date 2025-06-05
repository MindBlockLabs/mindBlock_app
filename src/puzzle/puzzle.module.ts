// src/puzzle/puzzle.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { PuzzleController } from './puzzle.controller';
import { PuzzleService } from './puzzle.service';
import { GamificationModule } from 'src/gamification/gamification.module';
import { DailyStreakModule } from 'src/daily-streak/daily_streak_module';

@Module({
  imports: [forwardRef(() => GamificationModule), forwardRef(() => DailyStreakModule),],
  controllers: [PuzzleController],
  providers: [PuzzleService],
  exports: [PuzzleService],
})
export class PuzzleModule {}
