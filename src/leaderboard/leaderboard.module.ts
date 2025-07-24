import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { LeaderboardEntry } from './entities/leaderboard.entity';
import { Badge } from 'src/badge/entities/badge.entity';
import { GetLeaderboardProvider } from './providers/get-leaderboard.provider';
import { UpdatePlayerStatsProvider } from './providers/update-player-stats-provider';
import { GetUserRankProvider } from './providers/get-user-rank-provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeaderboardEntry, User, Badge])],
  controllers: [LeaderboardController],
  providers: [LeaderboardService, GetLeaderboardProvider, UpdatePlayerStatsProvider, GetUserRankProvider],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
