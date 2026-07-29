import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { RetentionCohort } from '../entities/retention-cohort.entity';
import { RetentionCohortRollupJob } from './retention-cohort-rollup.job';

declare const expect: any;

describe('RetentionCohortRollupJob', () => {
  let job: RetentionCohortRollupJob;

  const mockAnalyticsEventRepo = {
    createQueryBuilder: jest.fn(),
  };
  const mockRetentionCohortRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
    create: jest.fn((data: Partial<RetentionCohort>) => data as RetentionCohort),
    save: jest.fn(),
  };

  // Builds a fresh queryBuilder mock per call, since the job creates a new
  // one for each of getCohortUserIds/countActiveInWindow.
  function makeQueryBuilder(result: unknown) {
    const qb: any = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      having: jest.fn().mockReturnThis(),
      andHaving: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(result),
      getRawOne: jest.fn().mockResolvedValue(result),
    };
    return qb;
  }

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetentionCohortRollupJob,
        {
          provide: getRepositoryToken(AnalyticsEvent),
          useValue: mockAnalyticsEventRepo,
        },
        {
          provide: getRepositoryToken(RetentionCohort),
          useValue: mockRetentionCohortRepo,
        },
      ],
    }).compile();

    job = module.get<RetentionCohortRollupJob>(RetentionCohortRollupJob);
  });

  it('should be defined', () => {
    expect(job).toBeDefined();
  });

  describe('rollupForDate', () => {
    it('creates a new cohort row for users first active today', async () => {
      // First call: getCohortUserIds for today -> 2 new users
      // Next three calls: getCohortUserIds for -1/-7/-30 -> empty (no older cohorts)
      mockAnalyticsEventRepo.createQueryBuilder
        .mockReturnValueOnce(
          makeQueryBuilder([{ userId: 'u1' }, { userId: 'u2' }]),
        )
        .mockReturnValueOnce(makeQueryBuilder([]))
        .mockReturnValueOnce(makeQueryBuilder([]))
        .mockReturnValueOnce(makeQueryBuilder([]));

      mockRetentionCohortRepo.findOne.mockResolvedValue(null);

      const result = await job.rollupForDate(
        new Date('2026-07-29T12:00:00.000Z'),
      );

      expect(result.date).toBe('2026-07-29');
      expect(result.cohortsUpdated).toEqual(['2026-07-29']);
      expect(mockRetentionCohortRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ cohortDate: '2026-07-29', cohortSize: 2 }),
      );
      expect(mockRetentionCohortRepo.save).toHaveBeenCalledTimes(1);
    });

    it('updates only the day-1 cohort row when a day-1 cohort exists', async () => {
      // today's cohort: empty
      // day-1 cohort: 2 members
      // day-7, day-30: empty
      mockAnalyticsEventRepo.createQueryBuilder
        .mockReturnValueOnce(makeQueryBuilder([])) // today
        .mockReturnValueOnce(
          makeQueryBuilder([{ userId: 'u1' }, { userId: 'u2' }]),
        ) // day-1 cohort members
        .mockReturnValueOnce(makeQueryBuilder({ count: '1' })) // day-1 retained count
        .mockReturnValueOnce(makeQueryBuilder([])) // day-7
        .mockReturnValueOnce(makeQueryBuilder([])); // day-30

      mockRetentionCohortRepo.findOne.mockResolvedValue({
        cohortDate: '2026-07-28',
      });

      const result = await job.rollupForDate(
        new Date('2026-07-29T12:00:00.000Z'),
      );

      expect(result.cohortsUpdated).toEqual(['2026-07-28']);
      expect(mockRetentionCohortRepo.update).toHaveBeenCalledWith(
        { cohortDate: '2026-07-28' },
        expect.objectContaining({ cohortSize: 2, retainedDay1: 1 }),
      );
      // Only one row touched — not the full 90-day history.
      expect(mockRetentionCohortRepo.update).toHaveBeenCalledTimes(1);
      expect(mockRetentionCohortRepo.save).not.toHaveBeenCalled();
    });

    it('does not write any row when no cohort exists for a given offset', async () => {
      mockAnalyticsEventRepo.createQueryBuilder
        .mockReturnValueOnce(makeQueryBuilder([])) // today
        .mockReturnValueOnce(makeQueryBuilder([])) // day-1
        .mockReturnValueOnce(makeQueryBuilder([])) // day-7
        .mockReturnValueOnce(makeQueryBuilder([])); // day-30

      const result = await job.rollupForDate(
        new Date('2026-07-29T12:00:00.000Z'),
      );

      expect(result.cohortsUpdated).toEqual([]);
      expect(mockRetentionCohortRepo.update).not.toHaveBeenCalled();
      expect(mockRetentionCohortRepo.save).not.toHaveBeenCalled();
    });

    it('is idempotent: re-running for the same day updates in place rather than duplicating', async () => {
      mockAnalyticsEventRepo.createQueryBuilder.mockImplementation(() =>
        makeQueryBuilder([{ userId: 'u1' }]),
      );
      mockRetentionCohortRepo.findOne.mockResolvedValue({
        cohortDate: '2026-07-29',
      });

      await job.rollupForDate(new Date('2026-07-29T12:00:00.000Z'));
      await job.rollupForDate(new Date('2026-07-29T12:00:00.000Z'));

      expect(mockRetentionCohortRepo.save).not.toHaveBeenCalled();
      // Every run only ever updates existing rows here — never creates new ones.
      expect(mockRetentionCohortRepo.update.mock.calls.length).toBeGreaterThan(
        0,
      );
    });
  });
});