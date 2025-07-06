import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { AnalyticsExportService } from './analytics-export.service';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { ExportFormat } from '../dto/export-analytics-query.dto';

describe('AnalyticsExportService', () => {
  let service: AnalyticsExportService;
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
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsExportService],
    }).compile();

    service = module.get<AnalyticsExportService>(AnalyticsExportService);

    // Mock response object
    mockResponse = {
      setHeader: jest.fn(),
      pipe: jest.fn(),
    };
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportAnalytics', () => {
    it('should export data in CSV format', async () => {
      const mockCsvWrite = jest.fn().mockReturnValue({
        pipe: jest.fn(),
      });
      
      // Mock fast-csv
      jest.doMock('fast-csv', () => ({
        write: mockCsvWrite,
      }));

      await service.exportAnalytics(mockAnalyticsData, ExportFormat.CSV, mockResponse as Response);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename="analytics-export-')
      );
    });

    it('should export data in PDF format', async () => {
      const mockPdfDocument = {
        pipe: jest.fn(),
        fontSize: jest.fn().mockReturnThis(),
        font: jest.fn().mockReturnThis(),
        text: jest.fn().mockReturnThis(),
        moveDown: jest.fn().mockReturnThis(),
        end: jest.fn(),
      };

      // Mock pdfkit
      jest.doMock('pdfkit', () => {
        return jest.fn().mockImplementation(() => mockPdfDocument);
      });

      await service.exportAnalytics(mockAnalyticsData, ExportFormat.PDF, mockResponse as Response);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename="analytics-export-')
      );
    });

    it('should throw error for unsupported format', async () => {
      await expect(
        service.exportAnalytics(mockAnalyticsData, 'unsupported' as ExportFormat, mockResponse as Response)
      ).rejects.toThrow('Unsupported export format: unsupported');
    });

    it('should handle empty data array', async () => {
      const mockCsvWrite = jest.fn().mockReturnValue({
        pipe: jest.fn(),
      });
      
      jest.doMock('fast-csv', () => ({
        write: mockCsvWrite,
      }));

      await service.exportAnalytics([], ExportFormat.CSV, mockResponse as Response);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    });
  });

  describe('generateFilename', () => {
    it('should generate CSV filename with timestamp', () => {
      const filename = service.generateFilename(ExportFormat.CSV);
      expect(filename).toMatch(/^analytics-export-.*\.csv$/);
    });

    it('should generate PDF filename with timestamp', () => {
      const filename = service.generateFilename(ExportFormat.PDF);
      expect(filename).toMatch(/^analytics-export-.*\.pdf$/);
    });
  });

  describe('error handling', () => {
    it('should handle CSV export errors', async () => {
      const mockCsvWrite = jest.fn().mockImplementation(() => {
        throw new Error('CSV write error');
      });
      
      jest.doMock('fast-csv', () => ({
        write: mockCsvWrite,
      }));

      await expect(
        service.exportAnalytics(mockAnalyticsData, ExportFormat.CSV, mockResponse as Response)
      ).rejects.toThrow('CSV write error');
    });

    it('should handle PDF export errors', async () => {
      const mockPdfDocument = {
        pipe: jest.fn().mockImplementation(() => {
          throw new Error('PDF creation error');
        }),
      };

      jest.doMock('pdfkit', () => {
        return jest.fn().mockImplementation(() => mockPdfDocument);
      });

      await expect(
        service.exportAnalytics(mockAnalyticsData, ExportFormat.PDF, mockResponse as Response)
      ).rejects.toThrow('PDF creation error');
    });
  });
}); 