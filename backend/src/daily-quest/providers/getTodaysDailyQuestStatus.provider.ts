// backend/src/daily-quest/providers/getTodaysDailyQuestStatus.provider.ts
import { Injectable } from '@nestjs/common';
import  {getDateString } from "../../shared/utils/date.util"

@Injectable()
export class GetTodaysDailyQuestStatusProvider {
  getTodayDateString(userTimezone: string): string {
    return getDateString(userTimezone, 0);
  }

  // ... existing quest status logic
}
