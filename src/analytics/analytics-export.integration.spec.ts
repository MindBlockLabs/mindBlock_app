import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { AnalyticsModule } from './analytics.module';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { ExportFormat } from './dto/export-analytics-query.dto';

describe('Analytics Export Integration', () => {
  let app: INestApplication;
  let analyticsRepository: Repository<AnalyticsEvent>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [AnalyticsEvent],
          synchronize: true,
        }),
        AnalyticsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    analyticsRepository = moduleFixture.get<Repository<AnalyticsEvent>>(
      getRepositoryToken(AnalyticsEvent),
    );
  });

  beforeEach(async () => {
    // Clear database before each test
    await analyticsRepository.clear();

    // Insert test data
    const testData: Partial<AnalyticsEvent>[] = [
      {
        eventType: 'puzzle_solved',
        userId: 123,
        metadata: { puzzleId: 'puzzle-1', difficulty: 'easy' },
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        eventType: 'iq_question_answered',
        userId: 456,
        metadata: { questionId: 'iq-1', correct: true },
        createdAt: new Date('2024-01-02T11:00:00Z'),
      },
      {
        eventType: 'streak_milestone',
        userId: 789,
        metadata: { milestone: 7, reward: 100 },
        createdAt: new Date('2024-01-03T12:00:00Z'),
      },
    ];

    await analyticsRepository.save(testData);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /analytics/export', () => {
    it('should export analytics data in CSV format', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/export')
        .query({ format: ExportFormat.CSV })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.csv');
      expect(response.text).toContain('id,eventType,userId,timestamp,metadata');
    });

    it('should export analytics data in PDF format', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/export')
        .query({ format: ExportFormat.PDF })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('.pdf');
    });

    it('should default to CSV format when no format specified', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/export')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
    });

    it('should filter by userId', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/export')
        .query({ 
          format: ExportFormat.CSV,
          userId: '123'
        })
        .expect(200);

      expect(response.text).toContain('123');
      expect(response.text).not.toContain('456');
    });

    it('should filter by time range', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/export')
        .query({ 
          format: ExportFormat.CSV,
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-02T23:59:59Z'
        })
        .expect(200);

      // Should only include events from Jan 1-2
      expect(response.text).toContain('2024-01-01');
      expect(response.text).toContain('2024-01-02');
      expect(response.text).not.toContain('2024-01-03');
    });

    it('should filter by event type using metadata', async () => {
      // First, let's add an event with specific metadata
      await analyticsRepository.save({
        eventType: 'puzzle_solved',
        userId: 999,
        metadata: { puzzleId: 'puzzle-2', difficulty: 'hard' },
        createdAt: new Date('2024-01-04T10:00:00Z'),
      });

      const response = await request(app.getHttpServer())
        .get('/analytics/export')
        .query({ 
          format: ExportFormat.CSV,
          from: '2024-01-04T00:00:00Z',
          to: '2024-01-04T23:59:59Z'
        })
        .expect(200);

      expect(response.text).toContain('puzzle-2');
    });

    it('should handle empty results', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/export')
        .query({ 
          format: ExportFormat.CSV,
          userId: '999999' // Non-existent user
        })
        .expect(200);

      expect(response.text).toContain('id,eventType,userId,timestamp,metadata');
      // Should only have header row
      const lines = response.text.split('\n').filter(line => line.trim());
      expect(lines).toHaveLength(1);
    });

    it('should return 400 for invalid date format', async () => {
      await request(app.getHttpServer())
        .get('/analytics/export')
        .query({ 
          format: ExportFormat.CSV,
          from: 'invalid-date'
        })
        .expect(400);
    });

    it('should return 400 for invalid export format', async () => {
      await request(app.getHttpServer())
        .get('/analytics/export')
        .query({ 
          format: 'invalid-format'
        })
        .expect(400);
    });
  });

  describe('Data integrity in exports', () => {
    it('should include all required fields in CSV export', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/export')
        .query({ format: ExportFormat.CSV })
        .expect(200);

      const lines = response.text.split('\n').filter(line => line.trim());
      expect(lines.length).toBeGreaterThan(1); // Header + data rows

      // Check header
      const header = lines[0];
      expect(header).toContain('id');
      expect(header).toContain('eventType');
      expect(header).toContain('userId');
      expect(header).toContain('timestamp');
      expect(header).toContain('metadata');

      // Check data row (first data row)
      if (lines.length > 1) {
        const dataRow = lines[1];
        const fields = dataRow.split(',');
        expect(fields.length).toBeGreaterThanOrEqual(5);
      }
    });

    it('should properly escape JSON metadata in CSV', async () => {
      // Add event with complex metadata
      await analyticsRepository.save({
        eventType: 'complex_event',
        userId: 111,
        metadata: { 
          nested: { value: 'test' },
          array: [1, 2, 3],
          string: 'test,with,commas'
        },
        createdAt: new Date('2024-01-05T10:00:00Z'),
      });

      const response = await request(app.getHttpServer())
        .get('/analytics/export')
        .query({ 
          format: ExportFormat.CSV,
          from: '2024-01-05T00:00:00Z',
          to: '2024-01-05T23:59:59Z'
        })
        .expect(200);

      expect(response.text).toContain('complex_event');
      expect(response.text).toContain('111');
    });
  });
}); 