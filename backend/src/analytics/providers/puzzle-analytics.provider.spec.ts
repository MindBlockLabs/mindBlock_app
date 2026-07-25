import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PuzzleAnalyticsProvider } from './puzzle-analytics.provider';
import { AnalyticsEvent } from '../entities/analytics-event.entity';
import { DateRangeDto } from '../dtos/date-range.dto';

describe('PuzzleAnalyticsProvider', () => {
  let provider: PuzzleAnalyticsProvider;
  let qb: Record<string, jest.Mock>;
  let mockRepo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    qb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    mockRepo = { createQueryBuilder: jest.fn(() => qb) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuzzleAnalyticsProvider,
        { provide: getRepositoryToken(AnalyticsEvent), useValue: mockRepo },
      ],
    }).compile();

    provider = module.get<PuzzleAnalyticsProvider>(PuzzleAnalyticsProvider);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('returns zeroed stats when no events exist for the puzzle', async () => {
    qb.getMany.mockResolvedValue([]);

    const result = await provider.getPuzzleStats('puzzle-1');

    expect(result).toEqual({
      puzzleId: 'puzzle-1',
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      successRate: 0,
      averageTimeSpent: 0,
      uniqueUsers: 0,
      startDate: undefined,
      endDate: undefined,
    });
  });

  it('computes stats correctly for multiple puzzle attempts', async () => {
    const fakeEvents = [
      {
        id: '1',
        eventType: 'puzzle_attempted',
        userId: 'user-a',
        entityId: 'puzzle-100',
        payload: { puzzleId: 'puzzle-100', isCorrect: true, timeSpent: 30 },
        timestamp: new Date('2024-01-10T10:00:00Z'),
      },
      {
        id: '2',
        eventType: 'puzzle_attempted',
        userId: 'user-a',
        entityId: 'puzzle-100',
        payload: { puzzleId: 'puzzle-100', isCorrect: true, timeSpent: 50 },
        timestamp: new Date('2024-01-11T10:00:00Z'),
      },
      {
        id: '3',
        eventType: 'puzzle_attempted',
        userId: 'user-b',
        entityId: 'puzzle-100',
        payload: { puzzleId: 'puzzle-100', isCorrect: false, timeSpent: 40 },
        timestamp: new Date('2024-01-12T10:00:00Z'),
      },
    ];

    qb.getMany.mockResolvedValue(fakeEvents);

    const dateQuery: DateRangeDto = {
      start: new Date('2024-01-01T00:00:00Z'),
      end: new Date('2024-01-31T00:00:00Z'),
      _dateRange: true,
    };

    const result = await provider.getPuzzleStats('puzzle-100', dateQuery);

    expect(result).toEqual({
      puzzleId: 'puzzle-100',
      totalAttempts: 3,
      successfulAttempts: 2,
      failedAttempts: 1,
      successRate: 66.67,
      averageTimeSpent: 40,
      uniqueUsers: 2,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
  });
});
