import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from '../entities/badge.entity';
import { LeaderboardEntry } from '../../leaderboard/entities/leaderboard.entity';
import { DetermineBadgeForRankService } from './determine-badge-for-rank.service';

@Injectable()
export class AutoAssignBadgesService {
  private readonly logger = new Logger(AutoAssignBadgesService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(LeaderboardEntry)
    private readonly leaderboardRepository: Repository<LeaderboardEntry>,
    private readonly determineBadgeForRankService: DetermineBadgeForRankService,
  ) {}

  async autoAssignBadges(): Promise<void> {
    this.logger.log('Starting automatic badge assignment...');

    try {
      // Get all leaderboard entries ordered by score
      const leaderboardEntries = await this.leaderboardRepository.find({
        order: { score: 'DESC' },
        relations: ['player'],
      });

      // Get all auto-assignable badges
      const autoAssignableBadges = await this.badgeRepository.find({
        where: { isAutoAssigned: true, isActive: true },
        order: { rank: 'ASC' },
      });

      for (let i = 0; i < leaderboardEntries.length; i++) {
        const entry = leaderboardEntries[i];
        const playerRank = i + 1; // 1-based rank
        const appropriateBadge =
          this.determineBadgeForRankService.determineBadgeForRank(
            playerRank,
            autoAssignableBadges,
          );

        if (
          appropriateBadge &&
          (!entry.badge || entry.badge.id !== appropriateBadge.id)
        ) {
          entry.badge = appropriateBadge;
          await this.leaderboardRepository.save(entry);
          this.logger.log(
            `Assigned badge "${appropriateBadge.title}" to player at rank ${playerRank}`,
          );
        }
      }

      this.logger.log('Automatic badge assignment completed');
    } catch (error) {
      this.logger.error('Error during automatic badge assignment:', error);
      throw error;
    }
  }
}
