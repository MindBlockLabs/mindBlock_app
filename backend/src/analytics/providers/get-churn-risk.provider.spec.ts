import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { DateRangeDto } from '../dtos/date-range.dto';
import {
  ACTIVITY_EVENT_TYPES,
  GetChurnRiskProvider,
  MIN_BASELINE_BUCKETS,
} from './get-churn-risk.provider';

/** Day bucket key in the format the provider builds from `to_char`. */
const day = (n: number) => `2024-01-${String(n).padStart(2, '0')}T00:00:00`;

/** Raw rows as the grouped query would return them: one per (user, bucket). */
const rowsFor = (userId: string, counts: Record<number, number>) =>
  Object.entries(counts).map(([d, count]) => ({
    userId,
    bucket: day(Number(d)),
    count,
  }));

/** 2024-01-01 → 2024-01-10 = 10 day buckets; day 10 is "recent", 1-9 baseline. */
const TEN_DAYS: DateRangeDto = {
  start: new Date('2024-01-01T00:00:00.000Z'),
  end: new Date('2024-01-10T00:00:00.000Z'),
  granularity: 'day',
  _dateRange: true,
};

describe('GetChurnRiskProvider', () => {
  let provider: GetChurnRiskProvider;
  let qb: Record<string, jest.Mock>;
  let mockRepo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([]),
    };
    mockRepo = { createQueryBuilder: jest.fn(() => qb) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetChurnRiskProvider,
        { provide: getRepositoryToken(AnalyticsEvent), useValue: mockRepo },
      ],
    }).compile();

    provider = module.get<GetChurnRiskProvider>(GetChurnRiskProvider);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('empty / no-data cases', () => {
    it('returns an empty result when no events exist in the range', async () => {
      qb.getRawMany.mockResolvedValue([]);

      const result = await provider.getChurnRisk(TEN_DAYS);

      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-01-10');
      expect(result.granularity).toBe('day');
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('does not throw on an inverted range, and does not hit the DB', async () => {
      const inverted: DateRangeDto = {
        start: new Date('2024-01-10T00:00:00.000Z'),
        end: new Date('2024-01-01T00:00:00.000Z'),
        _dateRange: true,
      };

      await expect(provider.getChurnRisk(inverted)).resolves.toEqual(
        expect.objectContaining({ data: [], total: 0 }),
      );
      expect(qb.getRawMany).not.toHaveBeenCalled();
    });

    it('returns empty for a single-day range — one bucket leaves no baseline', async () => {
      const singleDay: DateRangeDto = {
        start: new Date('2024-01-05T00:00:00.000Z'),
        end: new Date('2024-01-05T00:00:00.000Z'),
        granularity: 'day',
        _dateRange: true,
      };

      const result = await provider.getChurnRisk(singleDay);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(qb.getRawMany).not.toHaveBeenCalled();
    });

    it('defaults granularity to "day" when not supplied', async () => {
      const result = await provider.getChurnRisk({
        start: new Date('2024-01-01T00:00:00.000Z'),
        end: new Date('2024-01-10T00:00:00.000Z'),
        _dateRange: true,
      });

      expect(result.granularity).toBe('day');
    });
  });

  describe('scoring over a multi-day range', () => {
    it('flags a steady user whose activity collapses', async () => {
      // Baseline mean 10, std dev 0.5. Recent bucket drops to 2 -> ~16 sigma.
      qb.getRawMany.mockResolvedValue(
        rowsFor('steady', {
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 10,
          7: 10,
          8: 11,
          9: 9,
          10: 2,
        }),
      );

      const [point] = (await provider.getChurnRisk(TEN_DAYS)).data;

      expect(point.userId).toBe('steady');
      expect(point.baselineBuckets).toBe(9);
      expect(point.baselineMean).toBe(10);
      expect(point.baselineStdDev).toBe(0.5);
      expect(point.recentCount).toBe(2);
      expect(point.riskScore).toBe(100);
      expect(point.riskBand).toBe('high');
      expect(point.insufficientBaseline).toBe(false);
    });

    it('scores an identical drop far lower for a naturally spiky user', async () => {
      // Both users land on recentCount = 2. The steady user's drop is many
      // standard deviations; the spiky user's is well under one. This is the
      // whole point of normalising by the user's own variance rather than by
      // a raw frequency ratio.
      qb.getRawMany.mockResolvedValue([
        ...rowsFor('steady', {
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 10,
          7: 10,
          8: 11,
          9: 9,
          10: 2,
        }),
        ...rowsFor('spiky', {
          1: 2,
          2: 18,
          3: 1,
          4: 20,
          5: 3,
          6: 17,
          7: 2,
          8: 19,
          9: 1,
          10: 2,
        }),
      ]);

      const { data } = await provider.getChurnRisk(TEN_DAYS);
      const steady = data.find((d) => d.userId === 'steady')!;
      const spiky = data.find((d) => d.userId === 'spiky')!;

      expect(steady.recentCount).toBe(spiky.recentCount);
      expect(steady.riskScore).toBe(100);
      expect(spiky.riskScore).toBe(27);
      expect(steady.riskBand).toBe('high');
      expect(spiky.riskBand).toBe('low');
      expect(spiky.riskScore!).toBeLessThan(steady.riskScore!);
    });

    it('scores a user who grew as zero risk', async () => {
      qb.getRawMany.mockResolvedValue(
        rowsFor('growing', {
          1: 5,
          2: 5,
          3: 5,
          4: 5,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 20,
        }),
      );

      const [point] = (await provider.getChurnRisk(TEN_DAYS)).data;

      expect(point.riskScore).toBe(0);
      expect(point.riskBand).toBe('none');
      expect(point.dropRatio).toBe(-3);
    });

    it('materialises silent buckets as zeros in the baseline', async () => {
      // Active every other day. If silent buckets were dropped instead of
      // counted as zeros, the baseline would be [10 x5] -> mean 10, stddev 0,
      // and this would score 100 instead of 35.
      qb.getRawMany.mockResolvedValue(
        rowsFor('intermittent', { 1: 10, 3: 10, 5: 10, 7: 10, 9: 10 }),
      );

      const [point] = (await provider.getChurnRisk(TEN_DAYS)).data;

      expect(point.baselineBuckets).toBe(9);
      expect(point.baselineMean).toBe(5.5556);
      expect(point.riskScore).toBe(35);
    });

    it('starts the baseline at first activity, not at the range start', async () => {
      // Signed up on day 6. Counting days 1-5 as zeros would drag the mean down
      // and make a genuine collapse look mild.
      qb.getRawMany.mockResolvedValue(
        rowsFor('newcomer', { 6: 10, 7: 10, 8: 10, 9: 10 }),
      );

      const [point] = (await provider.getChurnRisk(TEN_DAYS)).data;

      expect(point.baselineBuckets).toBe(4);
      expect(point.baselineMean).toBe(10);
      expect(point.recentCount).toBe(0);
      expect(point.riskScore).toBe(100);
    });
  });

  describe('insufficient history', () => {
    it(`returns null — not 0 — below ${MIN_BASELINE_BUCKETS} baseline buckets`, async () => {
      qb.getRawMany.mockResolvedValue(rowsFor('fresh', { 8: 10, 9: 10 }));

      const [point] = (await provider.getChurnRisk(TEN_DAYS)).data;

      expect(point.baselineBuckets).toBe(2);
      expect(point.insufficientBaseline).toBe(true);
      expect(point.riskScore).toBeNull();
      expect(point.riskBand).toBeNull();
      expect(point.dropRatio).toBeNull();
      // A 0 here would render as "safe" for a user we know nothing about.
      expect(point.riskScore).not.toBe(0);
    });

    it('treats a user active only in the recent bucket as unscorable', async () => {
      qb.getRawMany.mockResolvedValue(rowsFor('brandnew', { 10: 5 }));

      const [point] = (await provider.getChurnRisk(TEN_DAYS)).data;

      expect(point.baselineBuckets).toBe(0);
      expect(point.insufficientBaseline).toBe(true);
      expect(point.riskScore).toBeNull();
    });
  });

  describe('reporting', () => {
    it('reports trailing silence without folding it into the score', async () => {
      // Known limitation, surfaced rather than hidden: this provider measures
      // the drop, so a user who went quiet early in the window scores modestly
      // even though they are plainly gone. `consecutiveSilentBuckets` is what
      // a dormancy metric would key off.
      qb.getRawMany.mockResolvedValue(
        rowsFor('longGone', { 1: 10, 2: 10, 3: 10 }),
      );

      const [point] = (await provider.getChurnRisk(TEN_DAYS)).data;

      expect(point.consecutiveSilentBuckets).toBe(7);
      expect(point.recentCount).toBe(0);
      expect(point.riskScore).toBe(22);
    });

    it('sorts riskiest first and puts unscorable users last', async () => {
      qb.getRawMany.mockResolvedValue([
        ...rowsFor('mild', {
          1: 5,
          2: 5,
          3: 5,
          4: 5,
          5: 5,
          6: 5,
          7: 5,
          8: 5,
          9: 5,
          10: 5,
        }),
        ...rowsFor('unscorable', { 9: 3 }),
        ...rowsFor('severe', {
          1: 10,
          2: 10,
          3: 10,
          4: 10,
          5: 10,
          6: 10,
          7: 10,
          8: 11,
          9: 9,
          10: 0,
        }),
      ]);

      const { data, total } = await provider.getChurnRisk(TEN_DAYS);

      expect(total).toBe(3);
      expect(data.map((d) => d.userId)).toEqual([
        'severe',
        'mild',
        'unscorable',
      ]);
      expect(data[data.length - 1].riskScore).toBeNull();
    });
  });

  describe('query shape', () => {
    it('filters, groups and bounds the scan so it is index-backed', async () => {
      await provider.getChurnRisk(TEN_DAYS);

      expect(qb.where).toHaveBeenCalledWith(
        'e."timestamp" >= :start',
        expect.objectContaining({ start: TEN_DAYS.start }),
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'e."timestamp" <= :end',
        expect.objectContaining({ end: TEN_DAYS.end }),
      );
      expect(qb.andWhere).toHaveBeenCalledWith(
        'e."eventType" IN (:...eventTypes)',
        { eventTypes: ACTIVITY_EVENT_TYPES },
      );
      // Aggregation happens in Postgres — one row per (user, bucket) is
      // returned, rather than every raw event being pulled into the process.
      expect(qb.groupBy).toHaveBeenCalledWith('e.userId');
      expect(qb.addSelect).toHaveBeenCalledWith('COUNT(*)::int', 'count');
    });

    it('excludes one-shot onboarding and system-emitted events', () => {
      expect(ACTIVITY_EVENT_TYPES).not.toContain('onboarding_completed');
      expect(ACTIVITY_EVENT_TYPES).not.toContain('first_puzzle_attempted');
      expect(ACTIVITY_EVENT_TYPES).not.toContain('xp_awarded');
      expect(ACTIVITY_EVENT_TYPES).toContain('puzzle_attempted');
    });

    it('truncates to the requested granularity', async () => {
      await provider.getChurnRisk({
        start: new Date('2024-01-01T00:00:00.000Z'),
        end: new Date('2024-06-30T00:00:00.000Z'),
        granularity: 'week',
        _dateRange: true,
      });

      const truncatedTo = (unit: string) =>
        (qb.addSelect.mock.calls as unknown[][]).some(
          ([expression]) =>
            typeof expression === 'string' &&
            expression.includes(`date_trunc('${unit}'`),
        );

      expect(truncatedTo('week')).toBe(true);
      expect(truncatedTo('day')).toBe(false);
    });
  });
});
