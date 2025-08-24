import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from '../entities/badge.entity';

@Injectable()
export class FindAllActiveBadgesService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
  ) {}

  async findAllActive(): Promise<Badge[]> {
    return this.badgeRepository.find({
      where: { isActive: true },
      order: { rank: "ASC" },
    });
  }
} 