import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './providers/analytics.service';
import { AnalyticsExportService } from './providers/analytics-export.service';
import { AnalyticsBreakdownService } from './providers/analytics-breakdown.service';
import { GetAnalyticsQueryDto, TimeFilter } from './dto/get-analytics-query.dto';
import { AnalyticsBreakdownResponse } from './dto/analytics-breakdown-response.dto';
import { EventTypeBreakdown } from './dto/analytics-breakdown-response.dto';

describe('AnalyticsController - Breakdown Endpoints', () => {
  let controller: AnalyticsController;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let analyticsExportService: jest.Mocked<AnalyticsExportService>;
  let analyticsBreakdownService: jest.Mocked<AnalyticsBreakdownService>;

  const mockBreakdownResponse: AnalyticsBreakdownResponse = {
    breakdown: [
      {
        eventType: 'question_view',
        count: 124,
        displayName: 'Question Viewed',
        percentage: 58.8,
      },
      {
        eventType: 'answer_submit',
        count: 87,
        displayName: 'Answer Submitted',
        percentage: 41.2,
      },
    ],
    totalEvents: 211,
    uniqueEventTypes: 2,
    dateRange: '2024-01-01 to 2024-01-31',
  };

  const mockTopEventTypes: EventTypeBreakdown[] = [
    {
      eventType: 'question_view',
      count: 124,
      displayName: 'Question Viewed',
      percentage: 58.8,
    },
    {
      eventType: 'answer_submit',
      count: 87,
      displayName: 'Answer Submitted',
      percentage: 41.2,
    },
  ];

  const mockEventTypes = ['question_view', 'answer_submit', 'puzzle_solved'];

  beforeEach(async () => {
    const mockAnalyticsService = {
      getAnalytics: jest.fn(),
      findAll: jest.fn(),
    };

    const mockAnalyticsExportService = {
      exportAnalytics: jest.fn(),
      generateFilename: jest.fn(),
    };

    const mockAnalyticsBreakdownService = {
      getBreakdown: jest.fn(),
      getTopEventTypes: jest.fn(),
      getAvailableEventTypes: jest.fn(),
      getBreakdownForEventTypes: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
        {
          provide: AnalyticsExportService,
          useValue: mockAnalyticsExportService,
        },
        {
          provide: AnalyticsBreakdownService,
          useValue: mockAnalyticsBreakdownService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get(AnalyticsService);
    analyticsExportService = module.get(AnalyticsExportService);
    analyticsBreakdownService = module.get(AnalyticsBreakdownService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBreakdown', () => {
    it('should return analytics breakdown', async () => {
      const query: GetAnalyticsQueryDto = {
        timeFilter: TimeFilter.WEEKLY,
        userId: '123e4567-e89b-12d3-a456-426614174000',
      };

      analyticsBreakdownService.getBreakdown.mockResolvedValue(mockBreakdownResponse);

      const result = await controller.getBreakdown(query);

      expect(analyticsBreakdownService.getBreakdown).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockBreakdownResponse);
    });

    it('should handle empty query parameters', async () => {
      const query: GetAnalyticsQueryDto = {};

      analyticsBreakdownService.getBreakdown.mockResolvedValue(mockBreakdownResponse);

      const result = await controller.getBreakdown(query);

      expect(analyticsBreakdownService.getBreakdown).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockBreakdownResponse);
    });

    it('should handle service errors', async () => {
      const query: GetAnalyticsQueryDto = { timeFilter: TimeFilter.WEEKLY };
      const error = new Error('Service error');

      analyticsBreakdownService.getBreakdown.mockRejectedValue(error);

      await expect(controller.getBreakdown(query)).rejects.toThrow('Service error');
    });
  });

  describe('getTopEventTypes', () => {
    it('should return top event types with default limit', async () => {
      const query: GetAnalyticsQueryDto = { timeFilter: TimeFilter.WEEKLY };

      analyticsBreakdownService.getTopEventTypes.mockResolvedValue(mockTopEventTypes);

      const result = await controller.getTopEventTypes(undefined, query);

      expect(analyticsBreakdownService.getTopEventTypes).toHaveBeenCalledWith(10, query);
      expect(result).toEqual(mockTopEventTypes);
    });

    it('should return top event types with custom limit', async () => {
      const query: GetAnalyticsQueryDto = { timeFilter: TimeFilter.WEEKLY };
      const limit = 5;

      analyticsBreakdownService.getTopEventTypes.mockResolvedValue(mockTopEventTypes);

      const result = await controller.getTopEventTypes(limit, query);

      expect(analyticsBreakdownService.getTopEventTypes).toHaveBeenCalledWith(5, query);
      expect(result).toEqual(mockTopEventTypes);
    });

    it('should clamp limit to minimum value', async () => {
      const query: GetAnalyticsQueryDto = { timeFilter: TimeFilter.WEEKLY };
      const limit = 0;

      analyticsBreakdownService.getTopEventTypes.mockResolvedValue(mockTopEventTypes);

      const result = await controller.getTopEventTypes(limit, query);

      expect(analyticsBreakdownService.getTopEventTypes).toHaveBeenCalledWith(1, query);
      expect(result).toEqual(mockTopEventTypes);
    });

    it('should clamp limit to maximum value', async () => {
      const query: GetAnalyticsQueryDto = { timeFilter: TimeFilter.WEEKLY };
      const limit = 100;

      analyticsBreakdownService.getTopEventTypes.mockResolvedValue(mockTopEventTypes);

      const result = await controller.getTopEventTypes(limit, query);

      expect(analyticsBreakdownService.getTopEventTypes).toHaveBeenCalledWith(50, query);
      expect(result).toEqual(mockTopEventTypes);
    });

    it('should handle service errors', async () => {
      const query: GetAnalyticsQueryDto = { timeFilter: TimeFilter.WEEKLY };
      const error = new Error('Service error');

      analyticsBreakdownService.getTopEventTypes.mockRejectedValue(error);

      await expect(controller.getTopEventTypes(10, query)).rejects.toThrow('Service error');
    });
  });

  describe('getAvailableEventTypes', () => {
    it('should return available event types', async () => {
      analyticsBreakdownService.getAvailableEventTypes.mockResolvedValue(mockEventTypes);

      const result = await controller.getAvailableEventTypes();

      expect(analyticsBreakdownService.getAvailableEventTypes).toHaveBeenCalled();
      expect(result).toEqual(mockEventTypes);
    });

    it('should handle empty event types', async () => {
      analyticsBreakdownService.getAvailableEventTypes.mockResolvedValue([]);

      const result = await controller.getAvailableEventTypes();

      expect(result).toEqual([]);
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');

      analyticsBreakdownService.getAvailableEventTypes.mockRejectedValue(error);

      await expect(controller.getAvailableEventTypes()).rejects.toThrow('Service error');
    });
  });

  describe('query parameter validation', () => {
    it('should handle all query parameters correctly', async () => {
      const query: GetAnalyticsQueryDto = {
        timeFilter: TimeFilter.MONTHLY,
        from: '2024-01-01T00:00:00Z',
        to: '2024-01-31T23:59:59Z',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        sessionId: '456e7890-e89b-12d3-a456-426614174000',
      };

      analyticsBreakdownService.getBreakdown.mockResolvedValue(mockBreakdownResponse);

      const result = await controller.getBreakdown(query);

      expect(analyticsBreakdownService.getBreakdown).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockBreakdownResponse);
    });

    it('should handle partial query parameters', async () => {
      const query: GetAnalyticsQueryDto = {
        timeFilter: TimeFilter.WEEKLY,
        userId: '123e4567-e89b-12d3-a456-426614174000',
      };

      analyticsBreakdownService.getBreakdown.mockResolvedValue(mockBreakdownResponse);

      const result = await controller.getBreakdown(query);

      expect(analyticsBreakdownService.getBreakdown).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockBreakdownResponse);
    });
  });

  describe('response structure validation', () => {
    it('should return properly structured breakdown response', async () => {
      const query: GetAnalyticsQueryDto = { timeFilter: TimeFilter.WEEKLY };

      analyticsBreakdownService.getBreakdown.mockResolvedValue(mockBreakdownResponse);

      const result = await controller.getBreakdown(query);

      expect(result).toHaveProperty('breakdown');
      expect(result).toHaveProperty('totalEvents');
      expect(result).toHaveProperty('uniqueEventTypes');
      expect(result).toHaveProperty('dateRange');
      expect(Array.isArray(result.breakdown)).toBe(true);
    });

    it('should return properly structured top event types', async () => {
      const query: GetAnalyticsQueryDto = { timeFilter: TimeFilter.WEEKLY };

      analyticsBreakdownService.getTopEventTypes.mockResolvedValue(mockTopEventTypes);

      const result = await controller.getTopEventTypes(10, query);

      expect(Array.isArray(result)).toBe(true);
      result.forEach(item => {
        expect(item).toHaveProperty('eventType');
        expect(item).toHaveProperty('count');
        expect(item).toHaveProperty('displayName');
        expect(item).toHaveProperty('percentage');
      });
    });
  });
}); 