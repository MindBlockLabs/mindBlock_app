import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  LeaderboardQueryDto,
  SortBy,
  TimePeriod,
} from './dto/leaderboard-query.dto';
import { UpdateLeaderboardDto } from './dto/update-leaderboard.dto';
import { LeaderboardResponseDto } from './dto/leaderboard-response.dto';
import { User } from 'src/users/user.entity';
import { LeaderboardEntry } from './entities/leaderboard.entity';
import { Badge } from 'src/badge/entities/badge.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(LeaderboardEntry)
    private leaderboardRepository: Repository<LeaderboardEntry>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Badge)
    private badgeRepository: Repository<Badge>,
  ) {}

  async getLeaderboard(
    query: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto[]> {
    const { sort, period, limit, offset = 0 } = query;

    let queryBuilder = this.leaderboardRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.user', 'user')
      .leftJoinAndSelect('entry.badge', 'badge');

    // Apply time filters
    queryBuilder = this.applyTimeFilter(
      queryBuilder,
      period || TimePeriod.ALL_TIME,
    );

    // Apply sorting
    const orderDirection = 'DESC';
    queryBuilder.orderBy(`entry.${sort}`, orderDirection);

    // Apply pagination
    queryBuilder.skip(offset).take(limit);

    const entries = await queryBuilder.getMany();

    // Add rank to each entry
    return entries.map((entry, index) => ({
      id: entry.id,
      user: {
        id: entry.user.id,
        username: entry.user.username
        // avatar: entry.user.avatar,
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

  async updatePlayerStats(
    userId: number,
    updateData: UpdateLeaderboardDto,
  ): Promise<LeaderboardEntry> {
    // Find or create leaderboard entry for user
    let entry = await this.leaderboardRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'badge'],
    });

    if (!entry) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      entry = this.leaderboardRepository.create({
        user,
        puzzlesCompleted: 0,
        score: 0,
        tokens: 0,
      });
    }

    // Update stats (increment existing values)
    if (updateData.tokens !== undefined) {
      entry.tokens += updateData.tokens;
    }
    if (updateData.score !== undefined) {
      entry.score += updateData.score;
    }
    if (updateData.puzzlesCompleted !== undefined) {
      entry.puzzlesCompleted += updateData.puzzlesCompleted;
    }

    // Update badge if provided
    if (updateData.badgeId) {
      const badge = await this.badgeRepository.findOne({
        where: { id: updateData.badgeId },
      });
      if (!badge) {
        throw new NotFoundException('Badge not found');
      }
      entry.badge = badge;
    }

    return await this.leaderboardRepository.save(entry);
  }

  async getUserRank(
    userId: number,
    sortBy: SortBy = SortBy.TOKENS,
  ): Promise<number> {
    const userEntry = await this.leaderboardRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!userEntry) {
      throw new NotFoundException('User not found in leaderboard');
    }

    const userValue = userEntry[sortBy];

    const rank = await this.leaderboardRepository
      .createQueryBuilder('entry')
      .where(`entry.${sortBy} > :value`, { value: userValue })
      .getCount();

    return rank + 1;
  }

  private applyTimeFilter(
    queryBuilder: SelectQueryBuilder<LeaderboardEntry>,
    period: TimePeriod,
  ): SelectQueryBuilder<LeaderboardEntry> {
    const now = new Date();

    switch (period) {
      case TimePeriod.WEEKLY: {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        queryBuilder.andWhere('entry.updatedAt >= :weekAgo', { weekAgo });
        break;
      }

      case TimePeriod.MONTHLY: {
        const monthAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          now.getDate(),
        );
        queryBuilder.andWhere('entry.updatedAt >= :monthAgo', { monthAgo });
        break;
      }

      case TimePeriod.ALL_TIME:
      default:
        // No filter for all-time
        break;
    }

    return queryBuilder;
  }

  async getTopPlayers(limit: number = 10): Promise<LeaderboardResponseDto[]> {
    return this.getLeaderboard({
      sort: SortBy.TOKENS,
      period: TimePeriod.ALL_TIME,
      limit,
      offset: 0,
    });
  }
}
