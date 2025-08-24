import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LeaderboardEntry } from '../entities/leaderboard.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { LeaderboardQueryDto, TimePeriod } from '../dto/leaderboard-query.dto';
import { LeaderboardResponseDto } from '../dto/leaderboard-response.dto';

@Injectable()
export class GetLeaderboardProvider {
  constructor(
    @InjectRepository(LeaderboardEntry)
    private leaderboardRepository: Repository<LeaderboardEntry>,
  ) {}

  private applyTimeFilter(
    queryBuilder: SelectQueryBuilder<LeaderboardEntry>,
    period: TimePeriod,
  ): SelectQueryBuilder<LeaderboardEntry> {
    const now = new Date();

    switch (period) {
      case TimePeriod.WEEKLY:
        queryBuilder.andWhere('entry.updatedAt >= :weekAgo', {
          weekAgo: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        });
        break;

      case TimePeriod.MONTHLY:
        queryBuilder.andWhere('entry.updatedAt >= :monthAgo', {
          monthAgo: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
        });
        break;
    }

    return queryBuilder;
  }

  async execute(query: LeaderboardQueryDto): Promise<LeaderboardResponseDto[]> {
    const { sort, period, limit, offset = 0 } = query;

    let queryBuilder = this.leaderboardRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.user', 'user')
      .leftJoinAndSelect('entry.badge', 'badge');

    queryBuilder = this.applyTimeFilter(queryBuilder, period || TimePeriod.ALL_TIME);
    queryBuilder.orderBy(`entry.${sort}`, 'DESC').skip(offset).take(limit);

    const entries = await queryBuilder.getMany();

    return entries.map((entry, index) => ({
      id: entry.id,
      user: {
        id: entry.user.id,
        username: entry.user.username,
      },
      puzzlesCompleted: entry.puzzlesCompleted,
      score: entry.score,
      tokens: entry.tokens,
      badge: entry.badge
        ? {
            id: entry.badge.id,
            name: entry.badge.title,
            description: entry.badge.description,
            icon: entry.badge.iconUrl,
          }
        : undefined,
      rank: offset + index + 1,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));
  }
}
