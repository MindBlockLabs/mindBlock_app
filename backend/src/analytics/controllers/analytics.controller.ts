import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TrackEventProvider } from '../providers/track-event.provider';
import { GetOnboardingFunnelProvider } from '../providers/get-onboarding-funnel.provider';
import { GetRetentionCurveProvider } from '../providers/get-retention-curve.provider';
import { AnalyticsService } from '../analytics.service';
import { TrackEventDto } from '../dtos/track-event.dto';
import { DateRangeDto } from '../dtos/date-range.dto';
import { AnalyticsMetricResult } from '../dtos/analytics-metric-result.dto';
import { AnalyticsAdminGuard } from '../guards/analytics-admin.guard';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly trackEventProvider: TrackEventProvider,
    private readonly getOnboardingFunnelProvider: GetOnboardingFunnelProvider,
    private readonly getRetentionCurveProvider: GetRetentionCurveProvider,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('ping')
  @ApiOperation({ summary: 'Health check for analytics module' })
  @ApiResponse({ status: 200, description: 'Analytics module is healthy' })
  ping() {
    return this.analyticsService.ping();
  }

  @Post('track')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Track an analytics event' })
  @ApiResponse({ status: 429, description: 'Too many requests — rate limit exceeded' })
  async track(@Body() dto: TrackEventDto) {
    await this.trackEventProvider.track(dto);
    return { success: true };
  }

  @Get('funnel/onboarding')
  @ApiOperation({ summary: 'Get onboarding funnel data' })
  async getOnboardingFunnel(@Query() query: DateRangeDto) {
    return this.getOnboardingFunnelProvider.getFunnel(query.start, query.end);
  }

  @Get('users/retention')
  @UseGuards(AnalyticsAdminGuard)
  @ApiOperation({ summary: 'Get the user retention curve (admin only)' })
  @ApiResponse({ status: 200, type: AnalyticsMetricResult })
  async getRetentionCurve(@Query() query: DateRangeDto) {
    return this.getRetentionCurveProvider.getRetentionCurve(query);
  }
}
