import { Module } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { LeaderboardEntry } from './entities/leaderboard.entity';
import { Badge } from 'src/badge/entities/badge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LeaderboardEntry, User, Badge])],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
