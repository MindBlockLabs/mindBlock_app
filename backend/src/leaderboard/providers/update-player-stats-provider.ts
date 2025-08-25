// services/update-player-stats.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeaderboardEntry } from '../entities/leaderboard.entity';
import { User } from '../../users/user.entity';
import { Badge } from '../../badge/entities/badge.entity';
import { UpdateLeaderboardDto } from '../dto/update-leaderboard.dto';

@Injectable()
export class UpdatePlayerStatsProvider {
  constructor(
    @InjectRepository(LeaderboardEntry)
    private leaderboardRepository: Repository<LeaderboardEntry>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Badge)
    private badgeRepository: Repository<Badge>,
  ) {}

  async execute(
    userId: string,
    updateData: UpdateLeaderboardDto,
  ): Promise<LeaderboardEntry> {
    let entry = await this.leaderboardRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'badge'],
    });

    if (!entry) {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      entry = this.leaderboardRepository.create({
        user,
        puzzlesCompleted: 0,
        score: 0,
        tokens: 0,
      });
    }

    if (updateData.tokens !== undefined) entry.tokens += updateData.tokens;
    if (updateData.score !== undefined) entry.score += updateData.score;
    if (updateData.puzzlesCompleted !== undefined)
      entry.puzzlesCompleted += updateData.puzzlesCompleted;

    if (updateData.badgeId) {
      const badge = await this.badgeRepository.findOne({
        where: { id: updateData.badgeId },
      });
      if (!badge) throw new NotFoundException('Badge not found');
      entry.badge = badge;
    }

    return this.leaderboardRepository.save(entry);
  }
}