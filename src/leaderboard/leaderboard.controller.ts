import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  ParseIntPipe,
  // UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardQueryDto, SortBy } from './dto/leaderboard-query.dto';
import { UpdateLeaderboardDto } from './dto/update-leaderboard.dto';
import { LeaderboardResponseDto } from './dto/leaderboard-response.dto';
// Uncomment if you have authentication guards
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(
    @Query() query: LeaderboardQueryDto,
  ): Promise<LeaderboardResponseDto[]> {
    return this.leaderboardService.getLeaderboard(query);
  }

  @Get('top/:limit')
  async getTopPlayers(
    @Param('limit', ParseIntPipe) limit: number,
  ): Promise<LeaderboardResponseDto[]> {
    return this.leaderboardService.getTopPlayers(limit);
  }

  @Get('user/:userId/rank')
  async getUserRank(
    @Param('userId', ParseIntPipe) userId: string,
    @Query('sort') sort?: SortBy,
  ): Promise<{ rank: number }> {
    const sortBy: SortBy = sort || SortBy.TOKENS;
    const rank = await this.leaderboardService.getUserRank(userId, sortBy);
    return { rank };
  }

  @Post('update/:userId')
  @HttpCode(HttpStatus.OK)
  // @UseGuards(JwtAuthGuard) // Uncomment if you have authentication
  async updatePlayerStats(
    @Param('userId', ParseIntPipe) userId: string,
    @Body() updateData: UpdateLeaderboardDto,
  ) {
    const entry = await this.leaderboardService.updatePlayerStats(
      userId,
      updateData,
    );
    return {
      message: 'Player stats updated successfully',
      data: entry,
    };
  }
}
