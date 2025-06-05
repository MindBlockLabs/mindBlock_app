import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyStreak } from './entities/daily_streak_entity';
import { GamificationModule } from 'src/gamification/gamification.module';
import { DailyStreakService } from './daily_streak_service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyStreak]),
    forwardRef(() => GamificationModule), // <- fix here
  ],
  providers: [DailyStreakService],
  exports: [DailyStreakService],
})
export class DailyStreakModule {}
