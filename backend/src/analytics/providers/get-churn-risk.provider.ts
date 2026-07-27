import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { DateRangeDto, RetentionGranularity } from '../dtos/date-range.dto';
import {
  AnalyticsMetricResult,
  ChurnRiskBand,
  ChurnRiskDataPoint,
} from '../dtos/analytics-metric-result.dto';

/**
 * Event types that count as recurring engagement.
 *
 * Deliberately excludes the one-shot onboarding events (`onboarding_started`,
 * `profile_created`, `tutorial_viewed`, `first_puzzle_attempted`,
 * `onboarding_completed`, `wallet_connected`): they fire once, inflate a new
 * user's first buckets, and would manufacture a "sharp drop" for every account
 * the week after signup.
 *
 * Also excludes system-emitted consequences (`xp_awarded`, `user_leveled_up`)
 * which are downstream of the actions above and would double-count them.
 */
export const ACTIVITY_EVENT_TYPES = [
  'puzzle_attempted',
  'daily_quest_completed',
  'streak_updated',
  'login_occurred',
];

/** Baseline buckets required before a score is emitted at all. */
export const MIN_BASELINE_BUCKETS = 3;

/** Drop size, in baseline standard deviations, that saturates the score at 100. */
export const MAX_Z_SCORE = 3;

/** Bounded default window, so a missing `start` never becomes a full-table scan. */
export const DEFAULT_LOOKBACK_DAYS = 90;

const RISK_BAND_THRESHOLDS: ReadonlyArray<[number, ChurnRiskBand]> = [
  [67, 'high'],
  [34, 'medium'],
  [1, 'low'],
  [0, 'none'],
];

/**
 * `date_trunc` units, keyed by the validated granularity. Values are never
 * interpolated from raw user input — the DTO restricts granularity to these
 * three keys and anything else falls back to 'day'.
 */
const TRUNC_UNIT: Record<RetentionGranularity, string> = {
  day: 'day',
  week: 'week',
  month: 'month',
};

interface ChurnRiskRawRow {
  userId: string;
  bucket: string;
  count: string | number;
}

/**
 * Flags users whose activity in the most recent bucket has dropped sharply
 * against their own historical baseline.
 *
 * The scoring is variance-relative rather than ratio-relative on purpose. A raw
 * frequency ratio flags the wrong people: a user who does 40 puzzles a day and
 * drops to 8 reads as an 80% collapse, while a user who does one a day and
 * stops entirely reads as a smaller move. Dividing the drop by that user's own
 * standard deviation means a naturally spiky player needs a much larger drop to
 * flag than a metronomic one.
 *
 * Reads `analytics_events` directly. There is no per-user pre-aggregated table
 * in this module yet — `retention_cohorts` is cohort-level and carries no
 * `userId` — so the query is made index-backed instead, against
 * `IDX_analytics_events_timestamp_userId`. Aggregation happens in Postgres;
 * only one row per (user, bucket) crosses the wire.
 */
