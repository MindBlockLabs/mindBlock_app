import { Module } from '@nestjs/common';
import { LeaderboardController } from './controllers/leaderboard.controller';
import { LeaderboardService } from './providers/leaderboard.service';

@Module({
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
  exports: [LeaderboardService],
})
export class LeaderboardModule {}
