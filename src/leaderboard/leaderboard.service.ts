/* eslint-disable prettier/prettier */
import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/redis.constants';
import {
  LeaderboardQueryDto,
  SortBy,
  TimePeriod,
} from './dto/leaderboard-query.dto';
import { UpdateLeaderboardDto } from './dto/update-leaderboard.dto';
import { GetLeaderboardProvider } from './providers/get-leaderboard.provider';
import { UpdatePlayerStatsProvider } from './providers/update-player-stats-provider';
import { GetUserRankProvider } from './providers/get-user-rank-provider';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly getLeaderboardService: GetLeaderboardProvider,
    private readonly updatePlayerStatsService: UpdatePlayerStatsProvider,
    private readonly getUserRankService: GetUserRankProvider,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getLeaderboard(query: LeaderboardQueryDto): Promise<any[]> {
    const cacheKey = `leaderboard:${query.sort}:${query.period}:${query.limit}:${query.offset}`;

    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached) as any[];
      }
    } catch (err) {
      console.warn('Redis read error:', err);
    }

    const result = await this.getLeaderboardService.execute(query);

    try {
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
    } catch (err) {
      console.warn('Redis write error:', err);
    }

    return result;
  }

  updatePlayerStats(userId: string, dto: UpdateLeaderboardDto) {
    return this.updatePlayerStatsService.execute(userId, dto);
  }

  getUserRank(userId: string, sortBy: SortBy) {
    return this.getUserRankService.execute(userId, sortBy);
  }

  getTopPlayers(limit: number) {
    return this.getLeaderboard({
      sort: SortBy.TOKENS,
      period: TimePeriod.ALL_TIME,
      limit,
      offset: 0,
    });
  }
}
