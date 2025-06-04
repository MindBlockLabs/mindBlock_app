/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardController } from '../leaderboard.controller';
import { LeaderboardService } from '../leaderboard.service';
import { SortBy, TimePeriod } from '../dto/leaderboard-query.dto';

describe('LeaderboardController', () => {
  let controller: LeaderboardController;
  let service: LeaderboardService;

  const mockLeaderboardService = {
    getLeaderboard: jest.fn(),
    getTopPlayers: jest.fn(),
    getUserRank: jest.fn(),
    updatePlayerStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaderboardController],
      providers: [
        {
          provide: LeaderboardService,
          useValue: mockLeaderboardService,
        },
      ],
    }).compile();

    controller = module.get<LeaderboardController>(LeaderboardController);
    service = module.get<LeaderboardService>(LeaderboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard data', async () => {
      const mockData = [{ id: 1, rank: 1 }];
      mockLeaderboardService.getLeaderboard.mockResolvedValue(mockData);

      const result = await controller.getLeaderboard({
        sort: 'tokens' as SortBy,
        period: 'all' as TimePeriod,
        limit: 50,
        offset: 0,
      });

      expect(result).toEqual(mockData);
      expect(mockLeaderboardService.getLeaderboard).toHaveBeenCalled();
    });
  });

  describe('updatePlayerStats', () => {
    it('should update player stats', async () => {
      const mockEntry = { id: 1, tokens: 100 };
      mockLeaderboardService.updatePlayerStats.mockResolvedValue(mockEntry);

      const result = await controller.updatePlayerStats(1, { tokens: 50 });

      expect(result.message).toBe('Player stats updated successfully');
      expect(result.data).toEqual(mockEntry);
    });
  });
});
