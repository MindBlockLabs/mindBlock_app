import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsBreakdownService } from './analytics-breakdown.service';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { TimeFilterService } from 'src/timefilter/providers/timefilter.service';
import { GetAnalyticsQueryDto } from '../dto/get-analytics-query.dto';
import { EventTypeBreakdown, AnalyticsBreakdownResponse } from '../dto/analytics-breakdown-response.dto';

describe('AnalyticsBreakdownService', () => {
  let service: AnalyticsBreakdownService;
  let analyticsRepository: jest.Mocked<Repository<AnalyticsEvent>>;
  let timeFilterService: jest.Mocked<TimeFilterService>;

  const mockRawResults = [
    { eventType: 'question_view', count: '124' },
    { eventType: 'answer_submit', count: '87' },
    { eventType: 'puzzle_solved', count: '45' },
  ];

  const mockQuery: GetAnalyticsQueryDto = {
    timeFilter: 'weekly' as any,
    userId: '123e4567-e89b-12d3-a456-426614174000',
  };

  beforeEach(async () => {
    const mockRepository = {
      createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockRawResults),
      })),
    };

    const mockTimeFilterService = {
      resolveDateRange: jest.fn().mockReturnValue({
        from: new Date('2024-01-01'),
        to: new Date('2024-01-31'),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsBreakdownService,
        {
          provide: getRepositoryToken(AnalyticsEvent),
          useValue: mockRepository,
        },
        {
          provide: TimeFilterService,
          useValue: mockTimeFilterService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsBreakdownService>(AnalyticsBreakdownService);
    analyticsRepository = module.get(getRepositoryToken(AnalyticsEvent));
    timeFilterService = module.get(TimeFilterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBreakdown', () => {
    it('should return analytics breakdown with proper structure', async () => {
      const result = await service.getBreakdown(mockQuery);

      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('totalEvents');
      expect(result).toHaveProperty('uniqueEventTypes');
      expect(result).toHaveProperty('dateRange');
      expect(Array.isArray(result.breakdown)).toBe(true);
    });

    it('should calculate percentages correctly', async () => {
      const result = await service.getBreakdown(mockQuery);

      const totalEvents = 124 + 87 + 45; // 256
      const expectedPercentages = [
        Math.round((124 / totalEvents) * 100 * 10) / 10, // 48.4
        Math.round((87 / totalEvents) * 100 * 10) / 10,  // 34.0
        Math.round((45 / totalEvents) * 100 * 10) / 10,  // 17.6
      ];

      result.breakdown.forEach((item, index) => {
        expect(item.percentage).toBe(expectedPercentages[index]);
      });
    });

    it('should provide friendly display names', async () => {
      const result = await service.getBreakdown(mockQuery);

      expect(result.breakdown[0].displayName).toBe('Question Viewed');
      expect(result.breakdown[1].displayName).toBe('Answer Submitted');
      expect(result.breakdown[2].displayName).toBe('Puzzle Solved');
    });

    it('should handle empty results', async () => {
      const mockEmptyRepository = {
        createQueryBuilder: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        })),
      };

      const module = await Test.createTestingModule({
        providers: [
          AnalyticsBreakdownService,
          {
            provide: getRepositoryToken(AnalyticsEvent),
            useValue: mockEmptyRepository,
          },
          {
            provide: TimeFilterService,
            useValue: timeFilterService,
          },
        ],
      }).compile();

      const emptyService = module.get<AnalyticsBreakdownService>(AnalyticsBreakdownService);
      const result = await emptyService.getBreakdown(mockQuery);

      expect(result.breakdown).toEqual([]);
      expect(result.totalEvents).toBe(0);
      expect(result.uniqueEventTypes).toBe(0);
    });

    it('should apply date filters correctly', async () => {
      await service.getBreakdown(mockQuery);

      const queryBuilder = analyticsRepository.createQueryBuilder();
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'event.createdAt >= :from',
        { from: new Date('2024-01-01') }
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'event.createdAt <= :to',
        { to: new Date('2024-01-31') }
      );
    });

    it('should apply user filter when provided', async () => {
      await service.getBreakdown(mockQuery);

      const queryBuilder = analyticsRepository.createQueryBuilder();
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'event.userId = :userId',
        { userId: mockQuery.userId }
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockErrorRepository = {
        createQueryBuilder: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          addSelect: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockRejectedValue(new Error('Database error')),
        })),
      };

      const module = await Test.createTestingModule({
        providers: [
          AnalyticsBreakdownService,
          {
            provide: getRepositoryToken(AnalyticsEvent),
            useValue: mockErrorRepository,
          },
          {
            provide: TimeFilterService,
            useValue: timeFilterService,
          },
        ],
      }).compile();

      const errorService = module.get<AnalyticsBreakdownService>(AnalyticsBreakdownService);

      await expect(errorService.getBreakdown(mockQuery)).rejects.toThrow('Database error');
    });
  });

  describe('getAvailableEventTypes', () => {
    it('should return array of event types', async () => {
      const mockEventTypes = ['question_view', 'answer_submit', 'puzzle_solved'];
      const mockRepository = {
        createQueryBuilder: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue(
            mockEventTypes.map(type => ({ eventType: type }))
          ),
        })),
      };

      const module = await Test.createTestingModule({
        providers: [
          AnalyticsBreakdownService,
          {
            provide: getRepositoryToken(AnalyticsEvent),
            useValue: mockRepository,
          },
          {
            provide: TimeFilterService,
            useValue: timeFilterService,
          },
        ],
      }).compile();

      const eventTypesService = module.get<AnalyticsBreakdownService>(AnalyticsBreakdownService);
      const result = await eventTypesService.getAvailableEventTypes();

      expect(result).toEqual(mockEventTypes);
    });
  });

  describe('getBreakdownForEventTypes', () => {
    it('should filter by specific event types', async () => {
      const eventTypes = ['question_view', 'answer_submit'];
      const result = await service.getBreakdownForEventTypes(eventTypes, mockQuery);

      const queryBuilder = analyticsRepository.createQueryBuilder();
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'event.eventType IN (:...eventTypes)',
        { eventTypes }
      );
    });

    it('should return filtered breakdown', async () => {
      const eventTypes = ['question_view', 'answer_submit'];
      const result = await service.getBreakdownForEventTypes(eventTypes, mockQuery);

      expect(result.breakdown.length).toBeLessThanOrEqual(mockRawResults.length);
      result.breakdown.forEach(item => {
        expect(eventTypes).toContain(item.eventType);
      });
    });
  });

  describe('getTopEventTypes', () => {
    it('should limit results to specified number', async () => {
      const limit = 5;
      await service.getTopEventTypes(limit, mockQuery);

      const queryBuilder = analyticsRepository.createQueryBuilder();
      expect(queryBuilder.limit).toHaveBeenCalledWith(limit);
    });

    it('should clamp limit between 1 and 50', async () => {
      // Test lower bound
      await service.getTopEventTypes(0, mockQuery);
      let queryBuilder = analyticsRepository.createQueryBuilder();
      expect(queryBuilder.limit).toHaveBeenCalledWith(1);

      // Test upper bound
      await service.getTopEventTypes(100, mockQuery);
      queryBuilder = analyticsRepository.createQueryBuilder();
      expect(queryBuilder.limit).toHaveBeenCalledWith(50);
    });

    it('should return top event types ordered by count', async () => {
      const result = await service.getTopEventTypes(10, mockQuery);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe('display name formatting', () => {
    it('should format unknown event types correctly', () => {
      const service = new AnalyticsBreakdownService(
        analyticsRepository as any,
        timeFilterService as any
      );

      // Access private method through any
      const formatEventTypeName = (service as any).formatEventTypeName;
      expect(formatEventTypeName('custom_event_type')).toBe('Custom Event Type');
      expect(formatEventTypeName('single_word')).toBe('Single Word');
    });

    it('should use predefined display names for known event types', () => {
      const service = new AnalyticsBreakdownService(
        analyticsRepository as any,
        timeFilterService as any
      );

      const getDisplayName = (service as any).getDisplayName;
      expect(getDisplayName('question_view')).toBe('Question Viewed');
      expect(getDisplayName('puzzle_solved')).toBe('Puzzle Solved');
    });
  });

  describe('date range formatting', () => {
    it('should format date range correctly', () => {
      const service = new AnalyticsBreakdownService(
        analyticsRepository as any,
        timeFilterService as any
      );

      const generateDateRangeString = (service as any).generateDateRangeString;
      
      expect(generateDateRangeString()).toBe('All time');
      expect(generateDateRangeString(new Date('2024-01-01'))).toBe('From 2024-01-01');
      expect(generateDateRangeString(undefined, new Date('2024-01-31'))).toBe('Until 2024-01-31');
      expect(generateDateRangeString(new Date('2024-01-01'), new Date('2024-01-31'))).toBe('2024-01-01 to 2024-01-31');
    });
  });
}); 