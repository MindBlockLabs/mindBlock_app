import { Injectable } from '@nestjs/common';
import { STREAK_MILESTONES } from '../constants/streak.constants';
import { DailyStreak } from '../entities/daily-streak.entity';
import { StreakResponseDto } from '../dto/streak.dto';

@Injectable()
export class BuildStreakResponseService {
  buildStreakResponse(streak: DailyStreak): StreakResponseDto {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActive = new Date(streak.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);
    const hasSolvedToday = today.getTime() === lastActive.getTime();
    const milestones = Object.keys(STREAK_MILESTONES).map(Number).sort((a, b) => a - b);
    const nextMilestone = milestones.find(m => m > streak.streakCount);
    const daysUntilNextMilestone = nextMilestone ? nextMilestone - streak.streakCount : null;
    return {
      streakCount: streak.streakCount,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
      hasSolvedToday,
      nextMilestone,
      daysUntilNextMilestone: daysUntilNextMilestone || undefined,
    };
  }
} 