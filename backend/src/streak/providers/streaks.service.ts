import { Injectable } from '@nestjs/common';
import { UpdateStreakProvider } from './update-streak.provider';
import { Streak } from '../entities/streak.entity';

@Injectable()
export class StreaksService {
  constructor(private readonly updateStreakProvider: UpdateStreakProvider) {}

  /**
   * Get user's current streak
   */
  async getStreak(userId: string): Promise<Streak | null> {
    return this.updateStreakProvider.getStreak(userId);
  }

  /**
   * Update streak after daily quest completion
   * Handles increment, reset, and longest streak tracking
   */
  async updateStreak(userId: string, userTimezone: string): Promise<Streak> {
    return this.updateStreakProvider.updateStreak(userId, userTimezone);
  }
}
