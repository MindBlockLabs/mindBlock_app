import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GetRetentionCurveProvider } from './get-retention-curve.provider';
import { RetentionCohort } from '../entities/retention-cohort.entity';
import { DateRangeDto } from '../dtos/date-range.dto';

describe('GetRetentionCurveProvider', () => {
  let provider: GetRetentionCurveProvider;

  const mockRetentionCohortRepo = { find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetRetentionCurveProvider,
        { provide: getRepositoryToken(RetentionCohort), useValue: mockRetentionCohortRepo },
      ],
    }).compile();
    provider = module.get<GetRetentionCurveProvider>(GetRetentionCurveProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('getRetentionCurve', () => {
    it('should return empty result when no cohort data exists', async () => {
      const query: DateRangeDto = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        granularity: 'day',
        _dateRange: true,
      };
      mockRetentionCohortRepo.find.mockResolvedValue([]);

      const result = await provider.getRetentionCurve(query);

      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-01-31');
      expect(result.granularity).toBe('day');
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should compute retention correctly for a single cohort day', async () => {
      const query: DateRangeDto = {
        start: new Date('2024-01-15'),
        end: new Date('2024-01-15'),
        _dateRange: true,
      };
      const cohort: Partial<RetentionCohort> = {
        id: 'uuid-1',
        cohortDate: '2024-01-15',
        cohortSize: 100,
        retainedDay1: 70,
        retainedDay7: 50,
        retainedDay30: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRetentionCohortRepo.find.mockResolvedValue([cohort]);

      const result = await provider.getRetentionCurve(query);

      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
      const point = result.data[0];
      expect(point.cohortDate).toBe('2024-01-15');
      expect(point.cohortSize).toBe(100);
      expect(point.day1RetentionPct).toBe(70);
      expect(point.day7RetentionPct).toBe(50);
      expect(point.day30RetentionPct).toBe(30);
    });

    it('should compute retention for multi-day range with multiple cohorts', async () => {
      const query: DateRangeDto = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-03'),
        granularity: 'day',
        _dateRange: true,
      };
      const cohorts: Partial<RetentionCohort>[] = [
        { id: 'uuid-1', cohortDate: '2024-01-01', cohortSize: 200, retainedDay1: 130, retainedDay7: 100, retainedDay30: 60, createdAt: new Date(), updatedAt: new Date() },
        { id: 'uuid-2', cohortDate: '2024-01-02', cohortSize: 150, retainedDay1: 90, retainedDay7: 75, retainedDay30: 45, createdAt: new Date(), updatedAt: new Date() },
        { id: 'uuid-3', cohortDate: '2024-01-03', cohortSize: 180, retainedDay1: 126, retainedDay7: 90, retainedDay30: 54, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockRetentionCohortRepo.find.mockResolvedValue(cohorts);

      const result = await provider.getRetentionCurve(query);

      expect(result.data.length).toBe(3);
      expect(result.total).toBe(3);
      expect(result.data[0].day1RetentionPct).toBe(65);
      expect(result.data[1].day1RetentionPct).toBe(60);
      expect(result.data[2].day1RetentionPct).toBe(70);
      expect(result.data[2].day7RetentionPct).toBe(50);
      expect(result.data[2].day30RetentionPct).toBe(30);
    });

    it('should return null percentages when cohortSize is 0 (no division by zero)', async () => {
      const query: DateRangeDto = {
        start: new Date('2024-01-10'),
        end: new Date('2024-01-10'),
        _dateRange: true,
      };
      const cohort: Partial<RetentionCohort> = {
        id: 'uuid-zero', cohortDate: '2024-01-10', cohortSize: 0,
        retainedDay1: 0, retainedDay7: 0, retainedDay30: 0, createdAt: new Date(), updatedAt: new Date(),
      };
      mockRetentionCohortRepo.find.mockResolvedValue([cohort]);

      const result = await provider.getRetentionCurve(query);

      expect(result.data[0].day1RetentionPct).toBeNull();
      expect(result.data[0].day7RetentionPct).toBeNull();
      expect(result.data[0].day30RetentionPct).toBeNull();
    });

    it('should default granularity to "day" when not specified', async () => {
      const query: DateRangeDto = { start: new Date('2024-02-01'), end: new Date('2024-02-05'), _dateRange: true };
      mockRetentionCohortRepo.find.mockResolvedValue([]);

      const result = await provider.getRetentionCurve(query);

      expect(result.granularity).toBe('day');
    });

    it('should query using Between on cohortDate (index-backed)', async () => {
      const query: DateRangeDto = { start: new Date('2024-03-01'), end: new Date('2024-03-31'), _dateRange: true };
      mockRetentionCohortRepo.find.mockResolvedValue([]);

      await provider.getRetentionCurve(query);

      expect(mockRetentionCohortRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cohortDate: expect.anything() },
          order: { cohortDate: 'ASC' },
        }),
      );
    });

    it('should round retention percentages to two decimal places', async () => {
      const query: DateRangeDto = { start: new Date('2024-04-01'), end: new Date('2024-04-01'), _dateRange: true };
      const cohort: Partial<RetentionCohort> = {
        id: 'uuid-frac', cohortDate: '2024-04-01', cohortSize: 300,
        retainedDay1: 199, retainedDay7: 151, retainedDay30: 99,
        createdAt: new Date(), updatedAt: new Date(),
      };
      mockRetentionCohortRepo.find.mockResolvedValue([cohort]);

      const result = await provider.getRetentionCurve(query);

      expect(result.data[0].day1RetentionPct).toBe(66.33);
      expect(result.data[0].day7RetentionPct).toBe(50.33);
      expect(result.data[0].day30RetentionPct).toBe(33);
    });
  });
});