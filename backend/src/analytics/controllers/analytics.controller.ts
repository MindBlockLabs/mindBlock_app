import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Controller, Get, Query, Param, Post, Body, UseGuards } from '@nestjs/common';
import { MetricsService } from '../providers/metrics.service';
import { ActivityService } from '../providers/activity.service';
import { AnalyticsMetric, UserActivity } from '../entities';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly activityService: ActivityService,
  ) {}

  @Get('metrics/dau')
  @ApiOperation({ summary: 'Get Daily Active Users' })
  @ApiQuery({ name: 'date', required: false, description: 'Date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns DAU count' })
  async getDau(@Query('date') date?: string): Promise<{ count: number; date: string }> {
    const targetDate = date ? new Date(date) : new Date();
    const count = await this.metricsService.calculateDau(targetDate);
    return {
      count,
      date: this.formatDate(targetDate),
    };
  }

  @Get('metrics/wau')
  @ApiOperation({ summary: 'Get Weekly Active Users' })
  @ApiQuery({ name: 'date', required: false, description: 'Date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns WAU count' })
  async getWau(@Query('date') date?: string): Promise<{ count: number; week: string }> {
    const targetDate = date ? new Date(date) : new Date();
    const count = await this.metricsService.calculateWau(targetDate);
    return {
      count,
      week: this.getWeekNumber(targetDate).toString(),
    };
  }

  @Get('metrics/session-duration')
  @ApiOperation({ summary: 'Get average session duration' })
  @ApiQuery({ name: 'date', required: false, description: 'Date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Returns average session duration in ms' })
  async getSessionDuration(@Query('date') date?: string): Promise<{ average: number; unit: string }> {
    const targetDate = date ? new Date(date) : new Date();
    const average = await this.metricsService.calculateAverageSessionDuration(targetDate);
    return {
      average,
      unit: 'milliseconds',
    };
  }

  @Get('metrics/feature-usage')
  @ApiOperation({ summary: 'Get feature usage statistics' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'Returns feature usage breakdown' })
  async getFeatureUsage(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Record<string, number>> {
    return await this.metricsService.getFeatureUsageStatistics(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('metrics/platform-distribution')
  @ApiOperation({ summary: 'Get platform distribution' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'Returns platform breakdown' })
  async getPlatformDistribution(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Record<string, number>> {
    return await this.metricsService.getPlatformDistribution(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('metrics/device-distribution')
  @ApiOperation({ summary: 'Get device distribution' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'Returns device breakdown' })
  async getDeviceDistribution(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<Record<string, number>> {
    return await this.metricsService.getDeviceDistribution(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('activities')
  @ApiOperation({ summary: 'Get recent activities' })
  @ApiQuery({ name: 'limit', required: false, default: 100 })
  @ApiQuery({ name: 'offset', required: false, default: 0 })
  @ApiResponse({ status: 200, description: 'Returns activity logs' })
  async getActivities(
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
  ): Promise<UserActivity[]> {
    return await this.activityService.getRecentActivities({
      limit,
    });
  }

  @Get('activities/:userId')
  @ApiOperation({ summary: 'Get user-specific activities' })
  @ApiQuery({ name: 'limit', required: false, default: 100 })
  @ApiResponse({ status: 200, description: 'Returns user activities' })
  async getUserActivities(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 100,
  ): Promise<UserActivity[]> {
    return await this.activityService.getUserActivities(userId, limit);
  }

  @Post('activities/query')
  @ApiOperation({ summary: 'Query activities with filters' })
  @ApiResponse({ status: 200, description: 'Returns filtered activities' })
  async queryActivities(
    @Body() filters: {
      eventType?: string;
      eventCategory?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    },
  ): Promise<UserActivity[]> {
    return await this.activityService.getRecentActivities({
      eventType: filters.eventType as any,
      eventCategory: filters.eventCategory as any,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      limit: filters.limit || 100,
    });
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private getWeekNumber(d: Date): number {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}
