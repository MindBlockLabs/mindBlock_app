import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Streak } from './entities/streak.entity';

interface DateContext {
  today: string;
  yesterday: string;
}

@Injectable()
export class StreakService {
  private readonly logger = new Logger(StreakService.name);

  constructor(
    @InjectRepository(Streak)
    private readonly streakRepository: Repository<Streak>,
  ) {}

  private getDateContext(timeZone?: string): DateContext {
    const now = this.getDateInTimezone(timeZone);

    const today = this.formatDate(now);
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterday = this.formatDate(yesterdayDate);

    return { today, yesterday };
  }

  private getDateInTimezone(timeZone?: string): Date {
    if (!timeZone) {
      return new Date();
    }

    // Convert to the provided timezone, then back to Date for ISO formatting
    const localizedString = new Date().toLocaleString('en-US', { timeZone });
    return new Date(localizedString);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private normalizeDates(dates: string[]): string[] {
    const unique = Array.from(new Set(dates));
    return unique.sort();
  }

  async getStreak(userId: number): Promise<Streak> {
    let streak = await this.streakRepository.findOne({ where: { userId } });

    if (!streak) {
      const blankStreak = this.streakRepository.create({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        streakDates: [],
        lastActivityDate: null,
      });
      streak = await this.streakRepository.save(blankStreak);
    }

    return streak;
  }

  async updateStreak(userId: number, timeZone?: string): Promise<Streak> {
    const { today, yesterday } = this.getDateContext(timeZone);

    let streak = await this.streakRepository.findOne({ where: { userId } });

    if (!streak) {
      streak = this.streakRepository.create({
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
        streakDates: [today],
      });
      return this.streakRepository.save(streak);
    }

    // If already updated today, avoid double counting
    if (streak.lastActivityDate === today) {
      this.logger.debug(`User ${userId} already updated streak for ${today}`);
      return streak;
    }

    // Determine if yesterday was the last activity
    const continuedFromYesterday = streak.lastActivityDate === yesterday;

    const newCurrentStreak = continuedFromYesterday ? streak.currentStreak + 1 : 1;
    const updatedStreakDates = continuedFromYesterday
      ? this.normalizeDates([...(streak.streakDates || []), today])
      : [today];

    const longestStreak =
      newCurrentStreak > (streak.longestStreak || 0)
        ? newCurrentStreak
        : streak.longestStreak || 0;

    streak.currentStreak = newCurrentStreak;
    streak.longestStreak = longestStreak;
    streak.lastActivityDate = today;
    streak.streakDates = updatedStreakDates;

    return this.streakRepository.save(streak);
  }
}
