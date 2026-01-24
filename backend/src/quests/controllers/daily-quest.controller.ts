import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DailyQuestService } from '../providers/daily-quest.service';
import { DailyQuestResponseDto } from '../dtos/daily-quest-response.dto';
import { ActiveUser } from '../../auth/decorators/activeUser.decorator';
import { Auth } from '../../auth/decorators/auth.decorator';
import { authType } from '../../auth/enum/auth-type.enum';

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
    return this.dailyQuestService.getTodaysDailyQuest(userId);
  }
}
