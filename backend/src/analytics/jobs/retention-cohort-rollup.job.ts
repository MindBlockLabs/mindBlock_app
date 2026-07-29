import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { RetentionCohort } from '../entities/retention-cohort.entity';

/** Day-offsets tracked on `RetentionCohort`, and the entity column each maps to. */
const RETENTION_OFFSETS: ReadonlyArray<{
  days: number;
  column: 'retainedDay1' | 'retainedDay7' | 'retainedDay30';
}> = [
  { days: 1, column: 'retainedDay1' },
  { days: 7, column: 'retainedDay7' },
  { days: 30, column: 'retainedDay30' },
];

interface CohortUserIdRow {
  userId: string;
}

/**
 * Nightly rollup that materializes/updates `RetentionCohort` rows.
 *
 * There is no signup-date column on `User` — cohort membership is instead
 * derived from each user's *earliest* `AnalyticsEvent`, the same proxy
 * `GetChurnRiskProvider` uses elsewhere in this module.
 *
 * A user's day-N retention can only change on the calendar day exactly N days
 * after their cohort date. So instead of recomputing the full 90-day
 * retention window every night (a full table scan repeated 90x), this job
 * only ever touches up to four `RetentionCohort` rows per run:
 *   - today's cohort (a new cohort is forming; establishes `cohortSize`)
 *   - today−1's cohort (day-1 retention is now knowable)
 *   - today−7's cohort (day-7 retention is now knowable)
 *   - today−30's cohort (day-30 retention is now knowable)
 *
 * All four dates are always within the tracked 90-day window, so "only
 * affected rows" and "within the tracked window" are satisfied by construction
 * rather than by an explicit range check.
 */
@Injectable()
export class RetentionCohortRollupJob {
  private readonly logger = new Logger(RetentionCohortRollupJob.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
    @InjectRepository(RetentionCohort)
    private readonly retentionCohortRepository: Repository<RetentionCohort>,
  ) {}

  /**
   * Runs at 01:00 UTC — after the DAU rollup (midnight) and quest rollup
   * (00:30), so it never contends with them for the same event rows.
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleCron(): Promise<void> {
    await this.rollupForDate(new Date());
  }

  /**
   * Recomputes the handful of `RetentionCohort` rows affected by `referenceDate`
   * being "today". Safe to re-run for the same day: each affected row is
   * upserted (updated in place if present), never duplicated.
   */
  async rollupForDate(referenceDate: Date): Promise<{
    date: string;
    cohortsUpdated: string[];
  }> {
    const today = this.dayBounds(referenceDate);
    const cohortsUpdated: string[] = [];

    // New cohort forming today: establish cohortSize. Retention columns
    // start at 0 — it is not yet possible for a same-day cohort to have
    // day-1/7/30 retention.
    const todaysCohortUserIds = await this.getCohortUserIds(today);
    if (todaysCohortUserIds.length > 0) {
      await this.upsertCohort(today.dateStr, {
        cohortSize: todaysCohortUserIds.length,
      });
      cohortsUpdated.push(today.dateStr);
    }

    // Existing cohorts crossing a day-1/7/30 threshold today.
    for (const offset of RETENTION_OFFSETS) {
      const cohortDay = this.dayBounds(
        this.daysBefore(referenceDate, offset.days),
      );

      const cohortUserIds = await this.getCohortUserIds(cohortDay);
      if (cohortUserIds.length === 0) continue;

      const retainedCount = await this.countActiveInWindow(
        cohortUserIds,
        today,
      );

      await this.upsertCohort(cohortDay.dateStr, {
        cohortSize: cohortUserIds.length,
        [offset.column]: retainedCount,
      });
      cohortsUpdated.push(cohortDay.dateStr);
    }

    this.logger.log(
      `Retention cohort rollup for ${today.dateStr}: ` +
        `${cohortsUpdated.length} cohort row(s) updated ` +
        `(${cohortsUpdated.join(', ') || 'none'})`,
    );

    return { date: today.dateStr, cohortsUpdated };
  }

  /**
   * User IDs whose earliest-ever event falls within `window`. This is the
   * cohort-membership proxy: it identifies users who "started" on that day.
   */
  private async getCohortUserIds(window: DayWindow): Promise<string[]> {
    const rows = await this.analyticsEventRepository
      .createQueryBuilder('e')
      .select('e.userId', 'userId')
      .groupBy('e.userId')
      .having('MIN(e.timestamp) >= :start', { start: window.start })
      .andHaving('MIN(e.timestamp) < :end', { end: window.end })
      .getRawMany<CohortUserIdRow>();

    return rows.map((row) => row.userId);
  }

  /** How many of `userIds` have at least one event within `window`. */
  private async countActiveInWindow(
    userIds: string[],
    window: DayWindow,
  ): Promise<number> {
    if (userIds.length === 0) return 0;

    const result = await this.analyticsEventRepository
      .createQueryBuilder('e')
      .select('COUNT(DISTINCT e.userId)', 'count')
      .where('e.userId IN (:...userIds)', { userIds })
      .andWhere('e.timestamp >= :start', { start: window.start })
      .andWhere('e.timestamp < :end', { end: window.end })
      .getRawOne<{ count: string }>();

    return Number(result?.count ?? 0);
  }

  /**
   * Updates the `RetentionCohort` row for `cohortDate` in place if it exists;
   * creates it otherwise. Never touches any other row.
   */
  private async upsertCohort(
    cohortDate: string,
    patch: Partial<
      Pick<
        RetentionCohort,
        'cohortSize' | 'retainedDay1' | 'retainedDay7' | 'retainedDay30'
      >
    >,
  ): Promise<void> {
    const existing = await this.retentionCohortRepository.findOne({
      where: { cohortDate },
    });

    if (existing) {
      await this.retentionCohortRepository.update({ cohortDate }, patch);
      return;
    }

    const row = this.retentionCohortRepository.create({
      cohortDate,
      cohortSize: 0,
      retainedDay1: 0,
      retainedDay7: 0,
      retainedDay30: 0,
      ...patch,
    });
    await this.retentionCohortRepository.save(row);
  }

  private daysBefore(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() - days);
    return result;
  }

  private dayBounds(date: Date): DayWindow {
    const dateStr = date.toISOString().split('T')[0];
    return {
      dateStr,
      start: new Date(`${dateStr}T00:00:00.000Z`),
      end: new Date(`${dateStr}T23:59:59.999Z`),
    };
  }
}

interface DayWindow {
  dateStr: string;
  start: Date;
  end: Date;
}