import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DailyStreak } from '../entities/daily-streak.entity';
import { User } from '../../users/user.entity';
import { StreakResponseDto, StreakLeaderboardEntryDto, StreakLeaderboardResponseDto, StreakQueryDto } from '../dto/streak.dto';
import { STREAK_MILESTONES, STREAK_EVENTS, STREAK_CONFIG } from '../constants/streak.constants';
import { BonusRewardDto } from '../dto/bonus-reward.dto';

@Injectable()
export class DailyStreakService {
  private readonly logger = new Logger(DailyStreakService.name);

  constructor(
    @InjectRepository(DailyStreak)
    private readonly streakRepository: Repository<DailyStreak>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Update user's streak after solving a puzzle
   */
  async updateStreak(userId: string): Promise<StreakResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create streak record
    let streak = await this.streakRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!streak) {
      // Create new streak record
      streak = this.streakRepository.create({
        userId,
        lastActiveDate: today,
        streakCount: 1,
        longestStreak: 1,
        lastMilestoneReached: null as number | null,
      });
    } else {
      const lastActive = new Date(streak.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);

      const daysDifference = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDifference === 0) {
        // User already solved a puzzle today, return current streak
        return this.buildStreakResponse(streak);
      } else if (daysDifference === 1) {
        // Consecutive day, increment streak
        streak.streakCount += 1;
        streak.lastActiveDate = today;
      } else {
        // Streak broken, reset to 1
        streak.streakCount = 1;
        streak.lastActiveDate = today;
      }

      // Update longest streak if current streak is longer
      if (streak.streakCount > streak.longestStreak) {
        streak.longestStreak = streak.streakCount;
      }
    }

    // Save the streak
    const savedStreak = await this.streakRepository.save(streak);

    // Check for milestones
    await this.checkAndAwardMilestones(savedStreak);

    // Emit puzzle solved event
    this.eventEmitter.emit(STREAK_EVENTS.PUZZLE_SOLVED, {
      userId,
      streakCount: savedStreak.streakCount,
      isNewStreak: !streak.id,
    });

    this.logger.log(`Updated streak for user ${userId}: ${savedStreak.streakCount} days`);

    return this.buildStreakResponse(savedStreak);
  }

  /**
   * Get current streak status for a user
   */
  async getStreak(userId: string): Promise<StreakResponseDto> {
    const streak = await this.streakRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!streak) {
      // Return default streak response for new users
      return {
        streakCount: 0,
        longestStreak: 0,
        lastActiveDate: null as Date | null,
        hasSolvedToday: false,
        nextMilestone: 3,
        daysUntilNextMilestone: 3,
      };
    }

    return this.buildStreakResponse(streak);
  }

  /**
   * Get streak leaderboard
   */
  async getStreakLeaderboard(query: StreakQueryDto): Promise<StreakLeaderboardResponseDto> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [entries, total] = await this.streakRepository
      .createQueryBuilder('streak')
      .leftJoinAndSelect('streak.user', 'user')
      .select([
        'streak.userId',
        'streak.streakCount',
        'streak.longestStreak',
        'streak.lastActiveDate',
        'user.username',
      ])
      .orderBy('streak.streakCount', 'DESC')
      .addOrderBy('streak.longestStreak', 'DESC')
      .addOrderBy('streak.lastActiveDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const leaderboardEntries: StreakLeaderboardEntryDto[] = entries.map(entry => ({
      userId: entry.userId,
      username: entry.user?.username || `User ${entry.userId}`,
      streakCount: entry.streakCount,
      longestStreak: entry.longestStreak,
      lastActiveDate: entry.lastActiveDate,
    }));

    return {
      entries: leaderboardEntries,
      total,
      page,
      limit,
    };
  }

  /**
   * Check and award milestones
   */
  private async checkAndAwardMilestones(streak: DailyStreak): Promise<void> {
    const milestones = Object.keys(STREAK_MILESTONES).map(Number).sort((a, b) => a - b);
    
    for (const milestone of milestones) {
      if (streak.streakCount >= milestone && 
          (!streak.lastMilestoneReached || streak.lastMilestoneReached < milestone)) {
        
        const milestoneConfig = STREAK_MILESTONES[milestone as keyof typeof STREAK_MILESTONES];
        
        // Award bonus rewards
        const bonusReward: BonusRewardDto = {
          userId: streak.userId,
          bonusXp: milestoneConfig.xp,
          bonusTokens: milestoneConfig.tokens,
          reason: milestoneConfig.description,
        };

        this.eventEmitter.emit(STREAK_EVENTS.MILESTONE_REACHED, {
          userId: streak.userId,
          milestone,
          reward: bonusReward,
        });

        // Update last milestone reached
        streak.lastMilestoneReached = milestone;
        await this.streakRepository.save(streak);

        this.logger.log(`User ${streak.userId} reached ${milestone}-day streak milestone`);
        break; // Only award the highest milestone reached
      }
    }
  }

  /**
   * Build streak response DTO
   */
  private buildStreakResponse(streak: DailyStreak): StreakResponseDto {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = new Date(streak.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);

    const hasSolvedToday = today.getTime() === lastActive.getTime();

    // Find next milestone
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

  /**
   * Get streak statistics for admin purposes
   */
  async getStreakStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    averageStreak: number;
    topStreak: number;
  }> {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.streakRepository.count();
    
    const avgResult = await this.streakRepository
      .createQueryBuilder('streak')
      .select('AVG(streak.streakCount)', 'average')
      .getRawOne();
    
    const topResult = await this.streakRepository
      .createQueryBuilder('streak')
      .select('MAX(streak.streakCount)', 'max')
      .getRawOne();

    return {
      totalUsers,
      activeUsers,
      averageStreak: Math.round(avgResult?.average || 0),
      topStreak: topResult?.max || 0,
    };
  }
} 