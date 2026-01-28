import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Streak } from '../entities/streak.entity';

@Injectable()
export class UpdateStreakProvider {
  private readonly logger = new Logger(UpdateStreakProvider.name);

  constructor(
    @InjectRepository(Streak)
    private readonly streakRepository: Repository<Streak>,
  ) {}

  /**
   * Updates user streak based on daily quest completion
   * Handles streak continuation, breaks, and new streaks
   */
  async updateStreak(userId: number): Promise<Streak> {
    const todayDate = this.getTodayDateString();
    this.logger.log(`Updating streak for user ${userId} on ${todayDate}`);

    // Find or create user's streak record
    let streak = await this.streakRepository.findOne({
      where: { userId },
    });

    if (!streak) {
      // First time user - create new streak
      streak = this.streakRepository.create({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: todayDate,
        streakDates: [todayDate],
      });
      this.logger.log(`Created new streak for user ${userId}`);
    } else {
      // Check if already updated today (idempotency)
      if (streak.lastActivityDate === todayDate) {
        this.logger.log(
          `Streak already updated today for user ${userId}, returning existing`,
        );
        return streak;
      }

      // Calculate streak continuation
      const yesterday = this.getYesterdayDateString();
      const isConsecutive = streak.lastActivityDate === yesterday;

      if (isConsecutive) {
        // Continue streak
        streak.currentStreak += 1;
        this.logger.log(
          `Continued streak for user ${userId}: ${streak.currentStreak} days`,
        );
      } else {
        // Streak broken - start new streak
        streak.currentStreak = 1;
        this.logger.log(`Streak broken for user ${userId}, starting fresh`);
      }

      // Update longest streak if needed
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
        this.logger.log(
          `New longest streak for user ${userId}: ${streak.longestStreak}`,
        );
      }

      // Update last activity date and add to streak dates
      streak.lastActivityDate = todayDate;
      if (!streak.streakDates.includes(todayDate)) {
        streak.streakDates.push(todayDate);
      }
    }

    // Save and return
    return await this.streakRepository.save(streak);
  }

  /**
   * Get user's current streak information
   */
  async getStreak(userId: number): Promise<Streak | null> {
    return await this.streakRepository.findOne({
      where: { userId },
    });
  }

  private getTodayDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  private getYesterdayDateString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
}