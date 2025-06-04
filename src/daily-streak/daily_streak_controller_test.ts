import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DailyStreakController } from './daily_streak_controller';
import { DailyStreakService } from './daily_streak_service';


describe('DailyStreakController', () => {
  let controller: DailyStreakController;
  let service: DailyStreakService;

  const mockDailyStreakService = {
    getStreak: jest.fn(),
    getStreakLeaderboard: jest.fn(),
    getStreakStats: jest.fn(),
    getUserStreakRank: jest.fn(),
  };

  const mockUser = { id: 1, email: 'test@example.com' };
  const mockRequest = { user: mockUser };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DailyStreakController],
      providers: [
        {
          provide: DailyStreakService,
          useValue: mockDailyStreakService,
        },
      ],
    }).compile();

    controller = module.get<DailyStreakController>(DailyStreakController);
    service = module.get<DailyStreakService>(DailyStreakService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentStreak', () => {
    it('should return current streak status', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const mockStreak = {
        userId: 1,
        streakCount: 5,
        longestStreak: 15,
        lastActiveDate: today,
      };

      mockDailyStreakService.getStreak.mockResolvedValue(mockStreak);

      const result = await controller.getCurrentStreak(mockRequest);

      expect(result).toEqual({
        streakCount: 5,
        longestStreak: 15,
        lastActiveDate: today.toISOString().split('T')[0],
        isActive: true,
        daysUntilExpiry: 1,
        nextMilestone: 7,
        milestoneProgress: 71.43,
      });
      expect(service.getStreak).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when no streak found', async () => {
      mockDailyStreakService.getStreak.mockResolvedValue(null);

      await expect(controller.getCurrentStreak(mockRequest))
        .rejects.toThrow(NotFoundException);
    });

    it('should calculate inactive streak correctly', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0);
      
      const mockStreak = {
        userId: 1,
        streakCount: 5,
        longestStreak: 15,
        lastActiveDate: threeDaysAgo,
      };

      mockDailyStreakService.getStreak.mockResolvedValue(mockStreak);

      const result = await controller.getCurrentStreak(mockRequest);

      expect(result.isActive).toBe(false);
      expect(result.daysUntilExpiry).toBe(0);
    });

    it('should handle streak at milestone correctly', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const mockStreak = {
        userId: 1,
        streakCount: 7,
        longestStreak: 15,
        lastActiveDate: today,
      };

      mockDailyStreakService.getStreak.mockResolvedValue(mockStreak);

      const result = await controller.getCurrentStreak(mockRequest);

      expect(result.nextMilestone).toBe(14);
      expect(result.milestoneProgress).toBe(50);
    });
  });

  describe('getStreakLeaderboard', () => {
    it('should return leaderboard with default parameters', async () => {
      const mockLeaderboard = [
        { userId: 2, streakCount: 20, longestStreak: 25, lastActiveDate: new Date() },
        { userId: 3, streakCount: 15, longestStreak: 20, lastActiveDate: new Date() },
      ];
      
      const mockStats = { totalActiveStreaks: 100, averageStreakLength: 8.5, longestCurrentStreak: 45 };
      
      mockDailyStreakService.getStreakLeaderboard.mockResolvedValue(mockLeaderboard);
      mockDailyStreakService.getStreakStats.mockResolvedValue(mockStats);
      mockDailyStreakService.getUserStreakRank.mockResolvedValue(5);

      const result = await controller.getStreakLeaderboard({}, mockRequest);

      expect(result.leaderboard).toHaveLength(2);
      expect(result.leaderboard[0].rank).toBe(1);
      expect(result.leaderboard[1].rank).toBe(2);
      expect(result.totalActiveUsers).toBe(100);
      expect(result.userRank).toBe(5);
      expect(service.getStreakLeaderboard).toHaveBeenCalledWith(10);
    });

    it('should handle custom limit parameter', async () => {
      const mockLeaderboard = [];
      const mockStats = { totalActiveStreaks: 0, averageStreakLength: 0, longestCurrentStreak: 0 };
      
      mockDailyStreakService.getStreakLeaderboard.mockResolvedValue(mockLeaderboard);
      mockDailyStreakService.getStreakStats.mockResolvedValue(mockStats);
      mockDailyStreakService.getUserStreakRank.mockResolvedValue(0);

      const result = await controller.getStreakLeaderboard({ limit: 5 }, mockRequest);

      expect(result.userRank).toBeUndefined();
      expect(service.getStreakLeaderboard).toHaveBeenCalledWith(5);
    });
  });

  describe('getStreakStats', () => {
    it('should return streak statistics', async () => {
      const mockStats = {
        totalActiveStreaks: 1247,
        averageStreakLength: 8.75,
        longestCurrentStreak: 156,
      };

      mockDailyStreakService.getStreakStats.mockResolvedValue(mockStats);

      const result = await controller.getStreakStats();

      expect(result).toEqual(mockStats);
      expect(service.getStreakStats).toHaveBeenCalled();
    });
  });

  describe('getStreakMilestones', () => {
    it('should return all streak milestones', async () => {
      const result = await controller.getStreakMilestones();

      expect(result).toHaveLength(6);
      expect(result[0]).toEqual({
        day: 3,
        bonusXp: 50,
        bonusTokens: 5,
        title: '3-Day Streak',
      });
      expect(result[5]).toEqual({
        day: 100,
        bonusXp: 3000,
        bonusTokens: 300,
        title: 'Century Solver',
      });
    });
  });

  describe('getUserRank', () => {
    it('should return user rank and total users', async () => {
      const mockStats = { totalActiveStreaks: 1247, averageStreakLength: 8.5, longestCurrentStreak: 45 };
      
      mockDailyStreakService.getUserStreakRank.mockResolvedValue(15);
      mockDailyStreakService.getStreakStats.mockResolvedValue(mockStats);

      const result = await controller.getUserRank(mockRequest);

      expect(result).toEqual({
        rank: 15,
        totalUsers: 1247,
      });
      expect(service.getUserStreakRank).toHaveBeenCalledWith(1);
    });

    it('should handle user with no rank', async () => {
      const mockStats = { totalActiveStreaks: 100, averageStreakLength: 5.0, longestCurrentStreak: 20 };
      
      mockDailyStreakService.getUserStreakRank.mockResolvedValue(0);
      mockDailyStreakService.getStreakStats.mockResolvedValue(mockStats);

      const result = await controller.getUserRank(mockRequest);

      expect(result.rank).toBe(0);
      expect(result.totalUsers).toBe(100);
    });
  });
});