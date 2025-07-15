import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';
import { AnalyticsModule } from './analytics.module';
import { AnalyticsEvent } from './entities/analytics-event.entity';
import { TimeFilterModule } from '../timefilter/timefilter.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './providers/analytics.service';
import { AnalyticsExportService } from './providers/analytics-export.service';
import { AnalyticsBreakdownService } from './providers/analytics-breakdown.service';

describe('Analytics Breakdown Integration', () => {
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
        TimeFilterModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    analyticsRepository = moduleFixture.get<Repository<AnalyticsEvent>>(
      getRepositoryToken(AnalyticsEvent),
    );
  });

  const mockAnalyticsBreakdownService = {
  getBreakdown: jest.fn(),
};


  beforeEach(async () => {
    // Clear database before each test
    await analyticsRepository.clear();

    // Insert test data
    const testData: Partial<AnalyticsEvent>[] = [
      {
        eventType: 'question_view',
        userId: 123,
        metadata: { questionId: 'q1' },
        createdAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        eventType: 'question_view',
        userId: 456,
        metadata: { questionId: 'q2' },
        createdAt: new Date('2024-01-02T11:00:00Z'),
      },
      {
        eventType: 'answer_submit',
        userId: 123,
        metadata: { questionId: 'q1', correct: true },
        createdAt: new Date('2024-01-01T10:30:00Z'),
      },
      {
        eventType: 'puzzle_solved',
        userId: 789,
        metadata: { puzzleId: 'p1', difficulty: 'easy' },
        createdAt: new Date('2024-01-03T12:00:00Z'),
      },
      {
        eventType: 'streak_milestone',
        userId: 123,
        metadata: { milestone: 7, reward: 100 },
        createdAt: new Date('2024-01-04T13:00:00Z'),
      },
    ];

    await analyticsRepository.save(testData);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /analytics/breakdown', () => {
    it('should return analytics breakdown by event type', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown')
        .expect(200);

      expect(response.body).toHaveProperty('breakdown');
      expect(response.body).toHaveProperty('totalEvents');
      expect(response.body).toHaveProperty('uniqueEventTypes');
      expect(response.body).toHaveProperty('dateRange');

      expect(response.body.totalEvents).toBe(5);
      expect(response.body.uniqueEventTypes).toBe(4);

      const breakdown = response.body.breakdown;
      expect(Array.isArray(breakdown)).toBe(true);
      expect(breakdown.length).toBe(4);

      // Check that event types are ordered by count descending
      expect(breakdown[0].count).toBeGreaterThanOrEqual(breakdown[1].count);
    });

    it('should include friendly display names', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown')
        .expect(200);

      const breakdown = response.body.breakdown;
      
      const questionView = breakdown.find(item => item.eventType === 'question_view');
      expect(questionView.displayName).toBe('Question Viewed');

      const answerSubmit = breakdown.find(item => item.eventType === 'answer_submit');
      expect(answerSubmit.displayName).toBe('Answer Submitted');

      const puzzleSolved = breakdown.find(item => item.eventType === 'puzzle_solved');
      expect(puzzleSolved.displayName).toBe('Puzzle Solved');
    });

    it('should calculate percentages correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown')
        .expect(200);

      const breakdown = response.body.breakdown;
      const totalEvents = response.body.totalEvents;

      breakdown.forEach(item => {
        const expectedPercentage = Math.round((item.count / totalEvents) * 100 * 10) / 10;
        expect(item.percentage).toBe(expectedPercentage);
      });

      // Sum of percentages should be 100 (or close due to rounding)
      const sumPercentages = breakdown.reduce((sum, item) => sum + item.percentage, 0);
      expect(sumPercentages).toBeCloseTo(100, 1);
    });

    it('should filter by time range', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown')
        .query({
          from: '2024-01-01T00:00:00Z',
          to: '2024-01-02T23:59:59Z',
        })
        .expect(200);

      // Should only include events from Jan 1-2
      expect(response.body.totalEvents).toBe(3); // question_view (2) + answer_submit (1)
    });

    it('should filter by user ID', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown')
        .query({
          userId: '123',
        })
        .expect(200);

      // Should only include events for user 123
      expect(response.body.totalEvents).toBe(3); // question_view, answer_submit, streak_milestone
    });

    it('should handle empty results', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown')
        .query({
          userId: '999999', // Non-existent user
        })
        .expect(200);

      expect(response.body.totalEvents).toBe(0);
      expect(response.body.uniqueEventTypes).toBe(0);
      expect(response.body.breakdown).toEqual([]);
    });

    it('should return 400 for invalid date format', async () => {
      await request(app.getHttpServer())
        .get('/analytics/breakdown')
        .query({
          from: 'invalid-date',
        })
        .expect(400);
    });
  });

  describe('GET /analytics/breakdown/top', () => {
    it('should return top event types with default limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown/top')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(10);
    });

    it('should return top event types with custom limit', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown/top')
        .query({ limit: 3 })
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(3);
    });

    it('should clamp limit to minimum value', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown/top')
        .query({ limit: 0 })
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(1);
    });

    it('should clamp limit to maximum value', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown/top')
        .query({ limit: 100 })
        .expect(200);

      expect(response.body.length).toBeLessThanOrEqual(50);
    });

    it('should order by count descending', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown/top')
        .query({ limit: 10 })
        .expect(200);

      for (let i = 0; i < response.body.length - 1; i++) {
        expect(response.body[i].count).toBeGreaterThanOrEqual(response.body[i + 1].count);
      }
    });

    it('should apply filters correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown/top')
        .query({
          limit: 10,
          userId: '123',
        })
        .expect(200);

      // Should only include events for user 123
      response.body.forEach(item => {
        expect(item.count).toBeLessThanOrEqual(3); // Max 3 events for user 123
      });
    });
  });

  describe('GET /analytics/breakdown/event-types', () => {
    it('should return all available event types', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown/event-types')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toContain('question_view');
      expect(response.body).toContain('answer_submit');
      expect(response.body).toContain('puzzle_solved');
      expect(response.body).toContain('streak_milestone');
    });

    it('should return event types in alphabetical order', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown/event-types')
        .expect(200);

      const sortedEventTypes = [...response.body].sort();
      expect(response.body).toEqual(sortedEventTypes);
    });

    it('should handle empty database', async () => {
      // Clear database
      await analyticsRepository.clear();

      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown/event-types')
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe('Data integrity and consistency', () => {
    it('should maintain data consistency across endpoints', async () => {
      // Get breakdown
      const breakdownResponse = await request(app.getHttpServer())
        .get('/analytics/breakdown')
        .expect(200);

      // Get top event types
      const topResponse = await request(app.getHttpServer())
        .get('/analytics/breakdown/top')
        .query({ limit: 10 })
        .expect(200);

      // Get available event types
      const eventTypesResponse = await request(app.getHttpServer())
        .get('/analytics/breakdown/event-types')
        .expect(200);

      // Verify consistency
      expect(breakdownResponse.body.uniqueEventTypes).toBe(eventTypesResponse.body.length);
      expect(topResponse.body.length).toBeLessThanOrEqual(eventTypesResponse.body.length);

      // Verify that all event types in breakdown exist in available event types
      breakdownResponse.body.breakdown.forEach(item => {
        expect(eventTypesResponse.body).toContain(item.eventType);
      });
    });

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 5 }, () =>
        request(app.getHttpServer())
          .get('/analytics/breakdown')
          .expect(200)
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.body).toHaveProperty('breakdown');
        expect(response.body).toHaveProperty('totalEvents');
        expect(response.body.totalEvents).toBe(5);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking database failures
      // For now, we'll test that the endpoint responds correctly to malformed requests
      await request(app.getHttpServer())
        .get('/analytics/breakdown')
        .query({
          from: 'invalid-date-format',
        })
        .expect(400);
    });

    it('should handle missing query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/analytics/breakdown')
        .expect(200);

      expect(response.body).toHaveProperty('breakdown');
      expect(response.body).toHaveProperty('totalEvents');
    });
  });
}); 