@Injectable()
export class GetChurnRiskProvider {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
  ) {}

  async getChurnRisk(
    query: DateRangeDto,
  ): Promise<AnalyticsMetricResult<ChurnRiskDataPoint>> {
    const granularity: RetentionGranularity = query.granularity ?? 'day';
    const end = query.end ?? new Date();
    const start = query.start ?? this.defaultStart(end);

    const startDate = start.toISOString().split('T')[0];
    const endDate = end.toISOString().split('T')[0];
    const empty: AnalyticsMetricResult<ChurnRiskDataPoint> = {
      startDate,
      endDate,
      granularity,
      data: [],
      total: 0,
    };

    // An inverted range has no buckets to score. Return empty rather than throw.
    if (start > end) return empty;

    const buckets = this.enumerateBuckets(start, end, granularity);
    // A single bucket is all "recent" and leaves nothing to form a baseline.
    if (buckets.length < MIN_BASELINE_BUCKETS + 1) return empty;

    const rows = await this.fetchBucketCounts(start, end, granularity);
    if (rows.length === 0) return empty;

    const recentBucket = buckets[buckets.length - 1];
    const baselineBuckets = buckets.slice(0, -1);

    const byUser = new Map<string, Map<string, number>>();
    for (const row of rows) {
      const counts = byUser.get(row.userId) ?? new Map<string, number>();
      counts.set(row.bucket, Number(row.count) || 0);
      byUser.set(row.userId, counts);
    }

    const data: ChurnRiskDataPoint[] = [];
    for (const [userId, counts] of byUser) {
      data.push(this.scoreUser(userId, counts, baselineBuckets, recentBucket));
    }

    this.sortByRisk(data);

    return { startDate, endDate, granularity, data, total: data.length };
  }

  private defaultStart(end: Date): Date {
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - DEFAULT_LOOKBACK_DAYS);
    return start;
  }

  private async fetchBucketCounts(
    start: Date,
    end: Date,
    granularity: RetentionGranularity,
  ): Promise<ChurnRiskRawRow[]> {
    const unit = TRUNC_UNIT[granularity] ?? TRUNC_UNIT.day;
    // Pinned to UTC so the bucket boundaries do not move with the DB session
    // timezone, and so `truncateToBucket` below can mirror them exactly.
    const bucketExpr = `date_trunc('${unit}', e."timestamp" AT TIME ZONE 'UTC')`;

    return this.analyticsEventRepository
      .createQueryBuilder('e')
      .select('e.userId', 'userId')
      .addSelect(`to_char(${bucketExpr}, 'YYYY-MM-DD"T"HH24:MI:SS')`, 'bucket')
      .addSelect('COUNT(*)::int', 'count')
      .where('e."timestamp" >= :start', { start })
      .andWhere('e."timestamp" <= :end', { end })
      .andWhere('e."eventType" IN (:...eventTypes)', {
        eventTypes: ACTIVITY_EVENT_TYPES,
      })
      .groupBy('e.userId')
      .addGroupBy(bucketExpr)
      .getRawMany<ChurnRiskRawRow>();
  }

  private scoreUser(
    userId: string,
    counts: Map<string, number>,
    baselineBuckets: string[],
    recentBucket: string,
  ): ChurnRiskDataPoint {
    const recentCount = counts.get(recentBucket) ?? 0;

    // A user's baseline starts at their first observed activity, not at the
    // start of the range — otherwise every account looks dormant for every
    // bucket that predates its signup. From that point on, silent buckets are
    // materialised as zeros; dropping them would only average the active days
    // and hide the exact decline this provider exists to find.
    const firstActive = baselineBuckets.findIndex(
      (b) => (counts.get(b) ?? 0) > 0,
    );
    const values =
      firstActive === -1
        ? []
        : baselineBuckets.slice(firstActive).map((b) => counts.get(b) ?? 0);

    const consecutiveSilentBuckets = this.trailingZeros([
      ...values,
      recentCount,
    ]);

    if (values.length < MIN_BASELINE_BUCKETS) {
      return this.insufficient(
        userId,
        recentCount,
        values.length,
        consecutiveSilentBuckets,
      );
    }

    const baselineMean = values.reduce((a, b) => a + b, 0) / values.length;
    if (baselineMean === 0) {
      return this.insufficient(
        userId,
        recentCount,
        values.length,
        consecutiveSilentBuckets,
      );
    }

    const baselineStdDev = this.sampleStdDev(values, baselineMean);
    const dropRatio = (baselineMean - recentCount) / baselineMean;
    const riskScore = this.riskScore(
      baselineMean,
      baselineStdDev,
      recentCount,
      dropRatio,
    );

    return {
      userId,
      riskScore,
      riskBand: this.bandFor(riskScore),
      baselineMean: this.round(baselineMean, 4),
      baselineStdDev: this.round(baselineStdDev, 4),
      baselineBuckets: values.length,
      recentCount,
      consecutiveSilentBuckets,
      dropRatio: this.round(dropRatio, 4),
      insufficientBaseline: false,
    };
  }

  /** Trailing run of zero-activity buckets, most recent bucket included. */
  private trailingZeros(values: number[]): number {
    let run = 0;
    for (let i = values.length - 1; i >= 0 && values[i] === 0; i--) run++;
    return run;
  }

  private riskScore(
    mean: number,
    stdDev: number,
    recentCount: number,
    dropRatio: number,
  ): number {
    // Held steady or grew — not a churn signal regardless of variance.
    if (recentCount >= mean) return 0;

    // Perfectly regular history: there is no variance to normalise against, so
    // fall back to the size of the drop itself.
    if (stdDev === 0) return Math.round(dropRatio * 100);

    const z = (mean - recentCount) / stdDev;
    return Math.round(Math.min(1, z / MAX_Z_SCORE) * 100);
  }

  private insufficient(
    userId: string,
    recentCount: number,
    baselineBuckets: number,
    consecutiveSilentBuckets: number,
  ): ChurnRiskDataPoint {
    // Null, never 0. A 0 here would render as "no churn risk" on the dashboard
    // for a user we simply know nothing about yet.
    return {
      userId,
      riskScore: null,
      riskBand: null,
      baselineMean: 0,
      baselineStdDev: 0,
      baselineBuckets,
      recentCount,
      consecutiveSilentBuckets,
      dropRatio: null,
      insufficientBaseline: true,
    };
  }

  private sampleStdDev(values: number[], mean: number): number {
    if (values.length < 2) return 0;
    const variance =
      values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  private bandFor(riskScore: number | null): ChurnRiskBand | null {
    if (riskScore === null) return null;
    for (const [threshold, band] of RISK_BAND_THRESHOLDS) {
      if (riskScore >= threshold) return band;
    }
    return 'none';
  }

  /** Riskiest first; unscorable users last; userId as a stable tiebreak. */
  private sortByRisk(data: ChurnRiskDataPoint[]): void {
    data.sort((a, b) => {
      if (a.riskScore === null && b.riskScore === null) {
        return a.userId.localeCompare(b.userId);
      }
      if (a.riskScore === null) return 1;
      if (b.riskScore === null) return -1;
      if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
      return a.userId.localeCompare(b.userId);
    });
  }

  /**
   * Mirrors `date_trunc(unit, ts AT TIME ZONE 'UTC')`. Postgres truncates weeks
   * to Monday, so this does too.
   */
  private truncateToBucket(
    date: Date,
    granularity: RetentionGranularity,
  ): Date {
    if (granularity === 'month') {
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    }

    const truncated = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    if (granularity === 'week') {
      const daysSinceMonday = (truncated.getUTCDay() + 6) % 7;
      truncated.setUTCDate(truncated.getUTCDate() - daysSinceMonday);
    }

    return truncated;
  }

  private advanceBucket(date: Date, granularity: RetentionGranularity): Date {
    const next = new Date(date);
    if (granularity === 'month') next.setUTCMonth(next.getUTCMonth() + 1);
    else if (granularity === 'week') next.setUTCDate(next.getUTCDate() + 7);
    else next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  /**
   * The full bucket grid for the range. Built from the range rather than from
   * the returned rows, so that buckets in which nobody was active still exist
   * and still count as zeros against every user's baseline.
   */
  private enumerateBuckets(
    start: Date,
    end: Date,
    granularity: RetentionGranularity,
  ): string[] {
    const keys: string[] = [];
    const last = this.truncateToBucket(end, granularity);
    let cursor = this.truncateToBucket(start, granularity);

    while (cursor <= last) {
      keys.push(this.bucketKey(cursor));
      cursor = this.advanceBucket(cursor, granularity);
    }

    return keys;
  }

  /** `YYYY-MM-DDTHH:mm:ss` — matches the `to_char` format used in the query. */
  private bucketKey(date: Date): string {
    return date.toISOString().slice(0, 19);
  }

  private round(value: number, places: number): number {
    const factor = 10 ** places;
    return Math.round(value * factor) / factor;
  }
}
