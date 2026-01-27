import { Injectable } from '@nestjs/common';
import { DailyQuestResponseDto } from '../dtos/daily-quest-response.dto';
import { DailyQuestStatusDto } from '../dtos/daily-quest-status.dto';
import { GetTodaysDailyQuestProvider } from './getTodaysDailyQuest.provider';
import { GetTodaysDailyQuestStatusProvider } from './getTodaysDailyQuestStatus.provider';

@Injectable()
export class DailyQuestService {
  constructor(
    private readonly getTodaysDailyQuestProvider: GetTodaysDailyQuestProvider,
    private readonly getTodaysDailyQuestStatusProvider: GetTodaysDailyQuestStatusProvider,
  ) {}

  async getTodaysDailyQuest(userId: string): Promise<DailyQuestResponseDto> {
    return this.getTodaysDailyQuestProvider.execute(userId);
  }

  /**
   * Returns the status of today's Daily Quest (read-only, lightweight)
   */
  async getTodaysDailyQuestStatus(userId: string): Promise<DailyQuestStatusDto> {
    return this.getTodaysDailyQuestStatusProvider.execute(userId);
  }
}
