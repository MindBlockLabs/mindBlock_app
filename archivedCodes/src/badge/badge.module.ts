// badge.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge } from './entities/badge.entity';
import { BadgeService } from './badge.service';
import { LeaderboardEntry } from '../leaderboard/entities/leaderboard.entity';
import { BadgeController } from './badge.controller';
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

@Module({
  imports: [TypeOrmModule.forFeature([Badge, LeaderboardEntry])],
  controllers: [BadgeController],
  providers: [
    BadgeService,
    SeedDefaultBadgesService,
    DetermineBadgeForRankService,
    AutoAssignBadgesService,
    GetBadgeByRankService,
    RemoveBadgeService,
    UpdateBadgeService,
    CreateBadgeService,
    FindOneBadgeService,
    FindAllActiveBadgesService,
    FindAllBadgesService,
  ],
  exports: [BadgeService],
})
export class BadgeModule {}
