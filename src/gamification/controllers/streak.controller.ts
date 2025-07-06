import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DailyStreakService } from '../providers/daily-streak.service';
import { StreakResponseDto, StreakLeaderboardResponseDto, StreakQueryDto } from '../dto/streak.dto';
import { ActiveUser } from '../../auth/decorators/activeUser.decorator';
import { ActiveUserData } from '../../auth/interfaces/activeInterface';

@ApiTags('Daily Streak')
@Controller('streak')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class StreakController {
  constructor(private readonly streakService: DailyStreakService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user streak status' })
  @ApiResponse({
    status: 200,
    description: 'Current streak information',
    type: StreakResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentStreak(@ActiveUser() user: ActiveUserData): Promise<StreakResponseDto> {
    return this.streakService.getStreak(user.sub.toString());
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get streak leaderboard' })
  @ApiResponse({
    status: 200,
    description: 'Streak leaderboard',
    type: StreakLeaderboardResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  async getStreakLeaderboard(@Query() query: StreakQueryDto): Promise<StreakLeaderboardResponseDto> {
    return this.streakService.getStreakLeaderboard(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get streak statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Streak statistics',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number' },
        activeUsers: { type: 'number' },
        averageStreak: { type: 'number' },
        topStreak: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStreakStats() {
    return this.streakService.getStreakStats();
  }
} 