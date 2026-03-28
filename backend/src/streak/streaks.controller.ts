import { Controller, Get, Post, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StreaksService } from './providers/streaks.service';
import { Streak } from './entities/streak.entity';
import { ActiveUser } from '../auth/decorators/activeUser.decorator';
import { ActiveUserData } from '../auth/interfaces/activeInterface';
import { Auth } from '../auth/decorators/auth.decorator';
import { authType } from '../auth/enum/auth-type.enum';

@ApiTags('streaks')
@Controller('streaks')
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  @Get()
  @Auth(authType.Bearer)
  @ApiOperation({ summary: 'Get current user streak' })
  @ApiResponse({
    status: 200,
    description: 'User streak retrieved successfully',
    type: Streak,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getStreak(@ActiveUser() user: ActiveUserData): Promise<Streak | null> {
    if (!user?.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = user.sub;
    return this.streaksService.getStreak(userId);
  }

  @Post('update')
  @Auth(authType.Bearer)
  @ApiOperation({ summary: 'Update streak after daily quest completion' })
  @ApiResponse({
    status: 200,
    description: 'Streak updated successfully',
    type: Streak,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateStreak(
    @ActiveUser() user: ActiveUserData,
    userTimezone: string,
  ): Promise<Streak> {
    if (!user?.sub) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = user.sub;
    return this.streaksService.updateStreak(userId, userTimezone);
  }
}
