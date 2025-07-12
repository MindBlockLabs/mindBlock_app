import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from '../entities/badge.entity';

@Injectable()
export class FindAllBadgesService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
  ) {}

  async findAll(): Promise<Badge[]> {
    return this.badgeRepository.find({
      order: { rank: "ASC" },
    });
  }
} 