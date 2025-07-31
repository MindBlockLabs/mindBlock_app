import { Injectable } from '@nestjs/common';
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
  ) {}

  getLeaderboard(query: LeaderboardQueryDto) {
    return this.getLeaderboardService.execute(query);
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