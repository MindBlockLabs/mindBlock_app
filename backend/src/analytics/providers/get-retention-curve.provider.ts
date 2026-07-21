import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { RetentionCohort } from '../entities/retention-cohort.entity';
import { DateRangeDto } from '../dtos/date-range.dto';
import {
  AnalyticsMetricResult,
  RetentionDataPoint,
} from '../dtos/analytics-metric-result.dto';

/**
 * Computes the retention curve for a given date range.
 *
 * Reads from the pre-aggregated `retention_cohorts` table — indexed on
 * `cohortDate` — so no full table scan on raw `analytics_events` rows is
 * performed at query time.
 */
@Injectable()
export class GetRetentionCurveProvider {
  constructor(
    @InjectRepository(RetentionCohort)
    private readonly retentionCohortRepo: Repository<RetentionCohort>,
  ) {}

  async getRetentionCurve(
    query: DateRangeDto,
  ): Promise<AnalyticsMetricResult> {
    const { start, end, granularity = 'day' } = query;

    // Convert Date objects to YYYY-MM-DD strings for cohortDate comparisons
    const startDate = start
      ? start.toISOString().split('T')[0]
      : new Date(0).toISOString().split('T')[0];
    const endDate = end
      ? end.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Query is index-backed via @Index(['cohortDate']) on the entity
    const cohorts = await this.retentionCohortRepo.find({
      where: {
        cohortDate: Between(startDate, endDate) as any,
      },
      order: { cohortDate: 'ASC' },
    });

    // Handle empty range / no data without throwing
    if (cohorts.length === 0) {
      return { startDate, endDate, granularity, data: [], total: 0 };
    }

    const data: RetentionDataPoint[] = cohorts.map((cohort) =>
      this.toDataPoint(cohort),
    );

    return { startDate, endDate, granularity, data, total: data.length };
  }

  private toDataPoint(cohort: RetentionCohort): RetentionDataPoint {
    const { cohortSize, retainedDay1, retainedDay7, retainedDay30 } = cohort;

    const pct = (retained: number): number | null => {
      if (cohortSize === 0) return null;
      return Math.round((retained / cohortSize) * 10000) / 100;
    };

    return {
      cohortDate: cohort.cohortDate,
      cohortSize,
      day1RetentionPct: pct(retainedDay1),
      day7RetentionPct: pct(retainedDay7),
      day30RetentionPct: pct(retainedDay30),
    };
  }
}