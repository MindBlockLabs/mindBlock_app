import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { DateRangeDto } from '../dtos/date-range.dto';
import { PuzzleStatsResult } from '../dtos/analytics-metric-result.dto';

@Injectable()
export class PuzzleAnalyticsProvider {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
  ) {}

  async getPuzzleStats(
    puzzleId: string,
    query?: DateRangeDto,
  ): Promise<PuzzleStatsResult> {
    const qb = this.analyticsEventRepository
      .createQueryBuilder('e')
      .where('e.eventType IN (:...eventTypes)', {
        eventTypes: ['puzzle_attempted', 'first_puzzle_attempted'],
      })
      .andWhere(
        '(e.entityId = :puzzleId OR e.payload::jsonb->>\'puzzleId\' = :puzzleId)',
        { puzzleId },
      );

    if (query?.start) {
      qb.andWhere('e.timestamp >= :start', { start: query.start });
    }
    if (query?.end) {
      qb.andWhere('e.timestamp <= :end', { end: query.end });
    }

    const events = await qb.getMany();

    const totalAttempts = events.length;
    let successfulAttempts = 0;
    let failedAttempts = 0;
    let totalTimeSpent = 0;
    const userSet = new Set<string>();

    for (const ev of events) {
      if (ev.userId) userSet.add(ev.userId);

      const isCorrect = ev.payload?.isCorrect;
      if (isCorrect === true) {
        successfulAttempts++;
      } else if (isCorrect === false) {
        failedAttempts++;
      }

      if (typeof ev.payload?.timeSpent === 'number') {
        totalTimeSpent += ev.payload.timeSpent;
      }
    }

    const successRate =
      totalAttempts > 0
        ? Math.round((successfulAttempts / totalAttempts) * 100 * 100) / 100
        : 0;

    const averageTimeSpent =
      totalAttempts > 0
        ? Math.round((totalTimeSpent / totalAttempts) * 100) / 100
        : 0;

    return {
      puzzleId,
      totalAttempts,
      successfulAttempts,
      failedAttempts,
      successRate,
      averageTimeSpent,
      uniqueUsers: userSet.size,
      startDate: query?.start
        ? query.start.toISOString().split('T')[0]
        : undefined,
      endDate: query?.end ? query.end.toISOString().split('T')[0] : undefined,
    };
  }
}
