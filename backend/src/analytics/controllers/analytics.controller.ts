import { Controller, Post, Body, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { TrackEventProvider } from '../providers/track-event.provider';
import { GetOnboardingFunnelProvider } from '../providers/get-onboarding-funnel.provider';
import { GetRetentionCurveProvider } from '../providers/get-retention-curve.provider';
import { GetChurnRiskProvider } from '../providers/get-churn-risk.provider';
import { AnalyticsService } from '../analytics.service';
import { TrackEventDto } from '../dtos/track-event.dto';
import { DateRangeDto } from '../dtos/date-range.dto';
import {
  AnalyticsMetricResult,
  ChurnRiskDataPoint,
} from '../dtos/analytics-metric-result.dto';
import { AnalyticsAdminGuard } from '../guards/analytics-admin.guard';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly trackEventProvider: TrackEventProvider,
    private readonly getOnboardingFunnelProvider: GetOnboardingFunnelProvider,
    private readonly getRetentionCurveProvider: GetRetentionCurveProvider,
    private readonly getChurnRiskProvider: GetChurnRiskProvider,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('ping')
  @ApiOperation({ summary: 'Health check for analytics module' })
  @ApiResponse({ status: 200, description: 'Analytics module is healthy' })
  ping() {
    return this.analyticsService.ping();
  }

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

  @Get('users/retention')
  @UseGuards(AnalyticsAdminGuard)
  @ApiOperation({ summary: 'Get the user retention curve (admin only)' })
  @ApiResponse({ status: 200, type: AnalyticsMetricResult })
  async getRetentionCurve(@Query() query: DateRangeDto) {
    return this.getRetentionCurveProvider.getRetentionCurve(query);
  }

  @Get('users/churn-risk')
  @UseGuards(AnalyticsAdminGuard)
  @ApiOperation({ summary: 'Get per-user churn risk scores (admin only)' })
  @ApiExtraModels(AnalyticsMetricResult, ChurnRiskDataPoint)
  @ApiResponse({
    status: 200,
    // AnalyticsMetricResult is generic, so `data` is described explicitly
    // here — the class decorator alone would advertise RetentionDataPoint.
    schema: {
      allOf: [
        { $ref: getSchemaPath(AnalyticsMetricResult) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(ChurnRiskDataPoint) },
            },
          },
        },
      ],
    },
  })
  async getChurnRisk(@Query() query: DateRangeDto) {
    return this.getChurnRiskProvider.getChurnRisk(query);
  }
}
