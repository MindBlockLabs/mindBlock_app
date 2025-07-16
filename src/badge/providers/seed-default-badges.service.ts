import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from '../entities/badge.entity';

@Injectable()
export class SeedDefaultBadgesService {
  private readonly logger = new Logger(SeedDefaultBadgesService.name);

  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
  ) {}

  async seedDefaultBadges(): Promise<void> {
    this.logger.log('Seeding default badges...');

    const defaultBadges = [
      {
        title: 'Puzzle Master',
        description: 'Awarded to the top performer on the leaderboard',
        rank: 1,
        isAutoAssigned: true,
        iconUrl: '/badges/puzzle-master.png',
      },
      {
        title: 'Grand Champion',
        description: 'Awarded to the second-place performer',
        rank: 2,
        isAutoAssigned: true,
        iconUrl: '/badges/grand-champion.png',
      },
      {
        title: 'Blockchain Expert',
        description: 'Awarded to the third-place performer',
        rank: 3,
        isAutoAssigned: true,
        iconUrl: '/badges/blockchain-expert.png',
      },
      {
        title: 'Algorithm Specialist',
        description: 'Awarded to top 10 performers',
        rank: 4,
        isAutoAssigned: true,
        iconUrl: '/badges/algorithm-specialist.png',
      },
      {
        title: 'Rising Star',
        description: 'Awarded to promising performers',
        rank: 5,
        isAutoAssigned: true,
        iconUrl: '/badges/rising-star.png',
      },
    ];

    for (const badgeData of defaultBadges) {
      const existingBadge = await this.badgeRepository.findOne({
        where: { title: badgeData.title },
      });

      if (!existingBadge) {
        const badge = this.badgeRepository.create(badgeData);
        await this.badgeRepository.save(badge);
        this.logger.log(`Created default badge: ${badgeData.title}`);
      }
    }

    this.logger.log('Default badges seeding completed');
  }
}
