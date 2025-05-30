// badge.module.ts
import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Badge } from "./entities/badge.entity"
// import { BadgeController } from "./badge.controller"
import { BadgeService } from "./badge.service"
import { LeaderboardEntry } from "../leaderboard/entities/leaderboard.entity"
import { BadgeController } from "./badge.controller"

@Module({
  imports: [
    TypeOrmModule.forFeature([Badge, LeaderboardEntry]), 
  ],
  controllers: [BadgeController],
  providers: [BadgeService],
  exports: [BadgeService],
})
export class BadgeModule {}
