import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from '../entities/badge.entity';
import { CreateBadgeDto } from '../dto/create-badge.dto';

@Injectable()
export class CreateBadgeService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
  ) {}

  async create(createBadgeDto: CreateBadgeDto): Promise<Badge> {
    // Check if badge with same title already exists
    const existingBadge = await this.badgeRepository.findOne({
      where: { title: createBadgeDto.title },
    });

    if (existingBadge) {
      throw new ConflictException(
        `Badge with title "${createBadgeDto.title}" already exists`,
      );
    }

    // Check if badge with same rank already exists
    const existingRank = await this.badgeRepository.findOne({
      where: { rank: createBadgeDto.rank },
    });

    if (existingRank) {
      throw new ConflictException(
        `Badge with rank ${createBadgeDto.rank} already exists`,
      );
    }

    const badge = this.badgeRepository.create(createBadgeDto);
    return this.badgeRepository.save(badge);
  }
}
