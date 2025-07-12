import { Test, TestingModule } from '@nestjs/testing';
import { StreakController } from './streak.controller';
import { DailyStreakService } from '../providers/daily-streak.service';
import {
  StreakResponseDto,
  StreakLeaderboardResponseDto,
} from '../dto/streak.dto';

describe('StreakController', () => {
  let controller: StreakController;
  let streakService: DailyStreakService;

  const mockStreakService = {
    getStreak: jest.fn(),
    getStreakLeaderboard: jest.fn(),
    getStreakStats: jest.fn(),
  };

  const mockUser = {
    sub: 1,
    email: 'test@example.com',
    username: 'testuser',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StreakController],
      providers: [
        {
          provide: DailyStreakService,
          useValue: mockStreakService,
        },
      ],
    }).compile();

    controller = module.get<StreakController>(StreakController);
    streakService = module.get<DailyStreakService>(DailyStreakService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentStreak', () => {
    it('should return current user streak', async () => {
      const mockStreakResponse: StreakResponseDto = {
        streakCount: 5,
        longestStreak: 10,
        lastActiveDate: new Date(),
        hasSolvedToday: true,
        nextMilestone: 7,
        daysUntilNextMilestone: 2,
      };

      mockStreakService.getStreak.mockResolvedValue(mockStreakResponse);

      const result = await controller.getCurrentStreak(mockUser as any);

      expect(mockStreakService.getStreak).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockStreakResponse);
    });
  });

  describe('getStreakLeaderboard', () => {
    it('should return streak leaderboard', async () => {
      const query = { page: 1, limit: 10 };
      const mockLeaderboardResponse: StreakLeaderboardResponseDto = {
        entries: [
          {
            userId: '1',
            username: 'user1',
            streakCount: 10,
            longestStreak: 15,
            lastActiveDate: new Date(),
          },
          {
            userId: '2',
            username: 'user2',
            streakCount: 8,
            longestStreak: 12,
            lastActiveDate: new Date(),
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockStreakService.getStreakLeaderboard.mockResolvedValue(
        mockLeaderboardResponse,
      );

      const result = await controller.getStreakLeaderboard(query);

      expect(mockStreakService.getStreakLeaderboard).toHaveBeenCalledWith(
        query,
      );
      expect(result).toEqual(mockLeaderboardResponse);
    });

    it('should use default pagination when no query provided', async () => {
      const mockLeaderboardResponse: StreakLeaderboardResponseDto = {
        entries: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      mockStreakService.getStreakLeaderboard.mockResolvedValue(
        mockLeaderboardResponse,
      );

      const result = await controller.getStreakLeaderboard({});

      expect(mockStreakService.getStreakLeaderboard).toHaveBeenCalledWith({});
      expect(result).toEqual(mockLeaderboardResponse);
    });
  });

  describe('getStreakStats', () => {
    it('should return streak statistics', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 50,
        averageStreak: 5,
        topStreak: 30,
      };

      mockStreakService.getStreakStats.mockResolvedValue(mockStats);

      const result = await controller.getStreakStats();

      expect(mockStreakService.getStreakStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });
});
