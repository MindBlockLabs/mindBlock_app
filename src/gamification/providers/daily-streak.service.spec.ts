import { Test, TestingModule } from '@nestjs/testing';
import { DailyStreakService } from './daily-streak.service';
import { UpdateStreakService } from './update-streak.service';
import { GetStreakService } from './get-streak.service';
import { GetStreakLeaderboardService } from './get-streak-leaderboard.service';
import { GetStreakStatsService } from './get-streak-stats.service';

const mockUpdateStreakService = { updateStreak: jest.fn() };
const mockGetStreakService = { getStreak: jest.fn() };
const mockGetStreakLeaderboardService = { getStreakLeaderboard: jest.fn() };
const mockGetStreakStatsService = { getStreakStats: jest.fn() };

describe('DailyStreakService', () => {
  let service: DailyStreakService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyStreakService,
        { provide: UpdateStreakService, useValue: mockUpdateStreakService },
        { provide: GetStreakService, useValue: mockGetStreakService },
        {
          provide: GetStreakLeaderboardService,
          useValue: mockGetStreakLeaderboardService,
        },
        { provide: GetStreakStatsService, useValue: mockGetStreakStatsService },
      ],
    }).compile();

    service = module.get<DailyStreakService>(DailyStreakService);
    jest.clearAllMocks();
  });

  describe('updateStreak', () => {
    it('should delegate to UpdateStreakService', async () => {
      const userId = '1';
      const mockResult = { streakCount: 1, hasSolvedToday: true };
      mockUpdateStreakService.updateStreak.mockResolvedValue(mockResult);
      const result = await service.updateStreak(userId);
      expect(mockUpdateStreakService.updateStreak).toHaveBeenCalledWith(userId);
      expect(result).toBe(mockResult);
    });
  });

  describe('getStreak', () => {
    it('should delegate to GetStreakService', async () => {
      const userId = '1';
      const mockResult = { streakCount: 5, hasSolvedToday: true };
      mockGetStreakService.getStreak.mockResolvedValue(mockResult);
      const result = await service.getStreak(userId);
      expect(mockGetStreakService.getStreak).toHaveBeenCalledWith(userId);
      expect(result).toBe(mockResult);
    });
  });

  describe('getStreakLeaderboard', () => {
    it('should delegate to GetStreakLeaderboardService', async () => {
      const query = { page: 1, limit: 10 };
      const mockResult = { entries: [], total: 0, page: 1, limit: 10 };
      mockGetStreakLeaderboardService.getStreakLeaderboard.mockResolvedValue(
        mockResult,
      );
      const result = await service.getStreakLeaderboard(query);
      expect(
        mockGetStreakLeaderboardService.getStreakLeaderboard,
      ).toHaveBeenCalledWith(query);
      expect(result).toBe(mockResult);
    });
  });

  describe('getStreakStats', () => {
    it('should delegate to GetStreakStatsService', async () => {
      const mockResult = {
        totalUsers: 100,
        activeUsers: 50,
        averageStreak: 6,
        topStreak: 30,
      };
      mockGetStreakStatsService.getStreakStats.mockResolvedValue(mockResult);
      const result = await service.getStreakStats();
      expect(mockGetStreakStatsService.getStreakStats).toHaveBeenCalled();
      expect(result).toBe(mockResult);
    });
  });
});
