import { Body,Controller, Post,  UseGuards, ValidationPipe,} from '@nestjs/common';
import { AnalyticsQueryDto } from './dtos/analytics-query.dto';
import { TrackEventProvider } from './providers/track-event.provider';
import { AnalyticsAdminGuard } from './guards/analytics-admin.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly trackEventProvider: TrackEventProvider,
  ) {}

  @Post('events/track')
  @UseGuards(AnalyticsAdminGuard)
  async trackEvent(
    @Body(new ValidationPipe())
    body: AnalyticsQueryDto,
  ) {
    return this.trackEventProvider.trackEvent(body);
  }
}