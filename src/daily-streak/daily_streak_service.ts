import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getMilestoneReward } from './streak_milestone_config';
import { GamificationService } from 'src/gamification/gamification.service';
import { DailyStreak } from './entities/daily_streak_entity';


export interface StreakUpdateResult {
  streak: DailyStreak;
  isNewStreak: boolean;
  streakIncremented: boolean;
  milestoneReached: boolean;
  milestoneReward?: {
    title: string;
    bonusXp: number;
    bonusTokens: number;
  };
}

@Injectable()
export class DailyStreakService {
  private readonly logger = new Logger(DailyStreakService.name);

  constructor(
    @InjectRepository(DailyStreak)
    private readonly dailyStreakRepository: Repository<DailyStreak>,
    @Inject(forwardRef(() => GamificationService))
    private readonly gamificationService: GamificationService,
  ) {}

  async updateStreak(userId: number): Promise<StreakUpdateResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    let existingStreak = await this.dailyStreakRepository.findOne({
      where: { userId }
    });

    let isNewStreak = false;
    let streakIncremented = false;
    let milestoneReached = false;
    let milestoneReward: {
      title: string;
      bonusXp: number;
      bonusTokens: number;
    } | undefined = undefined;

    if (!existingStreak) {
      // Create new streak record
      existingStreak = this.dailyStreakRepository.create({
        userId,
        lastActiveDate: today,
        streakCount: 1,
        longestStreak: 1,
      });
      isNewStreak = true;
      streakIncremented = true;
    } else {
      const lastActiveDate = new Date(existingStreak.lastActiveDate);
      lastActiveDate.setHours(0, 0, 0, 0);
      
      const daysDifference = this.calculateDaysDifference(lastActiveDate, today);

      if (daysDifference === 0) {
        // Already active today, no change needed
        this.logger.debug(`User ${userId} already has streak for today`);
      } else if (daysDifference === 1) {
        // Consecutive day - increment streak
        existingStreak.streakCount += 1;
        existingStreak.lastActiveDate = today;
        existingStreak.longestStreak = Math.max(
          existingStreak.longestStreak,
          existingStreak.streakCount
        );
        streakIncremented = true;

        // Check for milestone
        const milestone = getMilestoneReward(existingStreak.streakCount);
        if (milestone) {
          milestoneReached = true;
          milestoneReward = milestone;
          
          // Award milestone rewards
          await this.gamificationService.awardBonusRewards(
            userId,
            milestone.bonusXp,
            milestone.bonusTokens,
            `Streak Milestone: ${milestone.title}`
          );
        }
      } else {
        // Streak broken - reset to 1
        this.logger.log(`Streak reset for user ${userId}. Days gap: ${daysDifference}`);
        existingStreak.streakCount = 1;
        existingStreak.lastActiveDate = today;
        streakIncremented = true;
      }
    }

    const savedStreak = await this.dailyStreakRepository.save(existingStreak);

    return {
      streak: savedStreak,
      isNewStreak,
      streakIncremented,
      milestoneReached,
      milestoneReward,
    };
  }

  async getStreak(userId: number): Promise<DailyStreak | null> {
    const streak = await this.dailyStreakRepository.findOne({
      where: { userId }
    });

    if (!streak) {
      return null;
    }

    // Check if streak should be considered active
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActiveDate = new Date(streak.lastActiveDate);
    lastActiveDate.setHours(0, 0, 0, 0);
    
    const daysDifference = this.calculateDaysDifference(lastActiveDate, today);
    
    // If more than 1 day has passed, the streak is effectively broken
    if (daysDifference > 1) {
      // Reset streak count to 0 for display purposes, but don't save yet
      // It will be properly reset when they next solve a puzzle
      return {
        ...streak,
        streakCount: 0
      };
    }

    return streak;
  }

  async getStreakLeaderboard(limit: number = 10): Promise<DailyStreak[]> {
    return await this.dailyStreakRepository.find({
      order: {
        streakCount: 'DESC',
        longestStreak: 'DESC',
        updatedAt: 'DESC'
      },
      take: limit,
    });
  }

  async getUserStreakRank(userId: number): Promise<number> {
    const userStreak = await this.getStreak(userId);
    if (!userStreak) return 0;

   const higherStreaks = await this.dailyStreakRepository
  .createQueryBuilder('streak')
  .where('streak.streakCount > :userStreak', { userStreak: userStreak.streakCount })
  .getCount();


    return higherStreaks + 1;
  }

  private calculateDaysDifference(date1: Date, date2: Date): number {
    const timeDiff = date2.getTime() - date1.getTime();
    return Math.floor(timeDiff / (1000 * 3600 * 24));
  }

  async getStreakStats(): Promise<{
    totalActiveStreaks: number;
    averageStreakLength: number;
    longestCurrentStreak: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Count active streaks (updated today or yesterday)
    const activeStreaks = await this.dailyStreakRepository
      .createQueryBuilder('streak')
      .where('streak.lastActiveDate >= :yesterday', { yesterday })
      .andWhere('streak.streakCount > 0')
      .getMany();

    const totalActiveStreaks = activeStreaks.length;
    
    const averageStreakLength = totalActiveStreaks > 0 
      ? activeStreaks.reduce((sum, streak) => sum + streak.streakCount, 0) / totalActiveStreaks
      : 0;

    const longestCurrentStreak = totalActiveStreaks > 0
      ? Math.max(...activeStreaks.map(streak => streak.streakCount))
      : 0;

    return {
      totalActiveStreaks,
      averageStreakLength: Math.round(averageStreakLength * 100) / 100,
      longestCurrentStreak,
    };
  }
}