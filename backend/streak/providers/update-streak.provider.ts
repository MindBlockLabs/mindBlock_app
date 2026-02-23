import { Injectable } from '@nestjs/common';
import  {getDateString } from "../../shared/utils/date.util"

@Injectable()
export class UpdateStreakProvider {
  getTodayDateString(userTimezone: string): string {
    return getDateString(userTimezone, 0);
  }

  getYesterdayDateString(userTimezone: string): string {
    return getDateString(userTimezone, -1);
  }

  // ... existing streak update logic
}
