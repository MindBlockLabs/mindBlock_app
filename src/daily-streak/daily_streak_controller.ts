import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DailyStreakService } from './daily_streak_service';
import { GetStreakLeaderboardQueryDto, GetStreakLeaderboardResponseDto, GetStreakResponseDto, StreakMilestoneDto, StreakStatsDto } from './dto/daily_streak_dto';
import { STREAK_MILESTONES } from './streak_milestone_config';

@ApiTags('Daily Streak')
@Controller('streak')
// @UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DailyStreakController {
  constructor(private readonly dailyStreakService: DailyStreakService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get current user streak status',
    description: 'Retrieve the current user\'s streak information including count, longest streak, and milestone progress'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current streak status retrieved successfully',
    type: GetStreakResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User has no streak record',
  })
  async getCurrentStreak(@Request() req): Promise<GetStreakResponseDto> {
    const userId = req.user.id;
    const streak = await this.dailyStreakService.getStreak(userId);

    if (!streak) {
      throw new NotFoundException('No streak record found for user');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActiveDate = new Date(streak.lastActiveDate);
    lastActiveDate.setHours(0, 0, 0, 0);
    
    const daysDifference = Math.floor(
      (today.getTime() - lastActiveDate.getTime()) / (1000 * 3600 * 24)
    );

    const isActive = daysDifference <= 1;
    const daysUntilExpiry = isActive ? Math.max(0, 1 - daysDifference) : 0;

    // Find next milestone
    const nextMilestone = STREAK_MILESTONES
      .filter(m => m.day > streak.streakCount)
      .sort((a, b) => a.day - b.day)[0];

    const milestoneProgress = nextMilestone 
      ? (streak.streakCount / nextMilestone.day) * 100 
      : 100;

    return {
      streakCount: streak.streakCount,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate.toISOString().split('T')[0],
      isActive,
      daysUntilExpiry,
      nextMilestone: nextMilestone?.day,
      milestoneProgress: Math.min(100, Math.round(milestoneProgress * 100) / 100),
    };
  }

  @Get('leaderboard')
  @ApiOperation({ 
    summary: 'Get streak leaderboard',
    description: 'Retrieve top users by current streak count with optional limit'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of top users to return (1-50)',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leaderboard retrieved successfully',
    type: GetStreakLeaderboardResponseDto,
  })
  async getStreakLeaderboard(
    @Query() query: GetStreakLeaderboardQueryDto,
    @Request() req,
  ): Promise<GetStreakLeaderboardResponseDto> {
    const userId = req.user.id;
    const { limit = 10 } = query;

    const leaderboard = await this.dailyStreakService.getStreakLeaderboard(limit);
    const stats = await this.dailyStreakService.getStreakStats();
    const userRank = await this.dailyStreakService.getUserStreakRank(userId);

    const leaderboardWithRanks = leaderboard.map((streak, index) => ({
      userId: streak.userId,
      streakCount: streak.streakCount,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate.toISOString().split('T')[0],
      rank: index + 1,
    }));

    return {
      leaderboard: leaderboardWithRanks,
      totalActiveUsers: stats.totalActiveStreaks,
      userRank: userRank > 0 ? userRank : undefined,
    };
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Get streak statistics',
    description: 'Retrieve global streak statistics including total active streaks and averages'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    type: StreakStatsDto,
  })
  async getStreakStats(): Promise<StreakStatsDto> {
    return await this.dailyStreakService.getStreakStats();
  }

  @Get('milestones')
  @ApiOperation({ 
    summary: 'Get streak milestones',
    description: 'Retrieve all available streak milestones and their rewards'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Milestones retrieved successfully',
    type: [StreakMilestoneDto],
  })
  async getStreakMilestones(): Promise<StreakMilestoneDto[]> {
    return STREAK_MILESTONES.map(milestone => ({
      day: milestone.day,
      bonusXp: milestone.bonusXp,
      bonusTokens: milestone.bonusTokens,
      title: milestone.title,
    }));
  }

  @Get('rank')
  @ApiOperation({ 
    summary: 'Get current user streak rank',
    description: 'Get the current user\'s position in the streak leaderboard'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User rank retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        rank: {
          type: 'number',
          description: 'User rank in leaderboard (0 if no streak)',
          example: 15
        },
        totalUsers: {
          type: 'number',
          description: 'Total users with active streaks',
          example: 1247
        }
      }
    }
  })
  async getUserRank(@Request() req): Promise<{ rank: number; totalUsers: number }> {
    const userId = req.user.id;
    const rank = await this.dailyStreakService.getUserStreakRank(userId);
    const stats = await this.dailyStreakService.getStreakStats();

    return {
      rank,
      totalUsers: stats.totalActiveStreaks,
    };
  }
}