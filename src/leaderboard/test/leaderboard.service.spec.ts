import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardService } from '../leaderboard.service';

import { NotFoundException } from '@nestjs/common';
import { User } from 'src/users/user.entity';
import { LeaderboardEntry } from '../entities/leaderboard.entity';
import { SortBy, TimePeriod } from '../dto/leaderboard-query.dto';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let leaderboardRepo: Repository<LeaderboardEntry>;
  let userRepo: Repository<User>;
  let badgeRepo: Repository<Badge>;

  const mockUser = {
    id: 1,
    username: 'testuser',
    avatar: 'avatar.jpg',
  };

  const mockBadge = {
    id: 1,
    name: 'Puzzle Master',
    description: 'Complete 100 puzzles',
    icon: 'badge.png',
  };

  const mockLeaderboardEntry = {
    id: 1,
    user: mockUser,
    puzzlesCompleted: 50,
    score: 1000,
    tokens: 250,
    badge: mockBadge,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        {
          provide: getRepositoryToken(LeaderboardEntry),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue([mockLeaderboardEntry]),
              getCount: jest.fn().mockResolvedValue(5),
            })),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Badge),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
    leaderboardRepo = module.get<Repository<LeaderboardEntry>>(
      getRepositoryToken(LeaderboardEntry),
    );
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    badgeRepo = module.get<Repository<Badge>>(getRepositoryToken(Badge));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard with rankings', async () => {
      const result = await service.getLeaderboard({
        sort: 'tokens' as SortBy,
        period: 'all' as TimePeriod,
        limit: 50,
        offset: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0].rank).toBe(1);
      expect(result[0].user.username).toBe('testuser');
    });
  });

  describe('updatePlayerStats', () => {
    it('should update existing player stats', async () => {
      jest
        .spyOn(leaderboardRepo, 'findOne')
        .mockResolvedValue(mockLeaderboardEntry as any);
      const saveSpy = jest
        .spyOn(leaderboardRepo, 'save')
        .mockResolvedValue(mockLeaderboardEntry as any);

      const result = await service.updatePlayerStats(1, {
        tokens: 50,
        score: 100,
      });

      expect(result).toBeDefined();
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should create new entry for new user', async () => {
      jest.spyOn(leaderboardRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(mockUser as any);
      const createSpy = jest
        .spyOn(leaderboardRepo, 'create')
        .mockReturnValue(mockLeaderboardEntry as any);
      jest
        .spyOn(leaderboardRepo, 'save')
        .mockResolvedValue(mockLeaderboardEntry as any);

      const result = await service.updatePlayerStats(1, {
        tokens: 50,
      });

      expect(result).toBeDefined();
      expect(createSpy).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid user', async () => {
      jest.spyOn(leaderboardRepo, 'findOne').mockResolvedValue(null);
      jest.spyOn(userRepo, 'findOne').mockResolvedValue(null);

      await expect(
        service.updatePlayerStats(999, { tokens: 50 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserRank', () => {
    it('should return user rank', async () => {
      jest
        .spyOn(leaderboardRepo, 'findOne')
        .mockResolvedValue(mockLeaderboardEntry as any);

      const rank = await service.getUserRank(1);

      expect(rank).toBe(6); // 5 users ahead + 1
    });

    it('should throw NotFoundException for user not in leaderboard', async () => {
      jest.spyOn(leaderboardRepo, 'findOne').mockResolvedValue(null);

      await expect(service.getUserRank(999)).rejects.toThrow(NotFoundException);
    });
  });
});
