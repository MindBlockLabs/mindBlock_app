import { Injectable, BadRequestException } from '@nestjs/common';
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

  resolveDateRange(
    timeFilter?: TimeFilter,
    fromStr?: string,
    toStr?: string,
  ): { from?: Date; to?: Date } {
    if (fromStr && toStr) {
      const from = new Date(fromStr);
      const to = new Date(toStr);

      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
      if (from > to) {
        throw new BadRequestException(`'from' date must be earlier than 'to' date`);
      }

      return { from, to };
    }

    if (timeFilter) {
      const range = this.getDateRange(timeFilter);
      return range ? { from: range.from } : {};
    }

    return {};
  }
}