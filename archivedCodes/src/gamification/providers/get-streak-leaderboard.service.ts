import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyStreak } from '../entities/daily-streak.entity';
import {
  StreakLeaderboardEntryDto,
  StreakLeaderboardResponseDto,
  StreakQueryDto,
} from '../dto/streak.dto';

@Injectable()
export class GetStreakLeaderboardService {
  constructor(
    @InjectRepository(DailyStreak)
    private readonly streakRepository: Repository<DailyStreak>,
  ) {}

  async getStreakLeaderboard(
    query: StreakQueryDto,
  ): Promise<StreakLeaderboardResponseDto> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const [entries, total] = await this.streakRepository
      .createQueryBuilder('streak')
      .leftJoinAndSelect('streak.user', 'user')
      .select([
        'streak.userId',
        'streak.streakCount',
        'streak.longestStreak',
        'streak.lastActiveDate',
        'user.username',
      ])
      .orderBy('streak.streakCount', 'DESC')
      .addOrderBy('streak.longestStreak', 'DESC')
      .addOrderBy('streak.lastActiveDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    const leaderboardEntries: StreakLeaderboardEntryDto[] = entries.map(
      (entry) => ({
        userId: entry.userId,
        username: entry.user?.username || `User ${entry.userId}`,
        streakCount: entry.streakCount,
        longestStreak: entry.longestStreak,
        lastActiveDate: entry.lastActiveDate,
      }),
    );
    return {
      entries: leaderboardEntries,
      total,
      page,
      limit,
    };
  }
}
