// backend/src/daily-quest/daily-quest.controller.ts
import { Controller, Get, Headers } from '@nestjs/common';
import {DailyQuestService } from "./daily-quest.service"

@Controller('daily-quest')
export class DailyQuestController {
  constructor(private readonly dailyQuestService: DailyQuestService) {}

  @Get()
  getDailyQuest(@Headers('X-User-Timezone') tz: string) {
    const userTimezone = tz || 'UTC'; // fallback for backward compatibility
    return this.dailyQuestService.getTodaysStatus(userTimezone);
  }
}
