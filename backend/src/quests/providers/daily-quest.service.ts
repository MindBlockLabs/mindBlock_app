// backend/src/quests/providers/daily-quest.service.ts
import { Injectable } from '@nestjs/common';
import { DailyQuestResponseDto } from '../dtos/daily-quest-response.dto';
import { DailyQuestStatusDto } from '../dtos/daily-quest-status.dto';
import { CompleteDailyQuestResponseDto } from '../dtos/complete-daily-quest.dto';
import { GetTodaysDailyQuestProvider } from './getTodaysDailyQuest.provider';
import { GetTodaysDailyQuestStatusProvider } from './getTodaysDailyQuestStatus.provider';
import { CompleteDailyQuestProvider } from './complete-daily-quest.provider';

@Injectable()
export class DailyQuestService {
  constructor(
    private readonly getTodaysDailyQuestProvider: GetTodaysDailyQuestProvider,
    private readonly getTodaysDailyQuestStatusProvider: GetTodaysDailyQuestStatusProvider,
    private readonly completeDailyQuestProvider: CompleteDailyQuestProvider,
  ) {}

  async getTodaysDailyQuest(userId: string): Promise<DailyQuestResponseDto> {
    return this.getTodaysDailyQuestProvider.execute(userId);
  }

  /**
   * Returns the status of today's Daily Quest (read-only, lightweight)
   */
  async getTodaysDailyQuestStatus(
    userId: string,
  ): Promise<DailyQuestStatusDto> {
    return this.getTodaysDailyQuestStatusProvider.execute(userId);
  }

  /**
   * Completes today's Daily Quest and awards bonus XP
   * This method is idempotent - repeated calls will not duplicate rewards
   */
  async completeDailyQuest(
    userId: string,
  ): Promise<CompleteDailyQuestResponseDto> {
    return this.completeDailyQuestProvider.execute(userId);
  }
}