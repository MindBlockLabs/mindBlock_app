import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from '../entities/badge.entity';
import { LeaderboardEntry } from '../../leaderboard/entities/leaderboard.entity';
import { FindOneBadgeService } from './find-one-badge.service';

@Injectable()
export class RemoveBadgeService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(LeaderboardEntry)
    private readonly leaderboardRepository: Repository<LeaderboardEntry>,
    private readonly findOneBadgeService: FindOneBadgeService,
  ) {}

  async remove(id: number): Promise<void> {
    const badge = await this.findOneBadgeService.findOne(id);

    // Check if badge is assigned to any leaderboard entries
    const assignedEntries = await this.leaderboardRepository.count({
      where: { badge: { id } },
    });

    if (assignedEntries > 0) {
      throw new ConflictException(
        `Cannot delete badge "${badge.title}" as it is assigned to ${assignedEntries} leaderboard entries`,
      );
    }

    await this.badgeRepository.remove(badge);
  }
}
