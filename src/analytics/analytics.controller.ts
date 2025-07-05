import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { GetAnalyticsQueryDto } from './dto/get-analytics-query.dto';
import { TimeFilter } from 'src/timefilter/timefilter.enum.ts/timefilter.enum';
import { AnalyticsService } from './providers/analytics.service';

@Controller('analytics')
// @UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // @Get()
  // findAll(query: GetAnalyticsQueryDto) {
  //   return this.analyticsService.findAll(query);
  // }

  @Get('analytics')
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    description: 'Filter by user ID (UUID)',
  })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    type: String,
    description: 'Filter by session ID (UUID)',
  })
  async getAnalytics(@Query() query: GetAnalyticsQueryDto) {
    return this.analyticsService.getAnalytics(query);
  }
}
