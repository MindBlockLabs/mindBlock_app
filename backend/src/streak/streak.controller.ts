import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { authType } from '../auth/enum/auth-type.enum';
import { ActiveUser } from '../auth/decorators/activeUser.decorator';
import { StreakService } from './streak.service';
import { StreakResponseDto } from './dto/streak-response.dto';
import { UpdateStreakDto } from './dto/update-streak.dto';

@Controller('streaks')
@ApiTags('Streaks')
export class StreakController {
  constructor(private readonly streakService: StreakService) {}

  @Get()
  @Auth(authType.Bearer)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch current streak data' })
  @ApiResponse({ status: 200, type: StreakResponseDto })
  async getStreak(
    @ActiveUser('sub') userId: string,
  ): Promise<StreakResponseDto> {
    const streak = await this.streakService.getStreak(Number(userId));
    return this.mapToResponse(streak);
  }

  @Post('update')
  @Auth(authType.Bearer)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update streak after completing today’s quest/action',
    description:
      'Increments streak if yesterday was completed, resets if a day was missed, and prevents duplicate updates in the same day.',
  })
  @ApiResponse({ status: 200, type: StreakResponseDto })
  async updateStreak(
    @ActiveUser('sub') userId: string,
    @Body() updateDto: UpdateStreakDto,
    @Headers('x-timezone') timezoneHeader?: string,
  ): Promise<StreakResponseDto> {
    const tz = updateDto.timeZone || timezoneHeader;
    const streak = await this.streakService.updateStreak(Number(userId), tz);
    return this.mapToResponse(streak);
  }

  private mapToResponse(streak: {
    currentStreak: number;
    longestStreak: number;
    lastActivityDate?: string | null;
    streakDates?: string[];
  }): StreakResponseDto {
    return {
      currentStreak: streak.currentStreak || 0,
      longestStreak: streak.longestStreak || 0,
      lastActivityDate: streak.lastActivityDate || null,
      streakDates: streak.streakDates || [],
    };
  }
}
