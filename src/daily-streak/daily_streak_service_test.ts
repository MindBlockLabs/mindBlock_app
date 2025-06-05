import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyStreakService } from './daily_streak_service';
import { GamificationService } from 'src/gamification/gamification.service';
import { DailyStreak } from './entities/daily_streak_entity';

describe('DailyStreakService', () => {
  let service: DailyStreakService;
  let repository: Repository<DailyStreak>;
  let gamificationService: GamificationService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockGamificationService = {
    awardBonusRewards: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyStreakService,
        {
          provide: getRepositoryToken(DailyStreak),
          useValue: mockRepository,
        },
        {
          provide: GamificationService,
          useValue: mockGamificationService,
        },
      ],
    }).compile();

    service = module.get<DailyStreakService>(DailyStreakService);
    repository = module.get<Repository<DailyStreak>>(getRepositoryToken(DailyStreak));
    gamificationService = module.get<GamificationService>(GamificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateStreak', () => {
    const userId = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    it('should create new streak for first-time user', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const newStreak = { 
        userId, 
        lastActiveDate: today, 
        streakCount: 1, 
        longestStreak: 1 
      };
      mockRepository.create.mockReturnValue(newStreak);
      mockRepository.save.mockResolvedValue(newStreak);

      const result = await service.updateStreak(userId);

      expect(result.isNewStreak).toBe(true);
      expect(result.streakIncremented).toBe(true);
      expect(result.streak.streakCount).toBe(1);
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId,
        lastActiveDate: today,
        streakCount: 1,
        longestStreak: 1,
      });
    });

    it('should increment streak for consecutive day', async () => {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const existingStreak = {
        userId,
        lastActiveDate: yesterday,
        streakCount: 5,
        longestStreak: 10,
      };
      
      mockRepository.findOne.mockResolvedValue(existingStreak);
      mockRepository.save.mockResolvedValue({
        ...existingStreak,
        streakCount: 6,
        lastActiveDate: today,
      });

      const result = await service.updateStreak(userId);

      expect(result.streakIncremented).toBe(true);
      expect(result.streak.streakCount).toBe(6);
      expect(result.milestoneReached).toBe(false);
    });

    it('should reset streak if more than one day gap', async () => {
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const existingStreak = {
        userId,
        lastActiveDate: threeDaysAgo,
        streakCount: 15,
        longestStreak: 20,
      };
      
      mockRepository.findOne.mockResolvedValue(existingStreak);
      mockRepository.save.mockResolvedValue({
        ...existingStreak,
        streakCount: 1,
        lastActiveDate: today,
      });

      const result = await service.updateStreak(userId);

      expect(result.streakIncremented).toBe(true);
      expect(result.streak.streakCount).toBe(1);
      expect(result.streak.longestStreak).toBe(20); // Should preserve longest
    });

    it('should not change streak if already active today', async () => {
      const existingStreak = {
        userId,
        lastActiveDate: today,
        streakCount: 7,
        longestStreak: 15,
      };
      
      mockRepository.findOne.mockResolvedValue(existingStreak);
      mockRepository.save.mockResolvedValue(existingStreak);

      const result = await service.updateStreak(userId);

      expect(result.streakIncremented).toBe(false);
      expect(result.streak.streakCount).toBe(7);
    });

    it('should award milestone rewards for 7-day streak', async () => {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const existingStreak = {
        userId,
        lastActiveDate: yesterday,
        streakCount: 6,
        longestStreak: 10,
      };
      
      mockRepository.findOne.mockResolvedValue(existingStreak);
      mockRepository.save.mockResolvedValue({
        ...existingStreak,
        streakCount: 7,
        lastActiveDate: today,
      });

      const result = await service.updateStreak(userId);

      expect(result.milestoneReached).toBe(true);
      expect(result.milestoneReward?.title).toBe('Weekly Warrior');
      expect(result.milestoneReward?.bonusXp).toBe(150);
      expect(gamificationService.awardBonusRewards).toHaveBeenCalledWith(
        userId,
        150,
        15,
        'Streak Milestone: Weekly Warrior'
      );
    });

    it('should update longest streak when current exceeds it', async () => {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const existingStreak = {
        userId,
        lastActiveDate: yesterday,
        streakCount: 19,
        longestStreak: 15,
      };
      
      mockRepository.findOne.mockResolvedValue(existingStreak);
      mockRepository.save.mockResolvedValue({
        ...existingStreak,
        streakCount: 20,
        longestStreak: 20,
        lastActiveDate: today,
      });

      const result = await service.updateStreak(userId);

      expect(result.streak.longestStreak).toBe(20);
    });
  });

  describe('getStreak', () => {
    const userId = 1;

    it('should return null for user with no streak', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getStreak(userId);

      expect(result).toBeNull();
    });

    it('should return active streak', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const streak = {
        userId,
        lastActiveDate: today,
        streakCount: 5,
        longestStreak: 10,
      };
      
      mockRepository.findOne.mockResolvedValue(streak);

      const result = await service.getStreak(userId);

      expect(result).toEqual(streak);
    });

    it('should return streak with count 0 if more than 1 day passed', async () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      threeDaysAgo.setHours(0, 0, 0, 0);
      
      const streak = {
        userId,
        lastActiveDate: threeDaysAgo,
        streakCount: 5,
        longestStreak: 10,
      };
      
      mockRepository.findOne.mockResolvedValue(streak);

      const result = await service.getStreak(userId);

      expect(result).not.toBeNull();
      expect(result!.streakCount).toBe(0);
      expect(result!.longestStreak).toBe(10);
    });
  });

  describe('getStreakLeaderboard', () => {
    it('should return leaderboard with default limit', async () => {
      const mockStreaks = [
        { userId: 1, streakCount: 20, longestStreak: 25 },
        { userId: 2, streakCount: 15, longestStreak: 20 },
        { userId: 3, streakCount: 10, longestStreak: 15 },
      ];
      
      mockRepository.find.mockResolvedValue(mockStreaks);

      const result = await service.getStreakLeaderboard();

      expect(result).toEqual(mockStreaks);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: {
          streakCount: 'DESC',
          longestStreak: 'DESC',
          updatedAt: 'DESC'
        },
        take: 10,
      });
    });

    it('should return leaderboard with custom limit', async () => {
      const mockStreaks = [
        { userId: 1, streakCount: 20, longestStreak: 25 },
      ];
      
      mockRepository.find.mockResolvedValue(mockStreaks);

      const result = await service.getStreakLeaderboard(5);

      expect(mockRepository.find).toHaveBeenCalledWith({
        order: {
          streakCount: 'DESC',
          longestStreak: 'DESC',
          updatedAt: 'DESC'
        },
        take: 5,
      });
    });
  });

  describe('getStreakStats', () => {
    it('should return correct streak statistics', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { streakCount: 10 },
          { streakCount: 20 },
          { streakCount: 30 },
        ]),
      };
      
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getStreakStats();

      expect(result.totalActiveStreaks).toBe(3);
      expect(result.averageStreakLength).toBe(20);
      expect(result.longestCurrentStreak).toBe(30);
    });

    it('should handle empty streak data', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getStreakStats();

      expect(result.totalActiveStreaks).toBe(0);
      expect(result.averageStreakLength).toBe(0);
      expect(result.longestCurrentStreak).toBe(0);
    });
  });
});