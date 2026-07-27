import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExportCsvProvider } from './export-csv.provider';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { RetentionCohort } from '../entities/retention-cohort.entity';
import { AnalyticsQueryDto, ExportMetric, ExportFormat } from '../dtos/analytics-query.dto';

describe('ExportCsvProvider', () => {
  let provider: ExportCsvProvider;

  const mockRetentionCohortRepo = { find: jest.fn() };
  const mockAnalyticsEventRepo = { count: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportCsvProvider,
        { provide: getRepositoryToken(RetentionCohort), useValue: mockRetentionCohortRepo },
        { provide: getRepositoryToken(AnalyticsEvent), useValue: mockAnalyticsEventRepo },
      ],
    }).compile();
    provider = module.get<ExportCsvProvider>(ExportCsvProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('happy path', () => {
    it('exports a retention metric as CSV with header and data rows', async () => {
      mockRetentionCohortRepo.find.mockResolvedValue([
        {
          id: 'uuid-1',
          cohortDate: '2024-01-15',
          cohortSize: 100,
          retainedDay1: 70,
          retainedDay7: 50,
          retainedDay30: 30,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const query: AnalyticsQueryDto = {
        metric: ExportMetric.RETENTION,
        format: ExportFormat.CSV,
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        _dateRange: true,
      } as AnalyticsQueryDto;

      const result = await provider.export(query);

      expect(result.contentType).toBe('text/csv');
      expect(result.filename).toBe('analytics-export-retention.csv');
      expect(result.body).toContain('cohortDate,cohortSize,retainedDay1,retainedDay7,retainedDay30');
      expect(result.body).toContain('2024-01-15,100,70,50,30');
    });

    it('exports an onboarding_funnel metric as JSON', async () => {
      mockAnalyticsEventRepo.count.mockResolvedValue(0);
      mockAnalyticsEventRepo.count.mockResolvedValueOnce(200);

      const query: AnalyticsQueryDto = {
        metric: ExportMetric.ONBOARDING_FUNNEL,
        format: ExportFormat.JSON,
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31'),
        _dateRange: true,
      } as AnalyticsQueryDto;

      const result = await provider.export(query);

      expect(result.contentType).toBe('application/json');
      expect(result.filename).toBe('analytics-export-onboarding_funnel.json');

      const parsed = JSON.parse(result.body);
      expect(parsed).toHaveLength(5); // 5 onboarding stages
      expect(parsed[0]).toEqual({
        stage: 'Onboarding Started',
        eventType: 'onboarding_started',
        count: 200,
      });
      expect(mockAnalyticsEventRepo.count).toHaveBeenCalledTimes(5);
    });
  });

  describe('empty data', () => {
    it('returns a header-only CSV when no retention cohorts exist in range', async () => {
      mockRetentionCohortRepo.find.mockResolvedValue([]);

      const query: AnalyticsQueryDto = {
        metric: ExportMetric.RETENTION,
        format: ExportFormat.CSV,
        start: new Date('2024-06-01'),
        end: new Date('2024-06-30'),
        _dateRange: true,
      } as AnalyticsQueryDto;

      const result = await provider.export(query);

      expect(result.body.trim()).toBe(
        'cohortDate,cohortSize,retainedDay1,retainedDay7,retainedDay30',
      );
    });

    it('returns an empty JSON array when no funnel events exist in range', async () => {
      mockAnalyticsEventRepo.count.mockResolvedValue(0);

      const query: AnalyticsQueryDto = {
        metric: ExportMetric.ONBOARDING_FUNNEL,
        format: ExportFormat.JSON,
        start: new Date('2024-06-01'),
        end: new Date('2024-06-30'),
        _dateRange: true,
      } as AnalyticsQueryDto;

      const result = await provider.export(query);
      const parsed = JSON.parse(result.body);

      expect(parsed).toHaveLength(5);
      expect(parsed.every((row: { count: number }) => row.count === 0)).toBe(true);
    });
  });

  describe('boundary date range', () => {
    it('handles a single-day range (start === end) for retention export', async () => {
      mockRetentionCohortRepo.find.mockResolvedValue([
        {
          id: 'uuid-2',
          cohortDate: '2024-03-10',
          cohortSize: 50,
          retainedDay1: 25,
          retainedDay7: 10,
          retainedDay30: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const query: AnalyticsQueryDto = {
        metric: ExportMetric.RETENTION,
        format: ExportFormat.CSV,
        start: new Date('2024-03-10'),
        end: new Date('2024-03-10'),
        _dateRange: true,
      } as AnalyticsQueryDto;

      const result = await provider.export(query);

      expect(mockRetentionCohortRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { cohortDate: expect.anything() },
          order: { cohortDate: 'ASC' },
        }),
      );
      expect(result.body).toContain('2024-03-10,50,25,10,5');
    });

    it('defaults to the full available range when start/end are omitted', async () => {
      mockRetentionCohortRepo.find.mockResolvedValue([]);

      const query: AnalyticsQueryDto = {
        metric: ExportMetric.RETENTION,
        format: ExportFormat.CSV,
      } as AnalyticsQueryDto;

      await provider.export(query);

      const callArgs = mockRetentionCohortRepo.find.mock.calls[0][0];
      expect(callArgs.where.cohortDate).toBeDefined();
    });
  });
});
