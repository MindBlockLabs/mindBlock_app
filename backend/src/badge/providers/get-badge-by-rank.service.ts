import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from '../entities/badge.entity';

@Injectable()
export class GetBadgeByRankService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
  ) {}

  async getBadgeByRank(rank: number): Promise<Badge | null> {
    return this.badgeRepository.findOne({
      where: { rank, isActive: true },
    });
  }
} 