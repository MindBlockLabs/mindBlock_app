import { Controller, Get, Post, Body } from '@nestjs/common';
import { LeaderboardService } from '../providers/leaderboard.service';


@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  getLeaderboard() {
    return this.leaderboardService.getLeaderboard();
  }

  // @Post()
  // addScore(@Body() addScoreDto: AddScoreDto) {
  //   return this.leaderboardService.addScore(addScoreDto.userId, addScoreDto.score);
  // }
}
