import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DailyStreakService } from './daily-streak.service';
import { DailyStreak } from '../entities/daily-streak.entity';
import { User } from '../../users/user.entity';
import { STREAK_MILESTONES } from '../constants/streak.constants';

describe('DailyStreakService', () => {
  let service: DailyStreakService;
  let streakRepository: Repository<DailyStreak>;
  let userRepository: Repository<User>;
  let eventEmitter: EventEmitter2;

  const mockStreakRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
      select: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    })),
  };

  const mockUserRepository = {
    count: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyStreakService,
        {
          provide: getRepositoryToken(DailyStreak),
          useValue: mockStreakRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<DailyStreakService>(DailyStreakService);
    streakRepository = module.get<Repository<DailyStreak>>(getRepositoryToken(DailyStreak));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateStreak', () => {
    it('should create new streak for first-time user', async () => {
      const userId = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      mockStreakRepository.findOne.mockResolvedValue(null);
      mockStreakRepository.create.mockReturnValue({
        userId,
        lastActiveDate: today,
        streakCount: 1,
        longestStreak: 1,
        lastMilestoneReached: null,
      });
      mockStreakRepository.save.mockResolvedValue({
        id: 1,
        userId,
        lastActiveDate: today,
        streakCount: 1,
        longestStreak: 1,
        lastMilestoneReached: null,
      });

      const result = await service.updateStreak(userId);

      expect(mockStreakRepository.findOne).toHaveBeenCalledWith({
        where: { userId },
        relations: ['user'],
      });
      expect(mockStreakRepository.create).toHaveBeenCalledWith({
        userId,
        lastActiveDate: today,
        streakCount: 1,
        longestStreak: 1,
        lastMilestoneReached: null,
      });
      expect(mockStreakRepository.save).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('streak.puzzle.solved', {
        userId,
        streakCount: 1,
        isNewStreak: true,
      });
      expect(result.streakCount).toBe(1);
      expect(result.hasSolvedToday).toBe(true);
    });

    it('should increment streak for consecutive day', async () => {
      const userId = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const existingStreak = {
        id: 1,
        userId,
        lastActiveDate: yesterday,
        streakCount: 3,
        longestStreak: 3,
        lastMilestoneReached: null,
      };

      mockStreakRepository.findOne.mockResolvedValue(existingStreak);
      mockStreakRepository.save.mockResolvedValue({
        ...existingStreak,
        lastActiveDate: today,
        streakCount: 4,
        longestStreak: 4,
      });

      const result = await service.updateStreak(userId);

      expect(mockStreakRepository.save).toHaveBeenCalledWith({
        ...existingStreak,
        lastActiveDate: today,
        streakCount: 4,
        longestStreak: 4,
      });
      expect(result.streakCount).toBe(4);
      expect(result.hasSolvedToday).toBe(true);
    });

    it('should reset streak when day is skipped', async () => {
      const userId = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const existingStreak = {
        id: 1,
        userId,
        lastActiveDate: twoDaysAgo,
        streakCount: 5,
        longestStreak: 5,
        lastMilestoneReached: null,
      };

      mockStreakRepository.findOne.mockResolvedValue(existingStreak);
      mockStreakRepository.save.mockResolvedValue({
        ...existingStreak,
        lastActiveDate: today,
        streakCount: 1,
        longestStreak: 5, // Should remain the same
      });

      const result = await service.updateStreak(userId);

      expect(mockStreakRepository.save).toHaveBeenCalledWith({
        ...existingStreak,
        lastActiveDate: today,
        streakCount: 1,
        longestStreak: 5,
      });
      expect(result.streakCount).toBe(1);
      expect(result.hasSolvedToday).toBe(true);
    });

    it('should not update streak if already solved today', async () => {
      const userId = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingStreak = {
        id: 1,
        userId,
        lastActiveDate: today,
        streakCount: 3,
        longestStreak: 3,
        lastMilestoneReached: null,
      };

      mockStreakRepository.findOne.mockResolvedValue(existingStreak);

      const result = await service.updateStreak(userId);

      expect(mockStreakRepository.save).not.toHaveBeenCalled();
      expect(mockEventEmitter.emit).not.toHaveBeenCalled();
      expect(result.streakCount).toBe(3);
      expect(result.hasSolvedToday).toBe(true);
    });

    it('should award milestone rewards when reaching milestones', async () => {
      const userId = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const existingStreak = {
        id: 1,
        userId,
        lastActiveDate: yesterday,
        streakCount: 2,
        longestStreak: 2,
        lastMilestoneReached: null,
      };

      mockStreakRepository.findOne.mockResolvedValue(existingStreak);
      mockStreakRepository.save.mockResolvedValue({
        ...existingStreak,
        lastActiveDate: today,
        streakCount: 3,
        longestStreak: 3,
        lastMilestoneReached: 3,
      });

      const result = await service.updateStreak(userId);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('streak.milestone.reached', {
        userId,
        milestone: 3,
        reward: {
          userId,
          bonusXp: STREAK_MILESTONES[3].xp,
          bonusTokens: STREAK_MILESTONES[3].tokens,
          reason: STREAK_MILESTONES[3].description,
        },
      });
      expect(result.streakCount).toBe(3);
    });
  });

  describe('getStreak', () => {
    it('should return streak data for existing user', async () => {
      const userId = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existingStreak = {
        id: 1,
        userId,
        lastActiveDate: today,
        streakCount: 5,
        longestStreak: 10,
        lastMilestoneReached: 3,
      };

      mockStreakRepository.findOne.mockResolvedValue(existingStreak);

      const result = await service.getStreak(userId);

      expect(result.streakCount).toBe(5);
      expect(result.longestStreak).toBe(10);
      expect(result.hasSolvedToday).toBe(true);
      expect(result.nextMilestone).toBe(7);
      expect(result.daysUntilNextMilestone).toBe(2);
    });

    it('should return default data for new user', async () => {
      const userId = 1;

      mockStreakRepository.findOne.mockResolvedValue(null);

      const result = await service.getStreak(userId);

      expect(result.streakCount).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.lastActiveDate).toBeNull();
      expect(result.hasSolvedToday).toBe(false);
      expect(result.nextMilestone).toBe(3);
      expect(result.daysUntilNextMilestone).toBe(3);
    });
  });

  describe('getStreakLeaderboard', () => {
    it('should return leaderboard with pagination', async () => {
      const query = { page: 1, limit: 10 };
      const mockEntries = [
        {
          userId: 1,
          streakCount: 10,
          longestStreak: 15,
          lastActiveDate: new Date(),
          user: { username: 'user1' },
        },
        {
          userId: 2,
          streakCount: 8,
          longestStreak: 12,
          lastActiveDate: new Date(),
          user: { username: 'user2' },
        },
      ];

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockEntries, 2]),
      };

      mockStreakRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getStreakLeaderboard(query);

      expect(result.entries).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.entries[0].userId).toBe(1);
      expect(result.entries[0].username).toBe('user1');
    });
  });

  describe('getStreakStats', () => {
    it('should return streak statistics', async () => {
      mockUserRepository.count.mockResolvedValue(100);
      mockStreakRepository.count.mockResolvedValue(50);

      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ average: 5.5 }),
      };

      const mockMaxQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ max: 30 }),
      };

      mockStreakRepository.createQueryBuilder
        .mockReturnValueOnce(mockQueryBuilder)
        .mockReturnValueOnce(mockMaxQueryBuilder);

      const result = await service.getStreakStats();

      expect(result.totalUsers).toBe(100);
      expect(result.activeUsers).toBe(50);
      expect(result.averageStreak).toBe(6);
      expect(result.topStreak).toBe(30);
    });
  });
}); 