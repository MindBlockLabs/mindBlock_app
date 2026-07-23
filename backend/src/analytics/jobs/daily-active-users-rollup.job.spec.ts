import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { DailyActiveUser } from '../entities/daily-active-user.entity';
import { DailyActiveUsersRollupJob } from './daily-active-users-rollup.job';

describe('DailyActiveUsersRollupJob', () => {
  let job: DailyActiveUsersRollupJob;
  const mockAnalyticsEventRepo = {
    find: jest.fn<Promise<Pick<AnalyticsEvent, 'userId'>[]>, [unknown]>(),
  };
  const mockDailyActiveUserRepo = {
    delete: jest.fn<Promise<unknown>, [unknown]>(),
    create: jest.fn(
      (data: Partial<DailyActiveUser>) => data as DailyActiveUser,
    ),
    save: jest.fn<Promise<DailyActiveUser[]>, [DailyActiveUser[]]>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyActiveUsersRollupJob,
        {
          provide: getRepositoryToken(AnalyticsEvent),
          useValue: mockAnalyticsEventRepo,
        },
        {
          provide: getRepositoryToken(DailyActiveUser),
          useValue: mockDailyActiveUserRepo,
        },
      ],
    }).compile();

    job = module.get<DailyActiveUsersRollupJob>(DailyActiveUsersRollupJob);
  });

  it('should be defined', () => {
    expect(job).toBeDefined();
  });

  describe('rollupForDate', () => {
    it('dedupes users who fired multiple events on the same day', async () => {
      mockAnalyticsEventRepo.find.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-1' },
        { userId: 'user-3' },
        { userId: 'user-2' },
      ] as AnalyticsEvent[]);

      const result = await job.rollupForDate(
        new Date('2026-07-22T12:00:00.000Z'),
      );

      expect(result).toEqual({ date: '2026-07-22', rowsWritten: 3 });
      expect(mockDailyActiveUserRepo.save).toHaveBeenCalledTimes(1);

      const savedRows = mockDailyActiveUserRepo.save.mock.calls[0][0];
      const savedUserIds = savedRows.map((row) => row.userId).sort();
      expect(savedUserIds).toEqual(['user-1', 'user-2', 'user-3']);
      savedRows.forEach((row) => expect(row.date).toBe('2026-07-22'));
    });

    it('queries raw events for the correct UTC day bounds', async () => {
      mockAnalyticsEventRepo.find.mockResolvedValue([]);

      await job.rollupForDate(new Date('2026-07-22T12:00:00.000Z'));

      expect(mockAnalyticsEventRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          select: ['userId'],
          where: expect.objectContaining({ timestamp: expect.anything() }),
        }),
      );
    });

    it('is idempotent: re-running for the same day replaces rather than duplicates rows', async () => {
      mockAnalyticsEventRepo.find.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ] as AnalyticsEvent[]);

      await job.rollupForDate(new Date('2026-07-22T00:00:00.000Z'));
      await job.rollupForDate(new Date('2026-07-22T00:00:00.000Z'));

      expect(mockDailyActiveUserRepo.delete).toHaveBeenCalledTimes(2);
      expect(mockDailyActiveUserRepo.delete).toHaveBeenNthCalledWith(1, {
        date: '2026-07-22',
      });
      expect(mockDailyActiveUserRepo.delete).toHaveBeenNthCalledWith(2, {
        date: '2026-07-22',
      });
      expect(mockDailyActiveUserRepo.save).toHaveBeenCalledTimes(2);
    });

    it('writes no rows and skips save when no users were active', async () => {
      mockAnalyticsEventRepo.find.mockResolvedValue([]);

      const result = await job.rollupForDate(
        new Date('2026-07-22T00:00:00.000Z'),
      );

      expect(result.rowsWritten).toBe(0);
      expect(mockDailyActiveUserRepo.delete).toHaveBeenCalledWith({
        date: '2026-07-22',
      });
      expect(mockDailyActiveUserRepo.save).not.toHaveBeenCalled();
    });

    it('logs a summary of rows written on completion', async () => {
      mockAnalyticsEventRepo.find.mockResolvedValue([
        { userId: 'user-1' },
      ] as AnalyticsEvent[]);
      const loggerSpy = jest.spyOn(Logger.prototype, 'log');

      await job.rollupForDate(new Date('2026-07-22T00:00:00.000Z'));

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('2026-07-22'),
      );
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('1 rows written'),
      );
    });
  });
});
