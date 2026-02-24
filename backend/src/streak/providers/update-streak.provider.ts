import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Streak } from '../entities/streak.entity';
import { getDateString } from 'src/shared/utils/date.util';

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
  async updateStreak(userId: string, userTimezone: string): Promise<Streak> {
    const todayDate = getDateString(userTimezone, 0);
    this.logger.log(`Updating streak for user ${userId} on ${todayDate}`);

    if (!userId) {
      throw new NotFoundException();
    }

    // Find or create user's streak record
    let streak = await this.streakRepository.findOne({
      where: { userId: parseInt(userId, 10) },
    });

    if (!streak) {
      // First time user - create new streak
      streak = this.streakRepository.create({
        userId: parseInt(userId, 10),
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
      const yesterday = getDateString(userTimezone, -1);
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
  async getStreak(userId: string): Promise<Streak | null> {
    return await this.streakRepository.findOne({
      where: { userId: parseInt(userId, 10) },
    });
  }
}
