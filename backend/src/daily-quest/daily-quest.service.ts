// backend/src/daily-quest/daily-quest.service.ts
import { Injectable } from '@nestjs/common';
import { GetTodaysDailyQuestStatusProvider } from './providers/getTodaysDailyQuestStatus.provider';

@Injectable()
export class DailyQuestService {
  constructor(
    private readonly questStatusProvider: GetTodaysDailyQuestStatusProvider,
  ) {}

  getTodaysStatus(userTimezone: string) {
    const today = this.questStatusProvider.getTodayDateString(userTimezone);
    // Use `today` to fetch quest records, streaks, etc.
    return { date: today, status: 'ok' };
  }
}
