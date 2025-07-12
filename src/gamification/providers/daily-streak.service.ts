import { Injectable } from '@nestjs/common';
import { UpdateStreakService } from './update-streak.service';
import { GetStreakService } from './get-streak.service';
import { GetStreakLeaderboardService } from './get-streak-leaderboard.service';
import { GetStreakStatsService } from './get-streak-stats.service';
import {
  StreakResponseDto,
  StreakLeaderboardResponseDto,
  StreakQueryDto,
} from '../dto/streak.dto';

@Injectable()
export class DailyStreakService {
  constructor(
    private readonly updateStreakService: UpdateStreakService,
    private readonly getStreakService: GetStreakService,
    private readonly getStreakLeaderboardService: GetStreakLeaderboardService,
    private readonly getStreakStatsService: GetStreakStatsService,
  ) {}

  async updateStreak(userId: string): Promise<StreakResponseDto> {
    return this.updateStreakService.updateStreak(userId);
  }

  async getStreak(userId: string): Promise<StreakResponseDto> {
    return this.getStreakService.getStreak(userId);
  }

  async getStreakLeaderboard(
    query: StreakQueryDto,
  ): Promise<StreakLeaderboardResponseDto> {
    return this.getStreakLeaderboardService.getStreakLeaderboard(query);
  }

  async getStreakStats() {
    return this.getStreakStatsService.getStreakStats();
  }
}
