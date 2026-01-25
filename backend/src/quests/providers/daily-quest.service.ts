import { Injectable } from '@nestjs/common';
import { DailyQuestResponseDto } from '../dtos/daily-quest-response.dto';
import { GetTodaysDailyQuestProvider } from './getTodaysDailyQuest.provider';

@Injectable()
export class DailyQuestService {
  constructor(
    private readonly getTodaysDailyQuestProvider: GetTodaysDailyQuestProvider,
  ) {}

  async getTodaysDailyQuest(userId: string): Promise<DailyQuestResponseDto> {
    return this.getTodaysDailyQuestProvider.execute(userId);
  }
}
