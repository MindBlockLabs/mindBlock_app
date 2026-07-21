import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TrackEventProvider } from '../providers/track-event.provider';
import { GetOnboardingFunnelProvider } from '../providers/get-onboarding-funnel.provider';
import { TrackEventDto } from '../dtos/track-event.dto';
import { DateRangeDto } from '../dtos/date-range.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly trackEventProvider: TrackEventProvider,
    private readonly getOnboardingFunnelProvider: GetOnboardingFunnelProvider,
  ) {}

  @Post('track')
  @ApiOperation({ summary: 'Track an analytics event' })
  async track(@Body() dto: TrackEventDto) {
    await this.trackEventProvider.track(dto);
    return { success: true };
  }

  @Get('funnel/onboarding')
  @ApiOperation({ summary: 'Get onboarding funnel data' })
  async getOnboardingFunnel(@Query() query: DateRangeDto) {
    return this.getOnboardingFunnelProvider.getFunnel(query.start, query.end);
  }
}
