import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DailyQuestService } from '../providers/daily-quest.service';
import { DailyQuestResponseDto } from '../dtos/daily-quest-response.dto';
import { DailyQuestStatusDto } from '../dtos/daily-quest-status.dto';
import { ActiveUser } from '../../auth/decorators/activeUser.decorator';
import { Auth } from '../../auth/decorators/auth.decorator';
import { authType } from '../../auth/enum/auth-type.enum';
import { User } from 'src/users/user.entity';
import { request } from 'express';

@Controller('daily-quest')
@ApiTags('Daily Quest')
export class DailyQuestController {
  constructor(private readonly dailyQuestService: DailyQuestService) {}

  @Get()
  @Auth(authType.Bearer)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Fetch or generate today's daily quest",
    description:
      "Returns the daily quest for today. If no quest exists for the current date, a new one is automatically generated with 10 random puzzles matching the user's difficulty level.",
  })
  @ApiResponse({
    status: 200,
    description: 'Daily quest retrieved or generated successfully',
    type: DailyQuestResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid authentication required',
  })
  async getTodaysDailyQuest(
    @ActiveUser('sub') userId: string,
  ): Promise<DailyQuestResponseDto> {
    console.log('REQUEST_USER_KEY:', request['user']); // Common key
    console.log('Full request keys:', Object.keys(request));
    console.log('userId:', userId);
    console.log('fullUser:', User);

    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.dailyQuestService.getTodaysDailyQuest(userId);
  }

  @Get('status')
  @Auth(authType.Bearer)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get today's daily quest progress status",
    description:
      'Returns the current progress state of today\'s Daily Quest. This is a lightweight, read-only endpoint suitable for dashboard polling and UI consumption. If no quest exists yet, one is automatically generated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily quest status retrieved successfully',
    type: DailyQuestStatusDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid authentication required',
  })
  async getTodaysDailyQuestStatus(
    @ActiveUser('sub') userId: string,
  ): Promise<DailyQuestStatusDto> {
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.dailyQuestService.getTodaysDailyQuestStatus(userId);
  }
}
