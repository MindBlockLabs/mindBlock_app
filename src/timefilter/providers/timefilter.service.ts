import { Injectable } from '@nestjs/common';
import { TimeFilter } from '../timefilter.enum.ts/timefilter.enum';



@Injectable()
export class TimeFilterService {
  getDateRange(filter: TimeFilter): { from: Date } | null {
    const now = new Date();

    switch (filter) {
      case TimeFilter.WEEKLY:
        return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
      case TimeFilter.MONTHLY:
        return { from: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()) };
      case TimeFilter.ALL_TIME:
      default:
        return null;
    }
  }
}