import { Injectable } from '@nestjs/common';
import { Badge } from './entities/badge.entity';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';
import { SeedDefaultBadgesService } from './providers/seed-default-badges.service';
import { DetermineBadgeForRankService } from './providers/determine-badge-for-rank.service';
import { AutoAssignBadgesService } from './providers/auto-assign-badges.service';
import { GetBadgeByRankService } from './providers/get-badge-by-rank.service';
import { RemoveBadgeService } from './providers/remove-badge.service';
import { UpdateBadgeService } from './providers/update-badge.service';
import { CreateBadgeService } from './providers/create-badge.service';
import { FindOneBadgeService } from './providers/find-one-badge.service';
import { FindAllActiveBadgesService } from './providers/find-all-active-badges.service';
import { FindAllBadgesService } from './providers/find-all-badges.service';

@Injectable()
export class BadgeService {
  constructor(
    private readonly seedDefaultBadgesService: SeedDefaultBadgesService,
    private readonly determineBadgeForRankService: DetermineBadgeForRankService,
    private readonly autoAssignBadgesService: AutoAssignBadgesService,
    private readonly getBadgeByRankService: GetBadgeByRankService,
    private readonly removeBadgeService: RemoveBadgeService,
    private readonly updateBadgeService: UpdateBadgeService,
    private readonly createBadgeService: CreateBadgeService,
    private readonly findOneBadgeService: FindOneBadgeService,
    private readonly findAllActiveBadgesService: FindAllActiveBadgesService,
    private readonly findAllBadgesService: FindAllBadgesService,
  ) {}

  async findAll(): Promise<Badge[]> {
    return this.findAllBadgesService.findAll();
  }

  async findAllActive(): Promise<Badge[]> {
    return this.findAllActiveBadgesService.findAllActive();
  }

  async findOne(id: number): Promise<Badge> {
    return this.findOneBadgeService.findOne(id);
  }

  async create(createBadgeDto: CreateBadgeDto): Promise<Badge> {
    return this.createBadgeService.create(createBadgeDto);
  }

  async update(id: number, updateBadgeDto: UpdateBadgeDto): Promise<Badge> {
    return this.updateBadgeService.update(id, updateBadgeDto);
  }

  async remove(id: number): Promise<void> {
    return this.removeBadgeService.remove(id);
  }

  async getBadgeByRank(rank: number): Promise<Badge | null> {
    return this.getBadgeByRankService.getBadgeByRank(rank);
  }

  async autoAssignBadges(): Promise<void> {
    return this.autoAssignBadgesService.autoAssignBadges();
  }

  async seedDefaultBadges(): Promise<void> {
    return this.seedDefaultBadgesService.seedDefaultBadges();
  }
}
