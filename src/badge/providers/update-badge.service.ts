import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from '../entities/badge.entity';
import { UpdateBadgeDto } from '../dto/update-badge.dto';
import { FindOneBadgeService } from './find-one-badge.service';

@Injectable()
export class UpdateBadgeService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    private readonly findOneBadgeService: FindOneBadgeService,
  ) {}

  async update(id: number, updateBadgeDto: UpdateBadgeDto): Promise<Badge> {
    const badge = await this.findOneBadgeService.findOne(id);

    // Check for title conflicts if title is being updated
    if (updateBadgeDto.title && updateBadgeDto.title !== badge.title) {
      const existingBadge = await this.badgeRepository.findOne({
        where: { title: updateBadgeDto.title },
      });

      if (existingBadge) {
        throw new ConflictException(`Badge with title "${updateBadgeDto.title}" already exists`);
      }
    }

    // Check for rank conflicts if rank is being updated
    if (updateBadgeDto.rank && updateBadgeDto.rank !== badge.rank) {
      const existingRank = await this.badgeRepository.findOne({
        where: { rank: updateBadgeDto.rank },
      });

      if (existingRank) {
        throw new ConflictException(`Badge with rank ${updateBadgeDto.rank} already exists`);
      }
    }

    Object.assign(badge, updateBadgeDto);
    return this.badgeRepository.save(badge);
  }
} 