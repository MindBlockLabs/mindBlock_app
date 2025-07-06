import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './providers/analytics.service';
import { AnalyticsExportService } from './providers/analytics-export.service';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { ExportFormat } from './dto/export-analytics-query.dto';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: jest.Mocked<AnalyticsService>;
  let analyticsExportService: jest.Mocked<AnalyticsExportService>;
  let mockResponse: Partial<Response>;

  const mockAnalyticsData: AnalyticsEvent[] = [
    {
      id: 1,
      eventType: 'puzzle_solved',
      userId: 123,
      metadata: { puzzleId: 'puzzle-1', difficulty: 'easy' },
      createdAt: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: 2,
      eventType: 'iq_question_answered',
      userId: 456,
      metadata: { questionId: 'iq-1', correct: true },
      createdAt: new Date('2024-01-02T11:00:00Z'),
    },
  ];

  beforeEach(async () => {
    const mockAnalyticsService = {
      getAnalytics: jest.fn(),
      findAll: jest.fn(),
    };

    const mockAnalyticsExportService = {
      exportAnalytics: jest.fn(),
      generateFilename: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get(AnalyticsService);
    analyticsExportService = module.get(AnalyticsExportService);

    mockResponse = {
      setHeader: jest.fn(),
      pipe: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      const query = { userId: '123' };
      analyticsService.getAnalytics.mockResolvedValue(mockAnalyticsData);

      const result = await controller.getAnalytics(query);

      expect(analyticsService.getAnalytics).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockAnalyticsData);
    });
  });

  describe('exportAnalytics', () => {
    it('should export analytics data in CSV format', async () => {
      const query = { 
        format: ExportFormat.CSV,
        userId: '123',
        timeFilter: 'weekly' as any
      };
      
      analyticsService.findAll.mockResolvedValue(mockAnalyticsData);
      analyticsExportService.exportAnalytics.mockResolvedValue(undefined);

      await controller.exportAnalytics(query, mockResponse as Response);

      expect(analyticsService.findAll).toHaveBeenCalledWith(query);
      expect(analyticsExportService.exportAnalytics).toHaveBeenCalledWith(
        mockAnalyticsData,
        ExportFormat.CSV,
        mockResponse
      );
    });

    it('should export analytics data in PDF format', async () => {
      const query = { 
        format: ExportFormat.PDF,
        from: '2024-01-01',
        to: '2024-01-31'
      };
      
      analyticsService.findAll.mockResolvedValue(mockAnalyticsData);
      analyticsExportService.exportAnalytics.mockResolvedValue(undefined);

      await controller.exportAnalytics(query, mockResponse as Response);

      expect(analyticsService.findAll).toHaveBeenCalledWith(query);
      expect(analyticsExportService.exportAnalytics).toHaveBeenCalledWith(
        mockAnalyticsData,
        ExportFormat.PDF,
        mockResponse
      );
    });

    it('should default to CSV format when no format specified', async () => {
      const query = { userId: '123' };
      
      analyticsService.findAll.mockResolvedValue(mockAnalyticsData);
      analyticsExportService.exportAnalytics.mockResolvedValue(undefined);

      await controller.exportAnalytics(query, mockResponse as Response);

      expect(analyticsExportService.exportAnalytics).toHaveBeenCalledWith(
        mockAnalyticsData,
        ExportFormat.CSV,
        mockResponse
      );
    });

    it('should handle empty analytics data', async () => {
      const query = { format: ExportFormat.CSV };
      
      analyticsService.findAll.mockResolvedValue([]);
      analyticsExportService.exportAnalytics.mockResolvedValue(undefined);

      await controller.exportAnalytics(query, mockResponse as Response);

      expect(analyticsExportService.exportAnalytics).toHaveBeenCalledWith(
        [],
        ExportFormat.CSV,
        mockResponse
      );
    });

    it('should handle service errors', async () => {
      const query = { format: ExportFormat.CSV };
      const error = new Error('Service error');
      
      analyticsService.findAll.mockRejectedValue(error);

      await expect(
        controller.exportAnalytics(query, mockResponse as Response)
      ).rejects.toThrow('Service error');
    });

    it('should handle export service errors', async () => {
      const query = { format: ExportFormat.CSV };
      const error = new Error('Export error');
      
      analyticsService.findAll.mockResolvedValue(mockAnalyticsData);
      analyticsExportService.exportAnalytics.mockRejectedValue(error);

      await expect(
        controller.exportAnalytics(query, mockResponse as Response)
      ).rejects.toThrow('Export error');
    });
  });
}); 